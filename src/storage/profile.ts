import AsyncStorage from '@react-native-async-storage/async-storage';

import { todayKey } from '../domain/date';
import { withDailyTarget } from '../domain/goals';
import type { ConsumptionProfile } from '../domain/profile';
import { loadGoalSettings, saveGoalSettings } from './goals';

const PROFILE_KEY = 'pufftrack.profile.v1';

/** Read-only probes. These keys are never written from onboarding. */
const EXISTING_DATA_KEYS = ['pufftrack.today.v1', 'pufftrack.history.v1', 'pufftrack.currentTrigger.v1', 'pufftrack.goals.v1'];

let queue: Promise<void> = Promise.resolve();

function enqueue<T>(task: () => Promise<T>): Promise<T> {
  const run = queue.then(task, task);
  queue = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isProfile(value: unknown): value is ConsumptionProfile {
  if (!isRecord(value) || value.completed !== true) {
    return false;
  }

  return (
    (value.productType === 'cigarette' || value.productType === 'vape' || value.productType === 'pouch') &&
    typeof value.dailyBaseline === 'number' &&
    typeof value.goal === 'string'
  );
}

export async function loadConsumptionProfile(): Promise<ConsumptionProfile | null> {
  try {
    const raw = await AsyncStorage.getItem(PROFILE_KEY);
    if (raw == null) {
      return null;
    }

    const parsed: unknown = JSON.parse(raw);
    return isProfile(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

async function hasExistingPuffData(): Promise<boolean> {
  try {
    const pairs = await AsyncStorage.multiGet(EXISTING_DATA_KEYS);
    return pairs.some(([, value]) => value != null);
  } catch {
    return true;
  }
}

/** Fresh installs have no profile and no saved puff data. A failed read skips onboarding. */
export async function shouldShowOnboarding(): Promise<boolean> {
  try {
    const profile = await loadConsumptionProfile();
    if (profile?.completed) {
      return false;
    }

    return !(await hasExistingPuffData());
  } catch {
    return false;
  }
}

/**
 * Saves the profile, then sets an empty vape or pouch reduction target from the reported baseline.
 * Existing goal settings are left as they are.
 */
export function completeOnboarding(profile: ConsumptionProfile): Promise<boolean> {
  return enqueue(async () => {
    try {
      await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
    } catch {
      return false;
    }

    if ((profile.productType === 'vape' || profile.productType === 'pouch') && profile.goal === 'reduce') {
      try {
        const existing = await loadGoalSettings();
        if (existing.dailyTarget == null && existing.history.length === 0) {
          const next = withDailyTarget(existing, profile.dailyBaseline, todayKey(new Date()));
          if (next !== existing) {
            await saveGoalSettings(next);
          }
        }
      } catch {
        // The profile is already saved. Goals can be set later.
      }
    }

    return true;
  });
}

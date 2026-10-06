import AsyncStorage from '@react-native-async-storage/async-storage';

import { isTriggerType, type TriggerType } from '../constants/triggers';

const CURRENT_TRIGGER_KEY = 'pufftrack.currentTrigger.v1';
const LEGACY_TRIGGER_KEYS = ['pufftrack.triggers.today.v1', 'pufftrack.triggers.history.v1'];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** The selected context for later puffs. This does not record a puff. */
export async function loadCurrentTrigger(): Promise<TriggerType | null> {
  try {
    await AsyncStorage.multiRemove(LEGACY_TRIGGER_KEYS);
  } catch {
    // The old event log is unused. A failed cleanup should not block the selection.
  }

  try {
    const raw = await AsyncStorage.getItem(CURRENT_TRIGGER_KEY);
    if (raw == null) {
      return null;
    }

    const data: unknown = JSON.parse(raw);
    if (!isRecord(data) || data.trigger == null || !isTriggerType(data.trigger)) {
      return null;
    }

    return data.trigger;
  } catch {
    return null;
  }
}

export async function saveCurrentTrigger(trigger: TriggerType | null): Promise<void> {
  await AsyncStorage.setItem(CURRENT_TRIGGER_KEY, JSON.stringify({ trigger }));
}

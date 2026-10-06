import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  EMPTY_GOALS,
  MAX_DAILY_TARGET,
  type GoalSettings,
  type ReductionGoal,
  type TargetChange,
} from '../domain/goals';
import { isValidDayKey } from '../domain/date';

const GOALS_KEY = 'pufftrack.goals.v1';
const HISTORY_CAP = 200;

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

function parseTarget(value: unknown): number | null {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 1 || value > MAX_DAILY_TARGET) {
    return null;
  }

  return value;
}

function parseHistory(value: unknown): TargetChange[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const changes: TargetChange[] = [];
  for (const entry of value) {
    if (!isRecord(entry) || typeof entry.date !== 'string' || !isValidDayKey(entry.date)) {
      continue;
    }

    const target = parseTarget(entry.target);
    if (target == null) {
      continue;
    }

    changes.push({ date: entry.date, target });
    if (changes.length >= HISTORY_CAP) {
      break;
    }
  }

  return changes;
}

function parseReduction(value: unknown): ReductionGoal | null {
  if (!isRecord(value)) {
    return null;
  }

  const startingTarget = parseTarget(value.startingTarget);
  if (startingTarget == null || typeof value.targetDate !== 'string' || !isValidDayKey(value.targetDate)) {
    return null;
  }

  return { startingTarget, targetDate: value.targetDate };
}

export function parseGoalSettings(value: unknown): GoalSettings {
  if (!isRecord(value)) {
    return EMPTY_GOALS;
  }

  const history = parseHistory(value.history);
  const storedTarget = parseTarget(value.dailyTarget);
  const dailyTarget = storedTarget ?? history[history.length - 1]?.target ?? null;

  return {
    dailyLimit: parseTarget(value.dailyLimit),
    dailyTarget,
    history,
    reduction: parseReduction(value.reduction),
  };
}

export async function loadGoalSettings(): Promise<GoalSettings> {
  try {
    const raw = await AsyncStorage.getItem(GOALS_KEY);
    if (raw == null) {
      return EMPTY_GOALS;
    }

    return parseGoalSettings(JSON.parse(raw));
  } catch {
    return EMPTY_GOALS;
  }
}

export function saveGoalSettings(settings: GoalSettings): Promise<void> {
  const payload: GoalSettings = {
    dailyLimit: settings.dailyLimit,
    dailyTarget: settings.dailyTarget,
    history: settings.history.slice(-HISTORY_CAP),
    reduction: settings.reduction,
  };

  return enqueue(() => AsyncStorage.setItem(GOALS_KEY, JSON.stringify(payload))).then(
    () => undefined,
    () => undefined,
  );
}

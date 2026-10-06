import { addCalendarDays, isValidDayKey, todayKey } from './date';

/** Largest personal target the editor accepts. This is an input limit, not a recommendation. */
export const MAX_DAILY_TARGET = 9999;

/** Longest reduction horizon, in days from today. */
export const MAX_HORIZON_DAYS = 3650;

export type TargetChange = {
  date: string;
  target: number;
};

export type ReductionGoal = {
  startingTarget: number;
  targetDate: string;
};

export type GoalSettings = {
  /** The user's tracking boundary. Null uses the default. Independent of the personal target. */
  dailyLimit: number | null;
  dailyTarget: number | null;
  history: TargetChange[];
  reduction: ReductionGoal | null;
};

export const EMPTY_GOALS: GoalSettings = {
  dailyLimit: null,
  dailyTarget: null,
  history: [],
  reduction: null,
};

export type TodayGoalStatus = {
  consumed: number;
  target: number;
  remaining: number;
  exceededBy: number;
  progress: number;
};

export type WeekGoalStatus = {
  recordedDays: number;
  average: number | null;
  withinTarget: number | null;
};

function isPositiveTarget(value: number): boolean {
  return Number.isInteger(value) && value >= 1 && value <= MAX_DAILY_TARGET;
}

/** Accepts a positive whole number. Zero, negatives, and decimals are rejected. */
export function parseDailyTarget(raw: string): number | null {
  const trimmed = raw.trim();
  if (!/^\d+$/.test(trimmed)) {
    return null;
  }

  const value = Number(trimmed);
  return isPositiveTarget(value) ? value : null;
}

/** Same rules as the target: a whole number from 1 to 9999. */
export function parseDailyLimit(raw: string): number | null {
  return parseDailyTarget(raw);
}

/** Accepts a whole number of days from today, from 1 through the horizon cap. */
export function parseHorizonDays(raw: string): number | null {
  const trimmed = raw.trim();
  if (!/^\d+$/.test(trimmed)) {
    return null;
  }

  const value = Number(trimmed);
  if (!Number.isInteger(value) || value < 1 || value > MAX_HORIZON_DAYS) {
    return null;
  }

  return value;
}

export function targetDateFromHorizon(now: Date, days: number): string | null {
  if (!Number.isInteger(days) || days < 1 || days > MAX_HORIZON_DAYS) {
    return null;
  }

  return addCalendarDays(todayKey(now), days);
}

export function todayGoalStatus(consumed: number, target: number): TodayGoalStatus | null {
  const safeConsumed = Number.isFinite(consumed) ? Math.max(0, Math.trunc(consumed)) : 0;
  if (!isPositiveTarget(target)) {
    return null;
  }

  const remaining = Math.max(0, target - safeConsumed);
  const exceededBy = Math.max(0, safeConsumed - target);

  return {
    consumed: safeConsumed,
    target,
    remaining,
    exceededBy,
    progress: safeConsumed / target,
  };
}

export function puffsReduced(startingTarget: number, currentTarget: number): number | null {
  if (!isPositiveTarget(startingTarget) || !isPositiveTarget(currentTarget)) {
    return null;
  }

  return startingTarget - currentTarget;
}

/** Recorded days only. Missing days are not part of the average or the within-target count. */
export function weekAgainstTarget(
  days: readonly { count: number }[],
  target: number | null,
): WeekGoalStatus {
  const recordedDays = days.length;
  if (recordedDays === 0) {
    return { recordedDays: 0, average: null, withinTarget: null };
  }

  const total = days.reduce((sum, day) => sum + day.count, 0);
  const canCompare = target != null && isPositiveTarget(target);

  return {
    recordedDays,
    average: total / recordedDays,
    withinTarget: canCompare ? days.filter((day) => day.count <= target).length : null,
  };
}

export function withDailyTarget(settings: GoalSettings, target: number, date: string): GoalSettings {
  if (!isPositiveTarget(target) || !isValidDayKey(date)) {
    return settings;
  }

  if (settings.dailyTarget === target) {
    return settings;
  }

  return {
    ...settings,
    dailyTarget: target,
    history: [...settings.history, { date, target }],
  };
}

/** Null clears the custom limit so the default applies again. */
export function withDailyLimit(settings: GoalSettings, limit: number | null): GoalSettings {
  if (limit != null && !isPositiveTarget(limit)) {
    return settings;
  }

  if (settings.dailyLimit === limit) {
    return settings;
  }

  return { ...settings, dailyLimit: limit };
}

export function withReduction(settings: GoalSettings, reduction: ReductionGoal): GoalSettings {
  if (!isPositiveTarget(reduction.startingTarget) || !isValidDayKey(reduction.targetDate)) {
    return settings;
  }

  return {
    ...settings,
    reduction: {
      startingTarget: reduction.startingTarget,
      targetDate: reduction.targetDate,
    },
  };
}

export function withoutReduction(settings: GoalSettings): GoalSettings {
  if (settings.reduction == null) {
    return settings;
  }

  return { ...settings, reduction: null };
}

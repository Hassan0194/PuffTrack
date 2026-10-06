import { sanitizeCount } from './count';

const HOUR_MS = 3_600_000;
const MINUTE_MS = 60_000;

export type PuffPace =
  | { kind: 'hourly'; perHour: number }
  | { kind: 'soon'; remaining: number; minutes: number }
  | { kind: 'closing' }
  | { kind: 'none' };

export type PuffBudget = {
  consumed: number;
  limit: number;
  remaining: number;
  /** Share of the daily limit already used. Can pass 100 after the limit is exceeded. */
  percentConsumed: number;
  /** Bar fill from 0 to 1. Extra puffs keep the bar full. */
  progress: number;
  budgetReached: boolean;
  pace: PuffPace;
};

export function millisecondsUntilLocalMidnight(now: Date): number {
  const nextMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  return Math.max(0, nextMidnight.getTime() - now.getTime());
}

/** Remaining budget, percent used, and the pace needed to stay inside the limit. */
export function calculatePuffBudget(consumed: number, limit: number, now: Date): PuffBudget {
  const safeConsumed = sanitizeCount(consumed);
  const safeLimit = sanitizeCount(limit);
  const remaining = Math.max(0, safeLimit - safeConsumed);
  const budgetReached = safeLimit > 0 && safeConsumed >= safeLimit;
  const percentConsumed = safeLimit === 0 ? 0 : (safeConsumed / safeLimit) * 100;
  const progress = safeLimit === 0 ? 0 : Math.min(1, safeConsumed / safeLimit);

  return {
    consumed: safeConsumed,
    limit: safeLimit,
    remaining,
    percentConsumed,
    progress,
    budgetReached,
    pace: paceForRemainder(remaining, budgetReached, millisecondsUntilLocalMidnight(now)),
  };
}

function paceForRemainder(remaining: number, budgetReached: boolean, msRemaining: number): PuffPace {
  if (budgetReached || remaining <= 0) {
    return { kind: 'none' };
  }

  if (msRemaining <= 0) {
    return { kind: 'closing' };
  }

  if (msRemaining < HOUR_MS) {
    const minutes = Math.max(1, Math.round(msRemaining / MINUTE_MS));
    if (minutes >= 60) {
      return { kind: 'hourly', perHour: remaining / (msRemaining / HOUR_MS) };
    }

    return { kind: 'soon', remaining, minutes };
  }

  return { kind: 'hourly', perHour: remaining / (msRemaining / HOUR_MS) };
}

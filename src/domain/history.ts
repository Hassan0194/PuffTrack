import type { TriggerCount } from './triggers';
import { countPuffTriggers } from './triggers';
import { calculatePuffBudget } from './budget';
import { addCalendarDays, todayKey } from './date';
import type { StoredPuff } from './storedPuff';

export type ArchivedDay = {
  date: string;
  count: number;
  limit: number | null;
  puffs: StoredPuff[];
  lastPuffAt: string | null;
};

export type WeekDay = {
  date: string;
  /** Null when that calendar day has no stored record. */
  count: number | null;
  limit: number | null;
  barPercent: number;
  triggerCounts: TriggerCount[];
};

export type HistorySnapshot = {
  todayCount: number;
  todayLimit: number;
  todayPercent: number;
  days: WeekDay[];
  hasHistory: boolean;
};

const WEEK_LENGTH = 7;

export function buildHistorySnapshot(
  archived: readonly ArchivedDay[],
  todayCount: number,
  todayLimit: number,
  now: Date,
  todayPuffs: readonly { trigger: StoredPuff['trigger'] }[] = [],
): HistorySnapshot {
  const today = todayKey(now);
  const byDate = new Map(archived.map((day) => [day.date, day]));
  const days: Omit<WeekDay, 'barPercent'>[] = [];

  for (let offset = WEEK_LENGTH - 1; offset >= 0; offset -= 1) {
    const date = addCalendarDays(today, -offset);
    if (!date) {
      continue;
    }

    if (date === today) {
      days.push({
        date,
        count: todayCount,
        limit: todayLimit,
        triggerCounts: countPuffTriggers(todayPuffs),
      });
      continue;
    }

    const saved = byDate.get(date);
    if (!saved) {
      days.push({ date, count: null, limit: null, triggerCounts: [] });
      continue;
    }

    days.push({
      date,
      count: saved.count,
      limit: saved.limit,
      triggerCounts: countPuffTriggers(saved.puffs),
    });
  }

  const peak = days.reduce((max, day) => Math.max(max, day.count ?? 0), 0);
  const budget = calculatePuffBudget(todayCount, todayLimit, now);

  return {
    todayCount: budget.consumed,
    todayLimit: budget.limit,
    todayPercent: budget.percentConsumed,
    hasHistory: archived.length > 0 || budget.consumed > 0,
    days: days.map((day) => ({
      ...day,
      barPercent: peak === 0 || day.count == null ? 0 : (day.count / peak) * 100,
    })),
  };
}

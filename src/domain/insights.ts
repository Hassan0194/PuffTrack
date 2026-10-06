import type { TriggerType } from '../constants/triggers';
import { addCalendarDays, todayKey } from './date';
import type { ArchivedDay } from './history';
import type { StoredPuff, TrackedPuff } from './storedPuff';
import { countPuffTriggers, type TriggerCount } from './triggers';

export type InsightPuff = {
  atMs: number;
  trigger: TriggerType | null;
};

export type RecordedDay = {
  date: string;
  count: number;
  puffs: InsightPuff[];
};

export type DayTotal = {
  date: string;
  count: number;
};

export type TriggerShare = TriggerCount & {
  percent: number;
};

export type PuffGap = {
  gapMs: number;
  startMs: number;
  endMs: number;
};

const WEEK_LENGTH = 7;

function dayFromStored(date: string, puffs: readonly StoredPuff[]): RecordedDay | null {
  const parsed: InsightPuff[] = [];

  for (const puff of puffs) {
    const atMs = Date.parse(puff.timestamp);
    if (!Number.isFinite(atMs)) {
      continue;
    }

    parsed.push({ atMs, trigger: puff.trigger });
  }

  if (parsed.length === 0) {
    return null;
  }

  return { date, count: parsed.length, puffs: parsed };
}

function dayFromTracked(date: string, puffs: readonly TrackedPuff[]): RecordedDay | null {
  if (puffs.length === 0) {
    return null;
  }

  return {
    date,
    count: puffs.length,
    puffs: puffs.map((puff) => ({ atMs: puff.atMs, trigger: puff.trigger })),
  };
}

/** Days that contain at least one stored puff. Missing days are omitted. */
export function recordedDaysFromHistory(
  archived: readonly ArchivedDay[],
  today: { dayKey: string; puffs: readonly TrackedPuff[] },
  now: Date,
): RecordedDay[] {
  const todayDate = todayKey(now);
  const days: RecordedDay[] = [];

  for (const day of archived) {
    if (day.date === todayDate) {
      continue;
    }

    const recorded = dayFromStored(day.date, day.puffs);
    if (recorded) {
      days.push(recorded);
    }
  }

  if (today.dayKey === todayDate) {
    const recordedToday = dayFromTracked(today.dayKey, today.puffs);
    if (recordedToday) {
      days.push(recordedToday);
    }
  }

  return days.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
}

export function totalPuffs(days: readonly { count: number }[]): number {
  return days.reduce((sum, day) => sum + day.count, 0);
}

export function averageDailyPuffs(days: readonly { count: number }[]): number | null {
  if (days.length === 0) {
    return null;
  }

  return totalPuffs(days) / days.length;
}

function laterOrBetter(current: RecordedDay, best: RecordedDay, wantHigher: boolean): RecordedDay {
  const countWins = wantHigher ? current.count > best.count : current.count < best.count;
  const sameCountLaterDay = current.count === best.count && current.date > best.date;
  return countWins || sameCountLaterDay ? current : best;
}

export function highestConsumptionDay(days: readonly RecordedDay[]): RecordedDay | null {
  if (days.length === 0) {
    return null;
  }

  return days.reduce((best, day) => laterOrBetter(day, best, true));
}

export function lowestConsumptionDay(days: readonly RecordedDay[]): RecordedDay | null {
  if (days.length === 0) {
    return null;
  }

  return days.reduce((best, day) => laterOrBetter(day, best, false));
}

export function recordedDaysInLastWeek(days: readonly RecordedDay[], now: Date): RecordedDay[] {
  const end = todayKey(now);
  const start = addCalendarDays(end, -(WEEK_LENGTH - 1));
  if (!start) {
    return [];
  }

  return days.filter((day) => day.date >= start && day.date <= end);
}

export function weeklyTotal(days: readonly RecordedDay[]): number {
  return totalPuffs(days);
}

export function chartShares(days: readonly RecordedDay[]): Array<DayTotal & { barPercent: number }> {
  const peak = days.reduce((max, day) => Math.max(max, day.count), 0);

  return days.map((day) => ({
    date: day.date,
    count: day.count,
    barPercent: peak === 0 ? 0 : (day.count / peak) * 100,
  }));
}

export function allPuffs(days: readonly RecordedDay[]): InsightPuff[] {
  return days.flatMap((day) => day.puffs);
}

export function triggerShares(puffs: readonly InsightPuff[]): {
  rows: TriggerShare[];
  taggedTotal: number;
  untaggedTotal: number;
} {
  const counts = countPuffTriggers(puffs);
  const taggedTotal = counts.reduce((sum, item) => sum + item.count, 0);
  const untaggedTotal = puffs.filter((puff) => puff.trigger == null).length;

  return {
    taggedTotal,
    untaggedTotal,
    rows: counts.map((item) => ({
      ...item,
      percent: taggedTotal === 0 ? 0 : (item.count / taggedTotal) * 100,
    })),
  };
}

export function mostCommonTrigger(rows: readonly TriggerShare[]): TriggerShare | null {
  return rows[0] ?? null;
}

/** Longest time between two consecutive recorded puffs, in timestamp order. */
export function longestPuffGap(puffs: readonly { atMs: number }[]): PuffGap | null {
  if (puffs.length < 2) {
    return null;
  }

  const sorted = [...puffs].sort((a, b) => a.atMs - b.atMs);
  let best: PuffGap | null = null;

  for (let index = 1; index < sorted.length; index += 1) {
    const startMs = sorted[index - 1].atMs;
    const endMs = sorted[index].atMs;
    const gapMs = endMs - startMs;

    if (!best || gapMs > best.gapMs || (gapMs === best.gapMs && endMs > best.endMs)) {
      best = { gapMs, startMs, endMs };
    }
  }

  return best;
}

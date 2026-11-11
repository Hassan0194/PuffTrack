import { addCalendarDays } from './date';
import type { Streaks } from './streaks';

export type TimeOfDayKey = 'morning' | 'afternoon' | 'evening' | 'night';

export type TimeOfDayBucket = {
  key: TimeOfDayKey;
  label: string;
  count: number;
  /** Share of the busiest bucket, 0 to 100, for bar width. */
  barPercent: number;
};

const BUCKETS: { key: TimeOfDayKey; label: string }[] = [
  { key: 'morning', label: 'Morning (5am–12pm)' },
  { key: 'afternoon', label: 'Afternoon (12pm–5pm)' },
  { key: 'evening', label: 'Evening (5pm–10pm)' },
  { key: 'night', label: 'Night (10pm–5am)' },
];

function bucketForHour(hour: number): TimeOfDayKey {
  if (hour >= 5 && hour < 12) {
    return 'morning';
  }

  if (hour >= 12 && hour < 17) {
    return 'afternoon';
  }

  if (hour >= 17 && hour < 22) {
    return 'evening';
  }

  return 'night';
}

/** When entries happen, by the phone's local time. */
export function timeOfDayBuckets(puffs: readonly { atMs: number }[]): TimeOfDayBucket[] {
  const counts: Record<TimeOfDayKey, number> = { morning: 0, afternoon: 0, evening: 0, night: 0 };

  for (const puff of puffs) {
    if (Number.isFinite(puff.atMs)) {
      counts[bucketForHour(new Date(puff.atMs).getHours())] += 1;
    }
  }

  const peak = Math.max(...Object.values(counts));

  return BUCKETS.map((bucket) => ({
    key: bucket.key,
    label: bucket.label,
    count: counts[bucket.key],
    barPercent: peak === 0 ? 0 : (counts[bucket.key] / peak) * 100,
  }));
}

export type WeekChange = {
  thisWeekAverage: number;
  lastWeekAverage: number;
  /** Negative means less than last week. Null when last week averaged 0. */
  changePercent: number | null;
};

type DayTotal = { date: string; count: number };

function averageBetween(days: readonly DayTotal[], from: string, to: string): number | null {
  const inRange = days.filter((day) => day.date >= from && day.date <= to);
  if (inRange.length === 0) {
    return null;
  }

  return inRange.reduce((sum, day) => sum + day.count, 0) / inRange.length;
}

/**
 * Average per saved day for the last 7 days against the 7 days before.
 * Days with no record are not counted as zero. Null when either week has no saved day.
 */
export function weekOverWeek(days: readonly DayTotal[], today: string): WeekChange | null {
  const thisStart = addCalendarDays(today, -6);
  const lastEnd = addCalendarDays(today, -7);
  const lastStart = addCalendarDays(today, -13);
  if (!thisStart || !lastEnd || !lastStart) {
    return null;
  }

  const thisWeekAverage = averageBetween(days, thisStart, today);
  const lastWeekAverage = averageBetween(days, lastStart, lastEnd);
  if (thisWeekAverage == null || lastWeekAverage == null) {
    return null;
  }

  return {
    thisWeekAverage,
    lastWeekAverage,
    changePercent:
      lastWeekAverage === 0 ? null : ((thisWeekAverage - lastWeekAverage) / lastWeekAverage) * 100,
  };
}

export type Milestone = {
  id: string;
  title: string;
  detail: string;
  earned: boolean;
};

const STREAK_STEPS = [3, 7, 14, 30];

/** Milestones are derived from saved days, so nothing extra is stored. */
export function milestones(
  days: readonly DayTotal[],
  streaks: Streaks,
  limit: number,
  weekChange: WeekChange | null,
): Milestone[] {
  const list: Milestone[] = [
    {
      id: 'first-day',
      title: 'First day on track',
      detail: 'Finish a day within your limit.',
      earned: days.some((day) => day.count <= limit),
    },
    {
      id: 'quiet-day',
      title: 'A quiet day',
      detail: 'Save a day with nothing logged.',
      earned: days.some((day) => day.count === 0),
    },
  ];

  for (const step of STREAK_STEPS) {
    list.push({
      id: `streak-${step}`,
      title: `${step}-day streak`,
      detail: `${step} days in a row on track.`,
      earned: streaks.best >= step,
    });
  }

  list.push({
    id: 'down-on-last-week',
    title: 'Down on last week',
    detail: 'Average less than the week before.',
    earned: weekChange != null && weekChange.changePercent != null && weekChange.changePercent < 0,
  });

  return list;
}

import { addCalendarDays } from './date';

export type StreakDay = {
  date: string;
  count: number;
};

export type Streaks = {
  current: number;
  best: number;
};

/**
 * Runs of consecutive recorded days at or under the limit.
 * A day with no record breaks a run. Today still counts while it is under the limit,
 * and an empty today does not end a run that reaches yesterday.
 */
export function withinLimitStreaks(days: readonly StreakDay[], limit: number, today: string): Streaks {
  const byDate = new Map<string, number>();
  for (const day of days) {
    byDate.set(day.date, day.count);
  }

  const within = [...byDate.entries()]
    .filter(([, count]) => count <= limit)
    .map(([date]) => date)
    .sort();

  let best = 0;
  let run = 0;
  let previous: string | null = null;
  for (const date of within) {
    run = previous != null && addCalendarDays(previous, 1) === date ? run + 1 : 1;
    best = Math.max(best, run);
    previous = date;
  }

  let cursor: string | null = byDate.has(today) ? today : addCalendarDays(today, -1);
  let current = 0;
  while (cursor != null) {
    const count = byDate.get(cursor);
    if (count == null || count > limit) {
      break;
    }

    current += 1;
    cursor = addCalendarDays(cursor, -1);
  }

  return { current, best };
}

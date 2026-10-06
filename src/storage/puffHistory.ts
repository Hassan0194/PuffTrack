import AsyncStorage from '@react-native-async-storage/async-storage';

import { HISTORY_RETENTION_DAYS } from '../constants/limits';
import { addCalendarDays, isValidDayKey, todayKey } from '../domain/date';
import type { ArchivedDay } from '../domain/history';
import { parseStoredPuffList, serializeStoredPuff } from '../domain/storedPuff';
import type { TodayRecord } from '../domain/todayRecord';

const HISTORY_KEY = 'pufftrack.history.v1';

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

function parseArchivedDay(value: unknown): ArchivedDay | null {
  if (!isRecord(value) || typeof value.date !== 'string' || !isValidDayKey(value.date)) {
    return null;
  }

  const tracked = parseStoredPuffList(value.puffs);
  if (!tracked) {
    return null;
  }

  const puffs = tracked.map(serializeStoredPuff);
  const lastPuffAt = puffs.length === 0 ? null : puffs[puffs.length - 1].timestamp;

  const limit =
    typeof value.limit === 'number' && Number.isInteger(value.limit) && value.limit >= 0
      ? value.limit
      : null;

  return {
    date: value.date,
    count: puffs.length,
    limit,
    puffs,
    lastPuffAt,
  };
}

function parseHistory(raw: string | null): ArchivedDay[] {
  if (raw == null) {
    return [];
  }

  try {
    const data: unknown = JSON.parse(raw);
    if (!isRecord(data) || !Array.isArray(data.days)) {
      return [];
    }

    const days: ArchivedDay[] = [];
    for (const entry of data.days) {
      const parsed = parseArchivedDay(entry);
      if (parsed) {
        days.push(parsed);
      }
    }
    return days;
  } catch {
    return [];
  }
}

function withinRetention(date: string, today: string): boolean {
  if (date === today) {
    return true;
  }

  const cutoff = addCalendarDays(today, -HISTORY_RETENTION_DAYS);
  if (!cutoff) {
    return true;
  }

  return date >= cutoff;
}

function toArchived(record: TodayRecord, limit: number): ArchivedDay {
  const puffs = record.puffs.map(serializeStoredPuff);

  return {
    date: record.dayKey,
    count: puffs.length,
    limit: Number.isInteger(limit) && limit >= 0 ? limit : null,
    puffs,
    lastPuffAt: record.lastPuffAt == null ? null : new Date(record.lastPuffAt).toISOString(),
  };
}

async function writeHistory(days: readonly ArchivedDay[]): Promise<void> {
  const sorted = [...days].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify({ days: sorted }));
}

async function readHistory(now: Date): Promise<ArchivedDay[]> {
  const today = todayKey(now);

  try {
    const raw = await AsyncStorage.getItem(HISTORY_KEY);
    const parsed = parseHistory(raw);
    const kept = parsed.filter((day) => withinRetention(day.date, today));

    if (raw != null && kept.length !== parsed.length) {
      await writeHistory(kept);
    }

    return kept;
  } catch {
    return [];
  }
}

/** Completed days only. Today's active record stays in its own key. */
export function loadPuffHistory(now = new Date()): Promise<ArchivedDay[]> {
  return enqueue(() => readHistory(now));
}

/**
 * Saves a finished day without touching today's active record.
 * Resolves false when the archive could not be written.
 */
export function archiveCompletedDay(
  record: TodayRecord,
  limit: number,
  now = new Date(),
): Promise<boolean> {
  const today = todayKey(now);
  if (record.dayKey === today) {
    return Promise.resolve(true);
  }

  const entry = toArchived(record, limit);

  return enqueue(async () => {
    try {
      const existing = parseHistory(await AsyncStorage.getItem(HISTORY_KEY));
      const next = existing.filter((day) => day.date !== entry.date && withinRetention(day.date, today));
      if (withinRetention(entry.date, today)) {
        next.push(entry);
      }
      await writeHistory(next);
      return true;
    } catch {
      return false;
    }
  });
}

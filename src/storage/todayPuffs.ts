import AsyncStorage from '@react-native-async-storage/async-storage';

import type { TriggerType } from '../constants/triggers';
import { isValidDayKey, todayKey } from '../domain/date';
import { parseStoredPuffList, serializeStoredPuff, type TrackedPuff } from '../domain/storedPuff';
import {
  applyPuff,
  cloneTodayRecord,
  emptyTodayRecord,
  type TodayRecord,
} from '../domain/todayRecord';
import { refreshPuffTrackWidget } from '../widget/syncPuffWidget';
import { loadEffectiveDailyLimit } from './dailyLimit';
import { archiveCompletedDay } from './puffHistory';

const STORAGE_KEY = 'pufftrack.today.v1';

type StoredToday = {
  date: string;
  count: number;
  puffs: ReturnType<typeof serializeStoredPuff>[];
  lastPuffAt: string | null;
};

let queue: Promise<void> = Promise.resolve();

function enqueue<T>(task: () => Promise<T>): Promise<T> {
  const run = queue.then(task, task);
  queue = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

function toStored(record: TodayRecord): StoredToday {
  return {
    date: record.dayKey,
    count: record.puffs.length,
    puffs: record.puffs.map(serializeStoredPuff),
    lastPuffAt: record.lastPuffAt == null ? null : new Date(record.lastPuffAt).toISOString(),
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseSameDay(data: Record<string, unknown>, today: string): TodayRecord | null {
  const puffs = parseStoredPuffList(data.puffs);
  if (!puffs) {
    return null;
  }

  const lastPuffAt = puffs.length === 0 ? null : puffs[puffs.length - 1].atMs;

  return {
    dayKey: today,
    count: puffs.length,
    puffs,
    lastPuffAt,
  };
}

function parseStoredDay(raw: string): TodayRecord | null {
  let data: unknown;

  try {
    data = JSON.parse(raw);
  } catch {
    return null;
  }

  if (!isRecord(data) || typeof data.date !== 'string' || !isValidDayKey(data.date)) {
    return null;
  }

  return parseSameDay(data, data.date);
}

function mergedToday(dayKey: string, stored: TrackedPuff[], incoming: TrackedPuff[]): TodayRecord {
  const byTime = new Map<number, TrackedPuff>();

  for (const puff of stored) {
    byTime.set(puff.atMs, puff);
  }

  for (const puff of incoming) {
    byTime.set(puff.atMs, puff);
  }

  const puffs = [...byTime.values()].sort((left, right) => left.atMs - right.atMs);

  return {
    dayKey,
    count: puffs.length,
    puffs,
    lastPuffAt: puffs.length === 0 ? null : puffs[puffs.length - 1].atMs,
  };
}

async function persistToday(snapshot: TodayRecord): Promise<void> {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    let next = snapshot;

    if (raw != null) {
      const existing = parseStoredDay(raw);
      if (existing && existing.dayKey !== snapshot.dayKey) {
        const archived = await archiveCompletedDay(existing, await loadEffectiveDailyLimit());
        if (!archived) {
          throw new Error('Could not archive the completed day.');
        }
      } else if (existing && existing.dayKey === snapshot.dayKey) {
        next = mergedToday(snapshot.dayKey, existing.puffs, snapshot.puffs);
      }
    }

    const payload = JSON.stringify(toStored(next));
    if ((await AsyncStorage.getItem(STORAGE_KEY)) !== raw) {
      continue;
    }

    await AsyncStorage.setItem(STORAGE_KEY, payload);
    if ((await AsyncStorage.getItem(STORAGE_KEY)) === payload) {
      return;
    }
  }

  throw new Error('Could not save today.');
}

async function readTodayRecord(now: Date): Promise<TodayRecord> {
  const fresh = emptyTodayRecord(now);

  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw == null) {
      return fresh;
    }

    const parsed = parseStoredDay(raw);
    if (!parsed) {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(toStored(fresh)));
      return fresh;
    }

    if (parsed.dayKey === fresh.dayKey) {
      return parsed;
    }

    await persistToday(fresh);
    return fresh;
  } catch {
    return fresh;
  }
}

/** Loads today's record. A previous day is archived before the active record resets. */
export function loadTodayRecord(now = new Date()): Promise<TodayRecord> {
  return enqueue(() => readTodayRecord(now));
}

/** Writes the full day snapshot. Later saves wait so an older write cannot overwrite them. */
export function saveTodayRecord(record: TodayRecord): Promise<void> {
  const snapshot = cloneTodayRecord(record);

  return enqueue(async () => {
    try {
      await persistToday(snapshot);
    } catch {
      // Keep the stored day when a reset cannot archive it first.
    }

    await refreshPuffTrackWidget();
  });
}

/**
 * Removes the most recent puff of today. The list is written directly, because saveTodayRecord
 * merges by timestamp and would bring the removed puff back.
 */
export function removeLastTodayPuff(now = new Date()): Promise<TodayRecord | null> {
  return enqueue(async () => {
    try {
      const current = await readTodayRecord(now);
      if (current.dayKey !== todayKey(now) || current.puffs.length === 0) {
        return current;
      }

      const puffs = current.puffs.slice(0, -1);
      const next: TodayRecord = {
        dayKey: current.dayKey,
        count: puffs.length,
        puffs,
        lastPuffAt: puffs.length === 0 ? null : puffs[puffs.length - 1].atMs,
      };

      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(toStored(next)));
      await refreshPuffTrackWidget();
      return next;
    } catch {
      return null;
    }
  });
}

/**
 * Adds one puff to today's stored list.
 * The list is re-read inside the save queue so this cannot replace a puff already stored.
 */
export function appendTodayPuff(
  atMs: number,
  trigger: TriggerType | null = null,
  now = new Date(atMs),
): Promise<TodayRecord | null> {
  if (!Number.isFinite(atMs)) {
    return Promise.resolve(null);
  }

  return enqueue(async () => {
    try {
      for (let attempt = 0; attempt < 5; attempt += 1) {
        const current = await readTodayRecord(now);
        const today = todayKey(now);
        if (current.dayKey === today && current.puffs.some((puff) => puff.atMs === atMs)) {
          return current;
        }

        await persistToday(applyPuff(current, atMs, trigger));

        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        const stored = raw == null ? null : parseStoredDay(raw);
        if (stored && stored.dayKey === today && stored.puffs.some((puff) => puff.atMs === atMs)) {
          await refreshPuffTrackWidget();
          return stored;
        }
      }

      return null;
    } catch {
      return null;
    }
  });
}

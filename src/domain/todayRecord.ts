import type { TriggerType } from '../constants/triggers';
import type { TrackedPuff } from './storedPuff';
import { todayKey } from './date';

export type TodayRecord = {
  dayKey: string;
  count: number;
  puffs: TrackedPuff[];
  lastPuffAt: number | null;
};

export function emptyTodayRecord(now = new Date()): TodayRecord {
  return {
    dayKey: todayKey(now),
    count: 0,
    puffs: [],
    lastPuffAt: null,
  };
}

export function applyPuff(
  record: TodayRecord,
  atMs: number,
  trigger: TriggerType | null = null,
): TodayRecord {
  const at = new Date(atMs);
  const key = todayKey(at);
  const base = record.dayKey === key ? record : emptyTodayRecord(at);
  const puffs = [...base.puffs, { atMs, trigger }];

  return {
    dayKey: key,
    count: puffs.length,
    puffs,
    lastPuffAt: atMs,
  };
}

export function cloneTodayRecord(record: TodayRecord): TodayRecord {
  return {
    dayKey: record.dayKey,
    count: record.count,
    puffs: record.puffs.map((puff) => ({ ...puff })),
    lastPuffAt: record.lastPuffAt,
  };
}

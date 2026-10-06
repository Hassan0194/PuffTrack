import { isTriggerType, type TriggerType } from '../constants/triggers';

export type TrackedPuff = {
  atMs: number;
  trigger: TriggerType | null;
};

export type StoredPuff = {
  timestamp: string;
  trigger: TriggerType | null;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Older saves stored a timestamp string. Those puffs have no trigger. */
export function parseStoredPuff(entry: unknown): TrackedPuff | null {
  if (typeof entry === 'string') {
    const atMs = Date.parse(entry);
    if (!Number.isFinite(atMs)) {
      return null;
    }

    return { atMs, trigger: null };
  }

  if (!isRecord(entry) || typeof entry.timestamp !== 'string') {
    return null;
  }

  const atMs = Date.parse(entry.timestamp);
  if (!Number.isFinite(atMs)) {
    return null;
  }

  const trigger =
    entry.trigger == null || !isTriggerType(entry.trigger) ? null : entry.trigger;

  return { atMs, trigger };
}

export function parseStoredPuffList(entries: unknown): TrackedPuff[] | null {
  if (!Array.isArray(entries)) {
    return null;
  }

  const puffs: TrackedPuff[] = [];
  for (const entry of entries) {
    const parsed = parseStoredPuff(entry);
    if (parsed) {
      puffs.push(parsed);
    }
  }

  if (entries.length > 0 && puffs.length === 0) {
    return null;
  }

  return puffs;
}

export function serializeStoredPuff(puff: TrackedPuff): StoredPuff {
  return {
    timestamp: new Date(puff.atMs).toISOString(),
    trigger: puff.trigger,
  };
}

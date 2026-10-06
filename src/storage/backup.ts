import AsyncStorage from '@react-native-async-storage/async-storage';

import { refreshPuffTrackWidget } from '../widget/syncPuffWidget';

/**
 * Every AsyncStorage key owned by PuffTrack starts with this prefix, so a new key such as
 * `pufftrack.something.v1` is backed up and restored without any change here.
 */
export const BACKUP_KEY_PREFIX = 'pufftrack.';

export const BACKUP_FORMAT = 'pufftrack-backup';

/** Bump when the file layout changes. Older versions stay readable up to this number. */
export const BACKUP_VERSION = 1;

/** Backups larger than this are rejected before they are read. */
export const MAX_BACKUP_BYTES = 10 * 1024 * 1024;

export type PuffTrackBackup = {
  format: typeof BACKUP_FORMAT;
  version: number;
  exportedAt: string;
  /** Raw stored strings, exactly as AsyncStorage holds them. */
  data: Record<string, string>;
};

export type BackupParseResult =
  | { ok: true; backup: PuffTrackBackup }
  | { ok: false; reason: 'invalid' | 'newer-version' };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isOwnedKey(key: string): boolean {
  return key.length > BACKUP_KEY_PREFIX.length && key.startsWith(BACKUP_KEY_PREFIX);
}

async function ownedKeys(): Promise<string[]> {
  return (await AsyncStorage.getAllKeys()).filter(isOwnedKey);
}

export function backupFileName(now = new Date()): string {
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `pufftrack-backup-${now.getFullYear()}-${month}-${day}.json`;
}

/** Reads every PuffTrack key and returns the backup as JSON text. */
export async function createBackupJson(now = new Date()): Promise<string> {
  const keys = await ownedKeys();
  const pairs = keys.length === 0 ? [] : await AsyncStorage.multiGet(keys);
  const data: Record<string, string> = {};

  for (const [key, value] of pairs) {
    if (value != null) {
      data[key] = value;
    }
  }

  const backup: PuffTrackBackup = {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    exportedAt: now.toISOString(),
    data,
  };

  return JSON.stringify(backup, null, 2);
}

/** Checks the file without touching storage. */
export function parseBackup(text: string): BackupParseResult {
  let parsed: unknown;

  try {
    parsed = JSON.parse(text);
  } catch {
    return { ok: false, reason: 'invalid' };
  }

  if (!isRecord(parsed) || parsed.format !== BACKUP_FORMAT) {
    return { ok: false, reason: 'invalid' };
  }

  const { version, exportedAt, data } = parsed;
  if (typeof version !== 'number' || !Number.isInteger(version) || version < 1) {
    return { ok: false, reason: 'invalid' };
  }

  if (version > BACKUP_VERSION) {
    return { ok: false, reason: 'newer-version' };
  }

  if (typeof exportedAt !== 'string' || !Number.isFinite(Date.parse(exportedAt))) {
    return { ok: false, reason: 'invalid' };
  }

  if (!isRecord(data)) {
    return { ok: false, reason: 'invalid' };
  }

  const entries = Object.entries(data);
  if (entries.length === 0) {
    return { ok: false, reason: 'invalid' };
  }

  const clean: Record<string, string> = {};
  for (const [key, value] of entries) {
    // Unrelated keys make the whole file untrustworthy, so reject it instead of skipping them.
    if (!isOwnedKey(key) || typeof value !== 'string') {
      return { ok: false, reason: 'invalid' };
    }

    // Every PuffTrack key holds JSON. A value that does not parse means a damaged file.
    try {
      JSON.parse(value);
    } catch {
      return { ok: false, reason: 'invalid' };
    }

    clean[key] = value;
  }

  return { ok: true, backup: { format: BACKUP_FORMAT, version, exportedAt, data: clean } };
}

/**
 * Replaces all PuffTrack data with the backup. The backup must already have passed parseBackup.
 * Returns false when storage could not be written.
 */
export async function restoreBackup(backup: PuffTrackBackup): Promise<boolean> {
  try {
    const existing = await ownedKeys();
    const stale = existing.filter((key) => !(key in backup.data));
    const pairs = Object.entries(backup.data);

    // Write first so a failed write leaves the old data in place, then drop keys the backup lacks.
    await AsyncStorage.multiSet(pairs);
    if (stale.length > 0) {
      await AsyncStorage.multiRemove(stale);
    }
  } catch {
    return false;
  }

  await refreshPuffTrackWidget();
  return true;
}

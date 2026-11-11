import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  BACKUP_FORMAT,
  BACKUP_VERSION,
  backupFileName,
  createBackupJson,
  parseBackup,
  restoreBackup,
} from '../storage/backup';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
jest.mock('../widget/syncPuffWidget', () => ({ refreshPuffTrackWidget: jest.fn(async () => undefined) }));

function backupText(overrides: Record<string, unknown> = {}): string {
  return JSON.stringify({
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    exportedAt: '2026-01-01T00:00:00.000Z',
    data: { 'pufftrack.goals.v1': '{"dailyLimit":15}' },
    ...overrides,
  });
}

beforeEach(async () => {
  await AsyncStorage.clear();
});

describe('backup file', () => {
  it('names the file by date', () => {
    expect(backupFileName(new Date(2026, 2, 5))).toBe('pufftrack-backup-2026-03-05.json');
  });
});

describe('parseBackup', () => {
  it('accepts a valid backup', () => {
    const result = parseBackup(backupText());
    expect(result.ok).toBe(true);
  });

  it('rejects text that is not JSON', () => {
    expect(parseBackup('not json')).toEqual({ ok: false, reason: 'invalid' });
  });

  it('rejects the wrong format, missing fields, and empty data', () => {
    for (const text of [
      backupText({ format: 'other' }),
      backupText({ version: 'one' }),
      backupText({ exportedAt: 'never' }),
      backupText({ data: {} }),
      backupText({ data: [] }),
      JSON.stringify([1, 2, 3]),
    ]) {
      expect(parseBackup(text)).toEqual({ ok: false, reason: 'invalid' });
    }
  });

  it('reports a newer version separately', () => {
    expect(parseBackup(backupText({ version: BACKUP_VERSION + 1 }))).toEqual({
      ok: false,
      reason: 'newer-version',
    });
  });

  it('rejects unrelated keys, non-string values, and values that are not JSON', () => {
    for (const data of [
      { 'other.app.key': '{}' },
      { 'pufftrack.goals.v1': { dailyLimit: 15 } },
      { 'pufftrack.goals.v1': '{broken' },
    ]) {
      expect(parseBackup(backupText({ data }))).toEqual({ ok: false, reason: 'invalid' });
    }
  });
});

describe('export and restore', () => {
  it('exports only PuffTrack keys', async () => {
    await AsyncStorage.setItem('pufftrack.today.v1', '{"date":"2026-01-01"}');
    await AsyncStorage.setItem('pufftrack.future.v9', '{}');
    await AsyncStorage.setItem('unrelated', 'x');

    const parsed = JSON.parse(await createBackupJson(new Date('2026-01-02T00:00:00Z')));
    expect(parsed.format).toBe(BACKUP_FORMAT);
    expect(parsed.version).toBe(BACKUP_VERSION);
    expect(parsed.exportedAt).toBe('2026-01-02T00:00:00.000Z');
    expect(Object.keys(parsed.data).sort()).toEqual(['pufftrack.future.v9', 'pufftrack.today.v1']);
  });

  it('replaces PuffTrack data and leaves unrelated data alone', async () => {
    await AsyncStorage.setItem('pufftrack.today.v1', '{"old":true}');
    await AsyncStorage.setItem('pufftrack.history.v1', '{"old":true}');
    await AsyncStorage.setItem('unrelated', 'keep');

    const result = parseBackup(backupText());
    if (!result.ok) {
      throw new Error('expected a valid backup');
    }

    expect(await restoreBackup(result.backup)).toBe(true);
    expect(await AsyncStorage.getItem('pufftrack.goals.v1')).toBe('{"dailyLimit":15}');
    expect(await AsyncStorage.getItem('pufftrack.today.v1')).toBeNull();
    expect(await AsyncStorage.getItem('pufftrack.history.v1')).toBeNull();
    expect(await AsyncStorage.getItem('unrelated')).toBe('keep');
  });

  it('round-trips an export', async () => {
    await AsyncStorage.setItem('pufftrack.profile.v1', '{"completed":true}');
    const text = await createBackupJson();
    await AsyncStorage.clear();

    const result = parseBackup(text);
    if (!result.ok) {
      throw new Error('expected a valid backup');
    }

    await restoreBackup(result.backup);
    expect(await AsyncStorage.getItem('pufftrack.profile.v1')).toBe('{"completed":true}');
  });
});

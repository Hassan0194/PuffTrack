import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import { backupFileName, createBackupJson, MAX_BACKUP_BYTES, parseBackup, type BackupParseResult } from './backup';

export type ExportResult = 'shared' | 'unavailable' | 'failed';

export type PickResult = BackupParseResult | { ok: false; reason: 'canceled' | 'too-large' | 'unreadable' };

/** Writes the backup to the cache folder and opens the system share sheet. */
export async function exportBackupFile(now = new Date()): Promise<ExportResult> {
  try {
    if (!(await Sharing.isAvailableAsync())) {
      return 'unavailable';
    }

    const json = await createBackupJson(now);
    const file = new File(Paths.cache, backupFileName(now));
    if (file.exists) {
      file.delete();
    }

    file.create();
    file.write(json);

    await Sharing.shareAsync(file.uri, {
      mimeType: 'application/json',
      dialogTitle: 'Save or send PuffTrack backup',
      UTI: 'public.json',
    });

    return 'shared';
  } catch {
    return 'failed';
  }
}

/** Opens the file picker and validates the chosen file. Storage is not touched. */
export async function pickBackupFile(): Promise<PickResult> {
  try {
    // Some providers label .json files as octet-stream, so the type is not filtered here.
    // The content check in parseBackup decides what is accepted.
    const picked = await DocumentPicker.getDocumentAsync({
      type: '*/*',
      copyToCacheDirectory: true,
      multiple: false,
    });

    if (picked.canceled || picked.assets.length === 0) {
      return { ok: false, reason: 'canceled' };
    }

    const asset = picked.assets[0];
    if (asset.size != null && asset.size > MAX_BACKUP_BYTES) {
      return { ok: false, reason: 'too-large' };
    }

    const text = await new File(asset.uri).text();
    if (text.length > MAX_BACKUP_BYTES) {
      return { ok: false, reason: 'too-large' };
    }

    return parseBackup(text);
  } catch {
    return { ok: false, reason: 'unreadable' };
  }
}

import { useState } from 'react';
import { Alert, Text } from 'react-native';

import { PrimaryButton } from '../components/PrimaryButton';
import { Screen } from '../components/Screen';
import { ScreenHeader } from '../components/ScreenHeader';
import { SectionCard } from '../components/SectionCard';
import { TextAction } from '../components/TextAction';
import { restoreBackup, type PuffTrackBackup } from '../storage/backup';
import { exportBackupFile, pickBackupFile } from '../storage/backupFiles';
import { ui } from '../theme/ui';

type SettingsScreenProps = {
  onBack: () => void;
  /** Called after a restore so the app reloads its screens from storage. */
  onRestored: () => void;
};

export function SettingsScreen({ onBack, onRestored }: SettingsScreenProps) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function exportBackup() {
    if (busy) {
      return;
    }

    setBusy(true);
    setMessage(null);
    const result = await exportBackupFile();
    setBusy(false);

    if (result === 'unavailable') {
      setMessage('Sharing is not available on this device.');
    } else if (result === 'failed') {
      setMessage('Could not create the backup. Try again.');
    }
  }

  async function restore(backup: PuffTrackBackup) {
    setBusy(true);
    const restored = await restoreBackup(backup);
    setBusy(false);

    if (!restored) {
      setMessage('Could not restore the backup. Your data was not changed.');
      return;
    }

    setMessage('Backup restored.');
    Alert.alert('Backup restored', 'Your PuffTrack data has been restored.', [
      { text: 'OK', onPress: onRestored },
    ]);
  }

  async function importBackup() {
    if (busy) {
      return;
    }

    setBusy(true);
    setMessage(null);
    const picked = await pickBackupFile();
    setBusy(false);

    if (!picked.ok) {
      if (picked.reason === 'canceled') {
        return;
      }

      setMessage(
        picked.reason === 'newer-version'
          ? 'This backup was made by a newer version of PuffTrack. Update the app and try again.'
          : picked.reason === 'too-large'
            ? 'Invalid PuffTrack backup. The file is too large.'
            : 'Invalid PuffTrack backup.',
      );
      return;
    }

    Alert.alert(
      'Restore this backup?',
      'Your current PuffTrack data will be replaced by the backup.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Restore', style: 'destructive', onPress: () => void restore(picked.backup) },
      ],
    );
  }

  return (
    <Screen>
      <ScreenHeader onBack={onBack} title="Settings" />

      <SectionCard title="DATA & BACKUP">
        <Text style={ui.secondary}>
          Save all your PuffTrack data to a file, or restore it from one. Backups stay on your device unless you
          send them somewhere.
        </Text>
        <PrimaryButton label={busy ? 'Working...' : 'Export Backup'} onPress={() => void exportBackup()} />
        <TextAction label="Import Backup" onPress={() => void importBackup()} />
        {message ? <Text style={ui.body}>{message}</Text> : null}
      </SectionCard>
    </Screen>
  );
}

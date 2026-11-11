import Constants from 'expo-constants';
import { useState } from 'react';
import { Alert, Linking, Text } from 'react-native';

import { PrimaryButton } from '../components/PrimaryButton';
import { Screen } from '../components/Screen';
import { ScreenHeader } from '../components/ScreenHeader';
import { SectionCard } from '../components/SectionCard';
import { TextAction } from '../components/TextAction';
import { restoreBackup, type PuffTrackBackup } from '../storage/backup';
import { exportBackupFile, pickBackupFile } from '../storage/backupFiles';
import { exportReportPdf } from '../storage/reportFile';
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

  async function exportReport() {
    if (busy) {
      return;
    }

    setBusy(true);
    setMessage(null);
    const result = await exportReportPdf();
    setBusy(false);

    if (result === 'unavailable') {
      setMessage('Sharing is not available on this device.');
    } else if (result === 'failed') {
      setMessage('Could not create the report. Try again.');
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

      <SectionCard title="REPORT">
        <Text style={ui.secondary}>
          A PDF summary of your saved days, limits, streak and triggers. You choose where it goes.
        </Text>
        <PrimaryButton label={busy ? 'Working...' : 'Export PDF Report'} onPress={() => void exportReport()} />
      </SectionCard>

      <SectionCard title="DATA & BACKUP">
        <Text style={ui.secondary}>
          Save all your PuffTrack data to a file, or restore it from one. Backups stay on your device unless you
          send them somewhere.
        </Text>
        <PrimaryButton label={busy ? 'Working...' : 'Export Backup'} onPress={() => void exportBackup()} />
        <TextAction label="Import Backup" onPress={() => void importBackup()} />
        {message ? <Text style={ui.body}>{message}</Text> : null}
      </SectionCard>

      <SectionCard title="HELP & SUPPORT">
        <Text style={ui.secondary}>
          Want to cut down or quit? Talking to a doctor or a quit-line can help. In the US, the free quitline is
          1-800-QUIT-NOW (1-800-784-8669). Elsewhere, ask your doctor or local health service.
        </Text>
        <TextAction label="Call 1-800-QUIT-NOW" onPress={() => void Linking.openURL('tel:18007848669').catch(() => undefined)} />
      </SectionCard>

      <SectionCard title="ABOUT">
        <Text style={ui.body}>PuffTrack {Constants.expoConfig?.version ?? ''}</Text>
        <Text style={ui.secondary}>
          Your data stays on this device. PuffTrack does not collect or send anything. The daily limit is a
          tracking boundary you choose, not a medical recommendation, and PuffTrack does not give medical advice.
        </Text>
      </SectionCard>
    </Screen>
  );
}

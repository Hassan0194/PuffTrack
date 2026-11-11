import Constants from 'expo-constants';
import { useEffect, useState } from 'react';
import { Alert, Text } from 'react-native';

import { PrimaryButton } from '../components/PrimaryButton';
import { Screen } from '../components/Screen';
import { ScreenHeader } from '../components/ScreenHeader';
import { SectionCard } from '../components/SectionCard';
import { TextAction } from '../components/TextAction';
import { restoreBackup, type PuffTrackBackup } from '../storage/backup';
import { exportBackupFile, pickBackupFile } from '../storage/backupFiles';
import {
  DEFAULT_REMINDER,
  disableReminder,
  enableReminder,
  loadReminder,
  REMINDER_TIMES,
  syncReminder,
  type ReminderSettings,
} from '../storage/reminder';
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
  const [reminder, setReminder] = useState<ReminderSettings>(DEFAULT_REMINDER);

  useEffect(() => {
    void loadReminder().then(setReminder);
  }, []);

  async function turnReminderOn(hour: number, minute: number) {
    setMessage(null);
    const ok = await enableReminder(hour, minute);
    if (!ok) {
      setMessage('Reminders need notification permission. You can allow it in your phone settings.');
      return;
    }

    setReminder({ enabled: true, hour, minute });
  }

  async function turnReminderOff() {
    await disableReminder();
    setReminder((current) => ({ ...current, enabled: false }));
  }

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

    await syncReminder();
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

      <SectionCard title="DAILY REMINDER">
        <Text style={ui.secondary}>
          An optional daily nudge to log your count. It stays on your phone and is off until you turn it on.
        </Text>
        {reminder.enabled ? (
          <>
            <Text style={ui.body}>
              On, every day at {REMINDER_TIMES.find((t) => t.hour === reminder.hour && t.minute === reminder.minute)?.label ?? `${reminder.hour}:${String(reminder.minute).padStart(2, '0')}`}
            </Text>
            {REMINDER_TIMES.filter((t) => t.hour !== reminder.hour || t.minute !== reminder.minute).map((t) => (
              <TextAction key={t.label} label={`Change to ${t.label}`} onPress={() => void turnReminderOn(t.hour, t.minute)} />
            ))}
            <TextAction label="Turn off reminder" onPress={() => void turnReminderOff()} />
          </>
        ) : (
          REMINDER_TIMES.map((t) => (
            <TextAction key={t.label} label={`Remind me at ${t.label}`} onPress={() => void turnReminderOn(t.hour, t.minute)} />
          ))
        )}
      </SectionCard>

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

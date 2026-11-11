import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

/** Starts with `pufftrack.`, so backups include it without any other change. */
const REMINDER_KEY = 'pufftrack.reminder.v1';
const CHANNEL_ID = 'daily-checkin';
const NOTIFICATION_ID = 'pufftrack-daily-checkin';

export type ReminderSettings = {
  enabled: boolean;
  hour: number;
  minute: number;
};

export const DEFAULT_REMINDER: ReminderSettings = { enabled: false, hour: 20, minute: 0 };

export const REMINDER_TIMES: { hour: number; minute: number; label: string }[] = [
  { hour: 9, minute: 0, label: '9:00 AM' },
  { hour: 13, minute: 0, label: '1:00 PM' },
  { hour: 18, minute: 0, label: '6:00 PM' },
  { hour: 20, minute: 0, label: '8:00 PM' },
  { hour: 21, minute: 30, label: '9:30 PM' },
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function validTime(hour: unknown, minute: unknown): boolean {
  return (
    typeof hour === 'number' &&
    typeof minute === 'number' &&
    Number.isInteger(hour) &&
    Number.isInteger(minute) &&
    hour >= 0 &&
    hour <= 23 &&
    minute >= 0 &&
    minute <= 59
  );
}

export async function loadReminder(): Promise<ReminderSettings> {
  try {
    const raw = await AsyncStorage.getItem(REMINDER_KEY);
    if (raw == null) {
      return DEFAULT_REMINDER;
    }

    const data: unknown = JSON.parse(raw);
    if (!isRecord(data) || typeof data.enabled !== 'boolean' || !validTime(data.hour, data.minute)) {
      return DEFAULT_REMINDER;
    }

    return { enabled: data.enabled, hour: data.hour as number, minute: data.minute as number };
  } catch {
    return DEFAULT_REMINDER;
  }
}

async function saveReminder(settings: ReminderSettings): Promise<void> {
  await AsyncStorage.setItem(REMINDER_KEY, JSON.stringify(settings));
}

async function schedule(hour: number, minute: number): Promise<void> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'Daily check-in',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  await Notifications.cancelScheduledNotificationAsync(NOTIFICATION_ID).catch(() => undefined);
  await Notifications.scheduleNotificationAsync({
    identifier: NOTIFICATION_ID,
    content: {
      title: 'PuffTrack check-in',
      body: "Log today's count and see how your day is going.",
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
      channelId: CHANNEL_ID,
    },
  });
}

/** Asks for permission if needed. Returns false when the reminder could not be turned on. */
export async function enableReminder(hour: number, minute: number): Promise<boolean> {
  try {
    const current = await Notifications.getPermissionsAsync();
    const granted = current.granted || (await Notifications.requestPermissionsAsync()).granted;
    if (!granted) {
      return false;
    }

    await schedule(hour, minute);
    await saveReminder({ enabled: true, hour, minute });
    return true;
  } catch {
    return false;
  }
}

export async function disableReminder(): Promise<void> {
  const current = await loadReminder();

  try {
    await Notifications.cancelScheduledNotificationAsync(NOTIFICATION_ID);
  } catch {
    // Nothing was scheduled.
  }

  await saveReminder({ ...current, enabled: false });
}

/** Re-applies the saved reminder, for example after a restore. Never asks for permission. */
export async function syncReminder(): Promise<void> {
  try {
    const settings = await loadReminder();
    if (!settings.enabled) {
      await Notifications.cancelScheduledNotificationAsync(NOTIFICATION_ID).catch(() => undefined);
      return;
    }

    if ((await Notifications.getPermissionsAsync()).granted) {
      await schedule(settings.hour, settings.minute);
    }
  } catch {
    // A failed reschedule leaves the saved setting in place.
  }
}

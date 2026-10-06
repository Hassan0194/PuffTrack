import AsyncStorage from '@react-native-async-storage/async-storage';

import { todayKey } from '../domain/date';
import { parseStoredPuffList } from '../domain/storedPuff';

const TODAY_KEY = 'pufftrack.today.v1';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Reads today's puff list length. Does not write storage. Null means the read failed. */
export async function readTodayPuffCount(now = new Date()): Promise<number | null> {
  try {
    const raw = await AsyncStorage.getItem(TODAY_KEY);
    if (raw == null) {
      return 0;
    }

    const data: unknown = JSON.parse(raw);
    if (!isRecord(data) || data.date !== todayKey(now)) {
      return 0;
    }

    const puffs = parseStoredPuffList(data.puffs);
    return puffs?.length ?? 0;
  } catch {
    return null;
  }
}

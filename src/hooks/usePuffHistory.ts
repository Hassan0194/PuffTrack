import { useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';

import { DAILY_PUFF_LIMIT } from '../constants/limits';
import { buildHistorySnapshot, type HistorySnapshot } from '../domain/history';
import { emptyTodayRecord } from '../domain/todayRecord';
import { loadPuffHistory } from '../storage/puffHistory';
import { loadTodayRecord } from '../storage/todayPuffs';

export function usePuffHistory(todayLimit: number = DAILY_PUFF_LIMIT): HistorySnapshot & { ready: boolean } {
  const [snapshot, setSnapshot] = useState<HistorySnapshot>(() =>
    buildHistorySnapshot([], 0, todayLimit, new Date()),
  );
  const [ready, setReady] = useState(false);

  const reload = useCallback((now = new Date()) => {
    return loadTodayRecord(now)
      .then((today) => loadPuffHistory(now).then((archived) => ({ today, archived })))
      .then(({ today, archived }) => {
        setSnapshot(buildHistorySnapshot(archived, today.count, todayLimit, now, today.puffs));
        setReady(true);
      })
      .catch(() => {
        const fresh = emptyTodayRecord(now);
        setSnapshot(buildHistorySnapshot([], fresh.count, todayLimit, now, fresh.puffs));
        setReady(true);
      });
  }, [todayLimit]);

  useEffect(() => {
    let cancelled = false;

    setReady(false);

    void loadTodayRecord()
      .then((today) => loadPuffHistory().then((archived) => ({ today, archived })))
      .then(({ today, archived }) => {
        if (cancelled) {
          return;
        }
        setSnapshot(buildHistorySnapshot(archived, today.count, todayLimit, new Date(), today.puffs));
        setReady(true);
      })
      .catch(() => {
        if (!cancelled) {
          setReady(true);
        }
      });

    const subscription = AppState.addEventListener('change', (nextState) => {
      if (!cancelled && nextState === 'active') {
        void reload();
      }
    });

    return () => {
      cancelled = true;
      subscription.remove();
    };
  }, [reload]);

  useEffect(() => {
    const now = new Date();
    const nextMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const delay = Math.max(1000, nextMidnight.getTime() - now.getTime());
    const timer = setTimeout(() => {
      void reload(new Date());
    }, delay);

    return () => clearTimeout(timer);
  }, [reload, snapshot.days[snapshot.days.length - 1]?.date]);

  return { ...snapshot, ready };
}

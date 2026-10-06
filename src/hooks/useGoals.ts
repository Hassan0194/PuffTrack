import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';

import { todayKey } from '../domain/date';
import {
  EMPTY_GOALS,
  targetDateFromHorizon,
  withDailyLimit,
  withDailyTarget,
  withReduction,
  withoutReduction,
  type GoalSettings,
} from '../domain/goals';
import { recordedDaysFromHistory, recordedDaysInLastWeek, type RecordedDay } from '../domain/insights';
import { emptyTodayRecord } from '../domain/todayRecord';
import { loadGoalSettings, saveGoalSettings } from '../storage/goals';
import { loadPuffHistory } from '../storage/puffHistory';
import { loadTodayRecord } from '../storage/todayPuffs';

export function useGoals() {
  const [ready, setReady] = useState(false);
  const [settings, setSettings] = useState<GoalSettings>(EMPTY_GOALS);
  const [todayCount, setTodayCount] = useState(0);
  const [weekDays, setWeekDays] = useState<RecordedDay[]>([]);
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  const reloadPuffs = useCallback((now = new Date()) => {
    return loadTodayRecord(now)
      .then((today) => loadPuffHistory(now).then((archived) => ({ today, archived })))
      .then(({ today, archived }) => {
        const days = recordedDaysFromHistory(archived, today, now);
        setTodayCount(today.dayKey === todayKey(now) ? today.puffs.length : 0);
        setWeekDays(recordedDaysInLastWeek(days, now));
      })
      .catch(() => {
        setTodayCount(0);
        setWeekDays([]);
      });
  }, []);

  useEffect(() => {
    let cancelled = false;

    void Promise.all([loadGoalSettings(), loadTodayRecord().then((today) => loadPuffHistory().then((archived) => ({ today, archived })))])
      .then(([stored, puff]) => {
        if (cancelled) {
          return;
        }

        const now = new Date();
        const days = recordedDaysFromHistory(puff.archived, puff.today, now);
        settingsRef.current = stored;
        setSettings(stored);
        setTodayCount(puff.today.dayKey === todayKey(now) ? puff.today.puffs.length : 0);
        setWeekDays(recordedDaysInLastWeek(days, now));
        setReady(true);
      })
      .catch(() => {
        if (cancelled) {
          return;
        }

        settingsRef.current = EMPTY_GOALS;
        setSettings(EMPTY_GOALS);
        setTodayCount(emptyTodayRecord().count);
        setWeekDays([]);
        setReady(true);
      });

    const subscription = AppState.addEventListener('change', (nextState) => {
      if (!cancelled && nextState === 'active') {
        void reloadPuffs();
      }
    });

    return () => {
      cancelled = true;
      subscription.remove();
    };
  }, [reloadPuffs]);

  const setDailyTarget = useCallback((target: number) => {
    const next = withDailyTarget(settingsRef.current, target, todayKey(new Date()));
    settingsRef.current = next;
    setSettings(next);
    return saveGoalSettings(next);
  }, []);

  /** Null goes back to the default limit. The personal target is not touched. */
  const setDailyLimit = useCallback((limit: number | null) => {
    const next = withDailyLimit(settingsRef.current, limit);
    settingsRef.current = next;
    setSettings(next);
    return saveGoalSettings(next);
  }, []);

  const setReduction = useCallback((startingTarget: number, horizonDays: number) => {
    const targetDate = targetDateFromHorizon(new Date(), horizonDays);
    if (!targetDate) {
      return Promise.resolve();
    }

    const next = withReduction(settingsRef.current, { startingTarget, targetDate });
    settingsRef.current = next;
    setSettings(next);
    return saveGoalSettings(next);
  }, []);

  const clearReduction = useCallback(() => {
    const next = withoutReduction(settingsRef.current);
    settingsRef.current = next;
    setSettings(next);
    return saveGoalSettings(next);
  }, []);

  return {
    ready,
    settings,
    todayCount,
    weekDays,
    setDailyTarget,
    setDailyLimit,
    setReduction,
    clearReduction,
  };
}

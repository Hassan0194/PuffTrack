import { useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';

import {
  allPuffs,
  averageDailyPuffs,
  chartShares,
  highestConsumptionDay,
  longestPuffGap,
  lowestConsumptionDay,
  mostCommonTrigger,
  recordedDaysFromHistory,
  recordedDaysInLastWeek,
  savedDayTotals,
  totalPuffs,
  triggerShares,
  weeklyTotal,
  type PuffGap,
  type RecordedDay,
  type TriggerShare,
} from '../domain/insights';
import { timeOfDayBuckets, weekOverWeek, type TimeOfDayBucket, type WeekChange } from '../domain/patterns';
import { todayKey } from '../domain/date';
import { emptyTodayRecord } from '../domain/todayRecord';
import { loadPuffHistory } from '../storage/puffHistory';
import { loadTodayRecord } from '../storage/todayPuffs';

export type InsightModel = {
  recordedDayCount: number;
  dayTotals: { date: string; count: number }[];
  total: number;
  average: number | null;
  highest: RecordedDay | null;
  lowest: RecordedDay | null;
  weekDays: ReturnType<typeof chartShares>;
  weekTotal: number;
  weekAverage: number | null;
  weekHighest: RecordedDay | null;
  triggerRows: TriggerShare[];
  taggedTotal: number;
  mostCommon: TriggerShare | null;
  longestGap: PuffGap | null;
  timeOfDay: TimeOfDayBucket[];
  weekChange: WeekChange | null;
};

function buildModel(
  archived: Parameters<typeof recordedDaysFromHistory>[0],
  today: Parameters<typeof recordedDaysFromHistory>[1],
  now: Date,
): InsightModel {
  const days = recordedDaysFromHistory(archived, today, now);
  const week = recordedDaysInLastWeek(days, now);
  const puffs = allPuffs(days);
  const triggers = triggerShares(puffs);

  return {
    recordedDayCount: days.length,
    dayTotals: savedDayTotals(archived, today, now),
    total: totalPuffs(days),
    average: averageDailyPuffs(days),
    highest: highestConsumptionDay(days),
    lowest: lowestConsumptionDay(days),
    weekDays: chartShares(week),
    weekTotal: weeklyTotal(week),
    weekAverage: averageDailyPuffs(week),
    weekHighest: highestConsumptionDay(week),
    triggerRows: triggers.rows,
    taggedTotal: triggers.taggedTotal,
    mostCommon: mostCommonTrigger(triggers.rows),
    longestGap: longestPuffGap(puffs),
    timeOfDay: timeOfDayBuckets(puffs),
    weekChange: weekOverWeek(savedDayTotals(archived, today, now), todayKey(now)),
  };
}

const emptyToday = () => emptyTodayRecord();

export function useInsights(): { ready: boolean; insights: InsightModel } {
  const [insights, setInsights] = useState<InsightModel>(() =>
    buildModel([], emptyToday(), new Date()),
  );
  const [ready, setReady] = useState(false);

  const reload = useCallback((now = new Date()) => {
    return loadTodayRecord(now)
      .then((today) => loadPuffHistory(now).then((archived) => ({ today, archived })))
      .then(({ today, archived }) => {
        setInsights(buildModel(archived, today, now));
        setReady(true);
      })
      .catch(() => {
        setInsights(buildModel([], emptyTodayRecord(now), now));
        setReady(true);
      });
  }, []);

  useEffect(() => {
    let cancelled = false;

    void loadTodayRecord()
      .then((today) => loadPuffHistory().then((archived) => ({ today, archived })))
      .then(({ today, archived }) => {
        if (cancelled) {
          return;
        }
        setInsights(buildModel(archived, today, new Date()));
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

  return { ready, insights };
}

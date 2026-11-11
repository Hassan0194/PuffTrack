import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';

import { DAILY_PUFF_LIMIT } from '../constants/limits';
import type { TriggerType } from '../constants/triggers';
import { calculatePuffBudget, type PuffPace } from '../domain/budget';
import { todayKey } from '../domain/date';
import { longestGapMs } from '../domain/gaps';
import { countPuffTriggers, type TriggerCount } from '../domain/triggers';
import { applyPuff, emptyTodayRecord, type TodayRecord } from '../domain/todayRecord';
import { loadTodayRecord, removeLastTodayPuff, saveTodayRecord } from '../storage/todayPuffs';

export type TodayPuffState = {
  count: number;
  dailyLimit: number;
  remaining: number;
  progress: number;
  percentConsumed: number;
  budgetReached: boolean;
  pace: PuffPace;
  lastPuffAt: Date | null;
  longestGapMs: number | null;
  triggerCounts: TriggerCount[];
  addPuff: (trigger?: TriggerType | null) => void;
  /** Removes the most recent entry of today. */
  undoLast: () => void;
  canUndo: boolean;
};

/**
 * Today's puff session. AsyncStorage is loaded and saved here, not by the screen.
 */
export function useTodayPuffs(dailyLimit: number = DAILY_PUFF_LIMIT): TodayPuffState {
  const [session, setSession] = useState<TodayRecord>(() => emptyTodayRecord());
  const [, setClock] = useState(0);
  const sessionRef = useRef(session);
  const hydratedRef = useRef(false);
  const pendingRef = useRef<{ atMs: number; trigger: TriggerType | null }[]>([]);

  useEffect(() => {
    let cancelled = false;

    loadTodayRecord()
      .then((loaded) => {
        if (cancelled) {
          return;
        }

        const pending = pendingRef.current.splice(0);
        let next = loaded;
        for (const puff of pending) {
          next = applyPuff(next, puff.atMs, puff.trigger);
        }

        sessionRef.current = next;
        hydratedRef.current = true;
        setSession(next);

        if (pending.length > 0) {
          void saveTodayRecord(next);
        }
      })
      .catch(() => {
        if (cancelled) {
          return;
        }

        const pending = pendingRef.current.splice(0);
        let next = emptyTodayRecord();
        for (const puff of pending) {
          next = applyPuff(next, puff.atMs, puff.trigger);
        }

        sessionRef.current = next;
        hydratedRef.current = true;
        setSession(next);

        if (pending.length > 0) {
          void saveTodayRecord(next);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState !== 'active') {
        return;
      }

      setClock((value) => value + 1);

      if (!hydratedRef.current) {
        return;
      }

      const now = new Date();
      if (sessionRef.current.dayKey === todayKey(now)) {
        return;
      }

      const fresh = emptyTodayRecord(now);
      sessionRef.current = fresh;
      setSession(fresh);
      void saveTodayRecord(fresh);
    });

    return () => subscription.remove();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setClock((value) => value + 1);
    }, 60_000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const now = new Date();
    const nextMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const delay = Math.max(1000, nextMidnight.getTime() - now.getTime());

    const timer = setTimeout(() => {
      setClock((value) => value + 1);

      if (!hydratedRef.current) {
        return;
      }

      const fresh = emptyTodayRecord(new Date());
      if (sessionRef.current.dayKey === fresh.dayKey) {
        return;
      }

      sessionRef.current = fresh;
      setSession(fresh);
      void saveTodayRecord(fresh);
    }, delay);

    return () => clearTimeout(timer);
  }, [session.dayKey]);

  const addPuff = useCallback((trigger: TriggerType | null = null) => {
    const atMs = Date.now();

    if (!hydratedRef.current) {
      pendingRef.current.push({ atMs, trigger });
    }

    const next = applyPuff(sessionRef.current, atMs, trigger);
    sessionRef.current = next;
    setSession(next);

    if (hydratedRef.current) {
      void saveTodayRecord(next);
    }
  }, []);

  const undoLast = useCallback(() => {
    const current = sessionRef.current;
    if (current.puffs.length === 0) {
      return;
    }

    if (!hydratedRef.current) {
      pendingRef.current.pop();
    }

    const puffs = current.puffs.slice(0, -1);
    const next: TodayRecord = {
      dayKey: current.dayKey,
      count: puffs.length,
      puffs,
      lastPuffAt: puffs.length === 0 ? null : puffs[puffs.length - 1].atMs,
    };
    sessionRef.current = next;
    setSession(next);

    if (hydratedRef.current) {
      void removeLastTodayPuff().then((stored) => {
        // Follow storage in case the widget added an entry meanwhile.
        if (stored && stored.dayKey === sessionRef.current.dayKey) {
          sessionRef.current = stored;
          setSession(stored);
        }
      });
    }
  }, []);

  const now = new Date();
  const today = todayKey(now);
  const active = session.dayKey === today ? session : emptyTodayRecord(now);
  const budget = calculatePuffBudget(active.count, dailyLimit, now);

  return {
    count: budget.consumed,
    dailyLimit: budget.limit,
    remaining: budget.remaining,
    progress: budget.progress,
    percentConsumed: budget.percentConsumed,
    budgetReached: budget.budgetReached,
    pace: budget.pace,
    lastPuffAt: active.lastPuffAt == null ? null : new Date(active.lastPuffAt),
    longestGapMs: longestGapMs(active.puffs.map((puff) => puff.atMs)),
    triggerCounts: countPuffTriggers(active.puffs),
    addPuff,
    undoLast,
    canUndo: active.puffs.length > 0,
  };
}

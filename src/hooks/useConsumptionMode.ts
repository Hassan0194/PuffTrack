import { useEffect, useState } from 'react';

import {
  defaultLimitFor,
  isCigaretteProfile,
  isPouchProfile,
  resolveDailyLimit,
  type CountUnit,
} from '../domain/consumption';
import { loadGoalSettings } from '../storage/goals';
import { loadConsumptionProfile } from '../storage/profile';

type ConsumptionModeState = {
  ready: boolean;
  cigarette: boolean;
  pouch: boolean;
  unit: CountUnit;
  baseline: number | null;
  customLimit: number | null;
};

const VAPE_STATE: ConsumptionModeState = {
  ready: true,
  cigarette: false,
  pouch: false,
  unit: 'puff',
  baseline: null,
  customLimit: null,
};

type ConsumptionMode = ConsumptionModeState & {
  /** The limit in force: the user's own, else the default. */
  referenceLimit: number;
  /** The limit used when the user has not set one. */
  defaultLimit: number;
};

/** Loads the saved profile. Missing or unreadable profiles stay on vape behavior. */
export function useConsumptionMode(): ConsumptionMode {
  const [state, setState] = useState<ConsumptionModeState>({ ...VAPE_STATE, ready: false });

  useEffect(() => {
    let cancelled = false;

    void Promise.all([loadConsumptionProfile(), loadGoalSettings()])
      .then(([profile, goals]) => {
        if (cancelled) {
          return;
        }

        const customLimit = goals.dailyLimit;
        if (profile && isCigaretteProfile(profile)) {
          setState({
            ready: true,
            cigarette: true,
            pouch: false,
            unit: 'cigarette',
            baseline: profile.dailyBaseline,
            customLimit,
          });
          return;
        }

        if (profile && isPouchProfile(profile)) {
          setState({
            ready: true,
            cigarette: false,
            pouch: true,
            unit: 'pouch',
            baseline: profile.dailyBaseline,
            customLimit,
          });
          return;
        }

        setState({ ...VAPE_STATE, customLimit });
      })
      .catch(() => {
        if (!cancelled) {
          setState(VAPE_STATE);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return {
    ...state,
    referenceLimit: resolveDailyLimit(state.unit, state.baseline, state.customLimit),
    defaultLimit: defaultLimitFor(state.unit, state.baseline),
  };
}

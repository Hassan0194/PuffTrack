import { useCallback, useEffect, useState } from 'react';

import type { TriggerType } from '../constants/triggers';
import { loadCurrentTrigger, saveCurrentTrigger } from '../storage/currentTrigger';

export function useCurrentTrigger() {
  const [currentTrigger, setCurrentTrigger] = useState<TriggerType | null>(null);

  useEffect(() => {
    let cancelled = false;

    loadCurrentTrigger()
      .then((trigger) => {
        if (!cancelled) {
          setCurrentTrigger(trigger);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setCurrentTrigger(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const selectTrigger = useCallback((trigger: TriggerType | null) => {
    setCurrentTrigger(trigger);
    void saveCurrentTrigger(trigger).catch(() => {
      // Keep the in-memory choice so the next puff can still be tagged.
    });
  }, []);

  return { currentTrigger, selectTrigger };
}

import type { WidgetTaskHandlerProps } from 'react-native-android-widget';

import { unitForProfile, type CountUnit } from '../domain/consumption';
import { loadCurrentTrigger } from '../storage/currentTrigger';
import { loadConsumptionProfile } from '../storage/profile';
import { appendTodayPuff } from '../storage/todayPuffs';
import { PuffTrackWidget } from './PuffTrackWidget';
import { readTodayPuffCount } from './readTodayPuffCount';
import { PUFF_TRACK_WIDGET_NAME } from './syncPuffWidget';

const ADD_PUFF_ACTION = 'ADD_PUFF';

async function currentUnit(): Promise<CountUnit> {
  try {
    return unitForProfile(await loadConsumptionProfile());
  } catch {
    return 'puff';
  }
}

function renderCount(props: WidgetTaskHandlerProps, count: number, unit: CountUnit) {
  props.renderWidget(<PuffTrackWidget unit={unit} count={count} />);
}

export async function widgetTaskHandler(props: WidgetTaskHandlerProps) {
  if (props.widgetInfo.widgetName !== PUFF_TRACK_WIDGET_NAME) {
    return;
  }

  if (props.widgetAction === 'WIDGET_DELETED') {
    return;
  }

  try {
    if (props.widgetAction === 'WIDGET_CLICK' && props.clickAction === ADD_PUFF_ACTION) {
      const now = new Date();
      const trigger = await loadCurrentTrigger();
      const saved = await appendTodayPuff(now.getTime(), trigger, now);

      if (saved) {
        renderCount(props, saved.count, await currentUnit());
        return;
      }
    }

    const count = await readTodayPuffCount();
    if (count == null) {
      if (props.widgetAction === 'WIDGET_ADDED') {
        renderCount(props, 0, await currentUnit());
      }
      return;
    }

    renderCount(props, count, await currentUnit());
  } catch {
    // Leave the last rendered widget in place when storage cannot be read.
  }
}

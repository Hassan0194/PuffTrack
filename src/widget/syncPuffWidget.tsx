import { Platform } from 'react-native';
import { requestWidgetUpdate } from 'react-native-android-widget';

import { PuffTrackWidget } from './PuffTrackWidget';
import { readTodayPuffCount } from './readTodayPuffCount';
import { unitForProfile, type CountUnit } from '../domain/consumption';
import { loadConsumptionProfile } from '../storage/profile';

export const PUFF_TRACK_WIDGET_NAME = 'PuffTrackWidget';

async function currentUnit(): Promise<CountUnit> {
  try {
    return unitForProfile(await loadConsumptionProfile());
  } catch {
    return 'puff';
  }
}

/** Redraws every PuffTrack widget from the stored event list. */
export async function refreshPuffTrackWidget(): Promise<void> {
  if (Platform.OS !== 'android') {
    return;
  }

  try {
    const count = await readTodayPuffCount();
    if (count == null) {
      return;
    }

    const unit = await currentUnit();
    await requestWidgetUpdate({
      widgetName: PUFF_TRACK_WIDGET_NAME,
      renderWidget: () => <PuffTrackWidget unit={unit} count={count} />,
    });
  } catch {
    // The event is already stored. A failed redraw must not surface as a save error.
  }
}

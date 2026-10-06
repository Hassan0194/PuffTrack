import { FlexWidget, TextWidget } from 'react-native-android-widget';

import { countLabel, toCountUnit, type UnitInput } from '../domain/consumption';
import { formatGroupedNumber } from '../format/puffCopy';

type PuffTrackWidgetProps = {
  count: number;
  unit?: UnitInput;
};

export function PuffTrackWidget({ count, unit: unitInput = false }: PuffTrackWidgetProps) {
  const kind = toCountUnit(unitInput);
  const unit = countLabel(kind, count);
  const long = kind !== 'puff';

  return (
    <FlexWidget
      style={{
        height: 'match_parent',
        width: 'match_parent',
        backgroundColor: '#081210',
        borderRadius: 20,
        paddingHorizontal: 10,
        paddingVertical: 8,
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <TextWidget
        text="PuffTrack"
        style={{
          fontSize: 11,
          fontWeight: '700',
          color: '#3DDCB0',
        }}
      />
      <FlexWidget
        style={{
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <TextWidget
          text={formatGroupedNumber(count)}
          style={{
            fontSize: 28,
            fontWeight: '700',
            color: '#F4F8F6',
            textAlign: 'center',
          }}
        />
        <TextWidget
          text={unit}
          style={{
            fontSize: 10,
            fontWeight: '700',
            letterSpacing: kind === 'cigarette' ? 0.6 : kind === 'pouch' ? 1.2 : 1.5,
            color: '#B7C9C2',
            textAlign: 'center',
          }}
        />
      </FlexWidget>
      <FlexWidget
        clickAction="ADD_PUFF"
        style={{
          width: 'match_parent',
          height: 28,
          borderRadius: 14,
          backgroundColor: '#3DDCB0',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <TextWidget
          text={`+ ${kind.toUpperCase()}`}
          style={{
            fontSize: long ? 11 : 12,
            fontWeight: '800',
            color: '#04241C',
            textAlign: 'center',
          }}
        />
      </FlexWidget>
    </FlexWidget>
  );
}

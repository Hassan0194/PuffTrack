import { StyleSheet, Text, View } from 'react-native';

import { colors } from '../theme/colors';
import { radius, spacing } from '../theme/spacing';

type DailyProgressProps = {
  count: number;
  limit: number;
  progress: number;
  exceeded?: boolean;
  limitLabel?: string;
  remainingLabel?: string;
};

export function DailyProgress({
  count,
  limit,
  progress,
  exceeded = false,
  limitLabel,
  remainingLabel,
}: DailyProgressProps) {
  const fill = Math.min(1, Math.max(0, progress));

  return (
    <View style={styles.wrap}>
      {limitLabel ? <Text style={styles.limit}>{limitLabel}</Text> : null}
      <View
        accessibilityRole="progressbar"
        accessibilityLabel={exceeded ? 'Limit exceeded' : undefined}
        accessibilityValue={{
          min: 0,
          max: limit,
          now: count,
        }}
        style={styles.track}
      >
        <View
          style={[
            styles.fill,
            { width: `${fill * 100}%`, backgroundColor: exceeded ? colors.exceeded : colors.accent },
            count > 0 ? styles.fillVisible : null,
          ]}
        />
      </View>
      {remainingLabel ? <Text style={styles.remaining}>{remainingLabel}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignSelf: 'stretch',
  },
  limit: {
    color: colors.textMuted,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  track: {
    height: 14,
    borderRadius: radius.pill,
    backgroundColor: colors.track,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: radius.pill,
  },
  fillVisible: {
    minWidth: 8,
  },
  remaining: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: spacing.sm,
  },
});

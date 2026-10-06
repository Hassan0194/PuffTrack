import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '../../theme/colors';
import { radius, spacing } from '../../theme/spacing';

type OnboardingProgressProps = {
  current: number | null;
  total: number | null;
  onBack?: () => void;
};

export function OnboardingProgress({ current, total, onBack }: OnboardingProgressProps) {
  const fraction = current != null && total != null && total > 0 ? Math.min(1, current / total) : 0;

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        {onBack ? (
          <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={onBack} style={styles.back}>
            <Text style={styles.backLabel}>Back</Text>
          </Pressable>
        ) : (
          <View style={styles.backSpacer} />
        )}
        <Text style={styles.brand}>PuffTrack</Text>
        {current != null && total != null ? (
          <Text style={styles.count}>
            {current} OF {total}
          </Text>
        ) : (
          <View style={styles.backSpacer} />
        )}
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${fraction * 100}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.sm,
  },
  row: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  back: {
    width: 72,
    minHeight: 44,
    justifyContent: 'center',
  },
  backSpacer: {
    width: 72,
  },
  backLabel: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  brand: {
    flex: 1,
    color: colors.accent,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1.2,
    textAlign: 'center',
  },
  count: {
    width: 72,
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.1,
    textAlign: 'right',
  },
  track: {
    height: 3,
    borderRadius: radius.pill,
    backgroundColor: colors.track,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
  },
});

import type { StyleProp, ViewStyle } from 'react-native';
import { StyleSheet, Text, View } from 'react-native';

import { colors } from '../theme/colors';
import { ui } from '../theme/ui';

type InfoCardProps = {
  label: string;
  value: string;
  style?: StyleProp<ViewStyle>;
};

export function InfoCard({ label, value, style }: InfoCardProps) {
  return (
    <View style={[ui.card, style]}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1.1,
  },
  value: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '600',
    lineHeight: 22,
  },
});

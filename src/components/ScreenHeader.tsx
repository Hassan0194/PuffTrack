import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { ui } from '../theme/ui';

type ScreenHeaderProps = {
  title: string;
  onBack: () => void;
};

export function ScreenHeader({ title, onBack }: ScreenHeaderProps) {
  return (
    <View style={styles.header}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Back to home"
        hitSlop={8}
        onPress={onBack}
        style={styles.back}
      >
        <Text style={styles.backText}>Back</Text>
      </Pressable>
      <Text accessibilityRole="header" style={ui.screenTitle}>
        {title}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: spacing.xs,
  },
  back: {
    alignSelf: 'flex-start',
    minHeight: 44,
    justifyContent: 'center',
    paddingRight: spacing.md,
  },
  backText: {
    color: colors.accent,
    fontSize: 17,
    fontWeight: '700',
  },
});

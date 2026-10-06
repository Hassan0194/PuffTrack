import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '../../theme/colors';
import { radius, spacing } from '../../theme/spacing';

type ChoiceCardProps = {
  title: string;
  selected: boolean;
  onPress: () => void;
  emoji?: string;
  detail?: string;
};

export function ChoiceCard({ title, selected, onPress, emoji, detail }: ChoiceCardProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        selected ? styles.selected : null,
        pressed ? styles.pressed : null,
      ]}
    >
      {emoji ? <Text style={styles.emoji}>{emoji}</Text> : null}
      <View style={styles.copy}>
        <Text style={[styles.title, selected ? styles.titleSelected : null]}>{title}</Text>
        {detail ? <Text style={styles.detail}>{detail}</Text> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 76,
    borderRadius: radius.lg,
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.cardBorder,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  selected: {
    backgroundColor: colors.track,
    borderColor: colors.accent,
  },
  pressed: {
    opacity: 0.82,
  },
  emoji: {
    fontSize: 30,
    width: 40,
    textAlign: 'center',
  },
  copy: {
    flex: 1,
    gap: 4,
  },
  title: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
  titleSelected: {
    color: colors.text,
  },
  detail: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 19,
  },
});

import { Modal, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from '../theme/colors';
import { horizontalPadding, radius, spacing } from '../theme/spacing';

type HomeMenuProps = {
  visible: boolean;
  onClose: () => void;
  onOpenHistory: () => void;
  onOpenInsights: () => void;
  onOpenGoals: () => void;
  onOpenSettings: () => void;
};

const ITEMS = [
  { key: 'history', label: 'History' },
  { key: 'insights', label: 'Insights' },
  { key: 'goals', label: 'Goals' },
  { key: 'settings', label: 'Settings' },
] as const;

export function HomeMenu({ visible, onClose, onOpenHistory, onOpenInsights, onOpenGoals, onOpenSettings }: HomeMenuProps) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const open = {
    history: onOpenHistory,
    insights: onOpenInsights,
    goals: onOpenGoals,
    settings: onOpenSettings,
  };

  return (
    <Modal animationType="fade" onRequestClose={onClose} transparent visible={visible}>
      <View style={styles.backdrop}>
        <Pressable accessibilityLabel="Close menu" onPress={onClose} style={styles.dismiss} />
        <View style={[styles.panel, { top: insets.top + 52, right: horizontalPadding(width) }]}>
          {ITEMS.map((item) => (
            <Pressable
              key={item.key}
              accessibilityRole="button"
              accessibilityLabel={`Open ${item.label}`}
              onPress={() => {
                onClose();
                open[item.key]();
              }}
              style={({ pressed }) => [styles.item, pressed ? styles.itemPressed : null]}
            >
              <Text style={styles.itemLabel}>{item.label}</Text>
            </Pressable>
          ))}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
  },
  dismiss: {
    ...StyleSheet.absoluteFillObject,
  },
  panel: {
    position: 'absolute',
    minWidth: 180,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    paddingVertical: spacing.xs,
  },
  item: {
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  itemPressed: {
    opacity: 0.7,
  },
  itemLabel: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '600',
  },
});

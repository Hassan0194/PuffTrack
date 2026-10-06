import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { countWord, type UnitInput } from '../domain/consumption';
import { TRIGGER_OPTIONS, type TriggerType } from '../constants/triggers';
import { colors } from '../theme/colors';
import { radius, spacing } from '../theme/spacing';

type TriggerSheetProps = {
  visible: boolean;
  selected: TriggerType | null;
  onClose: () => void;
  onSelect: (type: TriggerType | null) => void;
  unit?: UnitInput;
};

export function TriggerSheet({ visible, selected, onClose, onSelect, unit = false }: TriggerSheetProps) {
  const insets = useSafeAreaInsets();

  return (
    <Modal animationType="slide" onRequestClose={onClose} transparent visible={visible}>
      <View style={styles.backdrop}>
        <Pressable accessibilityLabel="Close trigger list" onPress={onClose} style={styles.dismiss} />
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
          <View style={styles.handle} />
          <Text style={styles.title}>Current trigger</Text>
          <Text style={styles.subtitle}>
            {`Tags the ${countWord(unit, 2)} you record until you change it.`}
          </Text>
          <ScrollView keyboardShouldPersistTaps="handled" style={styles.scroll}>
            <View style={styles.grid}>
              {TRIGGER_OPTIONS.map((option) => {
                const active = selected === option.type;
                return (
                  <Pressable
                    key={option.type}
                    accessibilityRole="button"
                    accessibilityLabel={option.label}
                    accessibilityState={{ selected: active }}
                    onPress={() => onSelect(option.type)}
                    style={({ pressed }) => [
                      styles.tile,
                      active ? styles.tileSelected : null,
                      pressed ? styles.tilePressed : null,
                    ]}
                  >
                    <Text style={styles.icon}>{option.icon}</Text>
                    <Text style={[styles.tileLabel, active ? styles.tileLabelSelected : null]}>
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="None"
              accessibilityState={{ selected: selected == null }}
              onPress={() => onSelect(null)}
              style={({ pressed }) => [
                styles.none,
                selected == null ? styles.tileSelected : null,
                pressed ? styles.tilePressed : null,
              ]}
            >
              <Text style={styles.noneMark}>–</Text>
              <Text style={[styles.tileLabel, selected == null ? styles.tileLabelSelected : null]}>None</Text>
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
  dismiss: {
    flex: 1,
  },
  sheet: {
    maxHeight: '78%',
    backgroundColor: colors.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    gap: spacing.sm,
  },
  handle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.track,
    marginBottom: spacing.xs,
  },
  title: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 21,
    marginBottom: spacing.xs,
  },
  scroll: {
    flexGrow: 0,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  tile: {
    flexGrow: 1,
    flexBasis: '47%',
    maxWidth: '48.5%',
    minHeight: 72,
    borderRadius: 18,
    backgroundColor: colors.card,
    alignItems: 'flex-start',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: 2,
  },
  tileSelected: {
    backgroundColor: colors.track,
  },
  tilePressed: {
    opacity: 0.72,
  },
  icon: {
    fontSize: 22,
  },
  tileLabel: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  tileLabelSelected: {
    color: colors.accent,
  },
  none: {
    minHeight: 56,
    marginTop: spacing.sm,
    borderRadius: 18,
    backgroundColor: colors.card,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  noneMark: {
    width: 28,
    color: colors.textMuted,
    fontSize: 22,
    fontWeight: '600',
    textAlign: 'center',
  },
});

import { useEffect, useState } from 'react';
import { StyleSheet, Text, TextInput } from 'react-native';

import { countWord, toCountUnit, type UnitInput } from '../domain/consumption';
import {
  MAX_DAILY_TARGET,
  MAX_HORIZON_DAYS,
  parseDailyLimit,
  parseDailyTarget,
  parseHorizonDays,
} from '../domain/goals';
import { colors } from '../theme/colors';
import { radius, spacing } from '../theme/spacing';
import { BottomSheet } from './BottomSheet';
import { PrimaryButton } from './PrimaryButton';
import { TextAction } from './TextAction';

type GoalEditorProps = {
  visible: boolean;
  mode: 'target' | 'reduction' | 'limit';
  canRemoveReduction: boolean;
  onClose: () => void;
  onSaveTarget: (target: number) => void;
  onSaveLimit: (limit: number) => void;
  onSaveReduction: (startingTarget: number, horizonDays: number) => void;
  onRemoveReduction: () => void;
  unit?: UnitInput;
};

export function GoalEditor({
  visible,
  mode,
  canRemoveReduction,
  onClose,
  onSaveTarget,
  onSaveLimit,
  onSaveReduction,
  onRemoveReduction,
  unit = false,
}: GoalEditorProps) {
  const [targetText, setTargetText] = useState('');
  const [startText, setStartText] = useState('');
  const [daysText, setDaysText] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) {
      return;
    }

    setTargetText('');
    setStartText('');
    setDaysText('');
    setError(null);
  }, [visible, mode]);

  const saveTarget = () => {
    const target = parseDailyTarget(targetText);
    if (target == null) {
      setError(`Enter a whole number from 1 to ${MAX_DAILY_TARGET}.`);
      return;
    }

    onSaveTarget(target);
  };

  const saveLimit = () => {
    const limit = parseDailyLimit(targetText);
    if (limit == null) {
      setError(`Enter a whole number from 1 to ${MAX_DAILY_TARGET}.`);
      return;
    }

    onSaveLimit(limit);
  };

  const saveReduction = () => {
    const startingTarget = parseDailyTarget(startText);
    const horizonDays = parseHorizonDays(daysText);
    if (startingTarget == null) {
      setError(`Enter a starting target from 1 to ${MAX_DAILY_TARGET}.`);
      return;
    }
    if (horizonDays == null) {
      setError(`Enter a target date as 1 to ${MAX_HORIZON_DAYS} days from today.`);
      return;
    }

    onSaveReduction(startingTarget, horizonDays);
  };

  return (
    <BottomSheet
      dismissLabel="Close goal editor"
      onClose={onClose}
        subtitle={
          mode === 'limit'
            ? `A whole number of ${countWord(unit, 2)} per day. This is your tracking limit, separate from your personal target.`
            : mode === 'target'
              ? toCountUnit(unit) === 'cigarette'
                ? 'A personal whole number of cigarettes per day. This does not change your baseline.'
                : `A personal whole number of ${countWord(unit, 2)} per day. This does not change the daily limit.`
              : 'Saves a starting target and a date. Your daily target does not change by itself.'
        }
      title={mode === 'limit' ? 'Daily limit' : mode === 'target' ? 'Personal daily target' : 'Reduction goal'}
      visible={visible}
    >
      {mode !== 'reduction' ? (
        <TextInput
          accessibilityLabel={mode === 'limit' ? 'Daily limit' : 'Daily target'}
          keyboardType="number-pad"
          maxLength={4}
          onChangeText={setTargetText}
          placeholder="Number"
          placeholderTextColor={colors.textMuted}
          style={styles.input}
          value={targetText}
        />
      ) : (
        <>
          <Text style={styles.fieldLabel}>Starting target</Text>
          <TextInput
            accessibilityLabel="Starting target"
            keyboardType="number-pad"
            maxLength={4}
            onChangeText={setStartText}
            placeholder="Number"
            placeholderTextColor={colors.textMuted}
            style={styles.input}
            value={startText}
          />
          <Text style={styles.fieldLabel}>Days from today</Text>
          <TextInput
            accessibilityLabel="Days from today"
            keyboardType="number-pad"
            maxLength={4}
            onChangeText={setDaysText}
            placeholder="Days"
            placeholderTextColor={colors.textMuted}
            style={styles.input}
            value={daysText}
          />
        </>
      )}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <PrimaryButton label="Save" onPress={mode === 'limit' ? saveLimit : mode === 'target' ? saveTarget : saveReduction} />
      {mode === 'reduction' && canRemoveReduction ? (
        <TextAction label="Remove reduction goal" onPress={onRemoveReduction} />
      ) : null}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  fieldLabel: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '700',
    marginTop: spacing.xs,
  },
  input: {
    minHeight: 48,
    borderRadius: radius.md,
    backgroundColor: colors.track,
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
    paddingHorizontal: spacing.md,
  },
  error: {
    color: colors.text,
    fontSize: 15,
    lineHeight: 21,
  },
});

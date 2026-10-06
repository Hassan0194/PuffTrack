import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { DailyProgress } from '../components/DailyProgress';
import { EmptyState } from '../components/EmptyState';
import { GoalEditor } from '../components/GoalEditor';
import { Screen } from '../components/Screen';
import { ScreenHeader } from '../components/ScreenHeader';
import { SectionCard } from '../components/SectionCard';
import { TextAction } from '../components/TextAction';
import { countWord, type UnitInput } from '../domain/consumption';
import { puffsReduced, todayGoalStatus, weekAgainstTarget } from '../domain/goals';
import { formatGroupedNumber, formatHistoryDate } from '../format/puffCopy';
import { useConsumptionMode } from '../hooks/useConsumptionMode';
import { useGoals } from '../hooks/useGoals';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { ui } from '../theme/ui';

type GoalsScreenProps = {
  onBack: () => void;
};

type EditorMode = 'target' | 'reduction' | 'limit' | null;

function formatPerDay(value: number, unit: UnitInput): string {
  const rounded = Math.round(value * 10) / 10;
  const shown = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
  return `${shown} ${countWord(unit, rounded)}/day`;
}

function formatLeft(count: number, unit: UnitInput): string {
  return `${formatGroupedNumber(count)} ${countWord(unit, count)} left`;
}

function formatExceeded(count: number, unit: UnitInput): string {
  return `Target exceeded by ${formatGroupedNumber(count)} ${countWord(unit, count)}`;
}

function formatReduced(reduced: number, unit: UnitInput): string {
  const amount = Math.abs(reduced);
  const word = countWord(unit, amount);
  if (reduced > 0) {
    return `${formatGroupedNumber(amount)} ${word} reduced`;
  }
  if (reduced < 0) {
    return `Current target is ${formatGroupedNumber(amount)} above the starting target`;
  }
  return `0 ${word} reduced`;
}

export function GoalsScreen({ onBack }: GoalsScreenProps) {
  const consumption = useConsumptionMode();
  const cigarette = consumption.cigarette;
  const pouch = consumption.pouch;
  const unit = consumption.unit;
  const { ready, settings, todayCount, weekDays, setDailyTarget, setDailyLimit, setReduction, clearReduction } =
    useGoals();
  const [editor, setEditor] = useState<EditorMode>(null);
  const customLimit = settings.dailyLimit;
  const dailyLimit = customLimit ?? consumption.defaultLimit;
  const target = settings.dailyTarget;
  const today = target == null ? null : todayGoalStatus(todayCount, target);
  const week = weekAgainstTarget(weekDays, target);
  const reduction = settings.reduction;
  const reduced = reduction && target != null ? puffsReduced(reduction.startingTarget, target) : null;

  return (
    <Screen
      footer={
        <GoalEditor
          canRemoveReduction={settings.reduction != null}
          mode={editor === 'reduction' ? 'reduction' : editor === 'limit' ? 'limit' : 'target'}
          onClose={() => setEditor(null)}
          onRemoveReduction={() => {
            void clearReduction();
            setEditor(null);
          }}
          onSaveReduction={(startingTarget, horizonDays) => {
            void setReduction(startingTarget, horizonDays);
            setEditor(null);
          }}
          onSaveLimit={(nextLimit) => {
            void setDailyLimit(nextLimit);
            setEditor(null);
          }}
          onSaveTarget={(nextTarget) => {
            void setDailyTarget(nextTarget);
            setEditor(null);
          }}
          unit={unit}
          visible={editor != null}
        />
      }
    >
      <ScreenHeader onBack={onBack} title="Goals" />

      {!ready || !consumption.ready ? (
        <Text style={ui.secondary}>Loading goals...</Text>
      ) : (
        <>
          <SectionCard title={cigarette && customLimit == null ? 'DAILY BASELINE' : 'DAILY LIMIT'}>
            <Text style={styles.hero}>{formatGroupedNumber(dailyLimit)}</Text>
            <Text style={ui.secondary}>
              {cigarette
                ? customLimit == null
                  ? 'Your reported daily baseline. This is not your personal target, and logging still works after it.'
                  : `Your daily limit. Your reported baseline was ${formatGroupedNumber(consumption.baseline ?? 0)}. This is not your personal target, and logging still works after it.`
                : customLimit == null
                  ? `Default limit of ${formatGroupedNumber(dailyLimit)} ${countWord(unit, 2)}. This is not your personal target, and logging still works after it.`
                  : `Your daily limit of ${formatGroupedNumber(dailyLimit)} ${countWord(unit, 2)}. This is not your personal target, and logging still works after it.`}
            </Text>
            <TextAction label="Change Daily Limit" onPress={() => setEditor('limit')} />
            {customLimit != null ? (
              <TextAction label="Reset to default" onPress={() => void setDailyLimit(null)} />
            ) : null}
          </SectionCard>

          <SectionCard title="PERSONAL DAILY TARGET">
            {target == null ? (
              <EmptyState
                body="Choose a target to start tracking your progress."
                plain
                title="No daily target set"
              />
            ) : (
              <Text style={styles.hero}>{formatPerDay(target, unit)}</Text>
            )}
            <TextAction
              label={target == null ? 'Set Daily Target' : 'Change Daily Target'}
              onPress={() => setEditor('target')}
            />
          </SectionCard>

          {today ? (
            <SectionCard title="PROGRESS">
              <Text style={ui.secondary}>
                {`Today's ${countWord(unit, 2)}, compared with your personal target`}
              </Text>
              <Text style={styles.ratio}>
                {formatGroupedNumber(today.consumed)} / {formatGroupedNumber(today.target)}
                {cigarette || pouch ? ` ${countWord(unit, today.consumed)}` : ''}
              </Text>
              <DailyProgress
                count={today.consumed}
                exceeded={today.exceededBy > 0}
                limit={today.target}
                progress={today.progress}
              />
              <Text style={ui.body}>
                {today.exceededBy > 0 ? formatExceeded(today.exceededBy, unit) : formatLeft(today.remaining, unit)}
              </Text>
            </SectionCard>
          ) : null}

          <SectionCard title="REDUCTION GOAL">
            {reduction && target != null && reduced != null ? (
              <>
                <Text style={styles.shift}>
                  {formatGroupedNumber(reduction.startingTarget)} → {formatGroupedNumber(target)} {countWord(unit, 2)}/day
                </Text>
                <View style={styles.fact}>
                  <Text style={ui.secondary}>Current target</Text>
                  <Text style={ui.body}>{formatGroupedNumber(target)}</Text>
                </View>
                <View style={styles.fact}>
                  <Text style={ui.secondary}>Progress</Text>
                  <Text style={ui.body}>{formatReduced(reduced, unit)}</Text>
                </View>
                <View style={styles.fact}>
                  <Text style={ui.secondary}>Target date</Text>
                  <Text style={ui.body}>{formatHistoryDate(reduction.targetDate)}</Text>
                </View>
                <Text style={ui.secondary}>The daily target changes only when you change it.</Text>
                <TextAction label="Change Reduction Goal" onPress={() => setEditor('reduction')} />
              </>
            ) : (
              <>
                <Text style={ui.secondary}>
                  {target == null
                    ? cigarette && customLimit == null
                      ? 'Set a personal target first. A reduction goal does not replace your baseline.'
                      : 'Set a personal target first. A reduction goal does not replace the daily limit.'
                    : 'Optional. Choose a starting target and a date. Your personal target stays where you set it.'}
                </Text>
                {target != null ? (
                  <TextAction label="Set Reduction Goal" onPress={() => setEditor('reduction')} />
                ) : null}
              </>
            )}
          </SectionCard>

          <SectionCard title="TARGET HISTORY">
            {settings.history.length === 0 ? (
              <EmptyState body="Your target changes will appear here." plain title="No target changes yet" />
            ) : (
              settings.history.map((change, index) => (
                <View key={`${change.date}-${change.target}-${index}`} style={styles.historyRow}>
                  <Text style={styles.historyDate}>{formatHistoryDate(change.date)}</Text>
                  <Text style={styles.historyValue}>{change.target}/day</Text>
                </View>
              ))
            )}
          </SectionCard>

          <SectionCard title="LAST 7 DAYS">
            {week.recordedDays === 0 ? (
              <EmptyState body="Keep tracking to see your progress." plain title="Not enough data yet" />
            ) : (
              <>
                <View style={styles.fact}>
                  <Text style={ui.secondary}>Average</Text>
                  <Text style={ui.body}>{week.average == null ? '--' : formatPerDay(week.average, unit)}</Text>
                </View>
                {target != null ? (
                  <>
                    <View style={styles.fact}>
                      <Text style={ui.secondary}>Personal target</Text>
                      <Text style={ui.body}>{formatPerDay(target, unit)}</Text>
                    </View>
                    <View style={styles.fact}>
                      <Text style={ui.secondary}>Days within target</Text>
                      <Text style={ui.body}>
                        {week.withinTarget} / {week.recordedDays}
                      </Text>
                    </View>
                  </>
                ) : (
                  <Text style={ui.secondary}>Set a personal target to compare these days.</Text>
                )}
                <Text style={ui.secondary}>
                  {`Only days with recorded ${countWord(unit, 2)}. Missing days are not counted as zero.`}
                </Text>
              </>
            )}
          </SectionCard>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    color: colors.text,
    fontSize: 34,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  ratio: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  shift: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '700',
  },
  fact: {
    gap: spacing.xs,
  },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 32,
  },
  historyDate: {
    flex: 1,
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  historyValue: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
});

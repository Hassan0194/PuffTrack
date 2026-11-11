import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { CurrentTriggerCard } from '../components/CurrentTriggerCard';
import { HomeMenu } from '../components/HomeMenu';
import { PuffButton } from '../components/PuffButton';
import { PuffGauge } from '../components/PuffGauge';
import { Screen } from '../components/Screen';
import { TodayTriggers } from '../components/TodayTriggers';
import { TriggerSheet } from '../components/TriggerSheet';
import {
  formatBudgetPace,
  formatBudgetRatio,
  formatGroupedNumber,
  formatLastPuff,
  formatLongestGap,
  formatToday,
} from '../format/puffCopy';
import { countWord } from '../domain/consumption';
import { useConsumptionMode } from '../hooks/useConsumptionMode';
import { useCurrentTrigger } from '../hooks/useCurrentTrigger';
import { useTodayPuffs } from '../hooks/useTodayPuffs';
import { colors } from '../theme/colors';
import { horizontalPadding, spacing } from '../theme/spacing';

type HomeScreenProps = {
  onOpenGoals: () => void;
  onOpenHistory: () => void;
  onOpenInsights: () => void;
  onOpenSettings: () => void;
};

export function HomeScreen({ onOpenGoals, onOpenHistory, onOpenInsights, onOpenSettings }: HomeScreenProps) {
  const { width, height } = useWindowDimensions();
  const consumption = useConsumptionMode();
  const {
    count,
    dailyLimit,
    remaining,
    progress,
    budgetReached,
    pace,
    lastPuffAt,
    longestGapMs,
    triggerCounts,
    addPuff,
    undoLast,
    canUndo,
  } = useTodayPuffs(consumption.referenceLimit);
  const { currentTrigger, selectTrigger } = useCurrentTrigger();
  const [triggerSheetOpen, setTriggerSheetOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const cigarette = consumption.cigarette;
  const pouch = consumption.pouch;
  const unit = consumption.unit;

  const gaugeSize = Math.round(
    Math.max(
      220,
      Math.min(width - horizontalPadding(width) * 2, 400, height < 700 ? height * 0.4 : height * 0.46),
    ),
  );
  const overBy = Math.max(0, count - dailyLimit);
  const exceeded = count > dailyLimit;
  const statusLabel = pouch
    ? `${formatBudgetRatio(count, dailyLimit)}. ${
        budgetReached
          ? exceeded
            ? `${formatGroupedNumber(overBy)} over the daily limit.`
            : 'Daily limit reached.'
          : `${formatGroupedNumber(remaining)} ${countWord('pouch', remaining)} remaining.`
      }`
    : cigarette
    ? `${formatBudgetRatio(count, dailyLimit)}. ${
        budgetReached
          ? exceeded
            ? `${formatGroupedNumber(overBy)} over your baseline.`
            : 'Baseline reached.'
          : `${formatGroupedNumber(remaining)} ${countWord(true, remaining)} remaining.`
      }`
    : budgetReached
      ? exceeded
        ? `Daily budget reached. ${formatGroupedNumber(overBy)} over the daily limit. Daily limit ${formatGroupedNumber(dailyLimit)}.`
        : `Daily budget reached. Daily limit ${formatGroupedNumber(dailyLimit)}.`
      : `${formatGroupedNumber(remaining)} puffs remaining. Daily limit ${formatGroupedNumber(dailyLimit)}. ${formatBudgetPace(pace) ?? ''}`;

  if (!consumption.ready) {
    return <Screen>{null}</Screen>;
  }

  return (
    <Screen
      footer={
        <>
          <TriggerSheet
            onClose={() => setTriggerSheetOpen(false)}
            onSelect={(type) => {
              selectTrigger(type);
              setTriggerSheetOpen(false);
            }}
            selected={currentTrigger}
            visible={triggerSheetOpen}
            unit={unit}
          />
          <HomeMenu
            onClose={() => setMenuOpen(false)}
            onOpenGoals={onOpenGoals}
            onOpenHistory={onOpenHistory}
            onOpenInsights={onOpenInsights}
            onOpenSettings={onOpenSettings}
            visible={menuOpen}
          />
        </>
      }
    >
      <View style={styles.layout}>
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.appName}>PuffTrack</Text>
            <Text style={styles.date}>{formatToday(new Date())}</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open menu"
            accessibilityState={{ expanded: menuOpen }}
            onPress={() => setMenuOpen(true)}
            style={({ pressed }) => [styles.menuButton, pressed ? styles.menuButtonPressed : null]}
          >
            <View style={styles.menuBar} />
            <View style={styles.menuBar} />
            <View style={styles.menuBar} />
          </Pressable>
        </View>

        <View style={styles.hero}>
          <PuffGauge
            count={count}
            exceeded={exceeded}
            limit={dailyLimit}
            progress={progress}
            size={gaugeSize}
            unit={unit}
          />
          <PuffButton
            unit={unit}
            onPress={() => {
              // Feedback is a nicety. A device without haptics must not block logging.
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
              addPuff(currentTrigger);
            }}
          />
          {canUndo ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Undo last ${countWord(unit, 1)}`}
              hitSlop={8}
              onPress={() => {
                void Haptics.selectionAsync().catch(() => undefined);
                undoLast();
              }}
              style={({ pressed }) => [styles.undo, pressed ? styles.menuButtonPressed : null]}
            >
              <Text style={styles.undoLabel}>{`Undo last ${countWord(unit, 1)}`}</Text>
            </Pressable>
          ) : null}
          <View accessibilityLabel={statusLabel.trim()} style={styles.status}>
            {pouch ? (
              <>
                <Text style={styles.statusPrimary}>{formatBudgetRatio(count, dailyLimit)}</Text>
                <Text style={styles.statusSecondary}>
                  {budgetReached
                    ? exceeded
                      ? `${formatGroupedNumber(overBy)} over the daily limit`
                      : 'Daily limit reached'
                    : `${formatGroupedNumber(remaining)} ${countWord('pouch', remaining)} remaining`}
                </Text>
              </>
            ) : cigarette ? (
              <>
                <Text style={styles.statusPrimary}>{formatBudgetRatio(count, dailyLimit)}</Text>
                {budgetReached ? (
                  <Text style={styles.statusSecondary}>
                    {exceeded ? `${formatGroupedNumber(overBy)} over your baseline` : 'Baseline reached'}
                  </Text>
                ) : (
                  <Text style={styles.statusSecondary}>
                    {formatGroupedNumber(remaining)} {countWord(true, remaining)} remaining
                  </Text>
                )}
              </>
            ) : budgetReached ? (
              <Text style={styles.statusPrimary}>Daily budget reached</Text>
            ) : (
              <Text style={styles.statusPrimary}>
                {formatGroupedNumber(remaining)} {remaining === 1 ? 'puff' : 'puffs'} remaining
              </Text>
            )}
            {cigarette || pouch ? null : exceeded ? (
              <Text style={styles.statusSecondary}>
                {formatGroupedNumber(overBy)} over the daily limit
              </Text>
            ) : null}
            {cigarette || pouch ? null : (
              <Text style={styles.statusSecondary}>Daily limit: {formatGroupedNumber(dailyLimit)}</Text>
            )}
            {!budgetReached && pace.kind !== 'none' ? (
              <Text style={styles.pace}>{formatBudgetPace(pace, unit)}</Text>
            ) : null}
          </View>
        </View>

        <View style={styles.secondary}>
          <CurrentTriggerCard trigger={currentTrigger} onChange={() => setTriggerSheetOpen(true)} />
          <View style={styles.meta}>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>{`Last ${countWord(unit, 1)}`}</Text>
              <Text style={styles.metaValue}>{formatLastPuff(lastPuffAt, unit)}</Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.metaLabel}>Longest gap</Text>
              <Text style={styles.metaValue}>{formatLongestGap(longestGapMs)}</Text>
            </View>
          </View>
          <TodayTriggers unit={unit} counts={triggerCounts} />
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  layout: {
    flexGrow: 1,
    justifyContent: 'space-between',
    gap: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  headerText: {
    flex: 1,
    minWidth: 0,
    gap: spacing.xs,
  },
  menuButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  menuButtonPressed: {
    opacity: 0.65,
  },
  menuBar: {
    width: 18,
    height: 2,
    borderRadius: 1,
    backgroundColor: colors.text,
  },
  undo: {
    minHeight: 36,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
  },
  undoLabel: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '700',
  },
  appName: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '700',
  },
  date: {
    color: colors.textMuted,
    fontSize: 15,
  },
  hero: {
    alignItems: 'center',
    gap: spacing.md,
  },
  status: {
    alignItems: 'center',
    gap: 2,
  },
  statusPrimary: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'center',
  },
  statusSecondary: {
    color: colors.textMuted,
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
  pace: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  secondary: {
    gap: spacing.md,
  },
  meta: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  metaItem: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  metaLabel: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  metaValue: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
  },
});

import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  Animated,
  Easing,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ChoiceCard } from '../components/onboarding/ChoiceCard';
import { NumberEntry } from '../components/onboarding/NumberEntry';
import { OnboardingProgress } from '../components/onboarding/OnboardingProgress';
import { WhenUsedPicker } from '../components/onboarding/WhenUsedPicker';
import { formatGroupedNumber } from '../format/puffCopy';
import {
  nicotineUnitLabel,
  pouchUnitLabel,
  parseBaselineCount,
  parseNicotineStrength,
  resolveLastUsedAt,
  type ConsumptionProfile,
  type LastUsedMode,
  type NicotineUnit,
  type PouchNicotineUnit,
  type ProductType,
  type ProfileGoal,
  type UsagePattern,
  type UseDuration,
  type VapeType,
} from '../domain/profile';
import { completeOnboarding } from '../storage/profile';
import { colors } from '../theme/colors';
import { radius, spacing, horizontalPadding } from '../theme/spacing';

type OnboardingScreenProps = {
  onDone: () => void;
};

type StepId =
  | 'product'
  | 'daily'
  | 'duration'
  | 'nicotine'
  | 'pouch-strength'
  | 'pouch-unit'
  | 'vape-type'
  | 'pattern'
  | 'goal'
  | 'last-used'
  | 'summary';

type Draft = {
  productType: ProductType | null;
  dailyCount: string;
  nicotineStrength: string;
  nicotineUnit: NicotineUnit | null;
  pouchUnit: PouchNicotineUnit | null;
  vapeType: VapeType | null;
  usagePattern: UsagePattern | null;
  duration: UseDuration | null;
  goal: ProfileGoal | null;
  lastUsedMode: LastUsedMode | null;
  hour: string;
  minute: string;
  day: string;
  month: string;
  year: string;
};

const EMPTY_DRAFT: Draft = {
  productType: null,
  dailyCount: '',
  nicotineStrength: '',
  nicotineUnit: null,
  pouchUnit: null,
  vapeType: null,
  usagePattern: null,
  duration: null,
  goal: null,
  lastUsedMode: null,
  hour: '',
  minute: '',
  day: '',
  month: '',
  year: '',
};

const PRODUCT_OPTIONS: { value: ProductType; emoji: string; title: string; detail: string }[] = [
  { value: 'cigarette', emoji: '🚬', title: 'Cigarettes', detail: 'What you smoke day to day.' },
  { value: 'vape', emoji: '💨', title: 'Vape', detail: 'A pod, disposable, or tank.' },
  { value: 'pouch', emoji: '🟢', title: 'Nicotine Pouches', detail: 'Tobacco-free pouches you place under your lip.' },
];

const DURATION_OPTIONS: { value: UseDuration; title: string }[] = [
  { value: 'under-6-months', title: 'Less than 6 months' },
  { value: '6-months-to-1-year', title: '6 months to 1 year' },
  { value: '1-to-3-years', title: '1 to 3 years' },
  { value: '3-plus-years', title: '3+ years' },
];

const VAPE_TYPE_OPTIONS: { value: VapeType; title: string; detail: string }[] = [
  { value: 'disposable', title: 'Disposable', detail: 'Used for a while, then replaced.' },
  { value: 'pod', title: 'Pod system', detail: 'A device with pods you swap.' },
  { value: 'tank', title: 'Refillable tank', detail: 'You add your own liquid.' },
  { value: 'unsure', title: 'Not sure', detail: 'Any of these is fine for now.' },
];

const PATTERN_OPTIONS: { value: UsagePattern; title: string; detail: string }[] = [
  { value: 'throughout-day', title: 'Throughout the day', detail: 'Spread across most of the day.' },
  { value: 'certain-times', title: 'Mostly at certain times', detail: 'A few regular parts of the day.' },
  { value: 'occasionally', title: 'Only occasionally', detail: 'Not part of most days.' },
];

const GOAL_OPTIONS: { value: ProfileGoal; title: string; detail: string }[] = [
  { value: 'track', title: 'Track my consumption', detail: 'Keep a simple record.' },
  { value: 'stay-within', title: 'Stay within a daily target', detail: 'See how today compares.' },
  { value: 'reduce', title: 'Gradually reduce', detail: 'Start from your usual amount, and lower it when you want.' },
  { value: 'understand', title: 'Understand my habits', detail: 'Notice the times and situations that come up.' },
];

const VAPE_GOAL_OPTIONS: { value: ProfileGoal; title: string; detail: string }[] = [
  { value: 'track', title: 'Track my consumption', detail: 'Keep a simple record.' },
  { value: 'stay-within', title: 'Stay within my current usage', detail: 'See how today compares.' },
  { value: 'reduce', title: 'Gradually reduce', detail: 'Start from your usual amount, and lower it when you want.' },
  { value: 'understand', title: 'Understand my habits', detail: 'Notice the times and situations that come up.' },
];

const LAST_USED_OPTIONS: { value: LastUsedMode; title: string }[] = [
  { value: 'now', title: 'Just now' },
  { value: 'earlier-today', title: 'Earlier today' },
  { value: 'yesterday', title: 'Yesterday' },
  { value: 'other', title: 'Another day' },
];

function questionSteps(product: ProductType | null): StepId[] {
  if (product === 'cigarette') {
    return ['product', 'daily', 'duration', 'goal', 'last-used'];
  }

  if (product === 'pouch') {
    return ['product', 'daily', 'pouch-strength', 'pouch-unit', 'duration', 'goal', 'last-used'];
  }

  if (product === 'vape') {
    return ['product', 'nicotine', 'vape-type', 'daily', 'pattern', 'goal', 'last-used'];
  }

  return ['product'];
}

function flowSteps(product: ProductType): StepId[] {
  return [...questionSteps(product), 'summary'];
}

function digitsOnly(raw: string, max: number): string {
  return raw.replace(/\D/g, '').slice(0, max);
}

function strengthText(raw: string): string {
  const cleaned = raw.replace(/[^\d.]/g, '');
  const dot = cleaned.indexOf('.');
  if (dot === -1) {
    return cleaned.slice(0, 3);
  }

  const whole = cleaned.slice(0, dot).slice(0, 3);
  const fraction = cleaned.slice(dot + 1).replace(/\./g, '').slice(0, 2);
  return `${whole}.${fraction}`;
}

export function OnboardingScreen({ onDone }: OnboardingScreenProps) {
  const { width } = useWindowDimensions();
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [committedProduct, setCommittedProduct] = useState<ProductType | null>(null);
  const [index, setIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const fade = useRef(new Animated.Value(1)).current;
  const slide = useRef(new Animated.Value(0)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;

  const product = draft.productType;
  const steps = product == null ? (['product'] as StepId[]) : flowSteps(product);
  const step = steps[Math.min(index, steps.length - 1)] ?? 'product';
  const questions = questionSteps(product);
  const questionIndex = questions.indexOf(step);
  const baseline = parseBaselineCount(draft.dailyCount);
  const strength = parseNicotineStrength(draft.nicotineStrength);
  const lastUsedAt = resolveLastUsedAt({
    mode: draft.lastUsedMode,
    hour: draft.hour,
    minute: draft.minute,
    day: draft.day,
    month: draft.month,
    year: draft.year,
  });

  const canContinue = stepCanContinue(step, draft, baseline, strength, lastUsedAt) && !saving;
  const progressCurrent =
    step === 'summary' && product != null
      ? questions.length
      : questionIndex >= 0 && product != null
        ? questionIndex + 1
        : null;
  const progressTotal = progressCurrent == null ? null : questions.length;

  useEffect(() => {
    fade.setValue(0);
    slide.setValue(14);
    scrollRef.current?.scrollTo({ y: 0, animated: false });
    Animated.parallel([
      Animated.timing(fade, {
        toValue: 1,
        duration: 240,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(slide, {
        toValue: 0,
        duration: 240,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [fade, slide, step]);

  function patch(next: Partial<Draft>) {
    setDraft((current) => ({ ...current, ...next }));
    setSaveError(false);
  }

  function goBack() {
    setSaveError(false);
    setIndex((current) => Math.max(0, current - 1));
  }

  async function goNext() {
    if (!canContinue || (product == null && step !== 'product')) {
      return;
    }

    if (step === 'product' && draft.productType != null) {
      if (draft.productType !== committedProduct) {
        const nextProduct = draft.productType;
        setCommittedProduct(nextProduct);
        setDraft({ ...EMPTY_DRAFT, productType: nextProduct });
      }

      setIndex(1);
      return;
    }

    if (step === 'summary') {
      if (product == null || baseline == null || draft.goal == null) {
        return;
      }

      const profile = buildProfile(draft, product, baseline, strength, lastUsedAt);
      if (profile == null) {
        return;
      }

      setSaving(true);
      const saved = await completeOnboarding(profile);
      setSaving(false);
      if (!saved) {
        setSaveError(true);
        return;
      }

      onDone();
      return;
    }

    setIndex((current) => current + 1);
  }

  function animateButton(toValue: number) {
    Animated.timing(buttonScale, {
      toValue,
      duration: toValue === 1 ? 120 : 60,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  }

  const padding = horizontalPadding(width);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom', 'left', 'right']}>
      <StatusBar style="light" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <View style={[styles.header, { paddingHorizontal: padding }]}>
          <OnboardingProgress
            current={progressCurrent}
            onBack={index > 0 ? goBack : undefined}
            total={progressTotal}
          />
        </View>
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={[styles.content, { paddingHorizontal: padding }]}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View
            style={[
              styles.column,
              { opacity: fade, transform: [{ translateY: slide }] },
            ]}
          >
            <StepBody
              baseline={baseline}
              draft={draft}
              lastUsedAt={lastUsedAt}
              onChange={patch}
              step={step}
              strength={strength}
            />
            {saveError ? <Text style={styles.error}>Couldn’t save your profile. Try again.</Text> : null}
          </Animated.View>
        </ScrollView>
        <View style={[styles.footer, { paddingHorizontal: padding }]}>
          <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ disabled: !canContinue }}
              disabled={!canContinue}
              onPress={() => {
                void goNext();
              }}
              onPressIn={() => {
                if (canContinue) {
                  animateButton(0.98);
                }
              }}
              onPressOut={() => animateButton(1)}
              style={[styles.next, canContinue ? null : styles.nextDisabled]}
            >
              <Text style={styles.nextLabel}>
                {saving ? 'Saving…' : step === 'summary' ? 'Start tracking' : 'Continue'}
              </Text>
            </Pressable>
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function stepCanContinue(
  step: StepId,
  draft: Draft,
  baseline: number | null,
  strength: number | null,
  lastUsedAt: string | null,
): boolean {
  switch (step) {
    case 'product':
      return draft.productType != null;
    case 'daily':
      return baseline != null;
    case 'duration':
      return draft.duration != null;
    case 'nicotine':
      return strength != null && draft.nicotineUnit != null;
    case 'pouch-strength':
      return strength != null;
    case 'pouch-unit':
      return draft.pouchUnit != null;
    case 'vape-type':
      return draft.vapeType != null;
    case 'pattern':
      return draft.usagePattern != null;
    case 'goal':
      return draft.goal != null;
    case 'last-used':
      return lastUsedAt != null;
    case 'summary':
      return true;
    default:
      return false;
  }
}

function buildProfile(
  draft: Draft,
  product: ProductType,
  baseline: number,
  strength: number | null,
  lastUsedAt: string | null,
): ConsumptionProfile | null {
  if (draft.goal == null) {
    return null;
  }

  if (product === 'cigarette') {
    if (draft.duration == null) {
      return null;
    }

    return {
      completed: true,
      productType: 'cigarette',
      dailyBaseline: baseline,
      nicotineStrength: null,
      nicotineUnit: null,
      vapeType: null,
      usagePattern: null,
      duration: draft.duration,
      lastUsedAt,
      goal: draft.goal,
    };
  }

  if (product === 'pouch') {
    if (draft.duration == null || strength == null || draft.pouchUnit == null) {
      return null;
    }

    return {
      completed: true,
      productType: 'pouch',
      dailyBaseline: baseline,
      nicotineStrength: null,
      nicotineUnit: null,
      vapeType: null,
      usagePattern: null,
      duration: draft.duration,
      lastUsedAt,
      goal: draft.goal,
      pouchNicotineStrength: strength,
      pouchNicotineUnit: draft.pouchUnit,
    };
  }

  if (draft.vapeType == null || draft.usagePattern == null || strength == null || draft.nicotineUnit == null) {
    return null;
  }

  return {
    completed: true,
    productType: 'vape',
    dailyBaseline: baseline,
    nicotineStrength: strength,
    nicotineUnit: draft.nicotineUnit,
    vapeType: draft.vapeType,
    usagePattern: draft.usagePattern,
    duration: null,
    lastUsedAt,
    goal: draft.goal,
  };
}

type StepBodyProps = {
  step: StepId;
  draft: Draft;
  baseline: number | null;
  strength: number | null;
  lastUsedAt: string | null;
  onChange: (next: Partial<Draft>) => void;
};

function StepBody({ step, draft, baseline, strength, lastUsedAt, onChange }: StepBodyProps) {
  if (step === 'product') {
    return (
      <Question
        detail="Choose the option that best describes your current consumption."
        title="What do you currently use?"
      >
        <ChoiceList
          onSelect={(productType) => onChange({ productType })}
          options={PRODUCT_OPTIONS}
          selected={draft.productType}
        />
      </Question>
    );
  }

  if (step === 'daily' && draft.productType === 'cigarette') {
    return (
      <Question detail="A usual day is enough." title="How many cigarettes do you usually smoke per day?">
        <NumberEntry
          accessibilityLabel="Cigarettes per day"
          hint={draft.dailyCount.trim() !== '' && baseline == null ? 'Enter a number greater than 0.' : null}
          keyboard="number-pad"
          onChangeText={(dailyCount) => onChange({ dailyCount: digitsOnly(dailyCount, 4) })}
          value={draft.dailyCount}
        />
      </Question>
    );
  }

  if (step === 'daily' && draft.productType === 'pouch') {
    return (
      <Question detail="A usual day is enough." title="How many pouches do you usually use per day?">
        <NumberEntry
          accessibilityLabel="Pouches per day"
          hint={draft.dailyCount.trim() !== '' && baseline == null ? 'Enter a number greater than 0.' : null}
          keyboard="number-pad"
          onChangeText={(dailyCount) => onChange({ dailyCount: digitsOnly(dailyCount, 4) })}
          value={draft.dailyCount}
        />
      </Question>
    );
  }

  if (step === 'daily') {
    return (
      <Question
        detail="Your usual day. This becomes your starting baseline."
        title="About how many puffs do you usually take per day?"
      >
        <NumberEntry
          accessibilityLabel="Puffs per day"
          hint={draft.dailyCount.trim() !== '' && baseline == null ? 'Enter a number greater than 0.' : null}
          keyboard="number-pad"
          onChangeText={(dailyCount) => onChange({ dailyCount: digitsOnly(dailyCount, 4) })}
          value={draft.dailyCount}
        />
      </Question>
    );
  }

  if (step === 'duration') {
    return (
      <Question
        title={
          draft.productType === 'pouch'
            ? 'How long have you been using nicotine pouches?'
            : 'How long have you been using cigarettes?'
        }
      >
        <ChoiceList
          onSelect={(duration) => onChange({ duration })}
          options={DURATION_OPTIONS}
          selected={draft.duration}
        />
      </Question>
    );
  }

  if (step === 'nicotine') {
    const strengthHint =
      draft.nicotineStrength.trim() !== '' && strength == null ? 'Enter a strength like 20 or 3.5.' : null;
    const unitHint = strength != null && draft.nicotineUnit == null ? 'Choose mg/mL or mg. They measure different things.' : null;

    return (
      <Question title="What nicotine strength are you currently using?">
        <NumberEntry
          accessibilityLabel="Nicotine strength"
          hint={strengthHint}
          keyboard="decimal-pad"
          onChangeText={(nicotineStrength) => onChange({ nicotineStrength: strengthText(nicotineStrength) })}
          value={draft.nicotineStrength}
        />
        <View style={styles.unitRow}>
          <UnitCard
            detail="Liquid strength. The number on most bottles and disposables."
            label="mg/mL"
            onPress={() => onChange({ nicotineUnit: 'mg/ml' })}
            selected={draft.nicotineUnit === 'mg/ml'}
          />
          <UnitCard
            detail="Amount per piece or pod. Not the same as liquid strength."
            label="mg"
            onPress={() => onChange({ nicotineUnit: 'mg' })}
            selected={draft.nicotineUnit === 'mg'}
          />
        </View>
        {unitHint ? <Text style={styles.hint}>{unitHint}</Text> : null}
      </Question>
    );
  }

  if (step === 'pouch-strength') {
    return (
      <Question
        detail="The number printed on the pouch or tin, per pouch."
        title="What nicotine strength are your pouches?"
      >
        <NumberEntry
          accessibilityLabel="Nicotine strength per pouch"
          hint={
            draft.nicotineStrength.trim() !== '' && strength == null ? 'Enter a strength like 6 or 12.5.' : null
          }
          keyboard="decimal-pad"
          onChangeText={(nicotineStrength) => onChange({ nicotineStrength: strengthText(nicotineStrength) })}
          value={draft.nicotineStrength}
        />
      </Question>
    );
  }

  if (step === 'pouch-unit') {
    return (
      <Question
        detail="Pouch strength is measured in milligrams of nicotine in each pouch."
        title="What is the nicotine strength unit?"
      >
        <UnitCard
          detail="Milligrams of nicotine in one pouch. Not mg/mL, which is for vape liquid."
          label="mg per pouch"
          onPress={() => onChange({ pouchUnit: 'mg-per-pouch' })}
          selected={draft.pouchUnit === 'mg-per-pouch'}
        />
      </Question>
    );
  }

  if (step === 'vape-type') {
    return (
      <Question title="What type of vape are you using?">
        <ChoiceList
          onSelect={(vapeType) => onChange({ vapeType })}
          options={VAPE_TYPE_OPTIONS}
          selected={draft.vapeType}
        />
      </Question>
    );
  }

  if (step === 'pattern') {
    return (
      <Question title="How often do you usually vape?">
        <ChoiceList
          onSelect={(usagePattern) => onChange({ usagePattern })}
          options={PATTERN_OPTIONS}
          selected={draft.usagePattern}
        />
      </Question>
    );
  }

  if (step === 'goal') {
    const options = draft.productType === 'vape' ? VAPE_GOAL_OPTIONS : GOAL_OPTIONS;
    return (
      <Question title="What would you like PuffTrack to help you do?">
        <ChoiceList onSelect={(goal) => onChange({ goal })} options={options} selected={draft.goal} />
      </Question>
    );
  }

  if (step === 'last-used') {
    const title =
      draft.productType === 'cigarette'
        ? 'When did you last use a cigarette?'
        : draft.productType === 'pouch'
          ? 'When did you last use a nicotine pouch?'
          : 'When did you last vape?';
    const showClock = draft.lastUsedMode != null && draft.lastUsedMode !== 'now';
    const showDate = draft.lastUsedMode === 'other';
    const timeReady = draft.hour.trim() !== '' && draft.minute.trim() !== '';
    const dateReady = draft.day.trim() !== '' && draft.month.trim() !== '' && draft.year.trim() !== '';
    const showFutureHint = showClock && timeReady && (showDate ? dateReady : true) && lastUsedAt == null;

    return (
      <Question detail="A rough time is enough." title={title}>
        <ChoiceList
          onSelect={(lastUsedMode) => onChange({ lastUsedMode })}
          options={LAST_USED_OPTIONS}
          selected={draft.lastUsedMode}
        />
        {draft.lastUsedMode != null ? (
          <WhenUsedPicker
            day={draft.day}
            future={showFutureHint}
            hour={draft.hour}
            minute={draft.minute}
            mode={draft.lastUsedMode}
            month={draft.month}
            onChange={onChange}
            year={draft.year}
          />
        ) : null}
      </Question>
    );
  }

  const cigarette = draft.productType === 'cigarette';
  const pouch = draft.productType === 'pouch';
  const unit = cigarette ? 'CIGARETTES' : pouch ? 'POUCHES' : 'PUFFS';
  const amount = baseline == null ? '—' : formatGroupedNumber(baseline);

  return (
    <View style={styles.question}>
      <View style={styles.heroCard}>
        <Text style={styles.heroKicker}>YOUR STARTING BASELINE</Text>
        <Text style={styles.heroAmount}>~{amount}</Text>
        <Text style={styles.heroUnit}>{unit} / DAY</Text>
        {pouch && strength != null && draft.pouchUnit != null ? (
          <View style={styles.heroFact}>
            <Text style={styles.heroFactLabel}>Nicotine strength</Text>
            <Text style={styles.heroFactValue}>
              {formatStrength(strength)} {pouchUnitLabel(draft.pouchUnit)}
            </Text>
          </View>
        ) : null}
        {draft.productType === 'vape' && strength != null && draft.nicotineUnit != null ? (
          <View style={styles.heroFact}>
            <Text style={styles.heroFactLabel}>Nicotine strength</Text>
            <Text style={styles.heroFactValue}>
              {formatStrength(strength)} {nicotineUnitLabel(draft.nicotineUnit)}
            </Text>
          </View>
        ) : null}
      </View>
      <Text style={styles.hint}>Based on what you reported.</Text>
      {draft.goal === 'reduce' && (draft.productType === 'vape' || pouch) && baseline != null ? (
        <Text style={styles.hint}>
          Your starting target is {formatGroupedNumber(baseline)} {pouch ? 'pouches' : 'puffs'}/day. You can change it
          in Goals.
        </Text>
      ) : null}
      {pouch ? (
        <Text style={styles.hint}>
          Your daily limit starts at 10 pouches. It is only a tracking default, and you can change it in Goals.
        </Text>
      ) : null}
    </View>
  );
}

function formatStrength(value: number): string {
  return Number.isInteger(value) ? String(value) : String(value);
}

function Question({ title, detail, children }: { title: string; detail?: string; children: ReactNode }) {
  return (
    <View style={styles.question}>
      <Text style={styles.title}>{title}</Text>
      {detail ? <Text style={styles.detail}>{detail}</Text> : null}
      <View style={styles.answers}>{children}</View>
    </View>
  );
}

function ChoiceList<T extends string>({
  options,
  selected,
  onSelect,
}: {
  options: { value: T; title: string; emoji?: string; detail?: string }[];
  selected: T | null;
  onSelect: (value: T) => void;
}) {
  return (
    <View style={styles.answers}>
      {options.map((option) => (
        <ChoiceCard
          detail={option.detail}
          emoji={option.emoji}
          key={option.value}
          onPress={() => onSelect(option.value)}
          selected={option.value === selected}
          title={option.title}
        />
      ))}
    </View>
  );
}

function UnitCard({
  label,
  detail,
  selected,
  onPress,
}: {
  label: string;
  detail: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [styles.unit, selected ? styles.unitSelected : null, pressed ? styles.pressed : null]}
    >
      <Text style={[styles.unitLabel, selected ? styles.unitLabelSelected : null]}>{label}</Text>
      <Text style={styles.unitDetail}>{detail}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
  },
  header: {
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  content: {
    flexGrow: 1,
    paddingBottom: spacing.lg,
  },
  column: {
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
    gap: spacing.lg,
  },
  question: {
    gap: spacing.lg,
  },
  title: {
    color: colors.text,
    fontSize: 34,
    fontWeight: '700',
    letterSpacing: -0.6,
    lineHeight: 40,
  },
  detail: {
    color: colors.textMuted,
    fontSize: 16,
    lineHeight: 22,
    marginTop: -spacing.sm,
  },
  answers: {
    gap: spacing.sm,
  },
  unitRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  unit: {
    flex: 1,
    minHeight: 108,
    borderRadius: radius.lg,
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.cardBorder,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.md,
    justifyContent: 'center',
    gap: 6,
  },
  unitSelected: {
    backgroundColor: colors.track,
    borderColor: colors.accent,
  },
  unitLabel: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
  },
  unitLabelSelected: {
    color: colors.accent,
  },
  unitDetail: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.82,
  },
  hint: {
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 21,
  },
  error: {
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 21,
  },
  heroCard: {
    borderRadius: radius.lg,
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.cardBorder,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
    alignItems: 'center',
    gap: spacing.sm,
  },
  heroKicker: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.3,
  },
  heroAmount: {
    color: colors.text,
    fontSize: 72,
    fontWeight: '700',
    letterSpacing: -2,
    lineHeight: 78,
  },
  heroUnit: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1.6,
  },
  heroFact: {
    marginTop: spacing.md,
    alignSelf: 'stretch',
    borderRadius: radius.md,
    backgroundColor: colors.track,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    gap: 4,
  },
  heroFactLabel: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '700',
  },
  heroFactValue: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '700',
  },
  footer: {
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  next: {
    minHeight: 60,
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextDisabled: {
    opacity: 0.38,
  },
  nextLabel: {
    color: colors.onAccent,
    fontSize: 17,
    fontWeight: '800',
  },
});

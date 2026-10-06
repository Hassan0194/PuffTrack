export const TRIGGER_TYPES = [
  'stress',
  'boredom',
  'coffee',
  'after-food',
  'gaming',
  'social',
  'habit',
  'work',
  'bathroom',
  'other',
] as const;

export type TriggerType = (typeof TRIGGER_TYPES)[number];

export type TriggerOption = {
  type: TriggerType;
  label: string;
  icon: string;
};

export const TRIGGER_OPTIONS: readonly TriggerOption[] = [
  { type: 'stress', label: 'Stress', icon: '😩' },
  { type: 'boredom', label: 'Boredom', icon: '😴' },
  { type: 'coffee', label: 'Coffee', icon: '☕' },
  { type: 'after-food', label: 'After Food', icon: '🍔' },
  { type: 'gaming', label: 'Gaming', icon: '🎮' },
  { type: 'social', label: 'Social', icon: '👥' },
  { type: 'habit', label: 'Habit', icon: '🔄' },
  { type: 'work', label: 'Work', icon: '💻' },
  { type: 'bathroom', label: 'Bathroom', icon: '💩' },
  { type: 'other', label: 'Other', icon: '•' },
];

export function isTriggerType(value: unknown): value is TriggerType {
  return typeof value === 'string' && TRIGGER_TYPES.some((type) => type === value);
}

export function triggerOption(type: TriggerType): TriggerOption {
  const match = TRIGGER_OPTIONS.find((option) => option.type === type);
  return match ?? TRIGGER_OPTIONS[TRIGGER_OPTIONS.length - 1];
}

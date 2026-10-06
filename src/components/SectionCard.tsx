import type { ReactNode } from 'react';
import { Text, View } from 'react-native';

import { ui } from '../theme/ui';

type SectionCardProps = {
  title: string;
  children: ReactNode;
};

export function SectionCard({ title, children }: SectionCardProps) {
  return (
    <View style={ui.card}>
      <Text style={ui.kicker}>{title}</Text>
      {children}
    </View>
  );
}

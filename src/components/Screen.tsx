import type { ReactNode } from 'react';
import { ScrollView, useWindowDimensions, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';

import { horizontalPadding } from '../theme/spacing';
import { ui } from '../theme/ui';

type ScreenProps = {
  children: ReactNode;
  footer?: ReactNode;
};

export function Screen({ children, footer }: ScreenProps) {
  const { width } = useWindowDimensions();

  return (
    <SafeAreaView style={ui.safe} edges={['top', 'bottom', 'left', 'right']}>
      <StatusBar style="light" />
      <ScrollView
        contentInsetAdjustmentBehavior="never"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[ui.content, { paddingHorizontal: horizontalPadding(width) }]}
      >
        <View style={ui.column}>{children}</View>
      </ScrollView>
      {footer}
    </SafeAreaView>
  );
}

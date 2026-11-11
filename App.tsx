import { useEffect, useState } from 'react';
import { BackHandler, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { GoalsScreen } from './src/screens/GoalsScreen';
import { HistoryScreen } from './src/screens/HistoryScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { InsightsScreen } from './src/screens/InsightsScreen';
import { OnboardingScreen } from './src/screens/OnboardingScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { shouldShowOnboarding } from './src/storage/profile';
import { colors } from './src/theme/colors';

type AppScreen = 'home' | 'history' | 'insights' | 'goals' | 'settings';
type LaunchGate = 'loading' | 'onboarding' | 'ready';

export default function App() {
  const [screen, setScreen] = useState<AppScreen>('home');
  const [dataVersion, setDataVersion] = useState(0);
  const [gate, setGate] = useState<LaunchGate>('loading');

  useEffect(() => {
    let cancelled = false;

    void shouldShowOnboarding()
      .then((show) => {
        if (!cancelled) {
          setGate(show ? 'onboarding' : 'ready');
        }
      })
      .catch(() => {
        if (!cancelled) {
          setGate('ready');
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (gate !== 'ready' || screen === 'home') {
      return;
    }

    // On a sub-screen, back returns Home instead of closing the app.
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      setScreen('home');
      return true;
    });

    return () => subscription.remove();
  }, [gate, screen]);

  if (gate === 'loading') {
    return (
      <SafeAreaProvider>
        <View style={{ flex: 1, backgroundColor: colors.background }} />
      </SafeAreaProvider>
    );
  }

  if (gate === 'onboarding') {
    return (
      <SafeAreaProvider>
        <OnboardingScreen onDone={() => setGate('ready')} />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      {screen === 'history' ? (
        <HistoryScreen onBack={() => setScreen('home')} />
      ) : screen === 'insights' ? (
        <InsightsScreen onBack={() => setScreen('home')} />
      ) : screen === 'settings' ? (
        <SettingsScreen
          onBack={() => setScreen('home')}
          onRestored={() => {
            setDataVersion((value) => value + 1);
            setScreen('home');
          }}
        />
      ) : screen === 'goals' ? (
        <GoalsScreen onBack={() => setScreen('home')} />
      ) : (
        <HomeScreen
          key={dataVersion}
          onOpenGoals={() => setScreen('goals')}
          onOpenHistory={() => setScreen('history')}
          onOpenInsights={() => setScreen('insights')}
          onOpenSettings={() => setScreen('settings')}
        />
      )}
    </SafeAreaProvider>
  );
}

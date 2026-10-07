import { Nunito_700Bold, Nunito_800ExtraBold, Nunito_900Black } from '@expo-google-fonts/nunito';
import { SourceSerif4_400Regular, SourceSerif4_600SemiBold } from '@expo-google-fonts/source-serif-4';
import { ThemeProvider, useTheme } from '@pax/tokens/react';
import { useFonts } from 'expo-font';
import { router, Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { ContentProvider } from '@/data/content';
import { addNotificationTapListener } from '@/notifications/reminders';
import { AppStateProvider, useAppState } from '@/state/AppState';

void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Nunito_700Bold,
    Nunito_800ExtraBold,
    Nunito_900Black,
    SourceSerif4_400Regular,
    SourceSerif4_600SemiBold,
  });
  return (
    <AppStateProvider>
      <Root fontsLoaded={fontsLoaded} />
    </AppStateProvider>
  );
}

function Root({ fontsLoaded }: { fontsLoaded: boolean }) {
  const { ready, today, settings, updateSettings } = useAppState();
  const loaded = ready && fontsLoaded;

  useEffect(() => {
    if (loaded) void SplashScreen.hideAsync();
  }, [loaded]);

  // A tapped reminder opens the screen it links to (paxapp://today, paxapp://prayer/angelus).
  useEffect(
    () =>
      addNotificationTapListener((url) => {
        const path = url.replace(/^paxapp:\/\//, '/');
        router.push(path as never);
      }),
    [],
  );

  if (!loaded) return null;
  return (
    <ThemeProvider
      liturgicalColor={today?.color ?? 'green'}
      lockedColor={settings.lockedColor}
      appearance={settings.appearance}>
      <ContentProvider
        installedVersion={settings.contentVersion}
        onInstalled={(contentVersion) => void updateSettings({ contentVersion })}>
        <Navigator />
      </ContentProvider>
    </ThemeProvider>
  );
}

function Navigator() {
  const t = useTheme();
  return (
    <>
      <StatusBar style={t.scheme === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: t.neutral.background } }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="rosary" options={{ presentation: 'fullScreenModal', gestureEnabled: false }} />
        <Stack.Screen name="reminders" options={{ presentation: 'modal' }} />
        <Stack.Screen name="prayer/[slug]" />
      </Stack>
    </>
  );
}

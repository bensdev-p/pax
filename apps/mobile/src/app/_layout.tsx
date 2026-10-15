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
import { useVerseRenumbering } from '@/state/renumber';

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
  useVerseRenumbering();

  // A tapped notification opens the screen it links to (paxapp://today, paxapp://prayer/angelus),
  // including the tap that launched the app. Registered here so the navigator already exists.
  useEffect(
    () =>
      addNotificationTapListener((url) => {
        const path = url.replace(/^paxapp:\/\//, '/');
        router.push(path as never);
      }),
    [],
  );
  return (
    <>
      <StatusBar style={t.scheme === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: t.neutral.background } }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="rosary" options={{ presentation: 'fullScreenModal', gestureEnabled: false }} />
        <Stack.Screen name="examen" options={{ presentation: 'fullScreenModal', gestureEnabled: false }} />
        <Stack.Screen name="devotion/[slug]/pray" options={{ presentation: 'fullScreenModal', gestureEnabled: false }} />
        <Stack.Screen name="reminders" options={{ presentation: 'modal' }} />
        <Stack.Screen name="journal/edit" options={{ presentation: 'modal' }} />
        <Stack.Screen name="my-prayer" options={{ presentation: 'modal' }} />
        <Stack.Screen name="welcome" options={{ presentation: 'fullScreenModal', gestureEnabled: false }} />
        <Stack.Screen name="prayer/[slug]" />
        {/* The native iOS sheet (Android: bottom sheet): opens at half height with the verse and its
            highlight, bookmark and note; drag up for Challoner, the Catechism and the Fathers. */}
        <Stack.Screen
          name="verse/[ref]"
          options={{
            presentation: 'formSheet',
            sheetAllowedDetents: [0.5, 1.0],
            sheetGrabberVisible: true,
            sheetExpandsWhenScrolledToEdge: true,
          }}
        />
      </Stack>
    </>
  );
}

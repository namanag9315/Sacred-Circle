import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useEffect, useState } from "react";
import { Platform, Pressable, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";
import { Flower2, Grid2X2, Headphones, Home, Video as VideoIcon } from "lucide-react-native";
import { LoadingState } from "../components/Sacred";
import { ActiveTabMotion } from "../components/Motion";
import { useAuth } from "../context/AuthContext";
import { AuthScreen, OnboardingScreen, ProfileSetupScreen, SplashScreenView } from "../screens/AuthScreens";
import { SacredStarterScreen } from "../screens/SacredStarterScreen";
import {
  AboutScreen,
  AudioPlayerScreen,
  ContactScreen,
  EventDetailScreen,
  EventsListScreen,
  HelpScreen,
  ProgramDetailScreen,
  ProgramsListScreen,
  ResourcesScreen,
  SessionDetailScreen,
} from "../screens/MainScreens";
import {
  HomeScreen,
  MeditationsScreen,
  MoreScreen,
  ProfileScreen,
  SessionsScreen,
  VideosListScreen
} from "../screens/PremiumMobileScreens";
import { colors } from "../theme";
import { hasOAuthCallbackInUrl, shouldBypassStarterForOAuth } from "../lib/authRedirect";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.warmIvory,
    card: colors.warmIvory,
    text: colors.navy,
    border: colors.border
  }
};

function Tabs() {
  return (
    <Tab.Navigator
      detachInactiveScreens
      tabBar={(props) => <PremiumBottomTabBar {...props} />}
      screenOptions={{ headerShown: false, lazy: true, freezeOnBlur: true }}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Audio" component={MeditationsScreen} />
      <Tab.Screen name="Video" component={VideosListScreen} />
      <Tab.Screen name="More" component={MoreScreen} />
    </Tab.Navigator>
  );
}

function tabIcon(name: string, color: string, focused: boolean) {
  const size = 25;
  const icon =
    name === "Home" ? <Home color={color} size={size} /> :
    name === "Audio" ? <Headphones color={color} size={size} /> :
    name === "Video" ? <VideoIcon color={color} size={size} /> :
    <Grid2X2 color={color} size={size} />;
  return <ActiveTabMotion focused={focused}>{icon}</ActiveTabMotion>;
}

function PremiumBottomTabBar({ state, navigation }: any) {
  const insets = useSafeAreaInsets();
  const { width, fontScale } = useWindowDimensions();
  const compactLayout = width < 380 || fontScale > 1.15;
  return (
    <View pointerEvents="box-none" style={[tabStyles.wrap, compactLayout && tabStyles.wrapCompact, { bottom: Math.max(12, insets.bottom + 6) }]}>
      <View style={[tabStyles.bar, compactLayout && tabStyles.barCompact]}>
        {state.routes.map((route: any, index: number) => {
          const focused = state.index === index;
          const color = focused ? colors.gold : colors.mutedText;
          const navigateToTab = () => {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true
            });
            if (!focused && !event.defaultPrevented) navigation.jumpTo(route.name);
          };
          return (
            <Pressable
              key={route.key}
              accessibilityRole="button"
              accessibilityState={focused ? { selected: true } : {}}
              onPress={navigateToTab}
              style={[tabStyles.item, focused && tabStyles.itemActive]}
            >
              {tabIcon(route.name, color, focused)}
              <Text numberOfLines={1} maxFontSizeMultiplier={1.08} style={[tabStyles.label, compactLayout && tabStyles.labelCompact, focused && tabStyles.labelActive]}>{route.name}</Text>
              <View style={[tabStyles.indicator, focused && tabStyles.indicatorActive]} />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function AppStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
        headerShadowVisible: false,
        headerStyle: { backgroundColor: colors.warmIvory },
        headerTintColor: colors.navy,
        headerTitleStyle: { fontWeight: "700" }
      }}
    >
      <Stack.Screen name="Tabs" component={Tabs} options={{ headerShown: false }} />
      <Stack.Screen name="SessionDetail" component={SessionDetailScreen} options={{ title: "Session" }} />
      <Stack.Screen name="Sessions" component={SessionsScreen} options={{ headerShown: false }} />
      <Stack.Screen name="AudioPlayer" component={AudioPlayerScreen} options={{ title: "Now Playing" }} />
      <Stack.Screen name="Programs" component={ProgramsListScreen} options={{ title: "Programs" }} />
      <Stack.Screen name="ProgramDetail" component={ProgramDetailScreen} options={{ title: "Program" }} />
      <Stack.Screen name="Events" component={EventsListScreen} options={{ title: "Events" }} />
      <Stack.Screen name="EventDetail" component={EventDetailScreen} options={{ title: "Event" }} />
      <Stack.Screen name="Videos" component={VideosListScreen} options={{ headerShown: false }} />
      <Stack.Screen name="About" component={AboutScreen} options={{ title: "About" }} />
      <Stack.Screen name="Contact" component={ContactScreen} options={{ title: "Contact" }} />
      <Stack.Screen name="Profile" component={ProfileScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Help" component={HelpScreen} options={{ title: "Help" }} />
      <Stack.Screen name="Resources" component={ResourcesScreen} options={{ title: "Resources" }} />
    </Stack.Navigator>
  );
}

const tabStyles = StyleSheet.create({
  wrap: {
    position: "absolute",
    left: 18,
    right: 18,
    bottom: 12,
    zIndex: 1000,
    elevation: 24
  },
  wrapCompact: {
    left: 10,
    right: 10
  },
  bar: {
    minHeight: 76,
    paddingTop: 10,
    paddingBottom: 8,
    borderWidth: 1,
    borderColor: "rgba(201,147,50,0.16)",
    borderRadius: 28,
    backgroundColor: "rgba(255,253,248,0.97)",
    shadowColor: "#1C1812",
    shadowOpacity: 0.14,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 13 },
    elevation: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around"
  },
  barCompact: {
    minHeight: 70,
    paddingTop: 8,
    paddingBottom: 6,
    borderRadius: 24
  },
  item: {
    flex: 1,
    minHeight: 56,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    borderRadius: 20
  },
  itemActive: {
    backgroundColor: "rgba(246,231,198,0.32)"
  },
  label: {
    color: colors.mutedText,
    fontSize: 12.5,
    fontWeight: "800"
  },
  labelCompact: {
    fontSize: 11.5
  },
  labelActive: {
    color: colors.gold
  },
  indicator: {
    width: 26,
    height: 2,
    borderRadius: 999,
    backgroundColor: "transparent"
  },
  indicatorActive: {
    backgroundColor: colors.gold
  }
});

export function AppNavigator() {
  const { loading, userId, profile } = useAuth();
  const [splashDone, setSplashDone] = useState(false);
  const [oauthReturn] = useState(shouldBypassStarterForOAuth);
  const [starterDone, setStarterDone] = useState(oauthReturn);
  const previewMode =
    Platform.OS === "web" && typeof window !== "undefined" && window.location.hostname === "localhost"
      ? new URLSearchParams(window.location.search).get("preview")
      : null;
  const hasOAuthCallback = Platform.OS === "web" && hasOAuthCallbackInUrl();
  const previewApp = previewMode === "app";
  const previewAuth = previewMode === "auth" || previewMode === "signup";
  const previewOnboarding = previewMode === "onboarding";

  useEffect(() => {
    const timer = setTimeout(() => setSplashDone(true), Platform.OS === "web" ? 30 : 320);
    return () => clearTimeout(timer);
  }, []);

  if (!splashDone) return <SplashScreenView />;
  if (!starterDone && !previewAuth && !previewOnboarding) return <SacredStarterScreen onFinish={() => setStarterDone(true)} />;
  if (loading && (!previewApp || hasOAuthCallback || oauthReturn)) return <LoadingState />;
  if (userId && !profile) return <LoadingState />;
  if (userId && profile && !isProfileComplete(profile)) return <ProfileSetupScreen />;

  return (
    <SafeAreaProvider>
      <NavigationContainer theme={theme} documentTitle={{ formatter: () => "Sacred Circle" }}>
        {previewOnboarding || previewAuth || (oauthReturn && !userId) || (!userId && !previewApp) ? (
          <Stack.Navigator initialRouteName={previewAuth || oauthReturn ? "Auth" : "Onboarding"} screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Onboarding" component={OnboardingScreen} />
            <Stack.Screen name="Auth" component={AuthScreen} />
          </Stack.Navigator>
        ) : (
          <AppStack />
        )}
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

function isProfileComplete(profile: { name?: string | null; phone?: string | null; city?: string | null; state?: string | null; date_of_birth?: string | null }) {
  return Boolean(
    profile.name?.trim() &&
    profile.city?.trim() &&
    profile.state?.trim() &&
    profile.date_of_birth?.trim()
  );
}

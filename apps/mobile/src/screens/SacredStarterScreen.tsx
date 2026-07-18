import { useEffect, useState } from "react";
import { AccessibilityInfo, Image, Platform, StyleSheet, View, useWindowDimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming
} from "react-native-reanimated";
import { AnimatedJaiGurudevText } from "../components/starter/AnimatedJaiGurudevText";
import { AnimatedSacredLogo } from "../components/starter/AnimatedSacredLogo";
import { FloatingParticles } from "../components/starter/FloatingParticles";
import starterWaterTemple from "../assets/starter/starter-water-temple-optimized.jpg";

export function SacredStarterScreen({
  onFinish,
  reducedMotion
}: {
  onFinish: () => void;
  reducedMotion?: boolean;
}) {
  const systemReducedMotion = useReducedMotionPreference();
  const shouldReduceMotion = reducedMotion ?? systemReducedMotion;
  const { width, height } = useWindowDimensions();
  const screenOpacity = useSharedValue(1);
  const wideScreen = width >= 720;
  const visualWidth = Math.min(width, 560);
  const logoSize = wideScreen ? 184 : Math.min(206, Math.max(178, visualWidth * 0.5));
  const circleSize = wideScreen ? 326 : Math.min(362, Math.max(308, visualWidth * 0.9));
  const glowSize = Math.min(410, visualWidth * 0.72);
  const lakeHeight = Math.max(wideScreen ? 430 : 440, height * (wideScreen ? 0.64 : 0.58));
  const compactHeight = height < 760;
  const lightweightMotion = Platform.OS === "web";

  useEffect(() => {
    screenOpacity.value = shouldReduceMotion
      ? withSequence(withTiming(1, { duration: 0 }), withDelay(1050, withTiming(0, { duration: 150 })))
      : withSequence(
          withTiming(1, { duration: 0 }),
          withDelay(2050, withTiming(0, { duration: 180, easing: Easing.inOut(Easing.cubic) }))
        );

    const timer = setTimeout(onFinish, shouldReduceMotion ? 1220 : 2260);
    return () => clearTimeout(timer);
  }, [onFinish, screenOpacity, shouldReduceMotion]);

  const screenStyle = useAnimatedStyle(() => ({
    opacity: screenOpacity.value
  }));

  return (
    <Animated.View style={[styles.screen, screenStyle]}>
      <LinearGradient colors={["#FFFDF8", "#FFF5E3", "#F8D79E"]} locations={[0, 0.58, 1]} style={StyleSheet.absoluteFill} />
      <Image source={starterWaterTemple} resizeMode="cover" style={[styles.lakeScene, { width, height: lakeHeight }]} />
      <LinearGradient
        colors={[
          "rgba(255,253,248,1)",
          "rgba(255,250,241,0.92)",
          "rgba(255,244,226,0.54)",
          "rgba(255,239,210,0.18)",
          "rgba(255,239,210,0)"
        ]}
        locations={[0, 0.43, 0.58, 0.71, 0.82]}
        style={styles.lakeVeil}
      />
      <LinearGradient
        colors={[
          "rgba(255,253,248,0.22)",
          "rgba(255,250,239,0.06)",
          "rgba(255,232,186,0.02)",
          "rgba(255,229,173,0.14)"
        ]}
        locations={[0, 0.42, 0.68, 1]}
        style={styles.backgroundVeil}
      />
      <View pointerEvents="none" style={[styles.sunGlow, { width: glowSize, height: glowSize, borderRadius: glowSize / 2 }]} />
      <FloatingParticles reducedMotion={shouldReduceMotion} lite={lightweightMotion} />

      <View style={[styles.content, wideScreen && styles.contentWide, compactHeight && styles.contentCompact]}>
        <View style={[styles.logoZone, compactHeight && styles.logoZoneCompact]}>
          <AnimatedSacredLogo size={logoSize} circleSize={circleSize} reducedMotion={shouldReduceMotion} />
        </View>
        <AnimatedJaiGurudevText reducedMotion={shouldReduceMotion} />
      </View>
    </Animated.View>
  );
}

function useReducedMotionPreference() {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (mounted) setReducedMotion(enabled);
    });
    const subscription = AccessibilityInfo.addEventListener?.("reduceMotionChanged", setReducedMotion);
    return () => {
      mounted = false;
      subscription?.remove?.();
    };
  }, []);

  return reducedMotion;
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    overflow: "hidden",
    backgroundColor: "#FFF9ED"
  },
  lakeScene: {
    position: "absolute",
    bottom: -18,
    left: 0,
    opacity: 0.96
  },
  lakeVeil: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  backgroundVeil: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0
  },
  sunGlow: {
    position: "absolute",
    alignSelf: "center",
    bottom: "11%",
    backgroundColor: "rgba(255,245,205,0.2)",
    shadowColor: "#FFF4C6",
    shadowOpacity: 0.12,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 0 }
  },
  content: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 52
  },
  contentWide: {
    width: "100%",
    maxWidth: 560,
    alignSelf: "center",
    paddingTop: 44
  },
  contentCompact: {
    paddingTop: 34
  },
  logoZone: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 22
  },
  logoZoneCompact: {
    marginBottom: 4
  }
});

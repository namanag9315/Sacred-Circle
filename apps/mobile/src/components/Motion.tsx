import { AccessibilityInfo, Image, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MotiText, MotiView } from "moti";
import type { ReactNode } from "react";
import { memo, useEffect, useMemo, useState } from "react";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming
} from "react-native-reanimated";
import { colors } from "../theme";
import sacredFlameLogo from "../assets/starter/sacred-flame-logo.png";
import { FlameFlicker } from "./starter/FlameFlicker";

const AnimatedPressableBase = Animated.createAnimatedComponent(Pressable);

export function useReducedMotionFlag() {
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

export function FadeUp({
  children,
  delay = 0,
  style,
  fromY = 12
}: {
  children: ReactNode;
  delay?: number;
  style?: StyleProp<ViewStyle>;
  fromY?: number;
}) {
  const reducedMotion = useReducedMotionFlag();
  return (
    <MotiView
      from={{ opacity: 0, translateY: reducedMotion ? 0 : fromY }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{
        type: "timing",
        duration: reducedMotion ? 220 : 560,
        delay: reducedMotion ? 0 : delay,
        easing: Easing.out(Easing.cubic)
      }}
      style={style}
    >
      {children}
    </MotiView>
  );
}

export function FadeInText({
  children,
  delay = 0,
  style
}: {
  children: ReactNode;
  delay?: number;
  style?: any;
}) {
  const reducedMotion = useReducedMotionFlag();
  return (
    <MotiText
      from={{ opacity: 0, translateY: reducedMotion ? 0 : 8 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: "timing", duration: reducedMotion ? 200 : 460, delay: reducedMotion ? 0 : delay }}
      style={style}
    >
      {children}
    </MotiText>
  );
}

export function AnimatedPressable({
  children,
  style,
  onPress,
  disabled,
  scaleTo = 0.97
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  disabled?: boolean;
  scaleTo?: number;
}) {
  const reducedMotion = useReducedMotionFlag();
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }]
  }));

  return (
    <AnimatedPressableBase
      disabled={disabled}
      onPress={onPress}
      onPressIn={() => {
        if (!reducedMotion) scale.value = withTiming(scaleTo, { duration: 120, easing: Easing.out(Easing.quad) });
      }}
      onPressOut={() => {
        scale.value = withTiming(1, { duration: 170, easing: Easing.out(Easing.quad) });
      }}
      style={[style, animatedStyle]}
    >
      {children}
    </AnimatedPressableBase>
  );
}

export function BreathingLogoGlow({ size }: { size: number }) {
  const reducedMotion = useReducedMotionFlag();
  const breath = useSharedValue(0);

  useEffect(() => {
    if (reducedMotion) return;
    breath.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1400, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 1400, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      false
    );
  }, [breath, reducedMotion]);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: reducedMotion ? 0.1 : 0.08 + breath.value * 0.16,
    transform: [{ scale: reducedMotion ? 1 : 0.9 + breath.value * 0.18 }]
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          position: "absolute",
          width: size * 0.44,
          height: size * 0.44,
          borderRadius: size * 0.22,
          top: size * 0.13,
          alignSelf: "center",
          backgroundColor: "rgba(214,163,72,0.42)"
        },
        glowStyle
      ]}
    />
  );
}

export function PremiumMotionMedallion({
  size = 76,
  style
}: {
  size?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const reducedMotion = useReducedMotionFlag();
  const tilt = useSharedValue(0);
  const float = useSharedValue(0);
  const sweep = useSharedValue(0);

  useEffect(() => {
    if (reducedMotion) return;
    tilt.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2400, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 2400, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      false
    );
    float.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1900, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 1900, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      false
    );
    sweep.value = withRepeat(withTiming(1, { duration: 3200, easing: Easing.inOut(Easing.cubic) }), -1, false);
  }, [float, reducedMotion, sweep, tilt]);

  const medallionStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 720 },
      { translateY: reducedMotion ? 0 : -3 + float.value * 6 },
      { rotateY: `${reducedMotion ? -8 : -14 + tilt.value * 28}deg` },
      { rotateX: `${reducedMotion ? 5 : 8 - tilt.value * 12}deg` },
      { scale: reducedMotion ? 1 : 0.98 + float.value * 0.025 }
    ]
  }));

  const orbitStyle = useAnimatedStyle(() => ({
    opacity: reducedMotion ? 0.52 : 0.48 + float.value * 0.2,
    transform: [{ rotate: `${reducedMotion ? -12 : tilt.value * 26 - 13}deg` }]
  }));

  const shineStyle = useAnimatedStyle(() => ({
    opacity: reducedMotion ? 0.16 : 0.12 + sweep.value * 0.24,
    transform: [
      { translateX: reducedMotion ? 0 : -size * 0.62 + sweep.value * size * 1.24 },
      { rotate: "-18deg" }
    ]
  }));

  return (
    <Animated.View pointerEvents="none" style={[{ width: size, height: size }, style, medallionStyle]}>
      <Animated.View
        style={[
          motionStyles.medallionGlow,
          {
            width: size * 1.18,
            height: size * 1.18,
            borderRadius: size * 0.59,
            left: -size * 0.09,
            top: -size * 0.08
          }
        ]}
      />
      <Animated.View
        style={[
          motionStyles.medallionOrbit,
          {
            width: size * 1.32,
            height: size * 0.74,
            borderRadius: size,
            left: -size * 0.16,
            top: size * 0.13
          },
          orbitStyle
        ]}
      />
      <LinearGradient
        colors={["#FFF7E8", "#D7A34A", "#FFFDF8", "#172341"]}
        locations={[0, 0.38, 0.68, 1]}
        start={{ x: 0.08, y: 0.08 }}
        end={{ x: 0.94, y: 0.94 }}
        style={[motionStyles.medallionFace, { width: size, height: size, borderRadius: size / 2 }]}
      >
        <View style={[motionStyles.medallionInner, { width: size * 0.79, height: size * 0.79, borderRadius: size * 0.395 }]} />
        <View
          style={[
            motionStyles.medallionLogoClip,
            { width: size * 0.88, height: size * 0.88, borderRadius: size * 0.44 }
          ]}
        >
          <Image source={sacredFlameLogo} resizeMode="cover" style={motionStyles.medallionLogo} />
          <View
            pointerEvents="none"
            style={[
              motionStyles.medallionFlameOverlay,
              {
                top: size * 0.065,
                width: size * 0.22,
                height: size * 0.32
              }
            ]}
          >
            <FlameFlicker width={size * 0.22} height={size * 0.32} reducedMotion={reducedMotion} />
          </View>
        </View>
        <Animated.View style={[motionStyles.medallionShine, { height: size * 1.35, width: size * 0.24 }, shineStyle]} />
      </LinearGradient>
    </Animated.View>
  );
}

export function PremiumOrbitRings({
  size = 96,
  style
}: {
  size?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const reducedMotion = useReducedMotionFlag();
  const orbit = useSharedValue(0);
  const pulse = useSharedValue(0);

  useEffect(() => {
    if (reducedMotion) return;
    orbit.value = withRepeat(withTiming(1, { duration: 6200, easing: Easing.linear }), -1, false);
    pulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1800, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 1800, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      false
    );
  }, [orbit, pulse, reducedMotion]);

  const spinStyle = useAnimatedStyle(() => ({
    opacity: reducedMotion ? 0.52 : 0.58 + pulse.value * 0.22,
    transform: [{ rotate: `${reducedMotion ? 0 : orbit.value * 360}deg` }]
  }));

  const counterSpinStyle = useAnimatedStyle(() => ({
    opacity: reducedMotion ? 0.32 : 0.34 + pulse.value * 0.18,
    transform: [{ rotate: `${reducedMotion ? -36 : -orbit.value * 260 - 36}deg` }]
  }));

  return (
    <View pointerEvents="none" style={[{ width: size, height: size }, style]}>
      <Animated.View
        style={[
          motionStyles.orbitRing,
          {
            width: size,
            height: size * 0.58,
            borderRadius: size,
            top: size * 0.21,
            borderColor: "rgba(214,163,72,0.56)"
          },
          spinStyle
        ]}
      />
      <Animated.View
        style={[
          motionStyles.orbitRing,
          {
            width: size * 0.78,
            height: size * 0.78,
            borderRadius: size * 0.39,
            left: size * 0.11,
            top: size * 0.11,
            borderColor: "rgba(255,253,248,0.54)"
          },
          counterSpinStyle
        ]}
      />
      <View style={[motionStyles.orbitCenter, { width: size * 0.16, height: size * 0.16, borderRadius: size * 0.08, left: size * 0.42, top: size * 0.42 }]} />
    </View>
  );
}

export const FloatingDust = memo(function FloatingDust() {
  const reducedMotion = useReducedMotionFlag();
  const dust = useMemo(
    () => [
      { left: "9%", top: "24%", size: 8, delay: 0, duration: 9800 },
      { left: "86%", top: "17%", size: 6, delay: 700, duration: 11200 },
      { left: "16%", top: "58%", size: 6, delay: 900, duration: 10800 },
      { left: "78%", top: "70%", size: 9, delay: 1300, duration: 11800 },
      { left: "48%", top: "39%", size: 5, delay: 1700, duration: 10200 },
      { left: "62%", top: "12%", size: 4, delay: 2400, duration: 12000 },
      { left: "30%", top: "82%", size: 5, delay: 2100, duration: 12600 },
      { left: "91%", top: "52%", size: 4, delay: 2800, duration: 11600 }
    ],
    []
  );

  if (reducedMotion) return null;

  return (
    <>
      {dust.map((particle, index) => (
        <FloatingDustParticle key={index} {...particle} />
      ))}
    </>
  );
});

function FloatingDustParticle({
  left,
  top,
  size,
  delay,
  duration
}: {
  left: string;
  top: string;
  size: number;
  delay: number;
  duration: number;
}) {
  const drift = useSharedValue(0);

  useEffect(() => {
    drift.value = withDelay(
      delay,
      withRepeat(withTiming(1, { duration, easing: Easing.inOut(Easing.sin) }), -1, true)
    );
  }, [delay, drift, duration]);

  const style = useAnimatedStyle(() => ({
    opacity: 0.24 + drift.value * 0.18,
    transform: [
      { translateY: -64 * drift.value },
      { translateX: 28 * drift.value },
      { scale: 0.82 + drift.value * 0.28 }
    ]
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          position: "absolute",
          left: left as any,
          top: top as any,
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: colors.gold,
          shadowColor: colors.gold,
          shadowOpacity: 0.22,
          shadowRadius: 11,
          shadowOffset: { width: 0, height: 0 }
        },
        style
      ]}
    />
  );
}

const motionStyles = StyleSheet.create({
  medallionGlow: {
    position: "absolute",
    backgroundColor: "rgba(214,163,72,0.22)",
    shadowColor: "#D6A348",
    shadowOpacity: 0.32,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 0 }
  },
  medallionOrbit: {
    position: "absolute",
    borderWidth: 1.2,
    borderColor: "rgba(214,163,72,0.54)",
    backgroundColor: "transparent"
  },
  medallionFace: {
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.68)",
    shadowColor: "#1C1812",
    shadowOpacity: 0.2,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 7
  },
  medallionInner: {
    position: "absolute",
    backgroundColor: "rgba(255,253,248,0.28)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.54)"
  },
  medallionLogoClip: {
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center"
  },
  medallionLogo: {
    width: "100%",
    height: "100%"
  },
  medallionFlameOverlay: {
    position: "absolute",
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center"
  },
  medallionShine: {
    position: "absolute",
    top: "-16%",
    backgroundColor: "rgba(255,255,255,0.58)"
  },
  orbitRing: {
    position: "absolute",
    borderWidth: 1.5,
    backgroundColor: "transparent"
  },
  orbitCenter: {
    position: "absolute",
    backgroundColor: "rgba(214,163,72,0.74)",
    shadowColor: "#D6A348",
    shadowOpacity: 0.28,
    shadowRadius: 9,
    shadowOffset: { width: 0, height: 0 }
  }
});

export function ActiveTabMotion({ focused, children }: { focused: boolean; children: ReactNode }) {
  const translate = useSharedValue(focused ? -3 : 0);
  const opacity = useSharedValue(focused ? 1 : 0);

  useEffect(() => {
    translate.value = withTiming(focused ? -3 : 0, { duration: 220, easing: Easing.out(Easing.cubic) });
    opacity.value = withTiming(focused ? 1 : 0, { duration: 220 });
  }, [focused, opacity, translate]);

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translate.value }]
  }));
  const dotStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scaleX: 0.7 + opacity.value * 0.3 }]
  }));

  return (
    <Animated.View style={[{ alignItems: "center", gap: 3 }, iconStyle]}>
      {children}
      <Animated.View
        style={[
          {
            width: 18,
            height: 2,
            borderRadius: 999,
            backgroundColor: colors.gold
          },
          dotStyle
        ]}
      />
    </Animated.View>
  );
}

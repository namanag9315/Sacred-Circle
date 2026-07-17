import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Svg, { Defs, LinearGradient as SvgLinearGradient, Path, Stop } from "react-native-svg";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming
} from "react-native-reanimated";

export function FlameFlicker({
  width = 46,
  height = 74,
  reducedMotion = false
}: {
  width?: number;
  height?: number;
  reducedMotion?: boolean;
}) {
  const flicker = useSharedValue(0);
  const glow = useSharedValue(0);

  useEffect(() => {
    if (reducedMotion) return;
    flicker.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 280, easing: Easing.inOut(Easing.sin) }),
        withTiming(0.28, { duration: 210, easing: Easing.inOut(Easing.sin) }),
        withTiming(0.72, { duration: 260, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 180, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      false
    );
    glow.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 420, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 440, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      false
    );
  }, [flicker, glow, reducedMotion]);

  const flameStyle = useAnimatedStyle(() => ({
    opacity: reducedMotion ? 0.95 : 0.86 + flicker.value * 0.14,
    transform: [
      { translateY: reducedMotion ? 0 : -1 + flicker.value * 2 },
      { scaleX: reducedMotion ? 1 : 0.98 + flicker.value * 0.05 },
      { scaleY: reducedMotion ? 1 : 0.96 + flicker.value * 0.1 }
    ]
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: reducedMotion ? 0.24 : 0.2 + glow.value * 0.22,
    transform: [{ scale: reducedMotion ? 1 : 0.86 + glow.value * 0.24 }]
  }));

  return (
    <View pointerEvents="none" style={[styles.wrap, { width, height }]}>
      <Animated.View
        style={[
          styles.glow,
          {
            width: width * 1.35,
            height: width * 1.35,
            borderRadius: width * 0.675,
            left: -width * 0.175,
            top: height * 0.38
          },
          glowStyle
        ]}
      />
      <Animated.View style={[styles.flame, flameStyle]}>
        <Svg width={width} height={height} viewBox="0 0 64 100">
          <Defs>
            <SvgLinearGradient id="outerFlame" x1="18" y1="0" x2="45" y2="100" gradientUnits="userSpaceOnUse">
              <Stop offset="0" stopColor="#FFF6B8" />
              <Stop offset="0.34" stopColor="#FFB22E" />
              <Stop offset="0.72" stopColor="#F97316" />
              <Stop offset="1" stopColor="#C2410C" />
            </SvgLinearGradient>
            <SvgLinearGradient id="innerFlame" x1="28" y1="28" x2="35" y2="90" gradientUnits="userSpaceOnUse">
              <Stop offset="0" stopColor="#FFF9D5" />
              <Stop offset="0.62" stopColor="#FFD36A" />
              <Stop offset="1" stopColor="#FF9F1C" />
            </SvgLinearGradient>
          </Defs>
          <Path
            d="M35 3C19 22 38 32 22 51 8 68 18 95 42 95c18 0 29-18 20-36-6-12-19-18-16-33 1-9-3-17-11-23Z"
            fill="url(#outerFlame)"
          />
          <Path
            d="M34 36c-8 10 3 17-7 28-8 9-2 23 11 23 10 0 16-9 12-19-3-7-10-10-8-19 1-5-2-10-8-13Z"
            fill="url(#innerFlame)"
            opacity={0.92}
          />
        </Svg>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    justifyContent: "center"
  },
  glow: {
    position: "absolute",
    backgroundColor: "rgba(249,115,22,0.58)",
    shadowColor: "#FFB22E",
    shadowOpacity: 0.55,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 0 }
  },
  flame: {
    alignItems: "center",
    justifyContent: "center"
  }
});

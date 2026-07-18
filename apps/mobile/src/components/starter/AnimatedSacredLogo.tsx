import { useEffect } from "react";
import { Image, StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming
} from "react-native-reanimated";
import sacredFlameLogo from "../../assets/starter/sacred-flame-logo-optimized.png";
import { FlameFlicker } from "./FlameFlicker";
import { RotatingSacredCircle } from "./RotatingSacredCircle";

export function AnimatedSacredLogo({
  size = 190,
  circleSize = 316,
  reducedMotion = false
}: {
  size?: number;
  circleSize?: number;
  reducedMotion?: boolean;
}) {
  const entrance = useSharedValue(0);
  const aura = useSharedValue(0);

  useEffect(() => {
    entrance.value = withDelay(
      reducedMotion ? 0 : 260,
      withTiming(1, { duration: reducedMotion ? 220 : 440, easing: Easing.out(Easing.cubic) })
    );

    if (reducedMotion) return;
    aura.value = withDelay(
      620,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 1400, easing: Easing.inOut(Easing.sin) }),
          withTiming(0, { duration: 1400, easing: Easing.inOut(Easing.sin) })
        ),
        -1,
        false
      )
    );
  }, [aura, entrance, reducedMotion]);

  const logoStyle = useAnimatedStyle(() => ({
    opacity: entrance.value,
    transform: [
      { translateY: (1 - entrance.value) * 10 },
      { scale: 0.88 + entrance.value * 0.12 + (reducedMotion ? 0 : aura.value * 0.012) }
    ]
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: entrance.value * (reducedMotion ? 0.22 : 0.24 + aura.value * 0.14),
    transform: [{ scale: 0.9 + entrance.value * 0.1 + (reducedMotion ? 0 : aura.value * 0.08) }]
  }));

  return (
    <View pointerEvents="none" style={[styles.wrap, { width: circleSize, height: circleSize }]}>
      <RotatingSacredCircle size={circleSize} reducedMotion={reducedMotion} />
      <Animated.View
        style={[
          styles.logoGlow,
          {
            width: size * 1.12,
            height: size * 1.12,
            borderRadius: size * 0.56
          },
          glowStyle
        ]}
      />
      <Animated.View style={[styles.logoShell, { width: size, height: size, borderRadius: size / 2 }, logoStyle]}>
        <Image source={sacredFlameLogo} resizeMode="cover" style={[styles.logoImage, { width: size, height: size, borderRadius: size / 2 }]} />
        <View
          style={[
            styles.flameOverlay,
            {
              top: size * 0.075,
              width: size * 0.25,
              height: size * 0.37
            }
          ]}
        >
          <FlameFlicker width={size * 0.25} height={size * 0.37} reducedMotion={reducedMotion} />
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    justifyContent: "center"
  },
  logoGlow: {
    position: "absolute",
    backgroundColor: "rgba(255,226,142,0.6)",
    shadowColor: "#FFB22E",
    shadowOpacity: 0.42,
    shadowRadius: 34,
    shadowOffset: { width: 0, height: 0 }
  },
  logoShell: {
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#1C1812",
    shadowOpacity: 0.2,
    shadowRadius: 26,
    shadowOffset: { width: 0, height: 12 },
    elevation: 8
  },
  logoImage: {
    overflow: "hidden"
  },
  flameOverlay: {
    position: "absolute",
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center"
  }
});

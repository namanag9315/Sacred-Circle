import { memo, useEffect, useMemo } from "react";
import { StyleSheet, View } from "react-native";
import Svg, { Defs, LinearGradient as SvgLinearGradient, Path, Stop } from "react-native-svg";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming
} from "react-native-reanimated";

type Particle = {
  kind: "dot" | "flame";
  left: string;
  top: string;
  size: number;
  delay: number;
  duration: number;
  driftX: number;
  driftY: number;
  opacity: number;
  rotate: number;
};

export const FloatingParticles = memo(function FloatingParticles({
  reducedMotion = false,
  lite = false
}: {
  reducedMotion?: boolean;
  lite?: boolean;
}) {
  const particles = useMemo<Particle[]>(
    () => [
      { kind: "dot", left: "12%", top: "7%", size: 4, delay: 0, duration: 5200, driftX: 18, driftY: -42, opacity: 0.42, rotate: 0 },
      { kind: "dot", left: "84%", top: "9%", size: 5, delay: 360, duration: 5700, driftX: -16, driftY: -46, opacity: 0.44, rotate: 0 },
      { kind: "dot", left: "45%", top: "4%", size: 3, delay: 720, duration: 5400, driftX: 8, driftY: -34, opacity: 0.34, rotate: 0 },
      { kind: "dot", left: "78%", top: "30%", size: 4, delay: 1120, duration: 6200, driftX: -14, driftY: -44, opacity: 0.4, rotate: 0 },
      { kind: "dot", left: "10%", top: "74%", size: 5, delay: 1480, duration: 5900, driftX: 22, driftY: -38, opacity: 0.34, rotate: 0 },
      { kind: "dot", left: "87%", top: "79%", size: 4, delay: 1920, duration: 5400, driftX: -20, driftY: -40, opacity: 0.38, rotate: 0 },
      { kind: "dot", left: "56%", top: "79%", size: 6, delay: 2440, duration: 6300, driftX: -8, driftY: -32, opacity: 0.26, rotate: 0 },
      { kind: "dot", left: "67%", top: "21%", size: 3, delay: 3280, duration: 5300, driftX: -10, driftY: -40, opacity: 0.32, rotate: 0 },
      { kind: "flame", left: "7%", top: "17%", size: 36, delay: 120, duration: 6500, driftX: 34, driftY: 46, opacity: 0.42, rotate: -22 },
      { kind: "flame", left: "80%", top: "14%", size: 30, delay: 560, duration: 7100, driftX: -28, driftY: 38, opacity: 0.38, rotate: 18 },
      { kind: "flame", left: "14%", top: "71%", size: 25, delay: 1040, duration: 7600, driftX: 26, driftY: -36, opacity: 0.32, rotate: 34 },
      { kind: "flame", left: "82%", top: "68%", size: 34, delay: 1440, duration: 7000, driftX: -30, driftY: -32, opacity: 0.36, rotate: -18 },
      { kind: "flame", left: "69%", top: "5%", size: 23, delay: 2120, duration: 7400, driftX: -20, driftY: 42, opacity: 0.3, rotate: 26 },
      { kind: "flame", left: "6%", top: "82%", size: 28, delay: 2520, duration: 7800, driftX: 24, driftY: -48, opacity: 0.34, rotate: -30 },
      { kind: "flame", left: "89%", top: "84%", size: 22, delay: 3040, duration: 7300, driftX: -22, driftY: -36, opacity: 0.28, rotate: 24 }
    ],
    []
  );

  if (reducedMotion) return null;
  const visibleParticles = lite
    ? particles.filter((_, index) => [0, 1, 3, 8, 9, 11].includes(index))
    : particles;

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {visibleParticles.map((particle, index) => (
        <FloatingParticle key={`${particle.kind}-${index}`} particle={particle} index={index} />
      ))}
    </View>
  );
});

function FloatingParticle({ particle, index }: { particle: Particle; index: number }) {
  const travel = useSharedValue(0);

  useEffect(() => {
    travel.value = withDelay(
      particle.delay,
      withRepeat(
        withTiming(1, { duration: particle.duration, easing: Easing.inOut(Easing.sin) }),
        -1,
        true
      )
    );
  }, [particle.delay, particle.duration, travel]);

  const style = useAnimatedStyle(() => ({
    opacity: particle.opacity * (0.64 + travel.value * 0.36),
    transform: [
      { translateX: particle.driftX * travel.value },
      { translateY: particle.driftY * travel.value },
      { rotate: `${particle.rotate + (index % 2 === 0 ? 14 : -14) * travel.value}deg` },
      { scale: 0.86 + travel.value * 0.2 }
    ]
  }));

  return (
    <Animated.View
      style={[
        styles.particle,
        {
          left: particle.left as any,
          top: particle.top as any,
          width: particle.size,
          height: particle.size
        },
        style
      ]}
    >
      {particle.kind === "dot" ? <View style={styles.dot} /> : <FlameSpark />}
    </Animated.View>
  );
}

function FlameSpark() {
  return (
    <Svg width="100%" height="100%" viewBox="0 0 42 42">
      <Defs>
        <SvgLinearGradient id="sparkFlame" x1="8" y1="2" x2="32" y2="40" gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor="#FFF0A8" />
          <Stop offset="0.42" stopColor="#FFB248" />
          <Stop offset="1" stopColor="#D96B12" />
        </SvgLinearGradient>
      </Defs>
      <Path
        d="M21 3C10 13 20 19 12 28c-5 7 1 13 9 11 11-2 17-11 15-24-6 7-11 3-15-12Z"
        fill="url(#sparkFlame)"
        opacity={0.82}
      />
      <Path
        d="M14 31C21 24 27 16 32 8"
        stroke="#FFF7C9"
        strokeWidth="1.2"
        strokeLinecap="round"
        opacity={0.66}
      />
    </Svg>
  );
}

const styles = StyleSheet.create({
  particle: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center"
  },
  dot: {
    width: "100%",
    height: "100%",
    borderRadius: 999,
    backgroundColor: "#FFF8D8",
    shadowColor: "#F2B84D",
    shadowOpacity: 0.42,
    shadowRadius: 9,
    shadowOffset: { width: 0, height: 0 }
  }
});

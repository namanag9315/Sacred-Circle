import { useEffect } from "react";
import { Image, StyleSheet } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming
} from "react-native-reanimated";
import mandalaAura from "../../assets/starter/sacred-mandala-alpha.png";

export function RotatingSacredCircle({
  size = 340,
  reducedMotion = false
}: {
  size?: number;
  reducedMotion?: boolean;
}) {
  const entrance = useSharedValue(0);
  const rotate = useSharedValue(0);
  const breath = useSharedValue(0);

  useEffect(() => {
    entrance.value = withDelay(
      reducedMotion ? 0 : 300,
      withTiming(1, { duration: reducedMotion ? 280 : 760, easing: Easing.out(Easing.cubic) })
    );

    if (reducedMotion) return;
    rotate.value = withRepeat(
      withTiming(1, { duration: 20000, easing: Easing.linear }),
      -1,
      false
    );
    breath.value = withDelay(
      300,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.sin) }),
          withTiming(0, { duration: 1500, easing: Easing.inOut(Easing.sin) })
        ),
        -1,
        false
      )
    );
  }, [breath, entrance, reducedMotion, rotate]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: entrance.value * (reducedMotion ? 0.5 : 0.7 + breath.value * 0.15),
    transform: [
      { scale: 0.94 + entrance.value * 0.06 + (reducedMotion ? 0 : breath.value * 0.03) },
      { rotate: `${reducedMotion ? 0 : rotate.value * 360}deg` }
    ]
  }));

  return (
    <Animated.View pointerEvents="none" style={[styles.mandala, { width: size, height: size }, animatedStyle]}>
      <Image source={mandalaAura} resizeMode="contain" style={styles.mandalaImage} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  mandala: {
    position: "absolute"
  },
  mandalaImage: {
    width: "100%",
    height: "100%"
  }
});

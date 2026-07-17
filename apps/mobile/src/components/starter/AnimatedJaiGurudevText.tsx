import { useEffect } from "react";
import { StyleSheet, View, useWindowDimensions } from "react-native";
import { useFonts } from "expo-font";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming
} from "react-native-reanimated";
import playfairSemiBold from "../../assets/fonts/PlayfairDisplay-SemiBold.ttf";

export function AnimatedJaiGurudevText({
  reducedMotion = false
}: {
  reducedMotion?: boolean;
}) {
  const { width } = useWindowDimensions();
  const titleProgress = useSharedValue(0);
  const subtitleProgress = useSharedValue(0);
  const dividerProgress = useSharedValue(0);
  const dotPulse = useSharedValue(0);
  const [fontsLoaded] = useFonts({ "PlayfairDisplay-SemiBold": playfairSemiBold });
  const titleSize = width < 390 ? 44 : width < 430 ? 49 : 55;

  const bottomDividerProgress = useSharedValue(0);

  useEffect(() => {
    dividerProgress.value = withDelay(
      reducedMotion ? 0 : 1200,
      withTiming(1, { duration: reducedMotion ? 220 : 300, easing: Easing.out(Easing.cubic) })
    );
    titleProgress.value = withDelay(
      reducedMotion ? 120 : 1400,
      withTiming(1, { duration: reducedMotion ? 260 : 820, easing: Easing.out(Easing.cubic) })
    );
    bottomDividerProgress.value = withDelay(
      reducedMotion ? 180 : 1600,
      withTiming(1, { duration: reducedMotion ? 220 : 300, easing: Easing.out(Easing.cubic) })
    );
    subtitleProgress.value = withDelay(
      reducedMotion ? 240 : 1800,
      withTiming(1, { duration: reducedMotion ? 240 : 650, easing: Easing.out(Easing.cubic) })
    );
    dotPulse.value = withDelay(
      reducedMotion ? 320 : 2100,
      withTiming(1, { duration: reducedMotion ? 220 : 900, easing: Easing.inOut(Easing.sin) })
    );
  }, [dividerProgress, bottomDividerProgress, dotPulse, reducedMotion, subtitleProgress, titleProgress]);

  const dividerStyle = useAnimatedStyle(() => ({
    opacity: dividerProgress.value,
    transform: [{ translateY: (1 - dividerProgress.value) * 6 }]
  }));

  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleProgress.value,
    transform: [{ translateX: reducedMotion ? 0 : -82 + titleProgress.value * 82 }]
  }));

  const bottomDividerStyle = useAnimatedStyle(() => ({
    opacity: bottomDividerProgress.value,
    transform: [{ translateY: (1 - bottomDividerProgress.value) * 6 }]
  }));

  const subtitleStyle = useAnimatedStyle(() => ({
    opacity: subtitleProgress.value,
    transform: [{ translateY: (1 - subtitleProgress.value) * 10 }]
  }));

  const activeDotStyle = useAnimatedStyle(() => ({
    opacity: 0.72 + dotPulse.value * 0.28,
    transform: [{ scale: 1 + dotPulse.value * 0.25 }]
  }));

  return (
    <View style={styles.wrap}>
      <Animated.View style={[styles.topLotus, dividerStyle]}>
        <View style={styles.lotus}>
          <View style={[styles.lotusPetal, styles.lotusPetalLeft]} />
          <View style={[styles.lotusPetal, styles.lotusPetalCenter]} />
          <View style={[styles.lotusPetal, styles.lotusPetalRight]} />
        </View>
      </Animated.View>
      <Animated.Text
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.86}
        style={[
          styles.title,
          {
            fontFamily: fontsLoaded ? "PlayfairDisplay-SemiBold" : "Georgia",
            fontSize: titleSize,
            lineHeight: titleSize + 8
          },
          titleStyle
        ]}
      >
        Sacred Circle
      </Animated.Text>
      <Animated.View style={[styles.bottomDivider, bottomDividerStyle]}>
        <View style={styles.bottomDividerLine} />
        <View style={styles.bottomDividerDiamond} />
        <View style={styles.bottomDividerLine} />
      </Animated.View>
      <Animated.Text style={[styles.subtitle, subtitleStyle]}>
        Preparing your sacred space...
      </Animated.Text>
      <View style={styles.dots}>
        <View style={[styles.dot, styles.dotMuted]} />
        <Animated.View style={[styles.dot, styles.dotActive, activeDotStyle]} />
        <View style={[styles.dot, styles.dotMuted]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: "100%",
    alignItems: "center"
  },
  topLotus: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8
  },
  lotus: {
    width: 54,
    height: 30,
    alignItems: "center",
    justifyContent: "flex-end"
  },
  lotusPetal: {
    position: "absolute",
    bottom: 1,
    width: 18,
    height: 28,
    borderWidth: 1.4,
    borderColor: "#C99332",
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4
  },
  lotusPetalLeft: {
    transform: [{ rotate: "-34deg" }],
    left: 10
  },
  lotusPetalCenter: {
    height: 30
  },
  lotusPetalRight: {
    transform: [{ rotate: "34deg" }],
    right: 10
  },
  title: {
    color: "#111D3A",
    textAlign: "center",
    letterSpacing: 0,
    textShadowColor: "rgba(255,253,248,0.36)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1
  },
  bottomDivider: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    marginTop: 14,
    marginBottom: 8
  },
  bottomDividerLine: {
    width: 48,
    height: 1,
    backgroundColor: "rgba(201,147,50,0.42)"
  },
  bottomDividerDiamond: {
    width: 6,
    height: 6,
    borderWidth: 1.2,
    borderColor: "#C99332",
    transform: [{ rotate: "45deg" }],
    backgroundColor: "transparent"
  },
  subtitle: {
    color: "#465066",
    fontSize: 19,
    lineHeight: 26,
    textAlign: "center",
    marginTop: 16
  },
  dots: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 20,
    marginTop: 28
  },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7
  },
  dotMuted: {
    backgroundColor: "rgba(246,231,198,0.9)"
  },
  dotActive: {
    backgroundColor: "#E58A1F"
  }
});

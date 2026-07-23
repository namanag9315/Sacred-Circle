import type { ImageSourcePropType, StyleProp, ViewStyle } from "react-native";
import {
  ActivityIndicator,
  Animated,
  Easing,
  Image,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View
} from "react-native";
import {
  ArrowRight,
  CalendarDays,
  ChevronRight,
  Eye,
  Headphones,
  KeyRound,
  LockKeyhole,
  Mail,
  MessageCircle,
  Pause,
  Play,
  RotateCcw,
  RotateCw,
  ShieldCheck,
  Video
} from "lucide-react-native";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { colors, radii, shadows, spacing } from "../theme";
import {
  AnimatedPressable as MotionPressable,
  FadeUp,
  FloatingDust,
  PremiumMotionMedallion,
  PremiumOrbitRings,
  useReducedMotionFlag
} from "./Motion";

const categoryToneBackgrounds = {
  purple: "#F7F5FF",
  green: "#F3FAF5",
  gold: "#FFF7E7",
  blue: "#F3FAFF"
} as const;

export function Screen({
  children,
  scroll = true,
  contentStyle,
  bottomImage,
  centered
}: {
  children: ReactNode;
  scroll?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
  bottomImage?: ImageSourcePropType;
  centered?: boolean;
}) {
  const entrance = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    entrance.setValue(0);
    Animated.timing(entrance, {
      toValue: 1,
      duration: Platform.OS === "web" ? 210 : 340,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: Platform.OS !== "web"
    }).start();
  }, [entrance]);

  const translateY = entrance.interpolate({ inputRange: [0, 1], outputRange: [Platform.OS === "web" ? 6 : 10, 0] });
  const content = (
    <Animated.View style={[styles.content, centered && styles.centeredContent, contentStyle, { opacity: entrance, transform: [{ translateY }] }]}>
      {children}
    </Animated.View>
  );

  return (
    <View style={styles.screen}>
      <FloatingDust />
      <SubtleMandalaWatermark animated={Platform.OS !== "web"} size={240} top={-60} right={-90} opacity={0.16} />
      <SubtleMandalaWatermark size={250} bottom={-80} left={-100} opacity={0.10} />
      {bottomImage ? <ImageBackground source={bottomImage} resizeMode="cover" style={styles.bottomLake} imageStyle={styles.bottomLakeImage} /> : null}
      {scroll ? (
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={0}
          style={styles.keyboardAvoider}
        >
          <ScrollView
            automaticallyAdjustKeyboardInsets={Platform.OS === "ios"}
            keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scroll}
          >
            {content}
          </ScrollView>
        </KeyboardAvoidingView>
      ) : content}
    </View>
  );
}

export function LightScreen({ children }: { children: ReactNode }) {
  return <Screen>{children}</Screen>;
}

export function PlainScreen({ children }: { children: ReactNode }) {
  return <Screen scroll={false} centered>{children}</Screen>;
}

export function AppLogoHeader({ centered, compact, markOnly }: { centered?: boolean; compact?: boolean; markOnly?: boolean }) {
  const { width } = useWindowDimensions();
  const tight = Boolean(compact && !centered && width < 520);
  const logoSize = tight ? 44 : compact ? centered ? 70 : 64 : 92;

  return (
    <FadeUp delay={80} fromY={6} style={[styles.logoLockup, tight && styles.logoLockupTight, centered && styles.logoLockupCentered]}>
      <LogoSymbol size={markOnly ? 54 : logoSize} />
      {!markOnly ? (
        <View style={[centered && styles.logoTextCentered, !centered && styles.logoTextWrap]}>
          <Text numberOfLines={1} style={[styles.logoText, compact && styles.logoTextCompact, centered && styles.logoTextCenteredSize, tight && styles.logoTextTight]}>SACRED CIRCLE</Text>
        </View>
      ) : null}
    </FadeUp>
  );
}

export function LogoMark({ compact }: { compact?: boolean }) {
  return <AppLogoHeader compact={compact} />;
}

export function LogoSymbol({ size = 58 }: { size?: number }) {
  return <PremiumMotionMedallion size={size} />;
}

export function SubtleMandalaWatermark({
  size,
  top,
  right,
  bottom,
  left,
  opacity = 0.14,
  animated,
  style
}: {
  size: number;
  top?: number;
  right?: number;
  bottom?: number;
  left?: number;
  opacity?: number;
  animated?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const breath = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!animated) return;
    const motion = Animated.loop(
      Animated.sequence([
        Animated.timing(breath, {
          toValue: 1,
          duration: 3200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: Platform.OS !== "web"
        }),
        Animated.timing(breath, {
          toValue: 0,
          duration: 3200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: Platform.OS !== "web"
        })
      ])
    );
    motion.start();
    return () => motion.stop();
  }, [animated, breath]);

  const breatheOpacity = breath.interpolate({ inputRange: [0, 1], outputRange: [opacity * 0.55, opacity] });
  const scale = breath.interpolate({ inputRange: [0, 1], outputRange: [0.98, 1.025] });

  return (
    <Animated.View pointerEvents="none" style={[styles.mandala, { width: size, height: size, top, right, bottom, left, opacity }, animated && { opacity: breatheOpacity, transform: [{ scale }] }, style]}>
      <View style={styles.mandalaRingOuter} />
      <View style={styles.mandalaRingInner} />
      <View style={styles.mandalaAxisVertical} />
      <View style={styles.mandalaAxisHorizontal} />
    </Animated.View>
  );
}

export function OnboardingHeroImage({ source }: { source: ImageSourcePropType }) {
  return (
    <View style={styles.heroWrap}>
      <SubtleMandalaWatermark size={370} top={-38} left={-30} opacity={0.18} />
      <FadeUp delay={180} fromY={16}>
        <View style={styles.archFrame}>
          <Image source={source} resizeMode="cover" style={styles.archImage} />
          <PremiumOrbitRings size={106} style={styles.archMotionObject} />
        </View>
      </FadeUp>
    </View>
  );
}

export function PremiumCard({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[styles.card, style]}>
      <View pointerEvents="none" style={styles.cardIvoryHighlight} />
      <View pointerEvents="none" style={styles.cardGoldEdge} />
      {children}
    </View>
  );
}

export function AuthCard({ children }: { children: ReactNode }) {
  return <View style={styles.authCard}>{children}</View>;
}

export function PrimaryButton({
  label,
  onPress,
  disabled,
  icon,
  leftIcon,
  style,
  textStyle
}: {
  label: string;
  onPress?: () => void;
  disabled?: boolean;
  icon?: ReactNode;
  leftIcon?: ReactNode;
  style?: StyleProp<ViewStyle>;
  textStyle?: any;
}) {
  return (
    <MotionPressable onPress={onPress} disabled={disabled} style={[styles.primaryButton, style, disabled && styles.disabled]}>
      {leftIcon ? <View style={styles.buttonIconLeft}>{leftIcon}</View> : null}
      <Text numberOfLines={1} style={[styles.primaryButtonText, textStyle]}>{label}</Text>
      {icon ? <View style={styles.buttonIconRight}>{icon}</View> : null}
    </MotionPressable>
  );
}

export function SecondaryButton({
  label,
  onPress,
  disabled,
  icon,
  style,
  gold,
  textStyle
}: {
  label: string;
  onPress?: () => void;
  disabled?: boolean;
  icon?: ReactNode;
  style?: StyleProp<ViewStyle>;
  gold?: boolean;
  textStyle?: any;
}) {
  return (
    <MotionPressable onPress={onPress} disabled={disabled} style={[styles.secondaryButton, gold && styles.goldButton, style, disabled && styles.disabled]}>
      {icon}
      <Text numberOfLines={1} style={[styles.secondaryButtonText, gold && styles.goldButtonText, textStyle]}>{label}</Text>
    </MotionPressable>
  );
}

export function TextField({
  label,
  value,
  onChangeText,
  placeholder,
  icon,
  trailing,
  keyboardType,
  secureTextEntry,
  multiline
}: {
  label?: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  icon?: ReactNode;
  trailing?: ReactNode;
  keyboardType?: "default" | "email-address" | "phone-pad" | "number-pad";
  secureTextEntry?: boolean;
  multiline?: boolean;
}) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={[styles.inputShell, focused && styles.inputShellFocused, multiline && styles.inputShellMulti]}>
      {icon ? <View style={styles.inputIcon}>{icon}</View> : null}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder || label || ""}
        placeholderTextColor={colors.body}
        keyboardType={keyboardType}
        secureTextEntry={secureTextEntry}
        multiline={multiline}
        style={[styles.input, multiline && styles.inputMulti]}
      />
      {trailing ? <View style={styles.inputTrailing}>{trailing}</View> : null}
    </View>
  );
}

export function AppHeader({ title, subtitle, eyebrow }: { title: string; subtitle?: string; eyebrow?: string }) {
  return (
    <View style={styles.header}>
      {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
      <Text style={styles.heading}>{title}</Text>
      <View style={styles.headingRule} />
      {subtitle ? <Text style={styles.subheading}>{subtitle}</Text> : null}
    </View>
  );
}

export function StatusBadge({ label, tone = "gold", pulse }: { label: string; tone?: "gold" | "success" | "warning" | "danger"; pulse?: boolean }) {
  const opacity = useRef(new Animated.Value(1)).current;
  const reducedMotion = useReducedMotionFlag();

  useEffect(() => {
    if (!pulse || reducedMotion) return;
    const motion = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.58,
          duration: 1200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: Platform.OS !== "web"
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 1200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: Platform.OS !== "web"
        })
      ])
    );
    motion.start();
    return () => motion.stop();
  }, [opacity, pulse, reducedMotion]);

  return (
    <Animated.Text style={[styles.badge, tone === "success" && styles.badgeSuccess, tone === "warning" && styles.badgeWarning, tone === "danger" && styles.badgeDanger, pulse && { opacity }]}>
      {label}
    </Animated.Text>
  );
}

export function IconCircle({ children, size = 48, pale }: { children: ReactNode; size?: number; pale?: boolean }) {
  return <View style={[styles.iconCircle, pale && styles.iconCirclePale, { width: size, height: size, borderRadius: size / 2 }]}>{children}</View>;
}

export function SectionTitle({ title }: { title: string }) {
  return <Text style={styles.sectionTitle}>{title}</Text>;
}

export function BodyText({ children }: { children: ReactNode }) {
  return <Text style={styles.body}>{children}</Text>;
}

export function MetaText({ children }: { children: ReactNode }) {
  return <Text style={styles.meta}>{children}</Text>;
}

export function SessionCard({ onJoin, onRegister }: { onJoin?: () => void; onRegister?: () => void }) {
  const { width } = useWindowDimensions();
  const stackActions = width < 520;
  const compact = width < 520;

  return (
    <PremiumCard style={[styles.sessionCard, compact && styles.sessionCardCompact]}>
      <SubtleMandalaWatermark size={190} top={28} right={-58} opacity={0.08} />
      <StatusBadge label="UPCOMING" />
      <Text style={[styles.sessionTitle, compact && styles.sessionTitleCompact]}>Next Sacred Circle{compact ? "\nSession" : " Session"}</Text>
      <View style={[styles.sessionMetaRow, compact && styles.sessionMetaColumn]}>
        <View style={styles.metaItem}><CalendarDays color={colors.navy} size={compact ? 14 : 18} /><Text style={[styles.metaItemText, compact && styles.metaItemTextCompact]}>Date to be announced</Text></View>
        <View style={styles.metaItem}><Text style={[styles.clockGlyph, compact && styles.clockGlyphCompact]}>◷</Text><Text style={[styles.metaItemText, compact && styles.metaItemTextCompact]}>Time to be announced</Text></View>
        <View style={styles.metaItem}><Video color={colors.navy} size={compact ? 14 : 18} /><Text style={[styles.metaItemText, compact && styles.metaItemTextCompact]}>Details on schedule</Text></View>
      </View>
      {!compact ? <Text style={styles.sessionBody}>Confirmed session details are published by Sacred Circle when they are ready.</Text> : null}
      <View style={[styles.sessionActions, stackActions && styles.sessionActionsStack]}>
        <PrimaryButton label={compact ? "View Sessions →" : "View Sessions"} icon={compact ? undefined : <ArrowRight color="#FFFFFF" size={20} />} onPress={onJoin} style={[styles.flexButton, stackActions && styles.fullButton, compact && styles.compactCardButton]} textStyle={compact && styles.compactButtonText} />
        <SecondaryButton label="Register" onPress={onRegister} style={[styles.flexButtonSmall, stackActions && styles.fullButton, compact && styles.compactCardButton]} textStyle={compact && styles.compactButtonTextGold} />
      </View>
    </PremiumCard>
  );
}

export function SacredAccessKeyCard({ onUnlock }: { onUnlock?: () => void }) {
  const { width } = useWindowDimensions();
  const compact = width < 520;
  return (
    <PremiumCard style={[styles.keyCard, compact && styles.keyCardCompact]}>
      <SubtleMandalaWatermark size={170} top={10} right={-48} opacity={0.10} />
      <View style={[styles.keyHeader, compact && styles.keyHeaderCompact]}>
        {!compact ? <IconCircle size={44}><KeyRound color={colors.gold} size={25} strokeWidth={1.7} /></IconCircle> : null}
        <View style={styles.keyCopy}>
          <Text style={[styles.smallCardTitle, compact && styles.smallCardTitleCompact]}>Sacred Access Key</Text>
          <Text style={[styles.smallCardSubtitle, compact && styles.smallCardSubtitleCompact]}>{compact ? "Enter the key shared during the live Sunday session to unlock the recording." : "Unlock this session's protected healing recording"}</Text>
        </View>
      </View>
      <View style={[styles.keyBoxes, compact && styles.keyBoxesCompact]}>
        {Array.from({ length: 6 }, (_, item) => <View key={item} style={[styles.keyBox, compact && styles.keyBoxCompact, item === 5 && styles.keyBoxActive]}><Text style={[styles.keyDot, compact && styles.keyDotCompact]}>•</Text></View>)}
      </View>
      <SecondaryButton gold label="Open Recording" icon={compact ? undefined : <LockKeyhole color="#FFFFFF" size={18} />} onPress={onUnlock} style={compact && styles.compactGoldButton} textStyle={compact && styles.compactGoldButtonText} />
      <View style={[styles.cardFooterRow, compact && styles.cardFooterRowHidden]}>
        <CalendarDays color={colors.goldSoft} size={15} />
        <Text style={styles.cardFooterText}>Key shared during the live Sunday session</Text>
      </View>
    </PremiumCard>
  );
}

export function MiniAudioPlayer({ imageSource, onPlay }: { imageSource: ImageSourcePropType; onPlay?: () => void }) {
  const { width } = useWindowDimensions();
  const compact = width < 520;

  return (
    <PremiumCard style={[styles.audioCard, compact && styles.audioCardCompact]}>
      <View style={styles.audioHeader}>
        <Text style={[styles.smallCardTitle, compact && styles.smallCardTitleCompact]}>Audio Library</Text>
        <StatusBadge label="Awaiting upload" />
      </View>
      <View style={[styles.audioMain, compact && styles.audioMainCompact]}>
        <ImageBackground source={imageSource} imageStyle={styles.audioImageRadius} style={[styles.audioImage, compact && styles.audioImageCompact]}>
          <View style={[styles.audioImagePlay, compact && styles.audioImagePlayCompact]}><Headphones color={colors.gold} size={compact ? 18 : 22} /></View>
        </ImageBackground>
        <View style={styles.audioCopy}>
          <Text style={[styles.audioTitle, compact && styles.audioTitleCompact]}>No audio published</Text>
          <Text style={[styles.audioMeta, compact && styles.audioMetaCompact]}>Reviewed recordings will appear here.</Text>
        </View>
      </View>
      <Text style={[styles.audioMeta, compact && styles.audioMetaCompact]}>New meditations are added only after Sacred Circle reviews the source.</Text>
    </PremiumCard>
  );
}

export function CategoryCard({ title, subtitle, count, tone, icon, onPress }: { title: string; subtitle: string; count: string; tone: "purple" | "green" | "gold" | "blue"; icon: ReactNode; onPress?: () => void }) {
  const { width } = useWindowDimensions();
  const compact = width < 520;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.categoryCard, compact && styles.categoryCardCompact, { backgroundColor: categoryToneBackgrounds[tone] }, pressed && styles.pressed]}>
      {icon}
      <Text style={[styles.categoryTitle, compact && styles.categoryTitleCompact]}>{title}</Text>
      <Text style={[styles.categorySubtitle, compact && styles.categorySubtitleCompact]}>{subtitle}</Text>
      <View style={styles.categoryFooter}>
        <Text style={[styles.categoryCount, compact && styles.categoryCountCompact]}>{count}</Text>
        <ChevronRight color={colors.gold} size={compact ? 12 : 17} />
      </View>
    </Pressable>
  );
}

export function EventCard({ imageSource, onRegister }: { imageSource: ImageSourcePropType; onRegister?: () => void }) {
  const { width } = useWindowDimensions();
  const compact = width < 520;
  return (
    <PremiumCard style={[styles.eventCard, compact && styles.eventCardCompact]}>
      <View style={styles.eventHeader}>
        <Text style={[styles.smallCardTitle, compact && styles.smallCardTitleCompact]}>Upcoming Event</Text>
        <StatusBadge label="Details pending" />
      </View>
      <View style={[styles.eventBody, compact && styles.eventBodyCompact]}>
        <Image source={imageSource} style={[styles.eventImage, compact && styles.eventImageCompact]} />
        <View style={[styles.eventCopy, compact && styles.eventCopyCompact]}>
          <Text style={[styles.eventTitle, compact && styles.eventTitleCompact]}>Sacred Circle Event</Text>
          <Text style={[styles.eventLocation, compact && styles.eventLocationCompact]}>Date and location to be announced</Text>
          {!compact ? <View style={styles.metaItem}><CalendarDays color={colors.navy} size={16} /><Text style={styles.metaItemText}>Confirmed dates will be published here</Text></View> : null}
          <Text style={[styles.eventText, compact && styles.eventTextCompact]}>Sacred Circle will publish the programme details before registration opens.</Text>
          <SecondaryButton label={compact ? "View Events →" : "View Events"} icon={compact ? undefined : <ChevronRight color={colors.navy} size={18} />} onPress={onRegister} style={[styles.eventButton, compact && styles.eventButtonCompact]} textStyle={compact && styles.eventButtonTextCompact} />
        </View>
      </View>
    </PremiumCard>
  );
}

export function QuoteCard() {
  const { width } = useWindowDimensions();
  const compact = width < 520;
  return (
    <PremiumCard style={[styles.inspirationCard, compact && styles.inspirationCardCompact]}>
      <Text style={[styles.smallCardTitle, compact && styles.smallCardTitleCompact]}>Daily Inspiration</Text>
      <Text style={[styles.quoteText, compact && styles.quoteTextCompact]}>{compact ? "The mind is everything.\nWhat you think\nyou become." : "Peace begins within.\nWhen the mind is still,\nthe soul speaks."}</Text>
      <View style={[styles.quoteSourceRow, compact && styles.quoteSourceRowCompact]}><View style={styles.quoteRule} /><Text style={[styles.quoteSource, compact && styles.quoteSourceCompact]}>{compact ? "Buddha" : "Stay connected to your inner self."}</Text></View>
    </PremiumCard>
  );
}

export function CommunityCard({ onJoin }: { onJoin?: () => void }) {
  const { width } = useWindowDimensions();
  const compact = width < 520;
  return (
    <View style={[styles.communityCard, compact && styles.communityCardCompact]}>
      <View>
        <Text style={[styles.communityTitle, compact && styles.communityTitleCompact]}>{compact ? "Join Our WhatsApp\nCommunity" : "Join Our Community"}</Text>
        <Text style={[styles.communityText, compact && styles.communityTextCompact]}>{compact ? "Connect with fellow seekers on the path of inner awakening." : "Connect with fellow seekers\nin our WhatsApp group."}</Text>
        <Pressable onPress={onJoin} style={[styles.communityButton, compact && styles.communityButtonCompact]}><Text style={styles.communityButtonText}>Join Now →</Text></Pressable>
      </View>
      {!compact ? <IconCircle size={74} pale><MessageCircle color={colors.goldSoft} size={42} /></IconCircle> : null}
    </View>
  );
}

export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <PremiumCard>
      <Text style={styles.smallCardTitle}>{title}</Text>
      <Text style={styles.body}>{body}</Text>
    </PremiumCard>
  );
}

export function LoadingState({ label = "Opening Sacred Circle..." }: { label?: string }) {
  return (
    <Screen scroll={false} centered>
      <ActivityIndicator color={colors.gold} />
      <Text style={styles.loadingText}>{label}</Text>
    </Screen>
  );
}

export function AuthDivider() {
  return (
    <View style={styles.orRow}>
      <View style={styles.orLine} />
      <Text style={styles.orText}>OR</Text>
      <View style={styles.orLine} />
    </View>
  );
}

export const fieldIcons = {
  mail: <Mail color={colors.navy} size={26} strokeWidth={1.8} />,
  lock: <LockKeyhole color={colors.navy} size={26} strokeWidth={1.8} />,
  eye: <Eye color={colors.body} size={26} strokeWidth={1.8} />,
  shield: <ShieldCheck color={colors.body} size={24} strokeWidth={1.8} />,
  headphones: <Headphones color={colors.gold} size={26} strokeWidth={1.8} />
};

const styles = StyleSheet.create({
  keyboardAvoider: { flex: 1 },
  screen: { flex: 1, overflow: "hidden", backgroundColor: colors.background },
  scroll: { flexGrow: 1 },
  content: { width: "100%", maxWidth: 1032, alignSelf: "center", paddingHorizontal: spacing.lg, paddingTop: spacing.xl, paddingBottom: 124 },
  centeredContent: { flex: 1, alignItems: "center", justifyContent: "center" },
  bottomLake: { position: "absolute", left: 0, right: 0, bottom: 0, height: 280, opacity: 0.72 },
  bottomLakeImage: { opacity: 0.72 },
  mandala: { position: "absolute", alignItems: "center", justifyContent: "center" },
  mandalaRingOuter: { position: "absolute", width: "100%", height: "100%", borderRadius: 999, borderWidth: 1, borderColor: "rgba(201,147,50,0.18)" },
  mandalaRingInner: { position: "absolute", width: "58%", height: "58%", borderRadius: 999, borderWidth: 1, borderColor: "rgba(201,147,50,0.14)" },
  mandalaAxisVertical: { position: "absolute", width: 1, height: "78%", backgroundColor: "rgba(201,147,50,0.10)" },
  mandalaAxisHorizontal: { position: "absolute", width: "78%", height: 1, backgroundColor: "rgba(201,147,50,0.10)" },
  logoLockup: { minWidth: 0, flexDirection: "row", alignItems: "center", gap: 14 },
  logoLockupTight: { gap: 10 },
  logoLockupCentered: { justifyContent: "center", alignSelf: "center", flexDirection: "column", gap: 12 },
  logoMark: { overflow: "hidden", backgroundColor: colors.cardWarm, alignItems: "center", justifyContent: "center", ...shadows.soft },
  logoMarkCompact: { width: 70, height: 70, borderRadius: 35 },
  logoMarkTight: { width: 44, height: 44, borderRadius: 22 },
  logoImage: { width: "100%", height: "100%" },
  logoTextWrap: { minWidth: 0, flexShrink: 1 },
  logoTextCentered: { alignItems: "center" },
  logoText: { color: colors.navy, fontFamily: "Georgia", fontSize: 34, letterSpacing: 9, lineHeight: 39 },
  logoTextCompact: { fontSize: 23, letterSpacing: 5, lineHeight: 28 },
  logoTextCenteredSize: { fontSize: 22, letterSpacing: 1.4, lineHeight: 27, textAlign: "center" },
  logoTextTight: { fontSize: 12, letterSpacing: 2, lineHeight: 16 },
  logoSubtext: { color: colors.gold, fontSize: 21, letterSpacing: 10, lineHeight: 27 },
  logoSubtextCompact: { fontSize: 13, letterSpacing: 6, lineHeight: 19 },
  logoSubtextCenteredSize: { fontSize: 12, letterSpacing: 6, lineHeight: 16, textAlign: "center" },
  logoSubtextTight: { fontSize: 8, letterSpacing: 3, lineHeight: 12 },
  heroWrap: { alignItems: "center", justifyContent: "center", marginTop: 38, marginBottom: 16 },
  archFrame: { width: "100%", maxWidth: 292, aspectRatio: 0.72, overflow: "hidden", borderTopLeftRadius: 180, borderTopRightRadius: 180, borderBottomLeftRadius: 2, borderBottomRightRadius: 2, borderWidth: 1.5, borderColor: colors.goldBorder, backgroundColor: colors.cardWarm },
  archImage: { width: "100%", height: "100%" },
  archMotionObject: { position: "absolute", top: 34, alignSelf: "center" },
  card: { position: "relative", overflow: "hidden", borderRadius: radii.xl, borderWidth: 1, borderColor: colors.border, backgroundColor: "rgba(255,255,255,0.90)", padding: spacing.lg, ...shadows.card },
  cardIvoryHighlight: { position: "absolute", left: -24, right: -24, top: -48, height: 96, borderRadius: 60, backgroundColor: "rgba(255,253,248,0.72)" },
  cardGoldEdge: { position: "absolute", left: 16, right: 16, top: 0, height: 1, backgroundColor: "rgba(214,163,72,0.28)" },
  authCard: { position: "relative", overflow: "hidden", borderRadius: radii.xxl, borderWidth: 1, borderColor: colors.border, backgroundColor: "rgba(255,253,248,0.88)", ...shadows.card },
  primaryButton: { minHeight: 58, borderRadius: 18, backgroundColor: colors.navy, flexDirection: "row", alignItems: "center", justifyContent: "center", paddingHorizontal: spacing.lg, ...shadows.button },
  primaryButtonText: { color: "#FFFFFF", fontSize: 18, fontWeight: "800", textAlign: "center" },
  buttonIconLeft: { position: "absolute", left: 28 },
  buttonIconRight: { position: "absolute", right: 24 },
  secondaryButton: { minHeight: 56, borderRadius: 17, borderWidth: 1, borderColor: colors.goldBorder, backgroundColor: "rgba(255,253,248,0.78)", flexDirection: "row", gap: 12, alignItems: "center", justifyContent: "center", paddingHorizontal: spacing.lg },
  secondaryButtonText: { color: colors.gold, fontSize: 16, fontWeight: "800", textAlign: "center" },
  goldButton: { backgroundColor: colors.gold, borderColor: colors.gold, ...shadows.softGold },
  goldButtonText: { color: "#FFFFFF" },
  pressed: { opacity: 0.82, transform: [{ scale: 0.995 }] },
  disabled: { opacity: 0.42 },
  inputShell: { minHeight: 64, borderRadius: 19, borderWidth: 1, borderColor: colors.borderStrong, backgroundColor: "rgba(255,255,255,0.68)", flexDirection: "row", alignItems: "center", paddingHorizontal: 18, gap: 14, overflow: "hidden" },
  inputShellFocused: { borderColor: colors.goldBorder, shadowColor: "#C99332", shadowOpacity: 0.13, shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: 2 },
  inputShellMulti: { alignItems: "flex-start", paddingVertical: 14 },
  inputIcon: { width: 30, alignItems: "center" },
  inputTrailing: { width: 28, flexShrink: 0, alignItems: "center" },
  input: { flex: 1, minWidth: 0, minHeight: 54, color: colors.navy, fontSize: 20 },
  inputMulti: { minHeight: 110, textAlignVertical: "top" },
  header: { marginTop: 52, marginBottom: 26 },
  eyebrow: { color: colors.gold, fontSize: 13, fontWeight: "800", marginBottom: 8 },
  heading: { color: colors.navy, fontFamily: "Georgia", fontSize: 52, lineHeight: 60 },
  headingRule: { width: 58, height: 2, backgroundColor: colors.gold, marginTop: 14, marginBottom: 18 },
  subheading: { color: colors.bodyDark, fontSize: 17, lineHeight: 24, maxWidth: 430 },
  sectionTitle: { color: colors.navy, fontFamily: "Georgia", fontSize: 25, lineHeight: 31, marginBottom: 14 },
  body: { color: colors.body, fontSize: 16, lineHeight: 23 },
  meta: { color: colors.bodyDark, fontSize: 15, lineHeight: 22 },
  badge: { alignSelf: "flex-start", color: colors.warning, backgroundColor: colors.goldLight, borderRadius: radii.round, paddingHorizontal: 13, paddingVertical: 6, fontSize: 12, fontWeight: "800", overflow: "hidden" },
  badgeSuccess: { color: colors.success, backgroundColor: "rgba(47,128,101,0.12)" },
  badgeWarning: { color: colors.warning, backgroundColor: colors.goldLight },
  badgeDanger: { color: colors.danger, backgroundColor: "rgba(169,74,74,0.12)" },
  iconCircle: { alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.goldBorder, backgroundColor: "rgba(255,255,255,0.72)" },
  iconCirclePale: { backgroundColor: "rgba(255,255,255,0.08)", borderColor: "rgba(214,163,72,0.45)" },
  sessionCard: { flex: 1, minHeight: 320, padding: 30 },
  sessionCardCompact: { minHeight: 308, padding: 16, borderRadius: 18 },
  sessionTitle: { color: colors.navy, fontFamily: "Georgia", fontSize: 35, lineHeight: 42, marginTop: 18, marginBottom: 18 },
  sessionTitleCompact: { fontSize: 19, lineHeight: 25, marginTop: 16, marginBottom: 16 },
  sessionMetaRow: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 22, marginBottom: 20 },
  sessionMetaColumn: { flexDirection: "column", alignItems: "flex-start", gap: 10, marginBottom: 0 },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 8 },
  metaItemText: { color: colors.navy, fontSize: 16 },
  metaItemTextCompact: { fontSize: 12, lineHeight: 15 },
  clockGlyph: { color: colors.navy, fontSize: 23, lineHeight: 23 },
  clockGlyphCompact: { fontSize: 16, lineHeight: 16 },
  sessionBody: { color: colors.bodyDark, fontSize: 15, lineHeight: 23, maxWidth: 430 },
  sessionActions: { flexDirection: "row", gap: 18, marginTop: 26 },
  sessionActionsStack: { flexDirection: "column", gap: 9, marginTop: 18 },
  flexButton: { flex: 1 },
  flexButtonSmall: { flex: 0.65, minWidth: 116 },
  fullButton: { flex: 0, width: "100%" },
  compactCardButton: { minHeight: 40, borderRadius: 11, paddingHorizontal: 10 },
  compactButtonText: { fontSize: 12 },
  compactButtonTextGold: { fontSize: 12, color: colors.gold },
  keyCard: { flex: 1, minHeight: 300 },
  keyCardCompact: { minHeight: 174, padding: 12, borderRadius: 18 },
  keyHeader: { flexDirection: "row", alignItems: "center", gap: 16, marginBottom: 22 },
  keyHeaderCompact: { marginBottom: 8 },
  keyCopy: { flex: 1, minWidth: 0 },
  smallCardTitle: { color: colors.navy, fontFamily: "Georgia", fontSize: 25, lineHeight: 31 },
  smallCardTitleCompact: { fontSize: 14, lineHeight: 18, fontFamily: "System", fontWeight: "900" },
  smallCardSubtitle: { color: colors.bodyDark, fontSize: 15, lineHeight: 21, marginTop: 2 },
  smallCardSubtitleCompact: { fontSize: 10, lineHeight: 14, marginTop: 5 },
  keyBoxes: { flexDirection: "row", gap: 14, marginBottom: 24 },
  keyBoxesCompact: { gap: 8, marginBottom: 10 },
  keyBox: { flex: 1, minWidth: 0, height: 62, borderRadius: 10, borderWidth: 1, borderColor: colors.borderStrong, backgroundColor: "rgba(255,255,255,0.62)", alignItems: "center", justifyContent: "center" },
  keyBoxCompact: { height: 32, borderRadius: 8 },
  keyBoxActive: { borderColor: colors.goldBorder },
  keyDot: { color: colors.navy, fontSize: 24, lineHeight: 24 },
  keyDotCompact: { fontSize: 16, lineHeight: 16 },
  compactGoldButton: { minHeight: 38, borderRadius: 11, gap: 6, paddingHorizontal: 6 },
  compactGoldButtonText: { fontSize: 10.5 },
  cardFooterRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 18 },
  cardFooterRowHidden: { display: "none" },
  cardFooterText: { color: colors.body, fontSize: 14 },
  audioCard: { flex: 1, minHeight: 300 },
  audioCardCompact: { minHeight: 218, padding: 12, borderRadius: 18 },
  audioHeader: { flexDirection: "row", flexWrap: "wrap", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 14 },
  audioMain: { flexDirection: "row", alignItems: "center", gap: 20 },
  audioMainCompact: { flexDirection: "column", alignItems: "stretch", gap: 10 },
  audioImage: { width: 154, height: 108, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  audioImageCompact: { width: "100%", height: 58 },
  audioImageRadius: { borderRadius: 14 },
  audioImagePlay: { width: 48, height: 48, borderRadius: 24, backgroundColor: "rgba(255,255,255,0.82)", alignItems: "center", justifyContent: "center" },
  audioImagePlayCompact: { width: 32, height: 32, borderRadius: 16 },
  audioCopy: { flex: 1, minWidth: 0 },
  audioTitle: { color: colors.navy, fontFamily: "Georgia", fontSize: 25, lineHeight: 31 },
  audioTitleCompact: { fontFamily: "System", fontWeight: "900", fontSize: 12, lineHeight: 16 },
  audioMeta: { color: colors.body, fontSize: 14, marginTop: 8 },
  audioMetaCompact: { fontSize: 10, marginTop: 4 },
  audioProgress: { height: 5, borderRadius: 999, backgroundColor: "rgba(17,29,58,0.12)", marginTop: 24, marginBottom: 10 },
  audioProgressCompact: { height: 4, marginTop: 7, marginBottom: 0 },
  audioProgressFill: { width: "48%", height: "100%", backgroundColor: colors.gold },
  audioThumb: { position: "absolute", left: "47%", top: -4, width: 12, height: 12, borderRadius: 6, backgroundColor: colors.gold },
  audioTimes: { flexDirection: "row", justifyContent: "space-between" },
  audioTime: { color: colors.body, fontSize: 13 },
  audioControls: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 54, marginTop: -8 },
  audioControlsCompact: { gap: 18, marginTop: -4 },
  audioPlayButton: { width: 68, height: 68, borderRadius: 34, backgroundColor: colors.navy, alignItems: "center", justifyContent: "center", ...shadows.button },
  audioPlayButtonCompact: { width: 36, height: 36, borderRadius: 18 },
  categoryCard: { flex: 1, minWidth: 150, minHeight: 172, borderRadius: 20, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center", padding: 18, ...shadows.card },
  categoryCardCompact: { minWidth: 0, minHeight: 132, borderRadius: 14, padding: 8 },
  categoryTitle: { color: colors.navy, fontFamily: "Georgia", fontSize: 20, lineHeight: 25, marginTop: 10, textAlign: "center" },
  categoryTitleCompact: { fontFamily: "System", fontWeight: "900", fontSize: 11, lineHeight: 15, marginTop: 6 },
  categorySubtitle: { color: colors.body, fontSize: 13, marginTop: 4, textAlign: "center" },
  categorySubtitleCompact: { display: "none" },
  categoryFooter: { marginTop: 14, flexDirection: "row", alignItems: "center", gap: 8 },
  categoryCountCompact: { fontSize: 9 },
  categoryCount: { color: colors.bodyDark, fontSize: 13 },
  eventCard: { flex: 1.16 },
  eventCardCompact: { flex: 1, padding: 14, borderRadius: 18 },
  eventHeader: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 16 },
  eventBody: { flexDirection: "row", flexWrap: "wrap", gap: 24 },
  eventBodyCompact: { flexDirection: "column", gap: 12 },
  eventImage: { width: "100%", maxWidth: 230, height: 214, borderRadius: 14 },
  eventImageCompact: { maxWidth: "100%", height: 126, borderRadius: 12 },
  eventCopy: { flex: 1, minWidth: 210 },
  eventCopyCompact: { minWidth: 0 },
  eventTitle: { color: colors.navy, fontFamily: "Georgia", fontSize: 25, lineHeight: 31 },
  eventTitleCompact: { fontFamily: "System", fontWeight: "900", fontSize: 13, lineHeight: 17 },
  eventLocation: { color: colors.bodyDark, fontSize: 15, marginTop: 4, marginBottom: 12 },
  eventLocationCompact: { fontSize: 10, marginTop: 4, marginBottom: 0 },
  eventText: { color: colors.bodyDark, fontSize: 15, lineHeight: 23, marginTop: 15, marginBottom: 16 },
  eventTextCompact: { fontSize: 10, lineHeight: 15, marginTop: 8, marginBottom: 10 },
  eventButton: { alignSelf: "stretch", minHeight: 48 },
  eventButtonCompact: { minHeight: 38, alignSelf: "flex-start", borderRadius: 10, paddingHorizontal: 12 },
  eventButtonTextCompact: { fontSize: 11 },
  inspirationCard: { minHeight: 178 },
  inspirationCardCompact: { minHeight: 148, padding: 14, borderRadius: 18 },
  quoteText: { color: colors.navy, fontSize: 16, lineHeight: 24, marginTop: 14, maxWidth: 330 },
  quoteTextCompact: { fontSize: 10.5, lineHeight: 16, marginTop: 10 },
  quoteSourceRow: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 14, minHeight: 18 },
  quoteSourceRowCompact: { gap: 8, marginTop: 10 },
  quoteRule: { width: 38, height: 2, backgroundColor: colors.gold },
  quoteSource: { color: colors.body, fontSize: 12, lineHeight: 16, flexShrink: 1 },
  quoteSourceCompact: { fontSize: 10, lineHeight: 14 },
  communityCard: { flex: 1, minHeight: 118, borderRadius: 18, overflow: "hidden", backgroundColor: colors.navy, padding: 22, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  communityCardCompact: { minHeight: 174, padding: 16, alignItems: "flex-start" },
  communityTitle: { color: "#FFFFFF", fontFamily: "Georgia", fontSize: 20, lineHeight: 25 },
  communityTitleCompact: { fontSize: 13, lineHeight: 18 },
  communityText: { color: "rgba(255,255,255,0.82)", fontSize: 13, lineHeight: 18, marginTop: 6 },
  communityTextCompact: { fontSize: 10, lineHeight: 15, marginTop: 12 },
  communityButton: { alignSelf: "flex-start", marginTop: 12, borderRadius: 999, borderWidth: 1, borderColor: "rgba(255,255,255,0.32)", paddingHorizontal: 18, paddingVertical: 7 },
  communityButtonCompact: { marginTop: 16, paddingHorizontal: 12, paddingVertical: 7, backgroundColor: colors.gold, borderColor: colors.gold },
  communityButtonText: { color: "#FFFFFF", fontWeight: "800", fontSize: 12 },
  orRow: { flexDirection: "row", alignItems: "center", gap: 20 },
  orLine: { flex: 1, height: 1, backgroundColor: colors.border },
  orText: { color: colors.body, fontSize: 15, fontWeight: "700" },
  loadingText: { color: colors.navy, marginTop: 14, fontSize: 16 }
});

export const sacredStyles = styles;

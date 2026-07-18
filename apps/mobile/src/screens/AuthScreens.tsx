import { useEffect, useRef, useState, type ReactNode } from "react";
import { Animated, Image, ImageBackground, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { MotiView } from "moti";
import { ArrowRight, Flower2, Headphones, KeyRound, LockKeyhole, Mail, ShieldCheck } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Path } from "react-native-svg";
import {
  AppLogoHeader,
  LoadingState,
  OnboardingHeroImage,
  PrimaryButton,
  Screen
} from "../components/Sacred";
import { FadeUp } from "../components/Motion";
import { useAuth } from "../context/AuthContext";
import { colors } from "../theme";
import sanctuaryArch from "../assets/reference/sanctuary-arch-optimized.jpg";
import templeLake from "../assets/reference/temple-lake-sunrise-optimized.jpg";
import sacredLogo from "../assets/starter/sacred-flame-logo-optimized.png";

const disclaimer = "Sacred Circle is a wellness and meditation app.\nIt does not replace professional medical advice or treatment.";

export function SplashScreenView() {
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fade, { toValue: 1, duration: 650, useNativeDriver: Platform.OS !== "web" }).start();
  }, [fade]);

  return (
    <Screen scroll={false} centered>
      <Animated.View style={[local.splash, { opacity: fade }]}>
        <AppLogoHeader centered compact />
      </Animated.View>
    </Screen>
  );
}

const slides = [
  {
    title: "Enter Your\nSacred Space",
    body: "A calm sanctuary for meditation, healing,\nspiritual wisdom, and inner peace."
  },
  {
    title: "Join Sunday\nSessions",
    body: "Meet online through Zoom every Sunday for\nmeditation, healing, and shared wisdom."
  },
  {
    title: "Unlock Session\nRecordings",
    body: "Enter the Sacred Access Key shared live to\nunlock that session's healing audio."
  }
];

export function OnboardingScreen({ navigation }: any) {
  const [index, setIndex] = useState(0);
  const slide = slides[index];

  function next() {
    if (index === slides.length - 1) navigation.navigate("Auth");
    else setIndex(index + 1);
  }

  return (
    <Screen contentStyle={local.onboardingContent}>
      <AppLogoHeader centered compact />
      <OnboardingHeroImage source={sanctuaryArch} />
      <FadeUp delay={260} style={local.centeredBlock}>
        <GoldDivider />
        <Text style={local.onboardingTitle}>{slide.title}</Text>
        <Text style={local.onboardingBody}>{slide.body}</Text>
      </FadeUp>
      <View style={local.dots}>{slides.map((_, dot) => (
        <MotiView
          key={dot}
          animate={{
            scale: dot === index ? 1.18 : 1,
            opacity: dot === index ? 1 : 0.34,
            backgroundColor: dot === index ? colors.gold : "rgba(17,29,58,0.14)"
          }}
          transition={{ type: "timing", duration: 260 }}
          style={local.dot}
        />
      ))}</View>
      <Text style={local.stepText}>{index + 1} of {slides.length}</Text>
      <PrimaryButton label={index === slides.length - 1 ? "Begin" : "Continue"} icon={<ArrowRight color="#FFFFFF" size={18} />} onPress={next} style={local.onboardingButton} />
      <Pressable onPress={() => navigation.navigate("Auth")} style={local.skipButton}>
        <Text style={local.skipText}>Skip</Text>
      </Pressable>
      <View style={local.disclaimerRow}>
        <ShieldCheck color={colors.goldSoft} size={18} />
        <Text style={local.disclaimer}>{disclaimer}</Text>
      </View>
    </Screen>
  );
}

export function AuthScreen() {
  const { signInWithEmail, signInWithGoogle, authNotice, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [showEmailEntry, setShowEmailEntry] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  if (loading) return <LoadingState />;

  async function emailOtpLogin() {
    setError("");
    if (!showEmailEntry) {
      setShowEmailEntry(true);
      return;
    }
    if (!email.trim()) {
      setError("Enter your email address to receive the OTP link.");
      return;
    }
    setBusy(true);
    try {
      await signInWithEmail({ email });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to send login email right now.");
    } finally {
      setBusy(false);
    }
  }

  async function googleSignIn() {
    setError("");
    setBusy(true);
    try {
      await signInWithGoogle();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to continue with Google right now.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={local.authScene}>
      <ImageBackground source={templeLake} resizeMode="cover" style={local.authBackdrop} imageStyle={local.authBackdropImage}>
        <LinearGradient
          colors={["rgba(255,249,240,0.90)", "rgba(255,249,240,0.52)", "rgba(255,249,240,0.80)", "rgba(255,249,240,0.96)"]}
          locations={[0, 0.28, 0.56, 1]}
          style={StyleSheet.absoluteFill}
        />
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={local.authScroll}>
          <FadeUp delay={80} style={local.referenceBrand}>
            <View style={local.referenceLogoShell}>
              <Image source={sacredLogo} resizeMode="cover" style={local.referenceLogo} />
            </View>
            <Text style={local.referenceBrandTitle}>Sacred Circle</Text>
            <AuthLotusDivider />
            <Text style={local.referenceTagline}>Heal. Meditate. Transform.</Text>
          </FadeUp>

          <FadeUp delay={180} style={local.referenceCard}>
            <Text style={local.referenceWelcome}>Welcome back <Text style={local.referenceHeart}>♥</Text></Text>
            <Text style={local.referenceSubtitle}>Sign in to continue your healing journey</Text>

            <AuthActionButton
              label="Continue with Google"
              icon={<GoogleMark />}
              onPress={googleSignIn}
              disabled={busy}
              filled
            />

            <View style={local.referenceOrRow}>
              <View style={local.referenceOrLine} />
              <Text style={local.referenceOrText}>OR</Text>
              <View style={local.referenceOrLine} />
            </View>

            {showEmailEntry ? (
              <View style={local.referenceEmailField}>
                <Mail color={colors.gold} size={25} strokeWidth={1.8} />
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Email address"
                  placeholderTextColor={colors.body}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  style={local.referenceEmailInput}
                />
              </View>
            ) : null}

            <AuthActionButton
              label={showEmailEntry ? "Send Email OTP" : "Continue with Email OTP"}
              icon={<Mail color={colors.gold} size={30} strokeWidth={1.8} />}
              onPress={emailOtpLogin}
              disabled={busy}
              outline
            />

            {error ? <Text style={local.referenceError}>{error}</Text> : null}
            {authNotice ? <Text style={local.referenceNotice}>{authNotice}</Text> : null}

            <View style={local.referencePrivacy}>
              <View style={local.referenceShield}>
                <ShieldCheck color={colors.gold} size={34} strokeWidth={1.6} />
              </View>
              <View style={local.referencePrivacyCopy}>
                <Text style={local.referencePrivacyTitle}>Your privacy is our priority</Text>
                <Text style={local.referencePrivacyText}>We never share your information. All data is encrypted and secure.</Text>
              </View>
            </View>

            <Pressable onPress={emailOtpLogin} style={local.referenceCreate}>
              <Text style={local.referenceCreateText}>New to Sacred Circle? <Text style={local.referenceCreateGold}>Create account</Text></Text>
            </Pressable>

          </FadeUp>

          <FadeUp delay={260} style={local.referenceFeatureRow}>
            <AuthFeature icon={<Flower2 color={colors.gold} size={34} strokeWidth={1.6} />} title="Sacred Sessions" body="Live healing & meditation sessions" />
            <View style={local.referenceFeatureDivider} />
            <AuthFeature icon={<Headphones color={colors.gold} size={34} strokeWidth={1.6} />} title="Guided Meditations" body="Audio library for mind, body & soul" />
            <View style={local.referenceFeatureDivider} />
            <AuthFeature icon={<KeyRound color={colors.gold} size={34} strokeWidth={1.6} />} title="Sacred Access" body="Protected content with Sacred Access Key" />
          </FadeUp>

          <View style={local.referenceTerms}>
            <LockKeyhole color={colors.gold} size={18} strokeWidth={1.8} />
            <Text style={local.referenceTermsText}>By continuing, you agree to our <Text style={local.referenceCreateGold}>Terms of Service</Text> and <Text style={local.referenceCreateGold}>Privacy Policy</Text>.</Text>
          </View>
        </ScrollView>
      </ImageBackground>
    </View>
  );
}

export function ProfileSetupScreen() {
  const { profile, updateProfile } = useAuth();
  const [name, setName] = useState(profile?.name || "");
  const [phone, setPhone] = useState(profile?.phone || "");
  const [city, setCity] = useState(profile?.city || "");
  const [state, setState] = useState(profile?.state || "");
  const [dateOfBirth, setDateOfBirth] = useState(profile?.date_of_birth || "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setName(profile?.name || "");
    setPhone(profile?.phone || "");
    setCity(profile?.city || "");
    setState(profile?.state || "");
    setDateOfBirth(profile?.date_of_birth || "");
  }, [profile]);

  async function saveDetails() {
    const validationError = validateProfileSetup({ name, phone, city, state, dateOfBirth });
    if (validationError) {
      setError(validationError);
      return;
    }
    setBusy(true);
    setError("");
    try {
      await updateProfile({
        name: name.trim(),
        phone: phone.trim(),
        city: city.trim(),
        state: state.trim(),
        date_of_birth: dateOfBirth.trim()
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save your profile right now.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={local.authScene}>
      <ImageBackground source={templeLake} resizeMode="cover" style={local.authBackdrop} imageStyle={local.authBackdropImage}>
        <LinearGradient
          colors={["rgba(255,249,240,0.92)", "rgba(255,249,240,0.62)", "rgba(255,249,240,0.92)"]}
          locations={[0, 0.5, 1]}
          style={StyleSheet.absoluteFill}
        />
        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={local.profileSetupScroll}>
          <FadeUp delay={80} style={local.referenceBrand}>
            <View style={local.referenceLogoShell}>
              <Image source={sacredLogo} resizeMode="cover" style={local.referenceLogo} />
            </View>
            <Text style={local.profileSetupTitle}>Complete Your Profile</Text>
            <Text style={local.profileSetupSubtitle}>These details help Sacred Circle manage sessions and member support.</Text>
          </FadeUp>

          <FadeUp delay={160} style={local.profileSetupCard}>
            <ProfileSetupField label="Full name" value={name} onChangeText={setName} placeholder="Enter your full name" />
            <ProfileSetupField label="Mobile number" value={phone} onChangeText={setPhone} placeholder="10 digit mobile number" keyboardType="phone-pad" />
            <ProfileSetupField label="City" value={city} onChangeText={setCity} placeholder="Enter your city" />
            <ProfileSetupField label="State" value={state} onChangeText={setState} placeholder="Enter your state" />
            <ProfileSetupField label="Date of birth" value={dateOfBirth} onChangeText={setDateOfBirth} placeholder="YYYY-MM-DD" keyboardType="numbers-and-punctuation" />
            {error ? <Text style={local.referenceError}>{error}</Text> : null}
            <AuthActionButton
              label={busy ? "Saving..." : "Save and Continue"}
              icon={<ArrowRight color={colors.gold} size={28} />}
              onPress={saveDetails}
              disabled={busy}
              outline
            />
          </FadeUp>
        </ScrollView>
      </ImageBackground>
    </View>
  );
}

function validateProfileSetup(input: { name: string; phone: string; city: string; state: string; dateOfBirth: string }) {
  const name = input.name.trim();
  if (name.length < 2) return "Please enter your full name.";
  const phoneDigits = input.phone.replace(/\D/g, "");
  if (phoneDigits.length < 10 || phoneDigits.length > 15) return "Please enter a valid mobile number.";
  if (input.city.trim().length < 2) return "Please enter your city.";
  if (input.state.trim().length < 2) return "Please enter your state.";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.dateOfBirth.trim())) return "Please enter your date of birth as YYYY-MM-DD.";
  const birthDate = new Date(`${input.dateOfBirth.trim()}T00:00:00`);
  const earliest = new Date();
  earliest.setFullYear(earliest.getFullYear() - 120);
  if (Number.isNaN(birthDate.getTime())) return "Please enter a valid date of birth.";
  if (birthDate > new Date()) return "Date of birth cannot be in the future.";
  if (birthDate < earliest) return "Please enter a valid date of birth.";
  return "";
}

function ProfileSetupField({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = "default"
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  keyboardType?: "default" | "phone-pad" | "numbers-and-punctuation";
}) {
  return (
    <View style={local.profileSetupField}>
      <Text style={local.profileSetupLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.body}
        keyboardType={keyboardType}
        autoCapitalize={label === "Mobile number" || label === "Date of birth" ? "none" : "words"}
        style={local.profileSetupInput}
      />
    </View>
  );
}

function AuthLotusDivider() {
  return (
    <View style={local.referenceDivider}>
      <View style={local.referenceDividerLine} />
      <Flower2 color={colors.gold} size={27} strokeWidth={1.35} />
      <View style={local.referenceDividerLine} />
    </View>
  );
}

function GoogleMark() {
  return (
    <Svg width={28} height={28} viewBox="0 0 48 48">
      <Path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.1 6.1 29.3 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.3-.1-2.6-.4-3.9z" />
      <Path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.1 6.1 29.3 4 24 4 16.3 4 9.6 8.3 6.3 14.7z" />
      <Path fill="#4CAF50" d="M24 44c5.2 0 10-2 13.5-5.2l-6.2-5.2C29.3 35.1 26.8 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.5 16.2 44 24 44z" />
      <Path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.3-2.2 4.2-4 5.6l6.2 5.2C37.1 39.1 44 34 44 24c0-1.3-.1-2.6-.4-3.9z" />
    </Svg>
  );
}

function AuthActionButton({
  label,
  icon,
  onPress,
  disabled,
  filled,
  outline
}: {
  label: string;
  icon: ReactNode;
  onPress: () => void;
  disabled?: boolean;
  filled?: boolean;
  outline?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        local.referenceAction,
        filled && local.referenceActionFilled,
        outline && local.referenceActionOutline,
        pressed && local.referenceActionPressed,
        disabled && local.referenceActionDisabled
      ]}
    >
      <View style={local.referenceActionIcon}>{icon}</View>
      <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.86} style={local.referenceActionText}>
        {disabled ? "Please wait..." : label}
      </Text>
    </Pressable>
  );
}

function AuthFeature({ icon, title, body }: { icon: ReactNode; title: string; body: string }) {
  return (
    <View style={local.referenceFeature}>
      <View style={local.referenceFeatureIcon}>{icon}</View>
      <Text style={local.referenceFeatureTitle}>{title}</Text>
      <Text style={local.referenceFeatureBody}>{body}</Text>
    </View>
  );
}

function GoldDivider() {
  return (
    <View style={local.goldDivider}>
      <View style={local.dividerLine} />
      <View style={local.dividerDiamond} />
      <View style={local.dividerLine} />
    </View>
  );
}

const local = StyleSheet.create({
  splash: { alignItems: "center" },
  authScene: { flex: 1, width: "100%", maxWidth: "100%", overflow: "hidden", backgroundColor: "#FFF9F0" },
  authBackdrop: { flex: 1, width: "100%", maxWidth: "100%", overflow: "hidden" },
  authBackdropImage: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0, width: "100%", height: "100%", opacity: 1 },
  authScroll: { flexGrow: 1, alignItems: "center", paddingHorizontal: 28, paddingTop: 54, paddingBottom: 30 },
  referenceBrand: { width: "100%", alignItems: "center", marginBottom: 22 },
  referenceLogoShell: { width: 112, height: 112, borderRadius: 56, overflow: "hidden", alignItems: "center", justifyContent: "center", backgroundColor: "#FFF8EA", borderWidth: 1, borderColor: "rgba(201,147,50,0.22)", shadowColor: "#C99332", shadowOpacity: 0.14, shadowRadius: 18, shadowOffset: { width: 0, height: 8 }, elevation: 5, marginBottom: 8 },
  referenceLogo: { width: 112, height: 112 },
  referenceBrandTitle: { color: colors.navy, fontFamily: "Georgia", fontSize: 43, lineHeight: 51, textAlign: "center" },
  referenceDivider: { flexDirection: "row", alignItems: "center", gap: 18, marginTop: 9, marginBottom: 10 },
  referenceDividerLine: { width: 78, height: 1.4, borderRadius: 999, backgroundColor: colors.gold },
  referenceTagline: { color: colors.warning, fontSize: 21, lineHeight: 28, textAlign: "center" },
  referenceCard: { width: "100%", maxWidth: 370, borderRadius: 34, borderWidth: 1, borderColor: "rgba(201,147,50,0.16)", backgroundColor: "rgba(255,253,248,0.94)", paddingHorizontal: 24, paddingTop: 30, paddingBottom: 24, shadowColor: "#1C1812", shadowOpacity: 0.10, shadowRadius: 28, shadowOffset: { width: 0, height: 18 }, elevation: 12 },
  referenceWelcome: { color: colors.navy, fontFamily: "Georgia", fontSize: 36, lineHeight: 43, textAlign: "center" },
  referenceHeart: { color: colors.gold, fontSize: 31 },
  referenceSubtitle: { color: colors.bodyDark, fontSize: 18, lineHeight: 25, textAlign: "center", marginTop: 8, marginBottom: 26 },
  referenceAction: { minHeight: 64, borderRadius: 16, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, paddingHorizontal: 12, marginBottom: 14 },
  referenceActionFilled: { backgroundColor: "#FFFFFF", shadowColor: "#1C1812", shadowOpacity: 0.06, shadowRadius: 18, shadowOffset: { width: 0, height: 9 }, elevation: 4 },
  referenceActionOutline: { borderWidth: 1.5, borderColor: colors.gold, backgroundColor: "rgba(255,253,248,0.58)" },
  referenceActionPressed: { transform: [{ scale: 0.985 }], opacity: 0.86 },
  referenceActionDisabled: { opacity: 0.62 },
  referenceActionIcon: { width: 30, alignItems: "center", justifyContent: "center" },
  referenceActionText: { flexShrink: 1, color: colors.navy, fontSize: 16.5, lineHeight: 22, fontWeight: "900", textAlign: "center" },
  referenceOrRow: { flexDirection: "row", alignItems: "center", gap: 18, marginVertical: 16 },
  referenceOrLine: { flex: 1, height: 1, backgroundColor: "rgba(201,147,50,0.46)" },
  referenceOrText: { color: colors.warning, fontSize: 18, fontWeight: "900" },
  referenceEmailField: { minHeight: 58, borderRadius: 16, borderWidth: 1, borderColor: "rgba(201,147,50,0.36)", backgroundColor: "rgba(255,255,255,0.86)", flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, marginBottom: 14 },
  referenceEmailInput: { flex: 1, minWidth: 0, color: colors.navy, fontSize: 18, minHeight: 50 },
  referenceError: { color: colors.danger, fontSize: 14, lineHeight: 20, fontWeight: "800", textAlign: "center", marginTop: 2, marginBottom: 10 },
  referenceNotice: { color: colors.success, fontSize: 14, lineHeight: 21, fontWeight: "800", textAlign: "center", marginTop: 2, marginBottom: 10 },
  referencePrivacy: { minHeight: 116, borderRadius: 18, backgroundColor: "rgba(246,231,198,0.34)", flexDirection: "row", alignItems: "center", gap: 18, paddingHorizontal: 20, paddingVertical: 18, marginTop: 20 },
  referenceShield: { width: 52, alignItems: "center" },
  referencePrivacyCopy: { flex: 1, minWidth: 0 },
  referencePrivacyTitle: { color: colors.navy, fontSize: 19, lineHeight: 24, fontWeight: "900", marginBottom: 4 },
  referencePrivacyText: { color: colors.bodyDark, fontSize: 17, lineHeight: 24 },
  referenceCreate: { alignItems: "center", paddingTop: 24, paddingBottom: 4 },
  referenceCreateText: { color: colors.bodyDark, fontSize: 17, textAlign: "center" },
  referenceCreateGold: { color: colors.warning, fontWeight: "900" },
  referenceDemoLink: { alignSelf: "center", paddingHorizontal: 14, paddingVertical: 9, borderRadius: 999, backgroundColor: "rgba(201,147,50,0.10)" },
  referenceDemoText: { color: colors.warning, fontSize: 13, fontWeight: "900" },
  referenceFeatureRow: { width: "100%", maxWidth: 370, flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", marginTop: 28 },
  referenceFeature: { flex: 1, alignItems: "center", paddingHorizontal: 5 },
  referenceFeatureIcon: { width: 70, height: 70, borderRadius: 35, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(246,231,198,0.58)", marginBottom: 10 },
  referenceFeatureTitle: { color: colors.navy, fontFamily: "Georgia", fontSize: 17, lineHeight: 21, textAlign: "center", minHeight: 42 },
  referenceFeatureBody: { color: colors.bodyDark, fontSize: 13.5, lineHeight: 20, textAlign: "center" },
  referenceFeatureDivider: { width: 1, height: 92, backgroundColor: "rgba(201,147,50,0.18)", marginTop: 18 },
  referenceTerms: { width: "100%", maxWidth: 360, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 12, marginTop: 28 },
  referenceTermsText: { flex: 1, color: colors.bodyDark, fontSize: 13.5, lineHeight: 20, textAlign: "center" },
  profileSetupScroll: { flexGrow: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 28, paddingTop: 48, paddingBottom: 36 },
  profileSetupTitle: { color: colors.navy, fontFamily: "Georgia", fontSize: 34, lineHeight: 41, textAlign: "center", marginTop: 8 },
  profileSetupSubtitle: { color: colors.bodyDark, fontSize: 15, lineHeight: 22, textAlign: "center", marginTop: 9, maxWidth: 330 },
  profileSetupCard: { width: "100%", maxWidth: 390, borderRadius: 28, borderWidth: 1, borderColor: "rgba(201,147,50,0.18)", backgroundColor: "rgba(255,253,248,0.95)", padding: 20, gap: 13, shadowColor: "#1C1812", shadowOpacity: 0.10, shadowRadius: 28, shadowOffset: { width: 0, height: 18 }, elevation: 12 },
  profileSetupField: { gap: 7 },
  profileSetupLabel: { color: colors.navy, fontSize: 13, fontWeight: "900" },
  profileSetupInput: { minHeight: 52, borderRadius: 15, borderWidth: 1, borderColor: "rgba(201,147,50,0.22)", backgroundColor: "#FFFFFF", color: colors.navy, fontSize: 16, paddingHorizontal: 15 },
  onboardingContent: { alignItems: "center", paddingTop: 64, paddingBottom: 34 },
  centeredBlock: { alignItems: "center", width: "100%" },
  onboardingTitle: { color: colors.navy, fontFamily: "Georgia", fontSize: 38, lineHeight: 45, textAlign: "center", marginTop: 12 },
  goldDivider: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 24, marginBottom: 20 },
  dividerLine: { width: 74, height: 1.5, backgroundColor: colors.gold },
  dividerDiamond: { width: 10, height: 10, backgroundColor: colors.goldSoft, transform: [{ rotate: "45deg" }] },
  onboardingBody: { color: colors.bodyDark, fontSize: 16, lineHeight: 25, textAlign: "center", marginTop: 24, maxWidth: 290 },
  dots: { flexDirection: "row", gap: 14, marginTop: 34, marginBottom: 18 },
  dot: { width: 12, height: 12, borderRadius: 6, backgroundColor: "rgba(17,29,58,0.13)" },
  dotActive: { backgroundColor: colors.gold },
  stepText: { color: colors.bodyDark, fontSize: 15, marginBottom: 34 },
  onboardingButton: { width: "100%", maxWidth: 284, minHeight: 58, borderRadius: 18 },
  skipButton: { paddingVertical: 22 },
  skipText: { color: colors.navy, fontSize: 17, fontWeight: "800" },
  disclaimerRow: { flexDirection: "row", alignItems: "flex-start", gap: 8, marginTop: 28, maxWidth: 300 },
  disclaimer: { color: colors.body, fontSize: 11, lineHeight: 18, textAlign: "left", flex: 1 },
  authContent: { paddingTop: 60, paddingBottom: 108, alignItems: "center" },
  authContentSignup: { paddingTop: 46 },
  authWelcome: { alignItems: "center", marginTop: 42, marginBottom: 24, zIndex: 2 },
  authForm: { width: "100%", maxWidth: 332, zIndex: 2 },
  authPanel: { width: "100%", gap: 15, borderRadius: 28, borderWidth: 1, borderColor: colors.border, backgroundColor: "rgba(255,253,248,0.96)", padding: 14, shadowColor: "#1C1812", shadowOpacity: 0.06, shadowRadius: 20, shadowOffset: { width: 0, height: 12 }, elevation: 8 },
  authTabs: { height: 58, flexDirection: "row", borderWidth: 1, borderColor: colors.border, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.62)", overflow: "hidden" },
  authTab: { flex: 1, alignItems: "center", justifyContent: "center" },
  tabText: { color: colors.navy, fontSize: 14, fontWeight: "600" },
  tabTextActive: { color: colors.navy },
  tabUnderline: { position: "absolute", bottom: 0, width: 64, height: 2, borderRadius: 999, backgroundColor: colors.navy },
  tabDivider: { width: 1, height: 34, alignSelf: "center", backgroundColor: colors.border },
  authTitle: { color: colors.navy, fontFamily: "Georgia", fontSize: 31, lineHeight: 38, textAlign: "center" },
  authSubtitle: { color: colors.bodyDark, fontSize: 14, lineHeight: 22, textAlign: "center", marginTop: 12 },
  forgotButton: { alignSelf: "flex-end", paddingVertical: 2 },
  forgotText: { alignSelf: "flex-end", color: colors.warning, textDecorationLine: "underline", fontSize: 12, marginTop: -2 },
  error: { color: colors.danger, fontWeight: "800", lineHeight: 21 },
  notice: { color: colors.success, fontWeight: "800", lineHeight: 22, textAlign: "center" },
  demoButton: { marginTop: -1 },
  googleButton: { borderColor: "rgba(17,29,58,0.16)", backgroundColor: "#FFFFFF" },
  googleButtonText: { color: colors.navy },
  googleIcon: { color: colors.gold, fontSize: 18, fontWeight: "900" },
  otpButton: { marginTop: -2 },
  privacyPill: { minHeight: 64, borderRadius: 17, backgroundColor: "rgba(246,231,198,0.18)", borderWidth: 1, borderColor: colors.border, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 12, paddingHorizontal: 16 },
  privacyText: { color: colors.bodyDark, fontSize: 13, textAlign: "center", flex: 1 },
  switchMode: { alignItems: "center", marginTop: 18 },
  switchText: { color: colors.bodyDark, fontSize: 14 },
  switchGold: { color: colors.warning, fontWeight: "800" }
});

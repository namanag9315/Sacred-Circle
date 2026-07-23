import { createElement, useEffect, useRef, useState, type ReactNode } from "react";
import DateTimePicker, { type DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { Animated, Image, ImageBackground, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { ArrowRight, CalendarDays, Flower2, Headphones, KeyRound, LockKeyhole, Mail, ShieldCheck } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as Linking from "expo-linking";
import Svg, { Path } from "react-native-svg";
import {
  AppLogoHeader,
  LoadingState,
  Screen
} from "../components/Sacred";
import { FadeUp } from "../components/Motion";
import { useAuth } from "../context/AuthContext";
import { colors } from "../theme";
import templeLake from "../assets/reference/temple-lake-sunrise-optimized.jpg";
import sacredLogo from "../assets/starter/sacred-flame-logo-optimized.png";

const PUBLIC_LEGAL_BASE_URL = "https://sacred-circle-app.vercel.app";

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
                <Text style={local.referencePrivacyText}>We use your information only to provide and protect Sacred Circle services. Review our Privacy Policy for details.</Text>
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
            <Text style={local.referenceTermsText}>By continuing, you agree to our <Text accessibilityRole="link" onPress={() => void Linking.openURL(`${PUBLIC_LEGAL_BASE_URL}/terms-of-use`)} style={local.referenceCreateGold}>Terms of Use</Text> and acknowledge our <Text accessibilityRole="link" onPress={() => void Linking.openURL(`${PUBLIC_LEGAL_BASE_URL}/privacy-policy`)} style={local.referenceCreateGold}>Privacy Policy</Text>.</Text>
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
            <ProfileSetupField label="Full name" value={name} onChangeText={setName} placeholder="Enter your full name" required />
            <DateOfBirthField value={dateOfBirth} onChangeText={setDateOfBirth} />
            <ProfileSetupField label="City" value={city} onChangeText={setCity} placeholder="Enter your city" required />
            <ProfileSetupField label="State" value={state} onChangeText={setState} placeholder="Enter your state" required />
            <ProfileSetupField label="Mobile number" value={phone} onChangeText={setPhone} placeholder="Enter mobile number" keyboardType="phone-pad" optional />
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
  if (phoneDigits && (phoneDigits.length < 10 || phoneDigits.length > 15)) return "Please enter a valid mobile number or leave it blank.";
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
  keyboardType = "default",
  required = false,
  optional = false
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  keyboardType?: "default" | "phone-pad";
  required?: boolean;
  optional?: boolean;
}) {
  return (
    <View style={local.profileSetupField}>
      <Text style={local.profileSetupLabel}>{label}{required ? " *" : optional ? " (optional)" : ""}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.body}
        keyboardType={keyboardType}
        autoCapitalize={label === "Mobile number" ? "none" : "words"}
        style={local.profileSetupInput}
      />
    </View>
  );
}

function DateOfBirthField({ value, onChangeText }: { value: string; onChangeText: (value: string) => void }) {
  const [showPicker, setShowPicker] = useState(false);
  const today = startOfToday();
  const earliest = new Date(today.getFullYear() - 120, today.getMonth(), today.getDate());
  const selectedDate = parseDateOnly(value) || new Date(today.getFullYear() - 30, today.getMonth(), today.getDate());

  if (Platform.OS === "web") {
    return (
      <View style={local.profileSetupField}>
        <Text style={local.profileSetupLabel}>Date of birth *</Text>
        <View style={local.profileDateWebShell}>
          {createElement("input", {
            type: "date",
            value,
            min: formatDateOnly(earliest),
            max: formatDateOnly(today),
            required: true,
            "aria-label": "Date of birth",
            onChange: (event: any) => onChangeText(event.currentTarget.value),
            style: webDateInputStyle
          } as any)}
          <CalendarDays color={colors.gold} size={20} />
        </View>
      </View>
    );
  }

  function selectDate(event: DateTimePickerEvent, date?: Date) {
    if (Platform.OS === "android") setShowPicker(false);
    if (event.type === "set" && date) onChangeText(formatDateOnly(date));
  }

  return (
    <View style={local.profileSetupField}>
      <Text style={local.profileSetupLabel}>Date of birth *</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Select date of birth"
        onPress={() => setShowPicker(true)}
        style={({ pressed }) => [local.profileDateButton, pressed && local.profileDateButtonPressed]}
      >
        <Text style={[local.profileDateValue, !value && local.profileDatePlaceholder]}>{value ? formatReadableDate(value) : "Select from calendar"}</Text>
        <CalendarDays color={colors.gold} size={21} />
      </Pressable>
      {showPicker ? (
        <View style={local.profileDatePickerWrap}>
          <DateTimePicker
            value={selectedDate}
            mode="date"
            display={Platform.OS === "ios" ? "inline" : "calendar"}
            minimumDate={earliest}
            maximumDate={today}
            onChange={selectDate}
          />
          {Platform.OS === "ios" ? (
            <Pressable onPress={() => setShowPicker(false)} style={local.profileDateDoneButton}>
              <Text style={local.profileDateDoneText}>Done</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

function startOfToday() {
  const today = new Date();
  return new Date(today.getFullYear(), today.getMonth(), today.getDate());
}

function parseDateOnly(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day ? date : null;
}

function formatDateOnly(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatReadableDate(value: string) {
  const date = parseDateOnly(value);
  if (!date) return value;
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" });
}

const webDateInputStyle = {
  flex: 1,
  minWidth: 0,
  border: 0,
  outline: "none",
  background: "transparent",
  color: colors.navy,
  fontSize: 16,
  fontFamily: "inherit"
};

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
  profileDateButton: { minHeight: 52, borderRadius: 15, borderWidth: 1, borderColor: "rgba(201,147,50,0.22)", backgroundColor: "#FFFFFF", paddingHorizontal: 15, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  profileDateButtonPressed: { opacity: 0.78 },
  profileDateValue: { flex: 1, color: colors.navy, fontSize: 16 },
  profileDatePlaceholder: { color: colors.body },
  profileDatePickerWrap: { borderRadius: 18, borderWidth: 1, borderColor: "rgba(201,147,50,0.18)", backgroundColor: "#FFFFFF", overflow: "hidden", padding: 6 },
  profileDateDoneButton: { alignSelf: "flex-end", paddingHorizontal: 18, paddingVertical: 10 },
  profileDateDoneText: { color: colors.warning, fontSize: 15, fontWeight: "900" },
  profileDateWebShell: { minHeight: 52, borderRadius: 15, borderWidth: 1, borderColor: "rgba(201,147,50,0.22)", backgroundColor: "#FFFFFF", paddingHorizontal: 15, flexDirection: "row", alignItems: "center", gap: 12 },
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

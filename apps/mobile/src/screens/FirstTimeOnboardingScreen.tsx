import { useRef, useState } from "react";
import {
  Image,
  ImageBackground,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  ArrowRight,
  BookOpen,
  BriefcaseBusiness,
  CalendarDays,
  Clock3,
  Flower2,
  GraduationCap,
  HandHeart,
  Headphones,
  Heart,
  Sparkles,
  Sun,
  UsersRound,
  Video
} from "lucide-react-native";
import { colors, shadows } from "../theme";
import templeLake from "../assets/reference/temple-lake-sunrise-optimized.jpg";
import sacredLogo from "../assets/branding/app-icon.png";
import sacredMandala from "../assets/starter/sacred-mandala-alpha.png";

type OnboardingPage = {
  eyebrow: string;
  title: string;
  kind: "about" | "programs" | "mentors" | "connect";
};

const pages: OnboardingPage[] = [
  { eyebrow: "ABOUT", title: "About Sacred Circle", kind: "about" },
  { eyebrow: "OUR PROGRAMS", title: "Explore Our Programs", kind: "programs" },
  { eyebrow: "OUR MENTORS", title: "Meet Our Mentors", kind: "mentors" },
  { eyebrow: "CONNECT WITH US", title: "Join Our Sacred Circle", kind: "connect" }
];

const benefits = [
  { label: "Healing", Icon: Heart },
  { label: "Relationships", Icon: UsersRound },
  { label: "Career", Icon: BriefcaseBusiness },
  { label: "Spiritual Growth", Icon: Flower2 },
  { label: "Manifestation", Icon: Sparkles }
];

const programGroups = [
  {
    title: "Healing & Inner Peace",
    Icon: HandHeart,
    items: ["Physical and emotional healing", "Stress, anxiety, and inner peace"]
  },
  {
    title: "Life & Abundance",
    Icon: BriefcaseBusiness,
    items: ["Relationships and family life", "Career and professional growth", "Manifestation and abundance"]
  },
  {
    title: "Spiritual Activation",
    Icon: Sun,
    items: [
      "Spiritual growth and self-awareness",
      "Guidance from Higher Self and I AM Presence",
      "Merkaba Activation and Chakra Healing",
      "Connection to the Great Central Sun"
    ]
  },
  {
    title: "Higher Guidance",
    Icon: Sparkles,
    items: [
      "Connecting with Ascended Masters such as Shiv, Vishnu, Buddha, and Jesus",
      "Guidance from Galactic Beings such as Arcturians, Pleiadians, Sirians, and Andromedans",
      "Past Life Regression",
      "DNA Activation"
    ]
  }
];

export function FirstTimeOnboardingScreen({
  navigation,
  onComplete
}: {
  navigation: any;
  onComplete?: () => Promise<void> | void;
}) {
  const [index, setIndex] = useState(0);
  const [finishing, setFinishing] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const insets = useSafeAreaInsets();
  const { width, height, fontScale } = useWindowDimensions();
  const page = pages[index];
  const compact = width < 380 || height < 720 || fontScale > 1.12;
  const wide = width >= 700;
  const horizontalPadding = wide ? 38 : compact ? 16 : 22;
  const contentMaxWidth = wide ? 720 : 620;
  const footerHeight = compact ? 82 : 94;

  async function finish() {
    if (finishing) return;
    setFinishing(true);
    try {
      await onComplete?.();
      navigation.replace("Auth");
    } finally {
      setFinishing(false);
    }
  }

  async function next() {
    if (index === pages.length - 1) {
      await finish();
      return;
    }
    scrollRef.current?.scrollTo({ y: 0, animated: false });
    setIndex((current) => current + 1);
  }

  return (
    <View style={styles.scene}>
      <View pointerEvents="none" style={[styles.heroScene, { height: compact ? 330 : wide ? 440 : 390 }]}>
        <ImageBackground source={templeLake} resizeMode="cover" style={StyleSheet.absoluteFill} imageStyle={styles.heroImage} />
        <LinearGradient
          colors={["rgba(255,249,240,0.68)", "rgba(255,249,240,0.42)", "rgba(255,249,240,0.92)", "#FFF9F0"]}
          locations={[0, 0.4, 0.82, 1]}
          style={StyleSheet.absoluteFill}
        />
        <Image source={sacredMandala} resizeMode="contain" tintColor="#D89A35" style={[styles.mandala, wide && styles.mandalaWide]} />
      </View>

      <View style={[styles.topBar, { top: Math.max(insets.top, 10), paddingHorizontal: horizontalPadding }]}>
        <View />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Skip introduction"
          disabled={finishing}
          onPress={finish}
          style={({ pressed }) => [styles.skipButton, pressed && styles.pressed]}
        >
          <Text style={styles.skipText}>Skip</Text>
        </Pressable>
      </View>

      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: Math.max(insets.top, 10) + (compact ? 54 : 66),
            paddingHorizontal: horizontalPadding,
            paddingBottom: footerHeight + Math.max(insets.bottom, 12) + 28
          }
        ]}
      >
        <View style={[styles.content, { maxWidth: contentMaxWidth }]}>
          <View style={[styles.logoShell, compact && styles.logoShellCompact, wide && styles.logoShellWide]}>
            <Image source={sacredLogo} resizeMode="cover" style={styles.logo} />
          </View>

          <Text style={[styles.eyebrow, compact && styles.eyebrowCompact]}>
            {String(index + 1).padStart(2, "0")}  •  {page.eyebrow}
          </Text>
          <Text style={[styles.title, compact && styles.titleCompact, wide && styles.titleWide]}>{page.title}</Text>
          <LotusDivider />

          <View key={page.kind} style={[styles.card, compact && styles.cardCompact, wide && styles.cardWide]}>
            <PageContent kind={page.kind} compact={compact} wide={wide} />
          </View>
        </View>
      </ScrollView>

      <View
        style={[
          styles.footer,
          {
            minHeight: footerHeight + Math.max(insets.bottom, 8),
            paddingBottom: Math.max(insets.bottom, 10),
            paddingHorizontal: horizontalPadding
          }
        ]}
      >
        <View style={[styles.footerInner, { maxWidth: contentMaxWidth }]}>
          <View style={styles.progressBlock}>
            <View style={styles.dots}>
              {pages.map((item, dotIndex) => (
                <View key={item.kind} style={[styles.dot, dotIndex === index && styles.dotActive]} />
              ))}
            </View>
            <Text style={styles.stepText}>{index + 1} of {pages.length}</Text>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={index === pages.length - 1 ? "Continue to sign in" : "Next introduction page"}
            disabled={finishing}
            onPress={next}
            style={({ pressed }) => [styles.nextButton, compact && styles.nextButtonCompact, pressed && styles.nextButtonPressed, finishing && styles.disabled]}
          >
            <LinearGradient colors={["#C47B08", "#DE980F"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.nextGradient}>
              <Text style={[styles.nextText, compact && styles.nextTextCompact]}>{index === pages.length - 1 ? "Sign In" : "Next"}</Text>
              <ArrowRight color="#FFFFFF" size={compact ? 20 : 24} strokeWidth={2.1} />
            </LinearGradient>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function PageContent({ kind, compact, wide }: { kind: OnboardingPage["kind"]; compact: boolean; wide: boolean }) {
  if (kind === "programs") return <ProgramsContent compact={compact} wide={wide} />;
  if (kind === "mentors") return <MentorsContent compact={compact} />;
  if (kind === "connect") return <ConnectContent compact={compact} />;
  return <AboutContent compact={compact} />;
}

function AboutContent({ compact }: { compact: boolean }) {
  return (
    <>
      <Text style={[styles.body, compact && styles.bodyCompact]}>
        Sacred Circle is a spiritual community dedicated to helping individuals experience healing, inner transformation, manifestation, and spiritual awakening through simple yet powerful meditation techniques.
      </Text>
      <Text style={[styles.body, compact && styles.bodyCompact]}>
        Our practices are inspired by the principles of modern Quantum Physics and the timeless wisdom of Indian spirituality, creating a practical approach that anyone can learn and incorporate into daily life.
      </Text>
      <Text style={[styles.body, compact && styles.bodyCompact]}>
        These techniques are easy to understand, simple to practice, and designed to bring positive changes in health, relationships, career, emotional well-being, and overall quality of life.
      </Text>

      <View style={styles.benefits}>
        {benefits.map(({ label, Icon }) => (
          <View key={label} style={[styles.benefit, compact && styles.benefitCompact]}>
            <View style={[styles.iconCircle, compact && styles.iconCircleCompact]}>
              <Icon color="#BE7508" size={compact ? 22 : 27} strokeWidth={1.7} />
            </View>
            <Text numberOfLines={2} style={[styles.benefitLabel, compact && styles.benefitLabelCompact]}>{label}</Text>
          </View>
        ))}
      </View>
    </>
  );
}

function ProgramsContent({ compact, wide }: { compact: boolean; wide: boolean }) {
  return (
    <>
      <Text style={[styles.intro, compact && styles.bodyCompact]}>
        Practical pathways for healing, abundance, self-awareness, and deeper spiritual connection.
      </Text>
      <View style={[styles.programGrid, wide && styles.programGridWide]}>
        {programGroups.map(({ title, Icon, items }) => (
          <View key={title} style={[styles.programGroup, wide && styles.programGroupWide]}>
            <View style={styles.programHeader}>
              <View style={styles.programIcon}><Icon color="#BE7508" size={22} strokeWidth={1.7} /></View>
              <Text style={styles.programTitle}>{title}</Text>
            </View>
            {items.map((item) => (
              <View key={item} style={styles.programItem}>
                <View style={styles.programBullet} />
                <Text style={[styles.programText, compact && styles.programTextCompact]}>{item}</Text>
              </View>
            ))}
          </View>
        ))}
      </View>
    </>
  );
}

function MentorsContent({ compact }: { compact: boolean }) {
  return (
    <>
      <Text style={[styles.mentorLead, compact && styles.bodyCompact]}>
        The main mentors of Sacred Circle are Lina and Diwakar Raipure.
      </Text>

      <View style={[styles.mentorRow, compact && styles.mentorRowCompact]}>
        <MentorCard initials="DR" name="Diwakar Raipure" qualification="M. Tech. · IIT Madras, Chennai" compact={compact} />
        <MentorCard initials="LR" name="Lina Raipure" qualification="M. Sc. · Institute of Science, Nagpur" compact={compact} />
      </View>

      <View style={styles.mentorStory}>
        <View style={styles.storyHeading}>
          <BookOpen color="#BE7508" size={23} strokeWidth={1.7} />
          <Text style={styles.storyTitle}>Three decades of learning and practice</Text>
        </View>
        <Text style={[styles.body, compact && styles.bodyCompact]}>
          Both mentors bring rich experience in healing and meditation. They have completed numerous spiritual trainings with facilitators and Gurus in India and abroad.
        </Text>
        <Text style={[styles.body, compact && styles.bodyCompact]}>
          Over about 30 years, they have practised more than 100 modalities and studied scientific principles and spiritual methods to develop techniques that are effective and easy to learn.
        </Text>
        <Text style={[styles.body, compact && styles.bodyCompact]}>
          They experienced their own awakening through the grace of their spiritual masters.
        </Text>
      </View>
    </>
  );
}

function MentorCard({ initials, name, qualification, compact }: { initials: string; name: string; qualification: string; compact: boolean }) {
  return (
    <View style={[styles.mentorCard, compact && styles.mentorCardCompact]}>
      <View style={styles.mentorAvatar}><Text style={styles.mentorInitials}>{initials}</Text></View>
      <Text style={styles.mentorName}>{name}</Text>
      <View style={styles.qualificationRow}>
        <GraduationCap color="#BE7508" size={17} strokeWidth={1.7} />
        <Text style={styles.qualification}>{qualification}</Text>
      </View>
    </View>
  );
}

function ConnectContent({ compact }: { compact: boolean }) {
  return (
    <>
      <View style={styles.sundayHero}>
        <View style={styles.sundayIcon}><CalendarDays color="#BE7508" size={34} strokeWidth={1.6} /></View>
        <View style={styles.sundayCopy}>
          <Text style={styles.sundayLabel}>FREE ONLINE MEDITATION</Text>
          <Text style={styles.sundayTitle}>Every Sunday</Text>
          <Text style={styles.sundayTime}>4:00 PM IST · Around 2 hours</Text>
        </View>
      </View>

      <Text style={[styles.body, compact && styles.bodyCompact]}>
        Our Sunday sessions create a welcoming space to learn, meditate, and experience practical spiritual guidance together.
      </Text>

      <View style={styles.sessionItems}>
        <SessionItem Icon={UsersRound} title="Spiritual discussions" body="Explore timeless wisdom and practical insights for daily life." />
        <SessionItem Icon={Flower2} title="Guided meditation" body="Experience simple, powerful techniques for healing and transformation." />
        <SessionItem Icon={Video} title="Live online gathering" body="Join from anywhere and practise with the Sacred Circle community." />
        <SessionItem Icon={Headphones} title="Session recordings" body="Continue your practice later, at your own pace and convenience." />
      </View>

      <View style={styles.closingNote}>
        <Sparkles color="#BE7508" size={22} strokeWidth={1.7} />
        <Text style={styles.closingText}>Your journey toward healing, awakening, and inner transformation can begin here.</Text>
      </View>
    </>
  );
}

function SessionItem({ Icon, title, body }: { Icon: typeof Clock3; title: string; body: string }) {
  return (
    <View style={styles.sessionItem}>
      <View style={styles.sessionIcon}><Icon color="#BE7508" size={23} strokeWidth={1.7} /></View>
      <View style={styles.sessionCopy}>
        <Text style={styles.sessionTitle}>{title}</Text>
        <Text style={styles.sessionBody}>{body}</Text>
      </View>
    </View>
  );
}

function LotusDivider() {
  return (
    <View style={styles.divider}>
      <View style={styles.dividerLine} />
      <Flower2 color="#BE7508" size={25} strokeWidth={1.5} />
      <View style={styles.dividerLine} />
    </View>
  );
}

const styles = StyleSheet.create({
  scene: { flex: 1, width: "100%", overflow: "hidden", backgroundColor: "#FFF9F0" },
  heroScene: { position: "absolute", top: 0, right: 0, left: 0, overflow: "hidden" },
  heroImage: { opacity: 0.78 },
  mandala: { position: "absolute", width: 430, height: 430, top: -70, alignSelf: "center", opacity: 0.18 },
  mandalaWide: { width: 560, height: 560, top: -100 },
  topBar: { position: "absolute", zIndex: 20, right: 0, left: 0, minHeight: 44, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  skipButton: { minWidth: 62, minHeight: 44, alignItems: "flex-end", justifyContent: "center", paddingHorizontal: 4 },
  skipText: { color: "#B76D00", fontSize: 17, lineHeight: 23, fontWeight: "700" },
  pressed: { opacity: 0.64 },
  scrollContent: { flexGrow: 1, alignItems: "center" },
  content: { width: "100%", alignItems: "center" },
  logoShell: { width: 116, height: 116, borderRadius: 58, overflow: "hidden", backgroundColor: "#FFF8EA", borderWidth: 1, borderColor: "rgba(201,147,50,0.32)", marginBottom: 26, ...shadows.softGold },
  logoShellCompact: { width: 88, height: 88, borderRadius: 44, marginBottom: 18 },
  logoShellWide: { width: 132, height: 132, borderRadius: 66 },
  logo: { width: "100%", height: "100%" },
  eyebrow: { color: "#B76D00", fontSize: 16, lineHeight: 22, fontWeight: "800", letterSpacing: 2.3, textAlign: "center" },
  eyebrowCompact: { fontSize: 13, lineHeight: 18, letterSpacing: 1.8 },
  title: { color: colors.navy, fontFamily: "Georgia", fontSize: 42, lineHeight: 50, textAlign: "center", marginTop: 10 },
  titleCompact: { fontSize: 32, lineHeight: 39, marginTop: 7 },
  titleWide: { fontSize: 50, lineHeight: 59 },
  divider: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 14, marginTop: 14, marginBottom: 22 },
  dividerLine: { width: 74, height: 1.2, borderRadius: 999, backgroundColor: "#C98616" },
  card: { width: "100%", borderRadius: 30, borderWidth: 1, borderColor: "rgba(201,134,22,0.32)", backgroundColor: "rgba(255,253,248,0.96)", paddingHorizontal: 26, paddingVertical: 28, ...shadows.lifted },
  cardCompact: { borderRadius: 24, paddingHorizontal: 18, paddingVertical: 21 },
  cardWide: { paddingHorizontal: 36, paddingVertical: 34 },
  body: { color: colors.navy, fontSize: 16.2, lineHeight: 25.5, marginBottom: 18 },
  bodyCompact: { fontSize: 14.2, lineHeight: 22, marginBottom: 14 },
  intro: { color: colors.bodyDark, fontSize: 16.2, lineHeight: 25, textAlign: "center", marginBottom: 22 },
  benefits: { width: "100%", flexDirection: "row", flexWrap: "wrap", alignItems: "flex-start", justifyContent: "center", borderTopWidth: 1, borderTopColor: "rgba(201,134,22,0.16)", paddingTop: 22, marginTop: 2 },
  benefit: { width: "20%", minWidth: 82, alignItems: "center", paddingHorizontal: 4, marginBottom: 8 },
  benefitCompact: { width: "33.333%", minWidth: 76, marginBottom: 15 },
  iconCircle: { width: 58, height: 58, borderRadius: 29, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(246,231,198,0.48)", borderWidth: 1, borderColor: "rgba(201,134,22,0.15)", marginBottom: 9 },
  iconCircleCompact: { width: 48, height: 48, borderRadius: 24, marginBottom: 7 },
  benefitLabel: { color: colors.navy, fontFamily: "Georgia", fontSize: 13.3, lineHeight: 17, textAlign: "center" },
  benefitLabelCompact: { fontSize: 12.2, lineHeight: 15 },
  programGrid: { width: "100%", gap: 14 },
  programGridWide: { flexDirection: "row", flexWrap: "wrap", alignItems: "stretch" },
  programGroup: { width: "100%", borderRadius: 20, borderWidth: 1, borderColor: "rgba(201,134,22,0.16)", backgroundColor: "rgba(255,249,240,0.72)", padding: 16 },
  programGroupWide: { width: "48.8%" },
  programHeader: { flexDirection: "row", alignItems: "center", gap: 11, marginBottom: 11 },
  programIcon: { width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(246,231,198,0.58)" },
  programTitle: { flex: 1, color: colors.navy, fontFamily: "Georgia", fontSize: 17, lineHeight: 21 },
  programItem: { flexDirection: "row", alignItems: "flex-start", gap: 10, marginTop: 7 },
  programBullet: { width: 5, height: 5, borderRadius: 3, backgroundColor: "#C98616", marginTop: 8 },
  programText: { flex: 1, color: colors.bodyDark, fontSize: 14, lineHeight: 21 },
  programTextCompact: { fontSize: 13.2, lineHeight: 19.5 },
  mentorLead: { color: colors.navy, fontFamily: "Georgia", fontSize: 20, lineHeight: 28, textAlign: "center", marginBottom: 22 },
  mentorRow: { width: "100%", flexDirection: "row", gap: 14, marginBottom: 20 },
  mentorRowCompact: { flexDirection: "column" },
  mentorCard: { flex: 1, minWidth: 0, alignItems: "center", borderRadius: 20, backgroundColor: "rgba(246,231,198,0.28)", borderWidth: 1, borderColor: "rgba(201,134,22,0.18)", paddingHorizontal: 14, paddingVertical: 18 },
  mentorCardCompact: { width: "100%", flexDirection: "row", flexWrap: "wrap", justifyContent: "center", columnGap: 12, paddingVertical: 13 },
  mentorAvatar: { width: 62, height: 62, borderRadius: 31, alignItems: "center", justifyContent: "center", backgroundColor: "#FFF8EA", borderWidth: 1.5, borderColor: "rgba(201,134,22,0.45)", marginBottom: 10 },
  mentorInitials: { color: "#B76D00", fontFamily: "Georgia", fontSize: 22, fontWeight: "700" },
  mentorName: { color: colors.navy, fontFamily: "Georgia", fontSize: 18, lineHeight: 23, textAlign: "center", marginBottom: 8 },
  qualificationRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "center", gap: 6 },
  qualification: { flexShrink: 1, color: colors.bodyDark, fontSize: 12.5, lineHeight: 18, textAlign: "center" },
  mentorStory: { borderTopWidth: 1, borderTopColor: "rgba(201,134,22,0.16)", paddingTop: 20 },
  storyHeading: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 14 },
  storyTitle: { flex: 1, color: colors.navy, fontFamily: "Georgia", fontSize: 18, lineHeight: 23 },
  sundayHero: { flexDirection: "row", alignItems: "center", gap: 16, borderRadius: 22, backgroundColor: "rgba(246,231,198,0.38)", borderWidth: 1, borderColor: "rgba(201,134,22,0.22)", padding: 18, marginBottom: 22 },
  sundayIcon: { width: 66, height: 66, borderRadius: 33, alignItems: "center", justifyContent: "center", backgroundColor: "#FFF8EA", borderWidth: 1, borderColor: "rgba(201,134,22,0.26)" },
  sundayCopy: { flex: 1, minWidth: 0 },
  sundayLabel: { color: "#B76D00", fontSize: 11.5, lineHeight: 16, fontWeight: "900", letterSpacing: 1.1 },
  sundayTitle: { color: colors.navy, fontFamily: "Georgia", fontSize: 26, lineHeight: 32, marginTop: 2 },
  sundayTime: { color: colors.bodyDark, fontSize: 14, lineHeight: 20, fontWeight: "700", marginTop: 2 },
  sessionItems: { width: "100%", gap: 11, marginTop: 2 },
  sessionItem: { flexDirection: "row", alignItems: "center", gap: 13, borderRadius: 17, borderWidth: 1, borderColor: "rgba(201,134,22,0.13)", backgroundColor: "rgba(255,249,240,0.64)", paddingHorizontal: 14, paddingVertical: 12 },
  sessionIcon: { width: 45, height: 45, borderRadius: 23, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(246,231,198,0.52)" },
  sessionCopy: { flex: 1, minWidth: 0 },
  sessionTitle: { color: colors.navy, fontFamily: "Georgia", fontSize: 16, lineHeight: 20, marginBottom: 2 },
  sessionBody: { color: colors.bodyDark, fontSize: 13, lineHeight: 19 },
  closingNote: { flexDirection: "row", alignItems: "center", gap: 12, borderTopWidth: 1, borderTopColor: "rgba(201,134,22,0.16)", marginTop: 20, paddingTop: 18 },
  closingText: { flex: 1, color: colors.navy, fontFamily: "Georgia", fontSize: 15, lineHeight: 22 },
  footer: { position: "absolute", zIndex: 30, right: 0, bottom: 0, left: 0, alignItems: "center", justifyContent: "flex-end", borderTopWidth: 1, borderTopColor: "rgba(201,134,22,0.20)", backgroundColor: "rgba(255,251,245,0.98)", paddingTop: 10 },
  footerInner: { width: "100%", flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 18 },
  progressBlock: { flex: 1, alignItems: "center", justifyContent: "center" },
  dots: { flexDirection: "row", alignItems: "center", gap: 11 },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: "rgba(17,33,71,0.12)" },
  dotActive: { width: 12, height: 12, borderRadius: 6, backgroundColor: "#C98616" },
  stepText: { color: "#B76D00", fontSize: 12.5, lineHeight: 17, fontWeight: "700", marginTop: 7 },
  nextButton: { width: 158, minHeight: 58, borderRadius: 29, overflow: "hidden", ...shadows.button },
  nextButtonCompact: { width: 130, minHeight: 50, borderRadius: 25 },
  nextButtonPressed: { transform: [{ scale: 0.985 }], opacity: 0.86 },
  nextGradient: { flex: 1, minHeight: 50, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 11, paddingHorizontal: 18 },
  nextText: { color: "#FFFFFF", fontSize: 20, lineHeight: 25, fontWeight: "800" },
  nextTextCompact: { fontSize: 17 },
  disabled: { opacity: 0.55 }
});

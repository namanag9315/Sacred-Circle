import {
  SACRED_KEY_LENGTH,
  formatDuration,
  getRecordingState,
  getYouTubeThumbnailUrl,
  type Announcement,
  type Resource,
  type SacredEvent,
  type Session,
  type Video as SacredVideo
} from "@sacred-circle/lib";
import * as Linking from "expo-linking";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect } from "@react-navigation/native";
import {
  ActivityIndicator,
  Alert,
  Image,
  ImageBackground,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
  type ImageSourcePropType
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ArrowLeft,
  Bell,
  BookOpen,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  Clock3,
  Crown,
  Flower2,
  Grid2X2,
  Headphones,
  HelpCircle,
  Info,
  LockKeyhole,
  Mail,
  MapPin,
  MessageCircle,
  Moon,
  Play,
  Search,
  Settings,
  SlidersHorizontal,
  Sparkles,
  Star,
  User,
  Video
} from "lucide-react-native";
import { FadeUp } from "../components/Motion";
import {
  LogoSymbol,
  PrimaryButton,
  SecondaryButton,
  StatusBadge
} from "../components/Sacred";
import { useAuth } from "../context/AuthContext";
import {
  findRecordingsBySacredKey,
  listAnnouncements,
  listEvents,
  listResources,
  listSessions,
  listSettings,
  listVideos
} from "../services/repository";
import { colors, shadows } from "../theme";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import sunriseLotus from "../assets/reference/sunrise-lotus-optimized.jpg";
import templeLake from "../assets/reference/temple-lake-sunrise-optimized.jpg";
import omMandala from "../assets/reference/om-mandala-gold-optimized.jpg";
import starterWaterTemple from "../assets/starter/starter-water-temple-optimized.jpg";
import sacredMandalaAlpha from "../assets/starter/sacred-mandala-alpha.png";
import sacredFlameLogo from "../assets/starter/sacred-flame-logo-optimized.png";

type PremiumDataSnapshot = {
  sessions: Session[];
  resources: Resource[];
  events: SacredEvent[];
  videos: SacredVideo[];
  announcements: Announcement[];
  settings: Record<string, string>;
};

const PREMIUM_DATA_CACHE_MS = 30_000;
let premiumDataCache: { value: PremiumDataSnapshot; loadedAt: number } | null = null;
let premiumDataRequest: Promise<PremiumDataSnapshot> | null = null;

async function loadPremiumData(force = false) {
  const cacheFresh = premiumDataCache && Date.now() - premiumDataCache.loadedAt < PREMIUM_DATA_CACHE_MS;
  if (!force && cacheFresh) return premiumDataCache!.value;
  if (premiumDataRequest) return premiumDataRequest;

  premiumDataRequest = Promise.all([
    listSessions(),
    listResources(),
    listEvents(),
    listVideos(),
    listAnnouncements(),
    listSettings()
  ]).then(([sessions, resources, events, videos, announcements, settings]) => {
    const value: PremiumDataSnapshot = {
      sessions,
      resources,
      events,
      videos,
      announcements,
      settings: Object.fromEntries(settings.map((setting) => [setting.key, setting.value]))
    };
    premiumDataCache = { value, loadedAt: Date.now() };
    return value;
  }).finally(() => {
    premiumDataRequest = null;
  });

  return premiumDataRequest;
}

function usePremiumData() {
  const cached = premiumDataCache?.value;
  const [sessions, setSessions] = useState<Session[]>(cached?.sessions || []);
  const [resources, setResources] = useState<Resource[]>(cached?.resources || []);
  const [events, setEvents] = useState<SacredEvent[]>(cached?.events || []);
  const [videos, setVideos] = useState<SacredVideo[]>(cached?.videos || []);
  const [announcements, setAnnouncements] = useState<Announcement[]>(cached?.announcements || []);
  const [settings, setSettings] = useState<Record<string, string>>(cached?.settings || {});
  const [loading, setLoading] = useState(!cached);
  const [error, setError] = useState("");

  const applySnapshot = useCallback((snapshot: PremiumDataSnapshot) => {
    setSessions(snapshot.sessions);
    setResources(snapshot.resources);
    setEvents(snapshot.events);
    setVideos(snapshot.videos);
    setAnnouncements(snapshot.announcements);
    setSettings(snapshot.settings);
  }, []);

  const hydrate = useCallback(async (force = false) => {
    const hasCachedData = Boolean(premiumDataCache);
    if (!hasCachedData) setLoading(true);
    setError("");
    try {
      applySnapshot(await loadPremiumData(force));
    } catch (loadError) {
      console.warn("Unable to load Sacred Circle content", loadError);
      if (!premiumDataCache) {
        setSessions([]);
        setResources([]);
        setEvents([]);
        setVideos([]);
        setAnnouncements([]);
        setSettings({});
        setError("We could not load the latest Sacred Circle content.");
      }
    } finally {
      setLoading(false);
    }
  }, [applySnapshot]);

  const reload = useCallback(() => hydrate(true), [hydrate]);

  useEffect(() => {
    void hydrate(false);
  }, [hydrate]);

  useFocusEffect(useCallback(() => {
    if (!premiumDataCache || Date.now() - premiumDataCache.loadedAt >= PREMIUM_DATA_CACHE_MS) {
      void hydrate(false);
    }
  }, [hydrate]));

  return { sessions, resources, events, videos, announcements, settings, loading, error, reload };
}

function isPlaceholderUrl(url?: string | null) {
  const value = (url || "").trim();
  return !value || value === "https://wa.me/" || value.includes("1234567890");
}

function settingValue(settings: Record<string, string>, key: string) {
  const value = settings[key];
  const envFallbacks: Record<string, string | undefined> = {
    whatsapp_group_url: process.env.EXPO_PUBLIC_WHATSAPP_GROUP_URL,
    youtube_channel_url: process.env.EXPO_PUBLIC_YOUTUBE_CHANNEL_URL,
    default_zoom_link: process.env.EXPO_PUBLIC_DEFAULT_ZOOM_LINK
  };
  if (isPlaceholderUrl(value) && envFallbacks[key]) return envFallbacks[key];
  return value || envFallbacks[key] || "";
}

function openUrl(url?: string | null, message = "Sacred Circle has not added this link yet.") {
  if (isPlaceholderUrl(url)) {
    Alert.alert("Not available yet", message);
    return;
  }
  void Linking.openURL(String(url)).catch(() => {
    Alert.alert("Could not open link", "Please try again in a moment.");
  });
}

function navigateApp(navigation: any, screen: string, params?: Record<string, unknown>) {
  const tabAliases: Record<string, string> = {
    Home: "Home",
    Audio: "Audio",
    Meditations: "Audio",
    Video: "Video",
    Videos: "Video",
    More: "More"
  };
  const tabName = tabAliases[screen];
  if (tabName) {
    if (navigation.jumpTo) navigation.jumpTo(tabName);
    else navigation.navigate("Tabs", { screen: tabName });
    return;
  }
  navigation.navigate(screen, params);
}

function nextSessionOf(sessions: Session[]) {
  const now = Date.now();
  return sessions.find((session) => session.status === "live") || sessions.find((session) => {
    const startsAt = Date.parse(session.session_date || "");
    return session.status === "upcoming" && Number.isFinite(startsAt) && startsAt >= now;
  });
}

function firstNameOf(name?: string | null) {
  const clean = (name || "").trim();
  if (!clean) return "";
  const first = clean.split(/\s+/)[0]?.replace(/[^A-Za-z]/g, "") || "";
  if (!first) return clean;
  return `${first.slice(0, 1).toUpperCase()}${first.slice(1).toLowerCase()}`;
}

function formatSessionDate(value?: string | null) {
  if (!value) return "Date to be announced";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date to be announced";
  return date.toLocaleDateString("en-IN", { weekday: "long", day: "2-digit", month: "short", year: "numeric" });
}

function formatShortDate(value?: string | null) {
  if (!value) return "Date to be announced";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date to be announced";
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function formatHeroSessionDay(value?: string | null) {
  return formatSessionDate(value);
}

function formatHeroSessionTime(value?: string | null) {
  if (!value) return "Time to be announced";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Time to be announced";
  return `${date.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: "Asia/Kolkata" })} IST`;
}

const AUDIO_LIBRARY_FILTERS = ["All", "Free", "Online Shivir", "Offline Shivir"] as const;

function audioGroupLabel(resource: Resource) {
  if (resource.audio_group === "offline_shivir") return "Offline Shivir";
  if (resource.audio_group === "online_shivir") return "Online Shivir";
  return resource.access_type === "public" ? "Free" : "Online Shivir";
}

function audioChronology(resource: Resource) {
  const value = resource.recorded_at || resource.created_at || "";
  const time = Date.parse(value);
  return Number.isFinite(time) ? time : 0;
}

function pluralCount(count: number, singular: string, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`;
}

function matchesSearch(values: Array<string | null | undefined>, query: string) {
  const normalized = query.trim().toLocaleLowerCase();
  if (!normalized) return true;
  return values.some((value) => (value || "").toLocaleLowerCase().includes(normalized));
}

function thumbnailFor(video: SacredVideo, fallback: ImageSourcePropType = templeLake): ImageSourcePropType {
  const url = video.thumbnail_url || getYouTubeThumbnailUrl(video.youtube_url);
  if (url) return { uri: url };
  return fallback;
}

function PageShell({ children, compactTop = false }: { children: ReactNode; compactTop?: boolean }) {
  return (
    <SafeAreaView edges={["top"]} style={premium.safeArea}>
      <View pointerEvents="none" style={premium.pageMandala}>
        <Image source={omMandala} resizeMode="contain" style={premium.pageMandalaImage} />
      </View>
      <ScrollView
        showsVerticalScrollIndicator={false}
        style={premium.pageScroll}
        contentContainerStyle={premium.pageScrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[premium.shell, compactTop && premium.shellCompact]}>
          {children}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function CenterTitle({ title, left, right }: { title: string; left?: ReactNode; right?: ReactNode }) {
  return (
    <View style={premium.centerHeader}>
      <View style={premium.headerSide}>{left}</View>
      <View style={premium.centerTitleWrap}>
        <Text
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.72}
          maxFontSizeMultiplier={1.12}
          style={premium.centerTitle}
        >
          {title}
        </Text>
        <View style={premium.titleDivider}>
          <View style={premium.titleLine} />
          <Flower2 color={colors.gold} size={23} strokeWidth={1.45} />
          <View style={premium.titleLine} />
        </View>
      </View>
      <View style={premium.headerSide}>{right}</View>
    </View>
  );
}

function CircleIconButton({ children, onPress, accessibilityLabel }: { children: ReactNode; onPress?: () => void; accessibilityLabel?: string }) {
  return <Pressable accessibilityLabel={accessibilityLabel} accessibilityRole="button" onPress={onPress} style={premium.circleButton}>{children}</Pressable>;
}

function PremiumCard({ children, style }: { children: ReactNode; style?: any }) {
  return (
    <View style={[premium.card, style]}>
      <View pointerEvents="none" style={premium.cardGlow} />
      {children}
    </View>
  );
}

function ImagePlay({ source, large }: { source: ImageSourcePropType; large?: boolean }) {
  return (
    <ImageBackground source={source} resizeMode="cover" imageStyle={premium.playImageRadius} style={[premium.playImage, large && premium.playImageLarge]}>
      <View style={[premium.playButton, large && premium.playButtonLarge]}>
        <Play color={colors.navy} fill={colors.navy} size={large ? 27 : 18} />
      </View>
    </ImageBackground>
  );
}

function DataStateCard({
  title,
  body,
  loading,
  onRetry
}: {
  title: string;
  body?: string;
  loading?: boolean;
  onRetry?: () => void;
}) {
  return (
    <PremiumCard style={premium.dataStateCard}>
      {loading ? <ActivityIndicator color={colors.gold} /> : null}
      <Text style={premium.dataStateTitle}>{title}</Text>
      {body ? <Text style={premium.dataStateBody}>{body}</Text> : null}
      {onRetry ? <SecondaryButton label="Try Again" onPress={onRetry} style={premium.retryButton} textStyle={premium.retryButtonText} /> : null}
    </PremiumCard>
  );
}

export function HomeScreen({ navigation }: any) {
  const { profile, userId, recordSessionJoin } = useAuth();
  const { sessions, resources, events, videos, announcements, settings, loading, error, reload } = usePremiumData();
  const { width } = useWindowDimensions();
  const compact = width < 370;
  const name = firstNameOf(profile?.name);
  const liveSession = nextSessionOf(sessions);
  const audioResources = resources.filter((resource) => resource.type === "audio");
  const freeAudio = audioResources.find((resource) => resource.access_type === "public");
  const nextEvent = events[0];
  const latestAnnouncement = announcements[0];
  const audioCount = audioResources.length;
  const avatarInitial = (profile?.name || profile?.email || "S").trim().slice(0, 1).toUpperCase();
  const whatsappUrl = settings.whatsapp_group_url?.trim() || "";

  async function rememberSessionClick(session?: Session) {
    if (!userId || !session?.id) return;
    try {
      await recordSessionJoin(session.id);
    } catch (err) {
      console.warn("Unable to record session join", err);
    }
  }

  async function joinSession() {
    await rememberSessionClick(liveSession);
    openUrl(liveSession?.zoom_link || settingValue(settings, "default_zoom_link"), "Sacred Circle has not added the session link yet.");
  }

  return (
    <PageShell>
      <FadeUp delay={0}>
        <View style={[premium.homeHeroPanel, compact && premium.homeHeroPanelCompact]}>
          <Image source={starterWaterTemple} resizeMode="cover" style={premium.homeHeroBgImage} />
          <LinearGradient pointerEvents="none" colors={["rgba(255,252,245,0.94)", "rgba(255,248,236,0.58)", "rgba(255,239,215,0.05)"]} start={{ x: 0.02, y: 0.04 }} end={{ x: 0.82, y: 0.90 }} style={premium.homeHeroWarmWash} />
          <LinearGradient pointerEvents="none" colors={["rgba(255,249,238,0.82)", "rgba(255,249,238,0.24)", "rgba(255,249,238,0.00)"]} style={premium.homeHeroTopWash} />
          <Image source={sacredMandalaAlpha} resizeMode="contain" style={premium.homeHeroMandala} />

          <View style={premium.homeHeroHeader}>
            <Image source={sacredFlameLogo} resizeMode="contain" style={premium.homeHeroLogo} />
            <View style={premium.headerActions}>
              <View style={premium.heroNotificationButton}>
                <Bell color={colors.navy} size={19} strokeWidth={1.7} />
              </View>
              <Pressable onPress={() => navigateApp(navigation, "Profile")} style={premium.heroAvatarSmall}>
                {profile?.avatar_url ? <Image source={{ uri: profile.avatar_url }} resizeMode="cover" style={premium.avatarImageSmall} /> : <Text style={premium.avatarInitial}>{avatarInitial}</Text>}
              </Pressable>
            </View>
          </View>

          <View style={premium.homeHeroGreeting}>
            <Text style={premium.heroGreeting}>{name ? `Namaste, ${name} Ji` : "Namaste Ji"}</Text>
            <View style={premium.heroGoldRule} />
            <Text style={premium.heroGreetingText}>Welcome to your sacred space of healing, meditation and inner awakening.</Text>
          </View>

          {liveSession ? (
            <View style={premium.heroSessionCard}>
              <View pointerEvents="none" style={premium.heroSessionGlow} />
              <View style={premium.heroSessionCopy}>
                <Text style={premium.heroSessionPill}>{liveSession.status === "live" ? "LIVE SESSION" : "NEXT SUNDAY SESSION"}</Text>
                <Text numberOfLines={3} style={premium.heroSessionTitle}>{liveSession.title}</Text>
                <View style={premium.heroMetaStack}>
                  <MetaLine icon={<CalendarDays color={colors.navy} size={15} />} text={formatHeroSessionDay(liveSession.session_date)} />
                  <MetaLine icon={<Clock3 color={colors.navy} size={15} />} text={formatHeroSessionTime(liveSession.session_date)} />
                  <MetaLine icon={<Video color={colors.navy} size={15} />} text="Live on Zoom" />
                </View>
              </View>
              <View pointerEvents="none" style={premium.heroSessionArtClip}>
                <Image source={sunriseLotus} resizeMode="cover" style={premium.heroSessionArt} />
              </View>
              <View style={premium.heroSessionActions}>
                <PrimaryButton label="Join Session" icon={<ChevronRight color="#FFFFFF" size={17} />} onPress={joinSession} style={premium.heroPrimaryButton} textStyle={premium.heroButtonText} />
              </View>
            </View>
          ) : null}
        </View>
      </FadeUp>

      {loading ? <DataStateCard title="Loading your sacred space..." loading /> : null}
      {error ? <DataStateCard title="Content unavailable" body={error} onRetry={reload} /> : null}

      {!loading && !error ? (
        <>
          {!liveSession ? (
            <DataStateCard title="No upcoming session" body="New sessions will appear here when they are published." />
          ) : null}

          {freeAudio ? (
            <FadeUp delay={230}>
              <PremiumCard style={premium.freeAudioCard}>
                <ImagePlay source={templeLake} />
                <View style={premium.freeAudioPanel}>
                  <Text style={premium.kicker}>Free Audio</Text>
                  <Text numberOfLines={2} style={premium.audioTitle}>{freeAudio.title}</Text>
                  {freeAudio.description ? <Text numberOfLines={2} style={premium.audioDesc}>{freeAudio.description}</Text> : null}
                  <View style={premium.freeAudioFooter}>
                    {freeAudio.duration_seconds ? <Text style={premium.audioMeta}>{formatDuration(freeAudio.duration_seconds)}</Text> : <View />}
                    <SecondaryButton label="Listen Now" onPress={() => navigateApp(navigation, "AudioPlayer", { resource: freeAudio })} style={premium.listenButton} textStyle={premium.listenText} />
                  </View>
                </View>
              </PremiumCard>
            </FadeUp>
          ) : (
            <DataStateCard title="Audio library is empty" body="Published meditations will appear here when they are available." />
          )}

          <FadeUp delay={270}>
            <HomeAccessKeyCard
              onAuthorized={(recording, accessCode) => navigateApp(navigation, "AudioPlayer", { resource: recording, accessCode })}
            />
          </FadeUp>

          <FadeUp delay={310}>
            <LibraryCard navigation={navigation} audioCount={audioCount} videoCount={videos.length} />
          </FadeUp>

          {latestAnnouncement ? (
            <FadeUp delay={350}>
              <PremiumCard style={premium.announcementCard}>
                <View style={premium.compactCardIcon}><Bell color={colors.gold} size={21} /></View>
                <View style={premium.compactCardCopy}>
                  <Text style={premium.compactCardTitle}>{latestAnnouncement.title}</Text>
                  <Text numberOfLines={3} style={premium.compactCardText}>{latestAnnouncement.message}</Text>
                </View>
              </PremiumCard>
            </FadeUp>
          ) : null}

          {nextEvent ? (
            <FadeUp delay={390}>
              <NextShivirCard event={nextEvent} navigation={navigation} />
            </FadeUp>
          ) : null}

          {!isPlaceholderUrl(whatsappUrl) ? (
            <FadeUp delay={470}>
              <WhatsAppCommunityCard onJoin={() => openUrl(whatsappUrl)} />
            </FadeUp>
          ) : null}
        </>
      ) : null}
    </PageShell>
  );
}

export function SessionsScreen({ navigation }: any) {
  const { userId, recordSessionJoin } = useAuth();
  const { sessions, resources, settings, loading, error, reload } = usePremiumData();
  const upcoming = sessions.filter((session) => session.status === "live" || (session.status === "upcoming" && Date.parse(session.session_date || "") >= Date.now()));
  const past = sessions.filter((session) => session.status === "completed");
  const liveSession = nextSessionOf(sessions);
  const remainingUpcoming = upcoming.filter((session) => session.id !== liveSession?.id);

  async function register(session?: Session) {
    if (!userId || !session) {
      Alert.alert("Registration unavailable", "Sign in and choose an upcoming session to register.");
      return;
    }
    await recordSessionJoin(session.id);
    Alert.alert("Registered", "You are registered for this session.");
  }

  return (
    <PageShell compactTop>
      <CenterTitle title="Sessions" />
      {loading ? <DataStateCard title="Loading sessions..." loading /> : null}
      {error ? <DataStateCard title="Sessions unavailable" body={error} onRetry={reload} /> : null}

      {!loading && !error ? (
        <>
          {liveSession ? (
            <FadeUp delay={80}>
              <PremiumCard style={premium.liveSessionCard}>
                <ImageBackground source={templeLake} resizeMode="cover" imageStyle={premium.liveImageRadius} style={premium.liveImage}>
                  <Text style={premium.liveBadge}>{liveSession.status === "live" ? "LIVE" : "UPCOMING"}</Text>
                </ImageBackground>
                <View style={premium.livePanel}>
                  <Text style={premium.liveTitle}>{liveSession.title}</Text>
                  <View style={premium.liveMetaRow}>
                    <MetaLine icon={<CalendarDays color={colors.navy} size={15} />} text={formatSessionDate(liveSession.session_date)} />
                    {liveSession.duration_minutes ? <MetaLine icon={<Clock3 color={colors.navy} size={15} />} text={`${liveSession.duration_minutes} min`} /> : null}
                    {liveSession.zoom_link || settingValue(settings, "default_zoom_link") ? <MetaLine icon={<Video color={colors.navy} size={15} />} text="Online session" /> : null}
                  </View>
                  <PrimaryButton label="Join Session" icon={<ChevronRight color="#FFFFFF" size={17} />} onPress={() => openUrl(liveSession.zoom_link || settingValue(settings, "default_zoom_link"), "Sacred Circle has not added the session link yet.")} style={premium.fullNavyButton} textStyle={premium.heroButtonText} />
                  <SecondaryButton label="Register for Session" onPress={() => register(liveSession)} style={premium.fullOutlineButton} textStyle={premium.listenText} />
                </View>
              </PremiumCard>
            </FadeUp>
          ) : (
            <DataStateCard title="No upcoming sessions" body="Published sessions will appear here." />
          )}

          {remainingUpcoming.length ? <Text style={premium.sectionTitle}>Upcoming Sessions</Text> : null}
          {remainingUpcoming.map((session, index) => (
            <FadeUp key={session.id} delay={160 + index * 70}>
              <Pressable onPress={() => navigateApp(navigation, "SessionDetail", { session })}>
                <SessionListRow session={session} index={index} />
              </Pressable>
            </FadeUp>
          ))}

          <Text style={premium.sectionTitle}>Past Sessions</Text>
          {past.length ? past.map((session, index) => {
            const resource = resources.find((item) => item.session_id === session.id);
            const state = getRecordingState(resource);
            return (
              <FadeUp key={session.id} delay={360 + index * 70}>
                <Pressable onPress={() => navigateApp(navigation, "SessionDetail", { session })}>
                  <PremiumCard style={premium.pastRow}>
                    <View style={premium.sessionRowCopy}>
                      <Text style={premium.rowTitle}>{session.title}</Text>
                      <Text style={premium.rowSub}>{formatShortDate(session.session_date)}</Text>
                    </View>
                    <StatusBadge label={state === "not_uploaded" ? "Not uploaded" : "Key required"} tone={state === "not_uploaded" ? "danger" : "warning"} />
                  </PremiumCard>
                </Pressable>
              </FadeUp>
            );
          }) : <DataStateCard title="No past sessions" body="Completed sessions will appear here." />}
        </>
      ) : null}
    </PageShell>
  );
}

export function MeditationsScreen({ navigation }: any) {
  const { profile } = useAuth();
  const { sessions, resources, loading, error, reload } = usePremiumData();
  const { width } = useWindowDimensions();
  const isNarrowPhone = width < 430;
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedLocation, setSelectedLocation] = useState("All Locations");
  const audioResources = useMemo(
    () => resources
      .filter((resource) => resource.type === "audio")
      .sort((left, right) => audioChronology(right) - audioChronology(left)),
    [resources]
  );
  const offlineLocations = useMemo(
    () => Array.from(new Set(audioResources
      .filter((resource) => audioGroupLabel(resource) === "Offline Shivir")
      .map((resource) => resource.shivir_location?.trim())
      .filter((value): value is string => Boolean(value))))
      .sort((left, right) => left.localeCompare(right)),
    [audioResources]
  );
  const filteredAudio = useMemo(
    () => audioResources.filter((resource) => {
      const group = audioGroupLabel(resource);
      const categoryMatches = selectedCategory === "All" || group === selectedCategory;
      const locationMatches = selectedCategory !== "Offline Shivir"
        || selectedLocation === "All Locations"
        || resource.shivir_location === selectedLocation;
      return categoryMatches
        && locationMatches
        && matchesSearch([resource.title, resource.description, resource.category, group, resource.shivir_location], query);
    }),
    [audioResources, query, selectedCategory, selectedLocation]
  );
  const featuredAudio = filteredAudio.find((item) => item.is_featured) || null;
  const categories = [...AUDIO_LIBRARY_FILTERS];
  const avatarInitial = (profile?.name || profile?.email || "S").trim().slice(0, 1).toUpperCase();

  useEffect(() => {
    if (selectedLocation !== "All Locations" && !offlineLocations.includes(selectedLocation)) {
      setSelectedLocation("All Locations");
    }
  }, [offlineLocations, selectedLocation]);

  function openProtectedResource(resource: Resource) {
    const session = sessions.find((item) => item.id === resource.session_id);
    if (!session) {
      Alert.alert("Session unavailable", "The session linked to this recording is not available.");
      return;
    }
    navigateApp(navigation, "SessionDetail", { session });
  }

  function openAudio(resource: Resource) {
    if (resource.access_type === "session_protected") {
      openProtectedResource(resource);
      return;
    }
    navigateApp(navigation, "AudioPlayer", { resource });
  }

  function selectAudioCategory(category: string) {
    setSelectedCategory(category);
    if (category !== "Offline Shivir") setSelectedLocation("All Locations");
  }

  function filterCount(category: string) {
    return audioResources.filter((resource) => audioGroupLabel(resource) === category).length;
  }

  return (
    <PageShell compactTop>
      <View style={premium.audioLibraryHeader}>
        <View style={premium.homeBrand}>
          <LogoSymbol size={44} />
          <View style={premium.homeBrandText}>
            <Text numberOfLines={1} maxFontSizeMultiplier={1.1} style={premium.brandTitle}>SACRED CIRCLE</Text>
          </View>
        </View>
        <View style={premium.headerActions}>
          <View style={premium.notificationButton}>
            <Bell color={colors.navy} size={18} strokeWidth={1.7} />
            <View style={premium.notificationDot} />
          </View>
          <Pressable onPress={() => navigateApp(navigation, "Profile")} style={premium.avatarSmall}>
            {profile?.avatar_url ? <Image source={{ uri: profile.avatar_url }} resizeMode="cover" style={premium.avatarImageSmall} /> : <Text style={premium.avatarInitial}>{avatarInitial}</Text>}
          </Pressable>
        </View>
      </View>

      <View style={[premium.audioLibraryIntro, isNarrowPhone && premium.audioLibraryIntroNarrow]}>
        <View style={[premium.audioLibraryCopy, isNarrowPhone && premium.audioLibraryCopyNarrow]}>
          <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.78} maxFontSizeMultiplier={1.08} style={premium.audioLibraryTitle}>Audio Library</Text>
          <Text maxFontSizeMultiplier={1.15} style={premium.audioLibrarySubtitle}>Sacred audios for your mind, body and soul.</Text>
        </View>
        <View style={premium.audioSearchBox}>
          <Search color={colors.body} size={18} />
          <TextInput
            accessibilityLabel="Search audio"
            value={query}
            onChangeText={setQuery}
            placeholder="Search audios..."
            placeholderTextColor={colors.body}
            style={premium.audioSearchInput}
          />
          {query ? <Pressable accessibilityRole="button" onPress={() => setQuery("")} style={premium.clearSearch}><Text style={premium.clearSearchText}>×</Text></Pressable> : null}
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="Clear audio filters" onPress={() => { setQuery(""); setSelectedCategory("All"); setSelectedLocation("All Locations"); }} style={premium.audioFilterButton}>
          <SlidersHorizontal color={colors.navy} size={20} strokeWidth={1.7} />
        </Pressable>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={premium.chipRow}>
        {categories.map((chip) => (
          <Pressable key={chip} accessibilityRole="button" accessibilityState={{ selected: selectedCategory === chip }} onPress={() => selectAudioCategory(chip)}>
            <Text numberOfLines={1} maxFontSizeMultiplier={1.12} style={[premium.chip, selectedCategory === chip && premium.chipActive]}>{chip}</Text>
          </Pressable>
        ))}
      </ScrollView>

      {selectedCategory === "Offline Shivir" && offlineLocations.length ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={premium.locationChipRow}>
          {["All Locations", ...offlineLocations].map((location) => (
            <Pressable key={location} accessibilityRole="button" accessibilityState={{ selected: selectedLocation === location }} onPress={() => setSelectedLocation(location)}>
              <Text style={[premium.locationChip, selectedLocation === location && premium.locationChipActive]}>{location}</Text>
            </Pressable>
          ))}
        </ScrollView>
      ) : null}

      {loading ? <DataStateCard title="Loading audio..." loading /> : null}
      {error ? <DataStateCard title="Audio unavailable" body={error} onRetry={reload} /> : null}

      {!loading && !error ? (
        <>
          {!audioResources.length ? <DataStateCard title="No audio published yet" body="Reviewed Sacred Circle audio will appear here when it is available." /> : null}
          {audioResources.length && !filteredAudio.length ? <DataStateCard title="No matching audio" body="Try a different search, group or Shivir location." /> : null}

          {featuredAudio ? (
            <>
              <SectionHead title="Featured" />
              <Pressable onPress={() => openAudio(featuredAudio)}>
                <PremiumCard style={premium.audioFeaturedCard}>
                  <View style={premium.audioFeaturedCopy}>
                    <View style={premium.audioFeaturedLabel}><Star color={colors.gold} size={13} fill={colors.gold} /><Text style={premium.audioFeaturedLabelText}>FEATURED</Text></View>
                    <Text numberOfLines={3} maxFontSizeMultiplier={1.08} style={premium.audioFeaturedTitle}>{featuredAudio.title}</Text>
                    {featuredAudio.description ? <Text numberOfLines={3} maxFontSizeMultiplier={1.1} style={premium.audioFeaturedDescription}>{featuredAudio.description}</Text> : null}
                    <View style={premium.audioFeaturedMeta}>
                      {featuredAudio.duration_seconds ? <MetaLine icon={<Clock3 color={colors.navy} size={16} />} text={formatDuration(featuredAudio.duration_seconds)} /> : null}
                      <Text style={premium.audioFeaturedCategory}>{audioGroupLabel(featuredAudio)}</Text>
                    </View>
                    <View style={premium.audioFeaturedAction}><Play color="#FFFFFF" fill="#FFFFFF" size={17} /><Text style={premium.audioFeaturedActionText}>Play Now</Text></View>
                  </View>
                  <Image source={sunriseLotus} resizeMode="cover" style={premium.audioFeaturedArt} />
                </PremiumCard>
              </Pressable>
            </>
          ) : null}

          <SectionHead title="Categories" />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={premium.audioCategoryScroll}>
            {AUDIO_LIBRARY_FILTERS.filter((category) => category !== "All").map((category) => (
              <Pressable key={category} onPress={() => selectAudioCategory(category)} style={premium.audioCategoryTile}>
                <View style={premium.audioCategoryIcon}>{audioGroupIcon(category)}</View>
                <Text numberOfLines={2} maxFontSizeMultiplier={1.1} style={premium.audioCategoryName}>{category}</Text>
                <Text style={premium.audioCategoryCount}>{pluralCount(filterCount(category), "audio")}</Text>
              </Pressable>
            ))}
          </ScrollView>

          {filteredAudio.length ? <SectionHead title={selectedCategory === "All" ? "All Audios" : selectedLocation !== "All Locations" ? selectedLocation : selectedCategory} /> : null}
          {filteredAudio.map((resource, index) => {
            return (
              <AudioListRow
                key={resource.id}
                resource={resource}
                image={index % 2 ? sunriseLotus : templeLake}
                locked={resource.access_type === "session_protected"}
                onPress={() => openAudio(resource)}
              />
            );
          })}

        </>
      ) : null}
    </PageShell>
  );
}

export function MoreScreen({ navigation }: any) {
  const { profile, signOut } = useAuth();
  const { settings } = usePremiumData();
  const name = profile?.name?.trim() || "Profile";
  const email = profile?.email?.trim() || "";
  const memberLabel = profile ? profile.role === "admin" ? "Administrator" : "Member" : "";

  async function logout() {
    await signOut();
    if (Platform.OS === "web" && typeof window !== "undefined") {
      const next = new URL(window.location.href);
      next.searchParams.set("preview", "auth");
      window.location.href = next.toString();
    }
  }

  const primaryRows = [
    ["My Profile", <User color={colors.navy} size={18} />, () => navigateApp(navigation, "Profile")],
    ["Sunday Sessions", <CalendarDays color={colors.navy} size={18} />, () => navigateApp(navigation, "Sessions")],
    ["Audio Library", <Headphones color={colors.navy} size={18} />, () => navigateApp(navigation, "Audio")],
    ["Video Library", <Video color={colors.navy} size={18} />, () => navigateApp(navigation, "Video")]
  ] as const;

  const contentRows = [
    ["Programs", <Sparkles color={colors.navy} size={18} />, () => navigateApp(navigation, "Programs")],
    ["Resources", <BookOpen color={colors.navy} size={18} />, () => navigateApp(navigation, "Resources")],
    ["Shivir Information", <CalendarDays color={colors.navy} size={18} />, () => navigateApp(navigation, "Events")],
    ["About Sacred Circle", <Info color={colors.navy} size={18} />, () => navigateApp(navigation, "About")],
    ["Contact", <Mail color={colors.navy} size={18} />, () => navigateApp(navigation, "Contact")],
    ["Help & Support", <HelpCircle color={colors.navy} size={18} />, () => navigateApp(navigation, "Help")]
  ] as const;
  const whatsappUrl = settings.whatsapp_group_url?.trim() || "";

  return (
    <PageShell compactTop>
      <CenterTitle title="More" />
      <Pressable onPress={() => navigateApp(navigation, "Profile")}>
        <PremiumCard style={premium.moreProfileCard}>
          <View style={premium.profilePhoto}>
            {profile?.avatar_url ? <Image source={{ uri: profile.avatar_url }} resizeMode="cover" style={premium.profilePhotoImage} /> : <Text style={premium.profilePhotoText}>{name.slice(0, 1)}</Text>}
          </View>
          <View style={premium.moreProfileCopy}>
            <Text numberOfLines={2} maxFontSizeMultiplier={1.15} style={premium.moreName}>{name}</Text>
            {email ? <Text numberOfLines={1} maxFontSizeMultiplier={1.15} style={premium.moreEmail}>{email}</Text> : null}
            {memberLabel ? <Text numberOfLines={1} maxFontSizeMultiplier={1.15} style={premium.sacredMember}>{memberLabel}</Text> : null}
          </View>
          <ChevronRight color={colors.gold} size={22} />
        </PremiumCard>
      </Pressable>

      <PremiumCard style={premium.moreListCard}>
        {primaryRows.map(([label, icon, action]) => <MoreRow key={label} label={label} icon={icon} onPress={action} />)}
      </PremiumCard>
      <PremiumCard style={premium.moreListCard}>
        {contentRows.map(([label, icon, action]) => <MoreRow key={label} label={label} icon={icon} onPress={action} />)}
        {!isPlaceholderUrl(whatsappUrl) ? <MoreRow label="WhatsApp Group" icon={<Grid2X2 color={colors.navy} size={18} />} onPress={() => openUrl(whatsappUrl)} /> : null}
      </PremiumCard>
      <View style={premium.blessingCard}>
        <Image source={omMandala} resizeMode="contain" style={premium.blessingOm} />
        <View>
          <Text style={premium.blessingTitle}>Jai Gurudev</Text>
          <Text style={premium.blessingText}>Thank you for being a part of this sacred journey.</Text>
        </View>
      </View>
      <Pressable onPress={logout} style={premium.logoutButton}>
        <Text style={premium.logoutText}>Logout</Text>
      </Pressable>
    </PageShell>
  );
}

export function ProfileScreen({ navigation }: any) {
  const { profile, updateProfile, deleteMyAccount, signOut } = useAuth();
  const { settings } = usePremiumData();
  const { width, fontScale } = useWindowDimensions();
  const compactLayout = width < 380 || fontScale > 1.15;
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [nameInput, setNameInput] = useState(profile?.name || "");
  const [phoneInput, setPhoneInput] = useState(profile?.phone || "");
  const [cityInput, setCityInput] = useState(profile?.city || "");
  const name = profile?.name?.trim() || "Profile";
  const email = profile?.email?.trim() || "";
  const memberSince = profile?.created_at ? new Date(profile.created_at).toLocaleDateString("en-IN", { month: "short", year: "numeric" }) : "";
  const memberLabel = profile?.role === "admin" ? "Administrator" : "Member";
  const avatarInitial = (profile?.name || profile?.email || "S").trim().slice(0, 1).toUpperCase();

  useEffect(() => {
    if (editing) return;
    setNameInput(profile?.name || "");
    setPhoneInput(profile?.phone || "");
    setCityInput(profile?.city || "");
  }, [editing, profile]);

  function cancelEditing() {
    setNameInput(profile?.name || "");
    setPhoneInput(profile?.phone || "");
    setCityInput(profile?.city || "");
    setEditing(false);
  }

  async function saveProfile() {
    const nextName = nameInput.trim();
    const validationError = validateProfileDetails({
      name: nextName,
      phone: phoneInput,
      city: cityInput
    });
    if (validationError) {
      Alert.alert("Check details", validationError);
      return;
    }
    setSaving(true);
    try {
      await updateProfile({
        name: nextName,
        phone: phoneInput.trim() || null,
        city: cityInput.trim() || null,
        state: profile?.state || null,
        date_of_birth: profile?.date_of_birth || null
      });
      setEditing(false);
      Alert.alert("Profile updated", "Your details have been saved.");
    } catch {
      Alert.alert("Could not update profile", "Please try again in a moment.");
    } finally {
      setSaving(false);
    }
  }

  async function confirmAccountDeletion() {
    if (deleting) return;
    setDeleting(true);
    try {
      await deleteMyAccount();
      Alert.alert("Account deleted", "Your Sacred Circle account and profile data have been deleted.");
    } catch {
      Alert.alert("Could not delete account", "Your account was not changed. Please try again or contact support.");
    } finally {
      setDeleting(false);
    }
  }

  function requestAccountDeletion() {
    if (deleting) return;
    Alert.alert(
      "Delete your account?",
      "This permanently deletes your profile and account data. This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete Account", style: "destructive", onPress: () => { void confirmAccountDeletion(); } }
      ]
    );
  }

  return (
    <PageShell compactTop>
      <CenterTitle
        title="My Profile"
        left={<CircleIconButton onPress={() => navigation.goBack()}><ArrowLeft color={colors.navy} size={20} /></CircleIconButton>}
        right={profile ? <CircleIconButton onPress={() => setEditing((value) => !value)}><Settings color={colors.navy} size={19} /></CircleIconButton> : undefined}
      />
      <ImageBackground
        source={templeLake}
        resizeMode="cover"
        imageStyle={premium.profileHeroImage}
        style={[premium.profileHero, compactLayout && premium.profileHeroCompact]}
      >
        <LinearGradient
          colors={["rgba(7,17,36,0.00)", "rgba(7,17,36,0.12)", "rgba(7,17,36,0.74)"]}
          locations={[0, 0.45, 1]}
          style={premium.profileHeroVeil}
        />
        <View style={[premium.profileHeroContent, compactLayout && premium.profileHeroContentCompact]}>
          <View style={[premium.profileAvatarLarge, compactLayout && premium.profileAvatarLargeCompact]}>
            {profile?.avatar_url ? <Image source={{ uri: profile.avatar_url }} resizeMode="cover" style={premium.profileAvatarImage} /> : <Text maxFontSizeMultiplier={1.08} style={[premium.profileAvatarText, compactLayout && premium.profileAvatarTextCompact]}>{avatarInitial}</Text>}
          </View>
          <View style={premium.profileIdentity}>
            <Text numberOfLines={2} maxFontSizeMultiplier={1.08} style={[premium.profileName, compactLayout && premium.profileNameCompact]}>{name}</Text>
            {profile ? <View style={premium.profileMemberRow}><Crown color={colors.gold} size={15} fill={colors.gold} /><Text numberOfLines={1} maxFontSizeMultiplier={1.08} style={premium.profileMember}>{memberLabel}</Text></View> : null}
            {email ? <Text numberOfLines={1} maxFontSizeMultiplier={1.08} style={[premium.profileEmail, compactLayout && premium.profileEmailCompact]}>{email}</Text> : null}
            {memberSince ? <Text numberOfLines={1} maxFontSizeMultiplier={1.08} style={premium.profileMeta}>Member since {memberSince}</Text> : null}
          </View>
        </View>
      </ImageBackground>

      {!profile ? <DataStateCard title="Profile unavailable" body="Sign in to view and update your profile." /> : null}

      {editing && profile ? (
        <PremiumCard style={premium.profileEditorCard}>
          <Text style={premium.profileEditorTitle}>Personal Details</Text>
          <ProfileField label="Name" value={nameInput} onChangeText={setNameInput} />
          <ProfileField label="Email" value={email} editable={false} />
          <ProfileField label="Phone" value={phoneInput} onChangeText={setPhoneInput} keyboardType="phone-pad" />
          <ProfileField label="City" value={cityInput} onChangeText={setCityInput} />
          <View style={premium.profileEditorActions}>
            <SecondaryButton label="Cancel" onPress={cancelEditing} disabled={saving} style={premium.profileEditorButton} textStyle={premium.listenText} />
            <PrimaryButton label={saving ? "Saving..." : "Save Details"} onPress={saveProfile} disabled={saving} style={premium.profileEditorButton} />
          </View>
        </PremiumCard>
      ) : null}

      <PremiumCard style={premium.moreListCard}>
        {profile ? <MoreRow label="Personal Details" icon={<User color={colors.navy} size={19} />} onPress={() => setEditing(true)} /> : null}
        {profile?.phone ? <MoreRow label="Mobile Number" icon={<User color={colors.navy} size={19} />} trailing={profile.phone} /> : null}
        {profile?.city ? <MoreRow label="City" icon={<MapPin color={colors.navy} size={19} />} trailing={profile.city} /> : null}
        <MoreRow label="Audio Library" icon={<Headphones color={colors.navy} size={19} />} onPress={() => navigateApp(navigation, "Audio")} />
        <MoreRow label="Sacred Access Key" icon={<LockKeyhole color={colors.navy} size={19} />} onPress={() => navigateApp(navigation, "Sessions")} />
        <MoreRow label="Contact and Help" icon={<HelpCircle color={colors.navy} size={19} />} onPress={() => navigateApp(navigation, "Help")} />
        {settings.privacy_policy ? <MoreRow label="Privacy Policy" icon={<Info color={colors.navy} size={19} />} onPress={() => Alert.alert("Privacy Policy", settings.privacy_policy)} /> : null}
        {settings.terms_text ? <MoreRow label="Terms" icon={<BookOpen color={colors.navy} size={19} />} onPress={() => Alert.alert("Terms", settings.terms_text)} /> : null}
      </PremiumCard>

      {profile ? (
        <PremiumCard style={premium.dangerZoneCard}>
          <Text style={premium.dangerZoneTitle}>Delete Account</Text>
          <Text style={premium.dangerZoneBody}>Permanently remove your Sacred Circle account and profile data.</Text>
          <Pressable accessibilityRole="button" disabled={deleting} onPress={requestAccountDeletion} style={[premium.deleteAccountButton, deleting && premium.deleteAccountButtonDisabled]}>
            <Text style={premium.deleteAccountText}>{deleting ? "Deleting..." : "Delete My Account"}</Text>
          </Pressable>
        </PremiumCard>
      ) : null}
      <Pressable onPress={() => { void signOut(); }} style={premium.logoutButton}>
        <Text style={premium.logoutText}>Logout</Text>
      </Pressable>
    </PageShell>
  );
}

export function VideosListScreen({ navigation }: any) {
  const { videos, loading, error, reload } = usePremiumData();
  const { width, fontScale } = useWindowDimensions();
  const compactLayout = width < 380 || fontScale > 1.15;
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("All Videos");
  const [sortMode, setSortMode] = useState<"latest" | "library">("latest");
  const categories = useMemo(() => [
    "All Videos",
    ...["Meditation", "Healing", "Manifestation", "Relationships", "Spiritual Wisdom", "Cosmic Teachings"]
      .filter((category) => videos.some((video) => video.category === category))
  ], [videos]);
  const filteredVideos = useMemo(
    () => videos.filter((video) => {
      const categoryMatches = selectedCategory === "All Videos" || video.category === selectedCategory;
      return categoryMatches && matchesSearch([video.title, video.description, video.category], query);
    }).sort((left, right) => {
      if (sortMode === "library") return left.display_order - right.display_order;
      const leftTime = left.created_at ? Date.parse(left.created_at) : 0;
      const rightTime = right.created_at ? Date.parse(right.created_at) : 0;
      return rightTime - leftTime || left.display_order - right.display_order;
    }),
    [query, selectedCategory, sortMode, videos]
  );
  const featured = filteredVideos[0];
  const remainingVideos = filteredVideos.slice(1);

  useEffect(() => {
    if (!categories.includes(selectedCategory)) setSelectedCategory("All Videos");
  }, [categories, selectedCategory]);

  return (
    <PageShell compactTop>
      <CenterTitle
        title="Video Library"
        left={<CircleIconButton onPress={() => navigation.goBack()}><ArrowLeft color={colors.navy} size={20} /></CircleIconButton>}
        right={
          <CircleIconButton
            accessibilityLabel={searchOpen ? "Close video search" : "Search videos"}
            onPress={() => {
              setSearchOpen((open) => !open);
              if (searchOpen) setQuery("");
            }}
          >
            <Search color={colors.navy} size={21} />
          </CircleIconButton>
        }
      />
      <ImageBackground
        source={templeLake}
        resizeMode="cover"
        imageStyle={premium.videoHeroImage}
        style={[premium.videoHero, compactLayout && premium.videoHeroCompact]}
      >
        <LinearGradient
          colors={["rgba(7,17,36,0.82)", "rgba(7,17,36,0.46)", "rgba(7,17,36,0.00)"]}
          locations={[0, 0.52, 1]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={premium.videoHeroVeil}
        />
        <View style={[premium.videoHeroCopy, compactLayout && premium.videoHeroCopyCompact]}>
          <View style={premium.videoHeroRule} />
          <Text numberOfLines={2} maxFontSizeMultiplier={1.08} style={[premium.videoHeroTitle, compactLayout && premium.videoHeroTitleCompact]}>Wisdom for Awakening</Text>
          <Text numberOfLines={3} maxFontSizeMultiplier={1.08} style={[premium.videoHeroText, compactLayout && premium.videoHeroTextCompact]}>Explore talks, teachings and guided insights by Sacred Circle.</Text>
        </View>
      </ImageBackground>
      {searchOpen ? (
        <View style={premium.searchRow}>
          <View style={premium.searchBox}>
            <Search color={colors.body} size={18} />
            <TextInput
              accessibilityLabel="Search videos"
              autoFocus
              value={query}
              onChangeText={setQuery}
              placeholder="Search videos..."
              placeholderTextColor={colors.body}
              style={premium.searchInput}
            />
          </View>
        </View>
      ) : null}

      {videos.length ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={premium.chipRow}>
          {categories.map((chip) => (
            <Pressable key={chip} accessibilityRole="button" accessibilityState={{ selected: selectedCategory === chip }} onPress={() => setSelectedCategory(chip)}>
              <Text numberOfLines={1} maxFontSizeMultiplier={1.12} style={[premium.chip, selectedCategory === chip && premium.chipActive]}>{chip}</Text>
            </Pressable>
          ))}
        </ScrollView>
      ) : null}

      {loading ? <DataStateCard title="Loading videos..." loading /> : null}
      {error ? <DataStateCard title="Videos unavailable" body={error} onRetry={reload} /> : null}

      {!loading && !error ? (
        <>
          {!videos.length ? <DataStateCard title="No videos yet" body="Published videos will appear here." /> : null}
          {videos.length && !filteredVideos.length ? <DataStateCard title="No matching videos" body="Try a different search or category." /> : null}

          {featured ? (
            <>
              <SectionHead
                title="Featured Videos"
                action="View All"
                onAction={() => {
                  setSelectedCategory("All Videos");
                  setQuery("");
                }}
              />
              <Pressable onPress={() => openUrl(featured.youtube_url)}>
                <PremiumCard style={[premium.videoFeaturedCard, compactLayout && premium.videoFeaturedCardCompact]}>
                  <ImageBackground source={thumbnailFor(featured, sunriseLotus)} resizeMode="cover" imageStyle={premium.videoFeaturedThumbRadius} style={[premium.videoFeaturedThumb, compactLayout && premium.videoFeaturedThumbCompact]}>
                    <View style={premium.videoFeaturedPlay}><Play color={colors.navy} fill={colors.navy} size={22} /></View>
                  </ImageBackground>
                  <View style={premium.videoFeaturedCopy}>
                    <Text numberOfLines={3} maxFontSizeMultiplier={1.1} style={premium.videoFeaturedTitle}>{featured.title}</Text>
                    {featured.description ? <Text numberOfLines={3} maxFontSizeMultiplier={1.1} style={premium.videoFeaturedDesc}>{featured.description}</Text> : null}
                    <View style={premium.videoMetaLine}>
                      <Text style={premium.videoMetaText}>YouTube video</Text>
                      <Text style={premium.videoCategory}>{featured.category || "Uncategorized"}</Text>
                    </View>
                  </View>
                </PremiumCard>
              </Pressable>
            </>
          ) : null}

          {remainingVideos.length ? (
            <>
              <View style={premium.videoListHeader}>
                <Text style={premium.sectionTitle}>All Videos</Text>
                <View style={premium.videoListActions}>
                  <Pressable
                    accessibilityLabel={`Sort videos by ${sortMode === "latest" ? "library order" : "latest first"}`}
                    onPress={() => setSortMode((mode) => mode === "latest" ? "library" : "latest")}
                    style={premium.videoSortButton}
                  >
                    <Text style={premium.videoSortText}>{sortMode === "latest" ? "Latest First" : "Library Order"}</Text>
                    <ChevronDown color={colors.navy} size={15} />
                  </Pressable>
                  <Pressable
                    accessibilityLabel="Clear video filters"
                    onPress={() => {
                      setSelectedCategory("All Videos");
                      setQuery("");
                    }}
                    style={premium.videoFilterButton}
                  >
                    <SlidersHorizontal color={colors.navy} size={17} />
                  </Pressable>
                </View>
              </View>
              {remainingVideos.map((video, index) => (
                <Pressable key={video.id} onPress={() => openUrl(video.youtube_url)} style={[premium.videoRow, compactLayout && premium.videoRowCompact]}>
                  <View style={[premium.videoThumbWrap, compactLayout && premium.videoThumbWrapCompact]}>
                    <Image source={thumbnailFor(video, index % 2 ? sunriseLotus : templeLake)} resizeMode="cover" style={premium.videoThumb} />
                    <View style={premium.videoRowPlay}><Play color={colors.navy} fill={colors.navy} size={16} /></View>
                  </View>
                  <View style={premium.videoRowCopy}>
                    <Text numberOfLines={2} maxFontSizeMultiplier={1.1} style={premium.videoRowTitle}>{video.title}</Text>
                    <View style={premium.videoRowMeta}><Text style={premium.videoRowMetaText}>YouTube</Text><Text style={premium.videoPill}>{video.category || "Uncategorized"}</Text></View>
                  </View>
                  <ChevronRight color={colors.gold} size={18} />
                </Pressable>
              ))}
            </>
          ) : null}
        </>
      ) : null}
    </PageShell>
  );
}

function MetaLine({ icon, text }: { icon: ReactNode; text: string }) {
  return (
    <View style={premium.metaLine}>
      {icon}
      <Text style={premium.metaLineText}>{text}</Text>
    </View>
  );
}

function SectionHead({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <View style={premium.sectionHead}>
      <Text style={premium.sectionTitle}>{title}</Text>
      {action && onAction ? <Pressable onPress={onAction}><Text style={premium.viewAll}>{action}</Text></Pressable> : null}
    </View>
  );
}

function SessionListRow({ session, index }: { session: Session; index: number }) {
  const date = new Date(session.session_date || Date.now());
  return (
    <PremiumCard style={premium.sessionListRow}>
      <View style={premium.dateTile}>
        <Text style={premium.dateDay}>{String(date.getDate() || index + 1).padStart(2, "0")}</Text>
        <Text style={premium.dateMonth}>{date.toLocaleDateString("en-IN", { month: "short" }).toUpperCase()}</Text>
      </View>
      <View style={premium.sessionRowCopy}>
        <Text style={premium.rowTitle}>{session.title}</Text>
        <Text style={premium.rowSub}>{formatSessionDate(session.session_date)}{session.duration_minutes ? ` · ${session.duration_minutes} min` : ""}</Text>
      </View>
      <ChevronRight color={colors.gold} size={20} />
    </PremiumCard>
  );
}

function AudioListRow({ resource, image, locked, onPress }: { resource: Resource; image: ImageSourcePropType; locked?: boolean; onPress: () => void }) {
  const meta = [
    resource.duration_seconds ? formatDuration(resource.duration_seconds) : null,
    audioGroupLabel(resource),
    resource.recorded_at ? formatShortDate(resource.recorded_at) : null,
    resource.audio_group === "offline_shivir" ? resource.shivir_location : null
  ].filter(Boolean).join(" · ");
  return (
    <Pressable onPress={onPress} style={premium.audioRow}>
      <ImagePlay source={image} />
      <View style={premium.audioRowCopy}>
        <Text numberOfLines={2} maxFontSizeMultiplier={1.12} style={premium.audioRowTitle}>{resource.title}</Text>
        <Text numberOfLines={2} maxFontSizeMultiplier={1.12} style={premium.audioRowMeta}>{meta}</Text>
      </View>
      {locked ? <LockKeyhole color={colors.gold} size={18} /> : <ChevronRight color={colors.gold} size={18} />}
    </Pressable>
  );
}

function audioGroupIcon(category: string) {
  const normalized = category.toLocaleLowerCase();
  if (normalized.includes("unlocked")) return <LockKeyhole color={colors.gold} size={28} strokeWidth={1.65} />;
  if (normalized.includes("offline")) return <MapPin color="#8473AA" size={28} strokeWidth={1.65} />;
  if (normalized.includes("online")) return <Video color="#5C77A4" size={28} strokeWidth={1.65} />;
  if (normalized.includes("free")) return <Headphones color="#9A5E9F" size={28} strokeWidth={1.65} />;
  return <Flower2 color={colors.gold} size={29} strokeWidth={1.65} />;
}

function MoreRow({ label, icon, trailing, onPress }: { label: string; icon: ReactNode; trailing?: string; onPress?: () => void }) {
  return (
    <Pressable accessibilityRole="button" hitSlop={8} onPress={onPress} style={premium.moreRow}>
      <View style={premium.moreRowIcon}>{icon}</View>
      <Text numberOfLines={1} maxFontSizeMultiplier={1.15} style={premium.moreRowLabel}>{label}</Text>
      {trailing ? <Text numberOfLines={1} maxFontSizeMultiplier={1.15} style={premium.moreTrailing}>{trailing}</Text> : null}
      <ChevronRight color={colors.gold} size={18} />
    </Pressable>
  );
}

function validateProfileDetails(input: { name: string; phone: string; city: string }) {
  if (input.name.trim().length < 2) return "Please enter your full name.";
  const phoneDigits = input.phone.replace(/\D/g, "");
  if (phoneDigits && (phoneDigits.length < 10 || phoneDigits.length > 15)) return "Please enter a valid mobile number.";
  if (input.city.trim() && input.city.trim().length < 2) return "Please enter a valid city.";
  return "";
}

function ProfileField({
  label,
  value,
  onChangeText,
  editable = true,
  keyboardType = "default"
}: {
  label: string;
  value: string;
  onChangeText?: (value: string) => void;
  editable?: boolean;
  keyboardType?: "default" | "phone-pad" | "numbers-and-punctuation";
}) {
  return (
    <View style={premium.profileField}>
      <Text style={premium.profileFieldLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        editable={editable}
        keyboardType={keyboardType}
        placeholder={`Enter ${label.toLocaleLowerCase()}`}
        placeholderTextColor={colors.body}
        style={[premium.profileFieldInput, !editable && premium.profileFieldInputDisabled]}
      />
    </View>
  );
}

function HomeAccessKeyCard({
  onAuthorized
}: {
  onAuthorized: (recording: Resource, accessCode: string) => void;
}) {
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [matchedCode, setMatchedCode] = useState("");
  const [recordings, setRecordings] = useState<Resource[]>([]);

  async function submit() {
    if (code.length !== SACRED_KEY_LENGTH) {
      setMessage(`Enter the complete ${SACRED_KEY_LENGTH}-digit key shared during the live session.`);
      return;
    }
    setBusy(true);
    const result = await findRecordingsBySacredKey(code);
    setBusy(false);
    setRecordings(result.recordings);
    if (result.status === "matched" && result.recordings.length) {
      setMatchedCode(code);
      setMessage(result.recordings.length === 1 ? "Your session recording is ready." : `${result.recordings.length} session recordings are ready.`);
    } else {
      setMatchedCode("");
      if (result.status === "expired_code") setMessage("This Sacred Access Key has expired.");
      else if (result.status === "rate_limited") setMessage("Too many attempts. Please wait 15 minutes and try again.");
      else if (result.status === "auth_required") setMessage("Please sign in before using a Sacred Access Key.");
      else if (result.status === "recording_unavailable") setMessage("The key is valid, but its recording has not been published yet.");
      else if (result.status === "service_unavailable") setMessage("The recording service is temporarily unavailable. Please try again.");
      else setMessage("This Sacred Access Key is incorrect.");
    }
  }

  function playRecording(recording: Resource) {
    if (!matchedCode) return;
    const accessCode = matchedCode;
    setCode("");
    setMatchedCode("");
    setRecordings([]);
    setMessage("");
    onAuthorized(recording, accessCode);
  }

  return (
    <PremiumCard style={premium.accessKeyCard}>
      <View style={premium.accessKeyHeader}>
        <View style={premium.compactCardIcon}><LockKeyhole color={colors.gold} size={22} /></View>
        <View style={premium.compactCardCopy}>
          <Text style={premium.compactCardTitle}>Sacred Access Key</Text>
          <Text style={premium.compactCardText}>Enter your session's six-digit key and its protected recording will appear here. The key is required again next time.</Text>
        </View>
      </View>
      <View style={premium.accessKeyControls}>
        <TextInput
          accessibilityLabel="Sacred Access Key"
          autoCorrect={false}
          keyboardType="number-pad"
          textContentType="oneTimeCode"
          maxLength={SACRED_KEY_LENGTH}
          value={code}
          onChangeText={(value) => {
            setCode(value.replace(/\D/g, "").slice(0, SACRED_KEY_LENGTH));
            setMatchedCode("");
            setRecordings([]);
            setMessage("");
          }}
          onSubmitEditing={() => {
            if (!busy && code.length === SACRED_KEY_LENGTH) void submit();
          }}
          placeholder="6 digits"
          placeholderTextColor={colors.body}
          style={premium.accessKeyInput}
        />
        <PrimaryButton label={busy ? "Checking..." : "Find Recording"} onPress={submit} disabled={busy} style={premium.accessKeyButton} />
      </View>
      {message ? <Text style={[premium.accessKeyMessage, recordings.length > 0 && premium.accessKeyMessageSuccess]}>{message}</Text> : null}
      {recordings.length ? (
        <View style={premium.accessKeyResults}>
          {recordings.map((recording) => (
            <View key={recording.id} style={premium.accessKeyResultRow}>
              <View style={premium.accessKeyResultIcon}><Headphones color={colors.gold} size={20} /></View>
              <View style={premium.accessKeyResultCopy}>
                <Text numberOfLines={2} style={premium.accessKeyResultTitle}>{recording.title}</Text>
                <Text numberOfLines={1} style={premium.accessKeyResultMeta}>
                  {[recording.recorded_at ? formatShortDate(recording.recorded_at) : "Session recording", recording.duration_seconds ? formatDuration(recording.duration_seconds) : ""].filter(Boolean).join(" · ")}
                </Text>
              </View>
              <Pressable accessibilityRole="button" accessibilityLabel={`Play ${recording.title}`} onPress={() => playRecording(recording)} style={premium.accessKeyResultPlay}>
                <Play color="#FFFFFF" fill="#FFFFFF" size={17} />
              </Pressable>
            </View>
          ))}
        </View>
      ) : null}
    </PremiumCard>
  );
}

function LibraryCard({ navigation, audioCount, videoCount }: { navigation: any; audioCount: number; videoCount: number }) {
  return (
    <PremiumCard style={premium.libraryCard}>
      <Text style={premium.kicker}>Sacred Library</Text>
      <View style={premium.libraryGrid}>
        <LibraryTile
          icon={<Headphones color={colors.gold} size={26} strokeWidth={1.8} />}
          title="Audio Library"
          subtitle={pluralCount(audioCount, "audio")}
          onPress={() => navigateApp(navigation, "Audio")}
        />
        <LibraryTile
          icon={<Video color={colors.gold} size={26} strokeWidth={1.8} />}
          title="Video Library"
          subtitle={pluralCount(videoCount, "video")}
          onPress={() => navigateApp(navigation, "Video")}
        />
        <LibraryTile
          icon={<BookOpen color={colors.gold} size={26} strokeWidth={1.8} />}
          title="Resources"
          subtitle="Guides & help"
          onPress={() => navigateApp(navigation, "Resources")}
        />
      </View>
      <Pressable onPress={() => navigateApp(navigation, "Resources")} style={premium.libraryCta}>
        <Text style={premium.libraryCtaText}>Explore Library</Text>
        <ChevronRight color={colors.gold} size={18} />
      </Pressable>
    </PremiumCard>
  );
}

function LibraryTile({ icon, title, subtitle, onPress }: { icon: ReactNode; title: string; subtitle: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={premium.libraryTile}>
      <View style={premium.libraryIcon}>{icon}</View>
      <Text numberOfLines={2} style={premium.libraryTileTitle}>{title}</Text>
      <Text numberOfLines={1} style={premium.libraryTileSubtitle}>{subtitle}</Text>
    </Pressable>
  );
}

function NextShivirCard({ event, navigation }: { event: SacredEvent; navigation: any }) {
  const imageSource: ImageSourcePropType = event.image_url ? { uri: event.image_url } : templeLake;
  return (
    <PremiumCard style={premium.shivirCard}>
      <Text style={premium.kicker}>Upcoming Event</Text>
      <View style={premium.shivirLayout}>
        <Image source={imageSource} resizeMode="cover" style={premium.shivirImage} />
        <View style={premium.shivirCopy}>
          <Text numberOfLines={3} style={premium.shivirTitle}>{event.title}</Text>
          <MetaLine icon={<MapPin color={colors.navy} size={16} />} text={event.location || "Location to be announced"} />
          <MetaLine icon={<CalendarDays color={colors.navy} size={16} />} text={formatShortDate(event.event_date)} />
        </View>
      </View>
      <Image source={omMandala} resizeMode="contain" style={premium.shivirWatermark} />
      <Pressable onPress={() => navigateApp(navigation, "EventDetail", { event })} style={premium.shivirButton}>
        <Text style={premium.shivirButtonText}>Know More</Text>
        <ChevronRight color="#FFFFFF" size={19} />
      </Pressable>
    </PremiumCard>
  );
}

function WhatsAppCommunityCard({ onJoin }: { onJoin: () => void }) {
  return (
    <Pressable onPress={onJoin}>
      <LinearGradient colors={["#102248", "#183B72"]} style={premium.whatsappCard}>
        <View style={premium.whatsappIcon}><MessageCircle color="#FFFFFF" size={24} /></View>
        <View style={premium.whatsappCopy}>
          <Text style={premium.whatsappTitle}>WhatsApp Community</Text>
          <Text style={premium.whatsappText}>Join updates for Sunday sessions and Sacred Circle announcements.</Text>
        </View>
        <ChevronRight color={colors.goldSoft} size={20} />
      </LinearGradient>
    </Pressable>
  );
}

const premium = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#FFF9F0" },
  pageScroll: { flex: 1, backgroundColor: "#FFF9F0" },
  pageMandala: { position: "absolute", width: 320, height: 320, top: 38, right: -124, opacity: 0.075 },
  pageMandalaImage: { width: "100%", height: "100%" },
  pageScrollContent: { alignItems: "center", paddingHorizontal: 14, paddingBottom: 144 },
  shell: { width: "100%", maxWidth: 460, alignSelf: "center", paddingTop: 10, paddingBottom: 28 },
  shellCompact: { paddingTop: 12 },
  card: { position: "relative", overflow: "hidden", borderRadius: 28, borderWidth: 1, borderColor: "rgba(201,147,50,0.20)", backgroundColor: "rgba(255,253,248,0.96)", padding: 18, ...shadows.card },
  cardGlow: { position: "absolute", left: -60, right: -60, top: -72, height: 126, backgroundColor: "rgba(255,255,255,0.68)", borderRadius: 80 },
  dataStateCard: { alignItems: "center", gap: 8, paddingVertical: 22, marginBottom: 14 },
  dataStateTitle: { color: colors.navy, fontFamily: "Georgia", fontSize: 18, lineHeight: 24, textAlign: "center" },
  dataStateBody: { color: colors.bodyDark, fontSize: 13, lineHeight: 19, textAlign: "center" },
  retryButton: { minHeight: 42, marginTop: 4, paddingHorizontal: 18 },
  retryButtonText: { color: colors.gold, fontSize: 13, fontWeight: "900" },
  homeHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 18, minHeight: 54 },
  homeBrand: { flex: 1, minWidth: 0, flexDirection: "row", alignItems: "center", gap: 10, paddingRight: 8 },
  homeBrandText: { minWidth: 0 },
  brandTitle: { color: colors.navy, fontFamily: "Georgia", fontSize: 15, letterSpacing: 2.1, lineHeight: 19 },
  brandSubtitle: { color: colors.gold, fontSize: 9, letterSpacing: 2.75, lineHeight: 13, marginTop: 1 },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 9 },
  notificationButton: { width: 42, height: 42, borderRadius: 21, backgroundColor: "rgba(255,255,255,0.84)", borderWidth: 1, borderColor: "rgba(201,147,50,0.14)", alignItems: "center", justifyContent: "center", ...shadows.soft },
  notificationDot: { position: "absolute", top: 10, right: 10, width: 7, height: 7, borderRadius: 4, backgroundColor: colors.gold, borderWidth: 1.5, borderColor: "#FFFFFF" },
  circleButton: { width: 46, height: 46, borderRadius: 23, backgroundColor: "rgba(255,255,255,0.90)", borderWidth: 1, borderColor: "rgba(201,147,50,0.16)", alignItems: "center", justifyContent: "center", ...shadows.soft },
  avatarSmall: { width: 44, height: 44, borderRadius: 22, overflow: "hidden", backgroundColor: colors.navy, borderWidth: 2, borderColor: "#FFFFFF", alignItems: "center", justifyContent: "center", ...shadows.card },
  avatarInitial: { color: "#FFFFFF", fontSize: 19, fontWeight: "900", textTransform: "uppercase" },
  avatarImageSmall: { width: "100%", height: "100%", borderRadius: 999 },
  greetingBlock: { position: "relative", zIndex: 2, paddingTop: 2, marginBottom: 18 },
  greeting: { color: colors.navy, fontFamily: "Georgia", fontSize: 34, lineHeight: 40 },
  goldRule: { width: 58, height: 3, borderRadius: 999, backgroundColor: colors.gold, marginTop: 9, marginBottom: 12 },
  greetingText: { color: colors.bodyDark, fontSize: 14.5, lineHeight: 22, maxWidth: 330 },
  homeHeroPanel: { minHeight: 660, borderRadius: 30, overflow: "hidden", marginBottom: 16, padding: 18, justifyContent: "space-between", backgroundColor: "#FFF3DF", borderWidth: 1, borderColor: "rgba(201,147,50,0.16)", ...shadows.card },
  homeHeroPanelCompact: { minHeight: 642, padding: 15, borderRadius: 28 },
  homeHeroBgImage: { position: "absolute", top: 0, bottom: 0, right: -160, width: 930, height: "100%", opacity: 1 },
  homeHeroWarmWash: { ...StyleSheet.absoluteFill },
  homeHeroTopWash: { position: "absolute", top: 0, left: 0, right: 0, height: "54%" },
  homeHeroMandala: { position: "absolute", top: 44, alignSelf: "center", width: 156, height: 156, opacity: 0.11 },
  homeHeroHeader: { position: "relative", zIndex: 3, flexDirection: "row", alignItems: "center", justifyContent: "space-between", minHeight: 54 },
  homeHeroLogo: { width: 56, height: 56, borderRadius: 28, ...shadows.soft },
  heroNotificationButton: { width: 42, height: 42, borderRadius: 21, backgroundColor: "rgba(255,255,255,0.62)", borderWidth: 1, borderColor: "rgba(201,147,50,0.12)", alignItems: "center", justifyContent: "center", ...shadows.soft },
  heroAvatarSmall: { width: 46, height: 46, borderRadius: 23, overflow: "hidden", backgroundColor: colors.navy, borderWidth: 2, borderColor: "#FFFFFF", alignItems: "center", justifyContent: "center", ...shadows.card },
  homeHeroGreeting: { position: "relative", zIndex: 3, marginTop: 44, marginBottom: 118, maxWidth: 316 },
  heroGreeting: { color: colors.navy, fontFamily: "Georgia", fontSize: 33, lineHeight: 39, letterSpacing: -0.4 },
  heroGoldRule: { width: 44, height: 2.5, borderRadius: 999, backgroundColor: colors.gold, marginTop: 8, marginBottom: 12 },
  heroGreetingText: { color: "rgba(49,61,83,0.72)", fontSize: 14, fontWeight: "700", lineHeight: 22, maxWidth: 300 },
  heroSessionCard: { position: "relative", zIndex: 4, minHeight: 238, borderRadius: 20, overflow: "hidden", borderWidth: 1.2, borderColor: "rgba(211,151,51,0.42)", backgroundColor: "rgba(255,250,240,0.92)", padding: 18, paddingBottom: 72, ...shadows.card },
  heroSessionGlow: { position: "absolute", left: -18, top: 0, bottom: 0, width: "68%", backgroundColor: "rgba(255,253,248,0.82)", borderTopRightRadius: 170, borderBottomRightRadius: 170, zIndex: 1 },
  heroSessionCopy: { position: "relative", zIndex: 4, width: "55%" },
  heroSessionPill: { alignSelf: "flex-start", overflow: "hidden", borderRadius: 6, backgroundColor: "#F8DFAF", color: "#B76D0A", fontSize: 10.5, lineHeight: 16, fontWeight: "900", letterSpacing: 0.45, paddingHorizontal: 7, paddingVertical: 3, textTransform: "uppercase" },
  heroSessionTitle: { color: colors.navy, fontFamily: "Georgia", fontSize: 22, lineHeight: 27, marginTop: 12, marginBottom: 13, letterSpacing: -0.2 },
  heroMetaStack: { gap: 8 },
  heroSessionArtClip: { position: "absolute", right: -10, top: 0, bottom: 0, width: "53%", overflow: "hidden", borderTopRightRadius: 20, borderBottomRightRadius: 20, borderTopLeftRadius: 96, transform: [{ skewX: "-10deg" }], zIndex: 2, borderLeftWidth: 1, borderLeftColor: "rgba(211,151,51,0.32)" },
  heroSessionArt: { width: "118%", height: "100%", marginLeft: -18, opacity: 0.96, transform: [{ skewX: "10deg" }] },
  heroSessionActions: { position: "absolute", left: 18, right: 18, bottom: 14, zIndex: 6, flexDirection: "row", gap: 8, alignItems: "center" },
  homeScene: { height: 404, marginHorizontal: -2, marginBottom: 14, paddingHorizontal: 2, justifyContent: "space-between" },
  homeSceneImage: { borderRadius: 0, opacity: 0.78 },
  homeSceneVeil: { ...StyleSheet.absoluteFill },
  homeHero: { marginBottom: 16 },
  homeHeroBg: { height: 0 },
  homeHeroImage: { opacity: 0.84 },
  homeHeroVeil: { ...StyleSheet.absoluteFill },
  homeSessionCard: { minHeight: 248, padding: 18, paddingBottom: 68, borderRadius: 28, marginBottom: 16 },
  homeSessionCopy: { width: "59%", zIndex: 2 },
  homeSessionTitle: { color: colors.navy, fontFamily: "Georgia", fontSize: 22, lineHeight: 27, marginTop: 10, marginBottom: 10 },
  sessionMetaStack: { gap: 6, marginBottom: 8 },
  metaLine: { flexDirection: "row", alignItems: "center", gap: 9 },
  metaLineText: { color: colors.bodyDark, fontSize: 12.5, lineHeight: 17, flexShrink: 1 },
  sessionActionRow: { position: "absolute", left: 18, right: 18, bottom: 16, zIndex: 4, flexDirection: "row", gap: 10, alignItems: "center" },
  heroPrimaryButton: { flex: 1, minHeight: 48, borderRadius: 13, paddingHorizontal: 10 },
  heroButtonText: { fontSize: 13 },
  homeSessionArt: { position: "absolute", right: 0, top: 0, bottom: 0, width: "51%", height: "100%", opacity: 0.94, borderTopLeftRadius: 164, borderBottomLeftRadius: 164, borderTopRightRadius: 28, borderBottomRightRadius: 28 },
  homeSessionArtCompact: { width: "46%", opacity: 0.86 },
  freeAudioCard: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 16, padding: 12, minHeight: 128 },
  freeAudioCopy: { flex: 1, minWidth: 0 },
  freeAudioPanel: { flex: 1, minWidth: 0, justifyContent: "center" },
  freeAudioFooter: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10, marginTop: 7 },
  kicker: { color: "#A85E00", fontSize: 11, letterSpacing: 0.9, textTransform: "uppercase", fontWeight: "900" },
  audioTitle: { color: colors.navy, fontFamily: "Georgia", fontSize: 15, lineHeight: 19 },
  audioDesc: { color: colors.bodyDark, fontSize: 11.5, lineHeight: 16, marginTop: 4 },
  audioMeta: { color: colors.bodyDark, fontSize: 12 },
  listenButton: { minHeight: 42, width: 116, borderRadius: 12, paddingHorizontal: 8 },
  listenText: { fontSize: 13, color: colors.gold, fontWeight: "900" },
  homeSectionGap: { marginBottom: 16 },
  accessKeyCard: { padding: 16, marginBottom: 16 },
  accessKeyHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
  accessKeyControls: { flexDirection: "row", alignItems: "center", gap: 9, marginTop: 14 },
  accessKeyInput: { flex: 0.72, minWidth: 92, height: 50, borderRadius: 13, borderWidth: 1, borderColor: colors.goldBorder, backgroundColor: "#FFFFFF", color: colors.navy, fontSize: 16, fontWeight: "900", letterSpacing: 2, textAlign: "center", paddingHorizontal: 10 },
  accessKeyButton: { flex: 1.28, minHeight: 50, borderRadius: 13, paddingHorizontal: 10 },
  accessKeyOpenButton: { alignSelf: "flex-start", minHeight: 44, marginTop: 14, paddingHorizontal: 18 },
  accessKeyMessage: { color: colors.bodyDark, fontSize: 12, lineHeight: 18, marginTop: 10 },
  accessKeyMessageSuccess: { color: "#527A4A", fontWeight: "800" },
  accessKeyResults: { gap: 9, marginTop: 12 },
  accessKeyResultRow: { minHeight: 68, borderRadius: 15, borderWidth: 1, borderColor: "rgba(201,147,50,0.22)", backgroundColor: "rgba(255,249,237,0.88)", flexDirection: "row", alignItems: "center", gap: 10, padding: 10 },
  accessKeyResultIcon: { width: 42, height: 42, borderRadius: 12, backgroundColor: "rgba(246,231,198,0.72)", alignItems: "center", justifyContent: "center" },
  accessKeyResultCopy: { flex: 1, minWidth: 0 },
  accessKeyResultTitle: { color: colors.navy, fontFamily: "Georgia", fontSize: 14, lineHeight: 18, fontWeight: "700" },
  accessKeyResultMeta: { color: colors.bodyDark, fontSize: 11.5, lineHeight: 16, marginTop: 3 },
  accessKeyResultPlay: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.navy, alignItems: "center", justifyContent: "center" },
  announcementCard: { flexDirection: "row", alignItems: "center", gap: 12, padding: 16, marginBottom: 16 },
  libraryCard: { padding: 18, marginBottom: 18 },
  libraryGrid: { flexDirection: "row", gap: 8, marginTop: 12, marginBottom: 12 },
  libraryTile: { flex: 1, minHeight: 104, borderRadius: 16, borderWidth: 1, borderColor: "rgba(196,125,18,0.18)", backgroundColor: "rgba(255,251,245,0.88)", alignItems: "center", justifyContent: "center", paddingHorizontal: 7, paddingVertical: 10 },
  libraryIcon: { width: 32, height: 32, alignItems: "center", justifyContent: "center", marginBottom: 7 },
  libraryTileTitle: { color: colors.navy, fontSize: 12, lineHeight: 16, fontWeight: "900", textAlign: "center" },
  libraryTileSubtitle: { color: colors.bodyDark, fontSize: 11, lineHeight: 15, marginTop: 3, textAlign: "center" },
  libraryCta: { minHeight: 48, borderRadius: 11, backgroundColor: "rgba(246,231,198,0.55)", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  libraryCtaText: { color: colors.gold, fontSize: 15, fontWeight: "900" },
  shivirCard: { padding: 17, marginBottom: 16 },
  shivirLayout: { flexDirection: "row", gap: 14, alignItems: "flex-start", marginTop: 12, marginBottom: 14, position: "relative", zIndex: 2 },
  shivirImage: { width: 112, height: 128, borderRadius: 13 },
  shivirCopy: { flex: 1, minWidth: 0, paddingTop: 1, gap: 6 },
  shivirTitle: { color: colors.navy, fontFamily: "Georgia", fontSize: 23, lineHeight: 25, fontWeight: "700", marginBottom: 4 },
  shivirWatermark: { position: "absolute", right: -34, top: 38, width: 142, height: 142, opacity: 0.12 },
  shivirButton: { width: "100%", minHeight: 50, borderRadius: 12, position: "relative", zIndex: 2, backgroundColor: "#CD8509", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 13 },
  shivirButtonText: { color: "#FFFFFF", fontSize: 15, fontWeight: "900" },
  recentPlayedCard: { padding: 16, marginBottom: 16 },
  compactCardHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
  compactCardIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: "rgba(246,231,198,0.54)", alignItems: "center", justifyContent: "center" },
  compactCardCopy: { flex: 1, minWidth: 0 },
  compactCardTitle: { color: colors.navy, fontFamily: "Georgia", fontSize: 18, lineHeight: 23 },
  compactCardText: { color: colors.bodyDark, fontSize: 12.5, lineHeight: 18, marginTop: 3 },
  recentPlayedList: { gap: 8, marginTop: 13 },
  recentPlayedRow: { minHeight: 38, borderRadius: 12, backgroundColor: "rgba(246,231,198,0.35)", flexDirection: "row", alignItems: "center", gap: 9, paddingHorizontal: 12 },
  recentPlayedTitle: { flex: 1, minWidth: 0, color: colors.navy, fontSize: 12.5, fontWeight: "800" },
  compactTextButton: { alignSelf: "flex-start", minHeight: 36, marginTop: 12, borderRadius: 999, flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, backgroundColor: "rgba(246,231,198,0.40)" },
  compactTextButtonLabel: { color: colors.gold, fontSize: 12, fontWeight: "900" },
  whatsappCard: { minHeight: 94, borderRadius: 22, padding: 16, marginBottom: 16, flexDirection: "row", alignItems: "center", gap: 13, overflow: "hidden", ...shadows.card },
  whatsappIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: "rgba(255,255,255,0.14)", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(255,255,255,0.18)" },
  whatsappCopy: { flex: 1, minWidth: 0 },
  whatsappTitle: { color: "#FFFFFF", fontFamily: "Georgia", fontSize: 18, lineHeight: 23 },
  whatsappText: { color: "rgba(255,255,255,0.82)", fontSize: 12, lineHeight: 18, marginTop: 4 },
  testimonialCard: { padding: 18, marginBottom: 18 },
  testimonialHead: { flexDirection: "row", alignItems: "center", gap: 9, marginBottom: 10 },
  testimonialQuote: { color: colors.navy, fontFamily: "Georgia", fontSize: 21, lineHeight: 29 },
  testimonialAuthor: { color: colors.gold, fontSize: 13, fontWeight: "900", marginTop: 12 },
  playImage: { width: 84, height: 72, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  playImageLarge: { width: "100%", height: 152, marginBottom: 14 },
  playImageRadius: { borderRadius: 14 },
  playButton: { width: 42, height: 42, borderRadius: 21, backgroundColor: "rgba(255,253,248,0.90)", alignItems: "center", justifyContent: "center", ...shadows.soft },
  playButtonLarge: { width: 62, height: 62, borderRadius: 31 },
  centerHeader: { minHeight: 84, flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 },
  headerSide: { width: 54, alignItems: "center" },
  centerTitleWrap: { alignItems: "center", flex: 1 },
  centerTitle: { color: colors.navy, fontFamily: "Georgia", fontSize: 32, lineHeight: 38 },
  titleDivider: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 5 },
  titleLine: { width: 46, height: 1, backgroundColor: colors.goldBorder },
  liveSessionCard: { padding: 10, marginBottom: 22, borderRadius: 26 },
  liveImage: { height: 218, justifyContent: "flex-start", padding: 14, overflow: "hidden" },
  liveImageRadius: { borderRadius: 22 },
  liveBadge: { alignSelf: "flex-start", overflow: "hidden", backgroundColor: "#EF4444", color: "#FFFFFF", fontSize: 12, fontWeight: "900", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 7 },
  livePanel: { marginTop: -42, backgroundColor: "rgba(255,253,248,0.97)", borderRadius: 22, padding: 18, borderWidth: 1, borderColor: colors.border, gap: 12 },
  liveTitle: { color: colors.navy, fontFamily: "Georgia", fontSize: 22, lineHeight: 28 },
  liveMetaRow: { flexDirection: "row", flexWrap: "wrap", gap: 14 },
  fullNavyButton: { minHeight: 54, borderRadius: 12 },
  fullOutlineButton: { minHeight: 52, borderRadius: 12 },
  sectionTitle: { color: colors.navy, fontFamily: "Georgia", fontSize: 20, lineHeight: 26, fontWeight: "700" },
  sessionListRow: { flexDirection: "row", alignItems: "center", gap: 14, padding: 13, marginBottom: 12 },
  dateTile: { width: 58, height: 58, borderRadius: 14, backgroundColor: "rgba(255,247,231,0.82)", borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center" },
  dateDay: { color: colors.navy, fontFamily: "Georgia", fontSize: 22, lineHeight: 25 },
  dateMonth: { color: colors.bodyDark, fontSize: 11, fontWeight: "900" },
  sessionRowCopy: { flex: 1, minWidth: 0 },
  rowTitle: { color: colors.navy, fontFamily: "Georgia", fontSize: 17, lineHeight: 22 },
  rowSub: { color: colors.bodyDark, fontSize: 12, lineHeight: 17, marginTop: 4 },
  pastRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 12 },
  searchRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 14 },
  searchBox: { flex: 1, height: 50, borderRadius: 13, borderWidth: 1, borderColor: colors.border, backgroundColor: "rgba(255,253,248,0.86)", flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 14 },
  searchInput: { flex: 1, height: "100%", color: colors.navy, fontSize: 14, paddingVertical: 0 },
  chipRow: { gap: 10, paddingHorizontal: 2, paddingRight: 24, paddingBottom: 18 },
  chip: { overflow: "hidden", paddingHorizontal: 19, paddingVertical: 11, borderRadius: 999, borderWidth: 1, borderColor: "rgba(201,147,50,0.14)", backgroundColor: "rgba(255,255,255,0.92)", color: colors.navy, fontSize: 13, fontWeight: "800", ...shadows.soft },
  chipActive: { backgroundColor: colors.gold, borderColor: colors.gold, color: "#FFFFFF" },
  locationChipRow: { gap: 8, paddingHorizontal: 2, paddingRight: 24, paddingBottom: 14 },
  locationChip: { overflow: "hidden", paddingHorizontal: 15, paddingVertical: 9, borderRadius: 999, borderWidth: 1, borderColor: "rgba(132,115,170,0.22)", backgroundColor: "rgba(255,255,255,0.9)", color: colors.navy, fontSize: 12, fontWeight: "800" },
  locationChipActive: { backgroundColor: "#8473AA", borderColor: "#8473AA", color: "#FFFFFF" },
  sectionHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 8, marginBottom: 12 },
  viewAll: { color: colors.gold, fontSize: 13, fontWeight: "900" },
  featuredScroll: { gap: 12, paddingRight: 24, paddingBottom: 16 },
  featuredCard: { width: 286, height: 206, borderRadius: 20, overflow: "hidden", justifyContent: "center" },
  featuredRadius: { borderRadius: 20 },
  featuredOverlay: { ...StyleSheet.absoluteFill },
  featuredPlay: { alignSelf: "center", width: 58, height: 58, borderRadius: 29, backgroundColor: "rgba(255,253,248,0.92)", alignItems: "center", justifyContent: "center" },
  featuredCopy: { position: "absolute", left: 16, right: 16, bottom: 16 },
  featuredBadge: { alignSelf: "flex-start", overflow: "hidden", backgroundColor: colors.gold, color: "#FFFFFF", fontSize: 11, fontWeight: "900", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 7, marginBottom: 6 },
  featuredTitle: { color: "#FFFFFF", fontSize: 16, fontWeight: "900", textShadowColor: "rgba(17,29,58,0.32)", textShadowRadius: 6 },
  featuredMeta: { color: "rgba(255,255,255,0.88)", fontSize: 12, marginTop: 3 },
  audioRow: { flexDirection: "row", alignItems: "center", gap: 12, minHeight: 92, borderRadius: 18, borderWidth: 1, borderColor: colors.border, backgroundColor: "rgba(255,253,248,0.88)", padding: 10, marginBottom: 10, ...shadows.soft },
  audioRowCopy: { flex: 1, minWidth: 0 },
  audioRowTitle: { color: colors.navy, fontSize: 14, fontWeight: "900", lineHeight: 19 },
  audioRowMeta: { color: colors.bodyDark, fontSize: 12, marginTop: 4 },
  videoPreviewScroll: { gap: 12, paddingRight: 24, paddingBottom: 14 },
  videoPreviewCard: { width: 142, height: 94, borderRadius: 16, overflow: "hidden", ...shadows.soft },
  videoPreviewImage: { width: "100%", height: "100%" },
  videoPreviewPlay: { position: "absolute", top: 29, left: 53, width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(255,253,248,0.92)", alignItems: "center", justifyContent: "center" },
  audioLibraryHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", minHeight: 56, marginBottom: 22 },
  audioLibraryIntro: { flexDirection: "row", alignItems: "flex-end", gap: 10, marginBottom: 18 },
  audioLibraryIntroNarrow: { flexWrap: "wrap", alignItems: "stretch" },
  audioLibraryCopy: { flex: 1, minWidth: 0 },
  audioLibraryCopyNarrow: { width: "100%", flexBasis: "100%" },
  audioLibraryTitle: { color: colors.navy, fontFamily: "Georgia", fontSize: 31, lineHeight: 37 },
  audioLibrarySubtitle: { color: colors.bodyDark, fontSize: 12.5, lineHeight: 18, marginTop: 5 },
  audioSearchBox: { flex: 1.08, minWidth: 156, minHeight: 52, borderRadius: 16, borderWidth: 1, borderColor: "rgba(201,147,50,0.18)", backgroundColor: "rgba(255,253,248,0.92)", flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 13, ...shadows.soft },
  audioSearchInput: { flex: 1, minWidth: 0, color: colors.navy, fontSize: 13.5, paddingVertical: 0 },
  clearSearch: { width: 22, height: 22, borderRadius: 11, alignItems: "center", justifyContent: "center", backgroundColor: colors.goldWash },
  clearSearchText: { color: colors.gold, fontSize: 18, lineHeight: 20, fontWeight: "700" },
  audioFilterButton: { width: 52, height: 52, borderRadius: 16, borderWidth: 1, borderColor: "rgba(201,147,50,0.18)", backgroundColor: "rgba(255,253,248,0.92)", alignItems: "center", justifyContent: "center", ...shadows.soft },
  audioFeaturedCard: { minHeight: 242, padding: 20, marginBottom: 20, borderRadius: 26 },
  audioFeaturedCopy: { width: "58%", minWidth: 0, zIndex: 2 },
  audioFeaturedLabel: { flexDirection: "row", alignItems: "center", alignSelf: "flex-start", gap: 5, paddingHorizontal: 9, paddingVertical: 5, borderRadius: 999, backgroundColor: "rgba(246,231,198,0.58)", marginBottom: 12 },
  audioFeaturedLabelText: { color: colors.gold, fontSize: 10.5, fontWeight: "900", letterSpacing: 0.4 },
  audioFeaturedTitle: { color: colors.navy, fontFamily: "Georgia", fontSize: 23, lineHeight: 28 },
  audioFeaturedDescription: { color: colors.bodyDark, fontSize: 13, lineHeight: 19, marginTop: 8 },
  audioFeaturedMeta: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 8, marginTop: 12 },
  audioFeaturedCategory: { overflow: "hidden", color: colors.gold, backgroundColor: colors.goldWash, paddingHorizontal: 9, paddingVertical: 4, borderRadius: 999, fontSize: 11, fontWeight: "800" },
  audioFeaturedAction: { alignSelf: "flex-start", minHeight: 44, borderRadius: 22, backgroundColor: colors.gold, flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 17, marginTop: 15, ...shadows.softGold },
  audioFeaturedActionText: { color: "#FFFFFF", fontSize: 13, fontWeight: "900" },
  audioFeaturedArt: { position: "absolute", top: 0, right: 0, bottom: 0, width: "54%", height: "100%", borderTopRightRadius: 26, borderBottomRightRadius: 26, borderTopLeftRadius: 144, borderBottomLeftRadius: 144, opacity: 0.94 },
  audioCategoryScroll: { gap: 10, paddingRight: 24, paddingBottom: 20 },
  audioCategoryTile: { width: 120, minHeight: 146, borderRadius: 18, borderWidth: 1, borderColor: "rgba(201,147,50,0.16)", backgroundColor: "rgba(255,253,248,0.9)", alignItems: "center", justifyContent: "center", paddingHorizontal: 8, ...shadows.soft },
  audioCategoryIcon: { width: 58, height: 58, borderRadius: 29, backgroundColor: "rgba(246,231,198,0.5)", alignItems: "center", justifyContent: "center", marginBottom: 10 },
  audioCategoryName: { color: colors.navy, fontFamily: "Georgia", fontSize: 16, lineHeight: 20, textAlign: "center" },
  audioCategoryCount: { color: colors.bodyDark, fontSize: 11.5, lineHeight: 16, marginTop: 5 },
  moreProfileCard: { flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 14 },
  profilePhoto: { width: 68, height: 68, borderRadius: 34, overflow: "hidden", backgroundColor: colors.navy, alignItems: "center", justifyContent: "center" },
  profilePhotoImage: { width: "100%", height: "100%", borderRadius: 999 },
  profilePhotoText: { color: "#FFFFFF", fontSize: 28, fontWeight: "900" },
  moreProfileCopy: { flex: 1, minWidth: 0 },
  moreName: { color: colors.navy, fontSize: 17, fontWeight: "900" },
  moreEmail: { color: colors.bodyDark, fontSize: 12, marginTop: 4 },
  sacredMember: { alignSelf: "flex-start", overflow: "hidden", marginTop: 8, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, backgroundColor: colors.gold, color: "#FFFFFF", fontSize: 11, fontWeight: "900" },
  moreListCard: { padding: 0, marginBottom: 14 },
  moreRow: { minHeight: 54, flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: colors.border },
  moreRowIcon: { width: 24, alignItems: "center" },
  moreRowLabel: { flex: 1, color: colors.navy, fontSize: 14, fontWeight: "800" },
  moreTrailing: { maxWidth: "42%", flexShrink: 1, color: colors.gold, fontWeight: "900" },
  dangerZoneCard: { marginTop: 2, borderColor: "rgba(185, 28, 28, 0.28)", gap: 8 },
  dangerZoneTitle: { color: colors.danger, fontFamily: "Georgia", fontSize: 18, lineHeight: 24 },
  dangerZoneBody: { color: colors.bodyDark, fontSize: 12, lineHeight: 18 },
  deleteAccountButton: { minHeight: 48, marginTop: 4, borderRadius: 12, borderWidth: 1, borderColor: colors.danger, alignItems: "center", justifyContent: "center" },
  deleteAccountButtonDisabled: { opacity: 0.55 },
  deleteAccountText: { color: colors.danger, fontSize: 13, fontWeight: "900" },
  blessingCard: { minHeight: 116, borderRadius: 18, backgroundColor: colors.navy, overflow: "hidden", padding: 18, flexDirection: "row", alignItems: "center", gap: 16, marginBottom: 14 },
  blessingOm: { width: 82, height: 82, opacity: 0.92 },
  blessingTitle: { color: colors.goldSoft, fontFamily: "Georgia", fontSize: 20, lineHeight: 25 },
  blessingText: { color: "#FFFFFF", fontSize: 13, lineHeight: 19, marginTop: 5, maxWidth: 210 },
  logoutButton: { minHeight: 52, alignItems: "center", justifyContent: "center" },
  logoutText: { color: colors.danger, fontWeight: "900" },
  profileHero: { height: 264, marginHorizontal: 0, justifyContent: "flex-end", paddingHorizontal: 22, paddingBottom: 22, marginBottom: 16, borderRadius: 30, overflow: "hidden", borderWidth: 1, borderColor: colors.goldBorder, backgroundColor: colors.navy, ...shadows.soft },
  profileHeroCompact: { height: 236, paddingHorizontal: 16, paddingBottom: 18, borderRadius: 26 },
  profileHeroImage: { borderRadius: 28 },
  profileHeroVeil: { ...StyleSheet.absoluteFill, borderRadius: 28 },
  profileHeroContent: { flexDirection: "row", alignItems: "center", gap: 16 },
  profileHeroContentCompact: { gap: 12 },
  profileAvatarLarge: { width: 98, height: 98, borderRadius: 49, overflow: "hidden", backgroundColor: colors.navy, borderWidth: 4, borderColor: "#FFFFFF", alignItems: "center", justifyContent: "center", ...shadows.card },
  profileAvatarLargeCompact: { width: 76, height: 76, borderRadius: 38, borderWidth: 3 },
  profileAvatarImage: { width: "100%", height: "100%", borderRadius: 999 },
  profileAvatarText: { color: "#FFFFFF", fontSize: 42, fontWeight: "900" },
  profileAvatarTextCompact: { fontSize: 32 },
  profileIdentity: { flex: 1, minWidth: 0 },
  profileName: { color: "#FFFFFF", fontFamily: "Georgia", fontSize: 28, lineHeight: 34, textShadowColor: "rgba(0,0,0,0.30)", textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 5 },
  profileNameCompact: { fontSize: 22, lineHeight: 27 },
  profileMemberRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 6 },
  profileMember: { color: "#FFD88B", fontWeight: "900" },
  profileEmail: { color: "rgba(255,255,255,0.90)", fontSize: 14, marginTop: 10 },
  profileEmailCompact: { fontSize: 12.5, marginTop: 8 },
  profileMeta: { color: "rgba(255,255,255,0.76)", fontSize: 13, marginTop: 6 },
  profileEditorCard: { marginBottom: 16, gap: 13 },
  profileEditorTitle: { color: colors.navy, fontFamily: "Georgia", fontSize: 20, lineHeight: 26 },
  profileField: { gap: 6 },
  profileFieldLabel: { color: colors.bodyDark, fontSize: 12, fontWeight: "800" },
  profileFieldInput: { minHeight: 48, borderRadius: 12, borderWidth: 1, borderColor: colors.border, backgroundColor: "#FFFFFF", color: colors.navy, fontSize: 14, paddingHorizontal: 14 },
  profileFieldInputDisabled: { backgroundColor: colors.goldWash, color: colors.bodyDark },
  profileEditorActions: { flexDirection: "row", gap: 10, marginTop: 4 },
  profileEditorButton: { flex: 1, minHeight: 48 },
  statsCard: { flexDirection: "row", alignItems: "center", justifyContent: "center", padding: 20, marginBottom: 16 },
  profileStat: { flex: 1, alignItems: "center", gap: 5 },
  profileStatValue: { color: colors.navy, fontFamily: "Georgia", fontSize: 31, lineHeight: 36 },
  profileStatLabel: { color: colors.bodyDark, fontSize: 11, textAlign: "center", lineHeight: 15 },
  profileBanner: { height: 146, borderRadius: 22, overflow: "hidden", padding: 21, justifyContent: "center", marginBottom: 18 },
  profileBannerImage: { borderRadius: 18 },
  profileBannerOverlay: { ...StyleSheet.absoluteFill },
  profileBannerTitle: { color: "#FFFFFF", fontFamily: "Georgia", fontSize: 23, lineHeight: 29 },
  profileBannerText: { color: "#FFFFFF", fontSize: 15, lineHeight: 22, marginTop: 6, maxWidth: 220 },
  profileSectionHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 },
  activityScroll: { gap: 10, paddingRight: 24, paddingBottom: 16 },
  activityTile: { width: 132, height: 98, borderRadius: 18, borderWidth: 1, borderColor: colors.border, backgroundColor: "rgba(255,253,248,0.92)", alignItems: "center", justifyContent: "center", gap: 10, ...shadows.soft },
  activityText: { color: colors.navy, fontSize: 12, fontWeight: "800", textAlign: "center" },
  videoHero: { height: 246, marginHorizontal: 0, justifyContent: "center", paddingHorizontal: 26, marginBottom: 16, borderRadius: 30, overflow: "hidden", borderWidth: 1, borderColor: colors.goldBorder, backgroundColor: colors.navy, ...shadows.soft },
  videoHeroCompact: { height: 224, paddingHorizontal: 20, borderRadius: 26 },
  videoHeroImage: { borderRadius: 28 },
  videoHeroVeil: { ...StyleSheet.absoluteFill, borderRadius: 28 },
  videoHeroCopy: { width: "57%", minWidth: 220 },
  videoHeroCopyCompact: { width: "68%", minWidth: 0 },
  videoHeroRule: { width: 46, height: 3, borderRadius: 999, backgroundColor: "#E7B14D", marginBottom: 13 },
  videoHeroTitle: { color: "#FFFFFF", fontFamily: "Georgia", fontSize: 29, lineHeight: 35, textShadowColor: "rgba(0,0,0,0.30)", textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 5 },
  videoHeroTitleCompact: { fontSize: 24, lineHeight: 29 },
  videoHeroText: { color: "rgba(255,255,255,0.86)", fontSize: 15, lineHeight: 23, marginTop: 10, maxWidth: 294 },
  videoHeroTextCompact: { fontSize: 13, lineHeight: 19, marginTop: 8 },
  videoFeaturedCard: { padding: 12, marginBottom: 18, flexDirection: "row", gap: 13, alignItems: "center", minHeight: 174, borderRadius: 24 },
  videoFeaturedCardCompact: { flexDirection: "column", alignItems: "stretch", minHeight: 0 },
  videoFeaturedThumb: { width: 146, height: 130, borderRadius: 17, overflow: "hidden", alignItems: "center", justifyContent: "center", backgroundColor: colors.goldWash },
  videoFeaturedThumbCompact: { width: "100%", height: 158 },
  videoFeaturedThumbRadius: { borderRadius: 16 },
  videoFeaturedPlay: { width: 50, height: 50, borderRadius: 25, backgroundColor: "rgba(255,253,248,0.92)", alignItems: "center", justifyContent: "center", ...shadows.soft },
  videoFeaturedCopy: { flex: 1, minWidth: 0, paddingRight: 2 },
  videoFeaturedTitle: { color: colors.navy, fontFamily: "Georgia", fontSize: 17, lineHeight: 21, marginBottom: 7 },
  videoFeaturedDesc: { color: colors.body, fontSize: 13, lineHeight: 18 },
  videoMetaLine: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 12, flexWrap: "wrap" },
  videoMetaText: { color: colors.bodyDark, fontSize: 13 },
  videoCategory: { overflow: "hidden", color: colors.gold, backgroundColor: colors.goldWash, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, fontSize: 12, fontWeight: "900" },
  videoListHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 },
  videoListActions: { flexDirection: "row", alignItems: "center", gap: 8 },
  videoSortButton: { minHeight: 42, borderRadius: 12, borderWidth: 1, borderColor: colors.border, backgroundColor: "rgba(255,253,248,0.92)", flexDirection: "row", alignItems: "center", gap: 7, paddingHorizontal: 12, ...shadows.soft },
  videoSortText: { color: colors.navy, fontSize: 11.5, fontWeight: "800" },
  videoFilterButton: { width: 42, height: 42, borderRadius: 12, borderWidth: 1, borderColor: colors.border, backgroundColor: "rgba(255,253,248,0.92)", alignItems: "center", justifyContent: "center", ...shadows.soft },
  resultCount: { color: colors.bodyDark, fontSize: 12, fontWeight: "800" },
  videoRow: { flexDirection: "row", alignItems: "center", gap: 13, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: "rgba(201,147,50,0.14)" },
  videoRowCompact: { gap: 10 },
  videoThumbWrap: { width: 124, height: 80, borderRadius: 14, overflow: "hidden" },
  videoThumbWrapCompact: { width: 106, height: 72 },
  videoThumb: { width: "100%", height: "100%" },
  videoRowPlay: { position: "absolute", top: 21, left: 45, width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(255,253,248,0.92)", alignItems: "center", justifyContent: "center" },
  videoRowCopy: { flex: 1, minWidth: 0 },
  videoRowTitle: { color: colors.navy, fontFamily: "Georgia", fontSize: 16, lineHeight: 21 },
  videoRowMeta: { flexDirection: "row", alignItems: "center", gap: 7, marginTop: 8, flexWrap: "wrap" },
  videoRowMetaText: { color: colors.bodyDark, fontSize: 12 },
  videoPill: { overflow: "hidden", color: colors.gold, backgroundColor: colors.goldWash, paddingHorizontal: 9, paddingVertical: 4, borderRadius: 999, fontSize: 11, fontWeight: "900" }
});

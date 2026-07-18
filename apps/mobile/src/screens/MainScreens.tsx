import {
  DISCLAIMER,
  HOME_SHORTCUTS,
  SACRED_KEY_LENGTH,
  formatDuration,
  getRecordingState,
  type PageContent,
  type Program,
  type Resource,
  type SacredEvent,
  type Session,
  type Video
} from "@sacred-circle/lib";
import Slider from "@react-native-community/slider";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import { LinearGradient } from "expo-linear-gradient";
import * as Linking from "expo-linking";
import type { ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Alert, ImageBackground, Pressable, StyleSheet, Text, TextInput, useWindowDimensions, View } from "react-native";
import LottieView from "lottie-react-native";
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming
} from "react-native-reanimated";
import {
  Bell,
  BookOpen,
  CalendarDays,
  ChevronRight,
  Headphones,
  Lock,
  LogOut,
  Mail,
  Menu,
  MessageCircle,
  Pause,
  Play,
  RotateCcw,
  RotateCw,
  Sparkles,
  Unlock,
  Video as VideoIcon
} from "lucide-react-native";
import {
  AppHeader,
  AppLogoHeader,
  BodyText,
  CategoryCard,
  CommunityCard,
  EmptyState,
  EventCard,
  LightScreen,
  LogoMark,
  LogoSymbol,
  MetaText,
  MiniAudioPlayer,
  PlainScreen,
  PremiumCard,
  PrimaryButton,
  QuoteCard,
  SacredAccessKeyCard,
  SecondaryButton,
  SectionTitle,
  SessionCard,
  StatusBadge,
  TextField
} from "../components/Sacred";
import { FadeUp, PremiumOrbitRings, useReducedMotionFlag } from "../components/Motion";
import { useAuth } from "../context/AuthContext";
import { colors, radii, shadows, spacing } from "../theme";
import {
  getPlayableResourceUrl,
  createContactSubmission,
  listAnnouncements,
  listEvents,
  listPages,
  listPrograms,
  listResources,
  listSessions,
  listSettings,
  listVideos,
  registerForEvent,
  registerForSession
} from "../services/repository";
import { recordRecentlyPlayedAudio } from "../services/playbackHistory";
import quoteLakeBackground from "../assets/reference/quote-lake-background.png";
import audioMeditation from "../assets/reference/audio-meditation.png";
import shivirTemple from "../assets/reference/shivir-temple.png";
import unlockSuccessAnimation from "../assets/animations/unlock-success.json";

function useAppData() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [events, setEvents] = useState<SacredEvent[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [pages, setPages] = useState<PageContent[]>([]);
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [announcement, setAnnouncement] = useState<string>("");

  useEffect(() => {
    let active = true;
    const load = <T,>(label: string, request: Promise<T>, apply: (value: T) => void) => {
      void request.then((value) => {
        if (active) apply(value);
      }).catch((error) => {
        console.warn(`Unable to load ${label}`, error);
      });
    };
    load("sessions", listSessions(), setSessions);
    load("resources", listResources(), setResources);
    load("programs", listPrograms(), setPrograms);
    load("events", listEvents(), setEvents);
    load("videos", listVideos(), setVideos);
    load("pages", listPages(), setPages);
    load("settings", listSettings(), (nextSettings) => setSettings(Object.fromEntries(nextSettings.map((setting) => [setting.key, setting.value]))));
    load("announcements", listAnnouncements(), (nextAnnouncements) => setAnnouncement(nextAnnouncements[0] ? `${nextAnnouncements[0].title}: ${nextAnnouncements[0].message}` : ""));
    return () => {
      active = false;
    };
  }, []);

  return { sessions, resources, programs, events, videos, pages, settings, announcement };
}

function nextSessionOf(sessions: Session[]) {
  return sessions.find((session) => session.status === "live") || sessions.find((session) => session.status === "upcoming") || sessions[0];
}

function protectedResourceFor(session: Session, resources: Resource[]) {
  return resources.find((resource) => resource.access_type === "session_protected" && resource.session_id === session.id);
}

function isPlaceholderUrl(url?: string | null) {
  const value = (url || "").trim();
  return !value || value === "https://wa.me/" || value.includes("1234567890");
}

function openUrl(url?: string | null, message = "The Sacred Circle team has not added this link yet.") {
  if (isPlaceholderUrl(url)) {
    Alert.alert("Not available yet", message);
    return;
  }
  Linking.openURL(String(url)).catch(() => {
    Alert.alert("Could not open link", "Please try again in a moment.");
  });
}

export function HomeScreen({ navigation }: any) {
  const { profile, userId } = useAuth();
  const { sessions, resources, settings } = useAppData();
  const { width } = useWindowDimensions();
  const isWide = width >= 860;
  const isPhone = width < 520;
  const nextSession = nextSessionOf(sessions);
  const lastPlayed = resources.find((resource) => resource.type === "audio" && resource.access_type === "public");
  const lockedRecording = resources.find((resource) => resource.access_type === "session_protected");
  const firstName = profile?.name && profile.name !== "Sacred Seeker" ? profile.name.split(/\s+/)[0]?.replace(/[^A-Za-z]/g, "") : "";
  const formattedName = firstName ? `${firstName.slice(0, 1).toUpperCase()}${firstName.slice(1).toLowerCase()}` : "";
  const displayName = formattedName && formattedName.length <= 10 ? formattedName : "Seeker";
  const audioResources = resources.filter((resource) => resource.type === "audio");
  const categoryCount = (category: string) => {
    const count = audioResources.filter((resource) => resource.category === category).length;
    return `${count} ${count === 1 ? "Audio" : "Audios"}`;
  };
  const homeQuote = settings.home_quote || "The light within\nyou is the same\nlight that illuminates\nthe universe.";
  const homeQuoteAuthor = settings.home_quote_author || "Mahavatar Babaji";

  async function register(session: Session) {
    if (!userId) return;
    await registerForSession(userId, session.id);
    Alert.alert("Registered", "You are registered for the Sunday session.");
  }

  function openKeyTarget() {
    const sessionId = lockedRecording?.session_id || sessions.find((session) => session.status === "completed")?.id;
    if (!sessionId) Alert.alert("No recording yet", "A protected recording will appear after a session is uploaded.");
    else navigation.navigate("SessionDetail", { session: sessions.find((session) => session.id === sessionId) });
  }

  return (
    <LightScreen>
      <FadeUp delay={0}>
        <View style={local.homeTopBar}>
          <View style={[local.menuButton, isPhone && local.menuButtonPhone]}>
            <Menu color={colors.navy} size={isPhone ? 18 : 23} />
          </View>
          <LogoSymbol size={isPhone ? 64 : 76} />
          <View style={[local.homeActions, isPhone && local.homeActionsPhone]}>
            <View style={[local.notifyWrap, isPhone && local.notifyWrapPhone]}>
              <Bell color={colors.navy} size={isPhone ? 18 : 23} />
              <View style={[local.notifyDot, isPhone && local.notifyDotPhone]} />
            </View>
            <View style={[local.avatar, isPhone && local.avatarPhone]}><Text style={[local.avatarText, isPhone && local.avatarTextPhone]}>{displayName.slice(0, 1)}</Text></View>
          </View>
        </View>
      </FadeUp>

      <FadeUp delay={80}>
        <View style={local.homeIntro}>
          <Text style={[local.homeGreeting, isPhone && local.homeGreetingPhone]}>Namaste, {displayName} Ji</Text>
          <View style={local.homeRule} />
          <Text style={[local.homeSubtext, isPhone && local.homeSubtextPhone]}>Welcome to your sacred space of healing,{"\n"}meditation and inner awakening.</Text>
        </View>
      </FadeUp>

      <View style={[local.heroGrid, isPhone && local.heroGridPhone, isWide && local.heroGridWide]}>
        <FadeUp delay={160} style={[local.sessionColumn, isPhone && local.sessionColumnPhone]}>
          <SessionCard
            onJoin={() => openUrl(nextSession?.zoom_link)}
            onRegister={() => nextSession && register(nextSession)}
          />
        </FadeUp>
        <FadeUp delay={260} style={[local.quoteColumn, isPhone && local.quoteColumnPhone]}>
          <QuoteImageCard wide={isWide} compact={isPhone} quote={homeQuote} author={homeQuoteAuthor} />
        </FadeUp>
      </View>

      <View style={[local.twoColumn, isPhone && local.twoColumnPhone, isWide && local.twoColumnWide]}>
        <FadeUp delay={340} style={local.flexOne}>
          <SacredAccessKeyCard onUnlock={openKeyTarget} />
        </FadeUp>
        <FadeUp delay={430} style={local.flexOne}>
          <MiniAudioPlayer imageSource={audioMeditation} onPlay={() => lastPlayed && navigation.navigate("AudioPlayer", { resource: lastPlayed })} />
        </FadeUp>
      </View>

      <View style={[local.categoryGrid, isPhone && local.categoryGridPhone]}>
        <FadeUp delay={500} style={local.categoryCell}>
          <CategoryCard title="Healing" subtitle="Restore & Rebalance" count={categoryCount("Healing")} tone="purple" icon={<Sparkles color="#7E6ACC" size={isPhone ? 28 : 48} strokeWidth={1.3} />} onPress={() => navigation.navigate("Tabs", { screen: "Meditations" })} />
        </FadeUp>
        <FadeUp delay={580} style={local.categoryCell}>
          <CategoryCard title="Guided Meditation" subtitle="Mindful Practices" count={categoryCount("Guided Meditation")} tone="green" icon={<Headphones color="#5A9D83" size={isPhone ? 28 : 48} strokeWidth={1.3} />} onPress={() => navigation.navigate("Tabs", { screen: "Meditations" })} />
        </FadeUp>
        <FadeUp delay={660} style={local.categoryCell}>
          <CategoryCard title="Babaji Wisdom" subtitle="Teachings & Discourses" count={categoryCount("Babaji Wisdom")} tone="gold" icon={<BookOpen color={colors.gold} size={isPhone ? 28 : 48} strokeWidth={1.3} />} onPress={() => navigation.navigate("Tabs", { screen: "Meditations" })} />
        </FadeUp>
        <FadeUp delay={740} style={local.categoryCell}>
          <CategoryCard title="Manifestation" subtitle="Create Your Reality" count={categoryCount("Manifestation")} tone="blue" icon={<Sparkles color="#5F8DB6" size={isPhone ? 28 : 48} strokeWidth={1.3} />} onPress={() => navigation.navigate("Tabs", { screen: "Meditations" })} />
        </FadeUp>
      </View>

      <View style={[local.bottomGrid, isPhone && local.bottomGridPhone, isWide && local.bottomGridWide]}>
        <FadeUp delay={820} style={local.eventColumn}>
          <EventCard imageSource={shivirTemple} onRegister={() => navigation.navigate("Events")} />
        </FadeUp>
        <FadeUp delay={920} style={local.rightStack}>
          <QuoteCard />
          <CommunityCard onJoin={() => openUrl(settings.whatsapp_group_url)} />
        </FadeUp>
      </View>
    </LightScreen>
  );
}

export function SessionsScreen({ navigation }: any) {
  const { userId } = useAuth();
  const { sessions, resources, settings } = useAppData();
  const upcoming = sessions.filter((session) => session.status === "upcoming" || session.status === "live");
  const past = sessions.filter((session) => session.status === "completed");

  async function register(session: Session) {
    if (!userId) return;
    await registerForSession(userId, session.id);
    Alert.alert("Registered", "You are registered for this session.");
  }

  return (
    <LightScreen>
      <LogoMark compact />
      <AppHeader title="Sessions" subtitle="Join Sunday on Zoom, then use the six-digit key each time you play a protected recording." />
      <SectionTitle title="Upcoming Session" />
      {upcoming.length ? upcoming.map((session) => (
        <SessionSummaryCard
          key={session.id}
          session={session}
          primaryLabel="Join Zoom"
          onPrimary={() => openUrl(session.zoom_link || settings.default_zoom_link)}
          secondaryLabel="Register"
          onSecondary={() => register(session)}
          onPress={() => navigation.navigate("SessionDetail", { session })}
        />
      )) : <EmptyState title="No upcoming session" body="The next Sunday session will be listed here." />}

      <SectionTitle title="Past Sessions" />
      {past.map((session) => {
        const resource = protectedResourceFor(session, resources);
        const state = getRecordingState(resource);
        return (
          <PastSessionCard
            key={session.id}
            session={session}
            state={state}
            onPress={() => navigation.navigate("SessionDetail", { session })}
          />
        );
      })}
      {!past.length ? <EmptyState title="No past sessions yet" body="Completed Sunday sessions will appear here." /> : null}
    </LightScreen>
  );
}

export function MeditationsScreen({ navigation }: any) {
  const { resources } = useAppData();
  const freeResources = resources.filter((resource) => resource.type === "audio" && resource.access_type === "public");
  const protectedResources = resources.filter((resource) => resource.type === "audio" && resource.access_type === "session_protected");
  const freeCategories = useMemo(
    () => Array.from(new Set(freeResources.map((resource) => resource.category.trim()).filter(Boolean))).sort((a, b) => a.localeCompare(b)),
    [freeResources]
  );

  return (
    <LightScreen>
      <LogoMark compact />
      <AppHeader title="Meditations" subtitle="Free meditations are open. Sunday healing recordings unlock with the session key." />

      <SectionTitle title="Free Meditations" />
      <View style={local.categoryStack}>
        {freeCategories.map((category) => (
          <Text key={category} style={local.categoryPill}>{category}</Text>
        ))}
      </View>
      {freeResources.map((resource) => (
        <AudioResourceCard key={resource.id} resource={resource} unlocked onPress={() => navigation.navigate("AudioPlayer", { resource })} />
      ))}
      {!freeResources.length ? <EmptyState title="No published audio yet" body="Reviewed Sacred Circle audio will appear here when it is available." /> : null}

      <SectionTitle title="Session Recordings" />
      {protectedResources.map((resource) => (
        <AudioResourceCard
          key={resource.id}
          resource={resource}
          unlocked={false}
          onPress={() => navigation.navigate("SessionDetail", { session: { id: resource.session_id, title: resource.title, description: resource.description, session_date: "", status: "completed" } })}
        />
      ))}
      {!protectedResources.length ? <EmptyState title="No session recordings yet" body="Protected Sunday healing recordings will appear here after upload." /> : null}
    </LightScreen>
  );
}

export function MoreScreen({ navigation }: any) {
  const { signOut } = useAuth();
  const { settings } = useAppData();
  const items = [
    ["Programs", "Healing, manifestation and spiritual wisdom programs", "Programs"],
    ["Events", "Upcoming events and shivirs", "Events"],
    ["Videos", "YouTube teachings and video links", "Videos"],
    ["About Sacred Circle", "Mission and mentor information", "About"],
    ["Contact", "Email, Sunday timing and WhatsApp", "Contact"],
    ["WhatsApp Group", "Open community link", "whatsapp"],
    ["My Profile", "Name, email, phone and protected-recording access", "Profile"],
    ["Help", "Simple app help and privacy note", "Help"]
  ] as const;

  return (
    <LightScreen>
      <LogoMark compact />
      <AppHeader title="More" subtitle="All website content is here, without adding more bottom tabs." />
      {items.map(([title, subtitle, target]) => (
        <MoreItem
          key={title}
          title={title}
          subtitle={subtitle}
          onPress={() => target === "whatsapp" ? openUrl(settings.whatsapp_group_url) : navigation.navigate(target)}
        />
      ))}
      <Pressable style={local.logoutItem} onPress={signOut}>
        <LogOut color={colors.danger} size={20} />
        <Text style={local.logoutText}>Logout</Text>
      </Pressable>
    </LightScreen>
  );
}

export function SessionDetailScreen({ route, navigation }: any) {
  const routeSession = route.params.session as Session;
  const { sessions, resources } = useAppData();
  const session = sessions.find((item) => item.id === routeSession.id) || routeSession;
  const resource = resources.find((item) => item.access_type === "session_protected" && item.session_id === session.id);
  const { completeSacredKey } = useAuth();

  return (
    <LightScreen>
      <LogoMark compact />
      <AppHeader title={session.title} subtitle={session.topic || session.description} eyebrow="Sunday Session" />
      <PremiumCard>
        <MetaText>{session.session_date ? new Date(session.session_date).toLocaleString([], { dateStyle: "medium", timeStyle: "short" }) : "Date not added"}</MetaText>
        <BodyText>{session.description}</BodyText>
        <View style={local.buttonRow}>
          {session.zoom_link ? <PrimaryButton label="Join Zoom" onPress={() => openUrl(session.zoom_link)} /> : null}
          {session.status === "upcoming" ? <SecondaryButton label="Register" onPress={() => Alert.alert("Registered", "Your interest is saved from the Sessions tab.")} /> : null}
        </View>
      </PremiumCard>
      <PremiumCard>
        <StatusBadge label="Protected Healing Recording" tone={resource ? "warning" : "danger"} />
        <Text style={local.cardTitle}>{resource?.title || "Recording not uploaded"}</Text>
        <BodyText>{resource ? "Enter the six-digit key each time you open this protected recording." : "The recording has not been uploaded yet."}</BodyText>
        {resource ? (
          <SacredKeyBlock
            sessionId={session.id}
            onSuccess={async (accessCode) => navigation.navigate("AudioPlayer", { resource, accessCode })}
            completeSacredKey={completeSacredKey}
          />
        ) : null}
      </PremiumCard>
    </LightScreen>
  );
}

export function AudioPlayerScreen({ route }: any) {
  const resource = route.params.resource as Resource;
  const accessCode = typeof route.params.accessCode === "string" ? route.params.accessCode : undefined;
  const player = useAudioPlayer(null, { updateInterval: 250 });
  const playback = useAudioPlayerStatus(player);
  const { height, width } = useWindowDimensions();
  const [sourceReady, setSourceReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [scrubbing, setScrubbing] = useState(false);
  const [scrubSeconds, setScrubSeconds] = useState(0);
  const playing = playback.playing;
  const compactPlayer = height < 760 || width < 380;
  const positionSeconds = Math.max(0, playback.currentTime || 0);
  const durationSeconds = Math.max(0, playback.duration || resource.duration_seconds || 0);
  const displayedSeconds = Math.min(scrubbing ? scrubSeconds : positionSeconds, durationSeconds || 0);
  const isWaiting = loading || (playback.isBuffering && !playing);
  const playPulse = useSharedValue(1);

  useEffect(() => {
    void recordRecentlyPlayedAudio(resource.id);
  }, [resource.id]);

  useEffect(() => {
    if (playing) {
      playPulse.value = withRepeat(
        withSequence(
          withTiming(1.035, { duration: 1350, easing: Easing.inOut(Easing.sin) }),
          withTiming(1, { duration: 1350, easing: Easing.inOut(Easing.sin) })
        ),
        -1,
        false
      );
    } else {
      cancelAnimation(playPulse);
      playPulse.value = withTiming(1, { duration: 180 });
    }
  }, [playPulse, playing]);

  const playPulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: playPulse.value }]
  }));

  useEffect(() => () => {
    try {
      player.clearLockScreenControls();
    } catch {
      // The player may already have been released during screen teardown.
    }
  }, [player]);

  useEffect(() => {
    if (playback.didJustFinish) setCompleted(true);
  }, [playback.didJustFinish]);

  async function ensureSound() {
    if (sourceReady) return player;
    setLoading(true);
    const url = await getPlayableResourceUrl(resource, accessCode);
    if (!url) throw new Error("Audio URL not available");
    player.replace({ uri: url });
    player.setActiveForLockScreen(
      true,
      {
        title: resource.title,
        artist: "Sacred Circle",
        albumTitle: resource.category
      },
      {
        showSeekBackward: true,
        showSeekForward: true,
        isLiveStream: false
      }
    );
    setSourceReady(true);
    setLoading(false);
    return player;
  }

  async function toggle() {
    setCompleted(false);
    try {
      const player = await ensureSound();
      if (completed) {
        await player.seekTo(0);
        setCompleted(false);
      }
      if (playing) {
        player.pause();
      } else {
        player.play();
      }
    } catch {
      Alert.alert("Audio unavailable", "Please check your internet connection or try again later.");
    } finally {
      setLoading(false);
    }
  }

  async function seekBy(seconds: number) {
    try {
      const player = await ensureSound();
      const knownDuration = playback.duration || resource.duration_seconds || 0;
      const nextPositionSeconds = Math.max(0, Math.min(playback.currentTime + seconds, knownDuration));
      await player.seekTo(nextPositionSeconds);
      setCompleted(false);
    } catch {
      Alert.alert("Audio unavailable", "Please check your internet connection or try again later.");
    } finally {
      setLoading(false);
    }
  }

  async function seekTo(seconds: number) {
    setScrubbing(false);
    try {
      const player = await ensureSound();
      await player.seekTo(Math.max(0, Math.min(seconds, durationSeconds)));
      setCompleted(false);
    } catch {
      Alert.alert("Audio unavailable", "Please check your internet connection or try again later.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <PlainScreen>
      <View style={[local.player, compactPlayer && local.playerCompact]}>
        <View style={local.playerEyebrow}>
          <Headphones color={colors.gold} size={15} />
          <Text style={local.playerEyebrowText}>NOW PLAYING</Text>
        </View>

        <Animated.View style={[local.playerArtworkShell, compactPlayer && local.playerArtworkShellCompact, playPulseStyle]}>
          <ImageBackground source={audioMeditation} resizeMode="cover" style={local.playerArtwork} imageStyle={local.playerArtworkImage}>
            <LinearGradient colors={["rgba(17,29,58,0.03)", "rgba(17,29,58,0.48)"]} style={local.playerArtworkShade} />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={playing ? "Pause audio" : "Play audio"}
              onPress={toggle}
              disabled={loading}
              style={({ pressed }) => [local.playerArtworkButton, pressed && local.playerControlPressed]}
            >
              {isWaiting ? (
                <ActivityIndicator color="#FFFFFF" size="large" />
              ) : playing ? (
                <Pause color="#FFFFFF" fill="#FFFFFF" size={32} />
              ) : (
                <Play color="#FFFFFF" fill="#FFFFFF" size={32} />
              )}
            </Pressable>
          </ImageBackground>
        </Animated.View>

        <View style={local.playerCopy}>
          <Text numberOfLines={compactPlayer ? 2 : 3} adjustsFontSizeToFit minimumFontScale={0.78} style={[local.playerTitle, compactPlayer && local.playerTitleCompact]}>{resource.title}</Text>
          <Text style={local.playerCategory}>{resource.category || "Sacred Audio"}</Text>
        </View>

        <View style={local.playerTimeline}>
          <Slider
            accessibilityLabel="Audio position"
            minimumValue={0}
            maximumValue={Math.max(durationSeconds, 1)}
            value={displayedSeconds}
            step={1}
            minimumTrackTintColor={colors.gold}
            maximumTrackTintColor="rgba(17,29,58,0.14)"
            thumbTintColor={colors.gold}
            disabled={!durationSeconds || loading}
            onSlidingStart={() => {
              setScrubSeconds(positionSeconds);
              setScrubbing(true);
            }}
            onValueChange={setScrubSeconds}
            onSlidingComplete={(value) => void seekTo(value)}
            style={local.playerSlider}
          />
          <View style={local.playerTimes}>
            <Text style={local.playerDuration}>{formatMillis(displayedSeconds * 1000)}</Text>
            <Text style={local.playerDuration}>{formatMillis(durationSeconds * 1000)}</Text>
          </View>
        </View>

        {completed ? <StatusBadge label="Completed" tone="success" /> : null}

        <View style={local.playerControls}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Rewind 15 seconds"
            onPress={() => seekBy(-15)}
            disabled={loading}
            style={({ pressed }) => [local.playerSkipButton, pressed && local.playerControlPressed, loading && local.playerControlDisabled]}
          >
            <RotateCcw color={colors.navy} size={24} />
            <Text style={local.playerSkipText}>15</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={playing ? "Pause audio" : "Play audio"}
            onPress={toggle}
            disabled={loading}
            style={({ pressed }) => [local.playerPlayButton, pressed && local.playerControlPressed, loading && local.playerControlDisabled]}
          >
            {isWaiting ? <ActivityIndicator color="#FFFFFF" /> : playing ? <Pause color="#FFFFFF" fill="#FFFFFF" size={31} /> : <Play color="#FFFFFF" fill="#FFFFFF" size={31} />}
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Forward 15 seconds"
            onPress={() => seekBy(15)}
            disabled={loading}
            style={({ pressed }) => [local.playerSkipButton, pressed && local.playerControlPressed, loading && local.playerControlDisabled]}
          >
            <RotateCw color={colors.navy} size={24} />
            <Text style={local.playerSkipText}>15</Text>
          </Pressable>
        </View>

        <View style={local.playerBackgroundNote}>
          <Headphones color={colors.gold} size={15} />
          <Text style={local.playerBackgroundNoteText}>Playback continues when your screen is locked</Text>
        </View>
      </View>
    </PlainScreen>
  );
}

export function ProgramsListScreen({ navigation }: any) {
  const { programs } = useAppData();
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const groups = [
    { title: "Healing and Wellbeing", description: "Practices for relaxation, emotional balance and personal wellbeing." },
    { title: "Meditation and Inner Development", description: "Meditative practices for attention, inner awareness and personal development." },
    { title: "Manifestation and Relationships", description: "Reflective practices focused on goals, clarity and relationships." },
    { title: "Spiritual Wisdom and Guidance", description: "Sacred Circle teachings and guided spiritual exploration." },
    { title: "Sacred Exploration", description: "Guided explorations inspired by spiritual traditions and sacred places." }
  ];
  const visiblePrograms = selectedGroup ? programs.filter((program) => program.category === selectedGroup) : [];

  return (
    <LightScreen>
      <LogoMark compact />
      <AppHeader title={selectedGroup || "Programs"} subtitle={selectedGroup ? "Choose a program to read its approved app copy." : "Five simple groups make Sacred Circle programs easier to explore."} />
      {selectedGroup ? <SecondaryButton label="Back to Program Groups" onPress={() => setSelectedGroup(null)} /> : null}
      {!selectedGroup ? groups.map((group) => {
        const count = programs.filter((program) => program.category === group.title).length;
        if (!count) return null;
        return (
          <Pressable key={group.title} onPress={() => setSelectedGroup(group.title)}>
            <PremiumCard>
              <Text style={local.cardTitle}>{group.title}</Text>
              <BodyText>{group.description}</BodyText>
              <MetaText>{count} {count === 1 ? "program" : "programs"}</MetaText>
            </PremiumCard>
          </Pressable>
        );
      }) : visiblePrograms.map((program) => (
        <Pressable key={program.id} onPress={() => navigation.navigate("ProgramDetail", { program })}>
          <PremiumCard>
            <Text style={local.cardTitle}>{program.title}</Text>
            <BodyText>{program.description}</BodyText>
          </PremiumCard>
        </Pressable>
      ))}
      {!programs.length ? <EmptyState title="No programs published yet" body="Reviewed Sacred Circle programs will appear here." /> : null}
    </LightScreen>
  );
}

export function ProgramDetailScreen({ route }: any) {
  const program = route.params.program as Program;
  return (
    <LightScreen>
      <LogoMark compact />
      <AppHeader title={program.title} subtitle="Sacred Circle program" />
      <PremiumCard>
        <BodyText>{program.description}</BodyText>
      </PremiumCard>
    </LightScreen>
  );
}

export function EventsListScreen({ navigation }: any) {
  const { events } = useAppData();
  return (
    <LightScreen>
      <LogoMark compact />
      <AppHeader title="Events" subtitle="Published Sacred Circle events and Shivirs." />
      {events.map((event) => (
        <Pressable key={event.id} onPress={() => navigation.navigate("EventDetail", { event })}>
          <PremiumCard>
            <StatusBadge label={event.event_date ? new Date(event.event_date).toLocaleDateString() : "Date to be announced"} />
            <Text style={local.cardTitle}>{event.title}</Text>
            <BodyText>{event.description}</BodyText>
          </PremiumCard>
        </Pressable>
      ))}
      {!events.length ? <EmptyState title="No upcoming Shivir has been announced yet." body="Confirmed events will appear here after Sacred Circle publishes the details." /> : null}
    </LightScreen>
  );
}

const CURATED_RESOURCE_SLUGS = [
  "getting-started",
  "joining-sunday-sessions",
  "sacred-access-key",
  "preparing-for-meditation",
  "offline-listening-help",
  "frequently-asked-questions"
];

export function ResourcesScreen() {
  const { pages, resources } = useAppData();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const curatedPages = CURATED_RESOURCE_SLUGS
    .map((slug) => pages.find((page) => page.slug === slug))
    .filter((page): page is PageContent => Boolean(page));
  const approvedFiles = resources.filter((resource) => resource.type === "pdf" || resource.type === "article");

  async function openResource(resource: Resource) {
    try {
      const url = resource.external_url || await getPlayableResourceUrl(resource);
      openUrl(url, "This resource does not have an approved file or link yet.");
    } catch {
      Alert.alert("Resource unavailable", "Please try again later or contact Sacred Circle.");
    }
  }

  return (
    <LightScreen>
      <LogoMark compact />
      <AppHeader title="Resources" subtitle="A short, curated set of guides and approved Sacred Circle material." />
      {curatedPages.map((page) => {
        const expanded = expandedId === page.id;
        return (
          <Pressable key={page.id} onPress={() => setExpandedId(expanded ? null : page.id)}>
            <PremiumCard>
              <Text style={local.cardTitle}>{page.title}</Text>
              {page.subtitle ? <MetaText>{page.subtitle}</MetaText> : null}
              <Text numberOfLines={expanded ? undefined : 3} style={local.resourceBody}>{page.body}</Text>
              <MetaText>{expanded ? "Show less" : "Read more"}</MetaText>
            </PremiumCard>
          </Pressable>
        );
      })}
      {approvedFiles.map((resource) => (
        <PremiumCard key={resource.id}>
          <Text style={local.cardTitle}>{resource.title}</Text>
          {resource.description ? <Text numberOfLines={3} style={local.resourceBody}>{resource.description}</Text> : null}
          <SecondaryButton label="Open Resource" onPress={() => { void openResource(resource); }} />
        </PremiumCard>
      ))}
      {!curatedPages.length && !approvedFiles.length ? <EmptyState title="No resources published yet" body="Approved guides, PDFs and articles will appear here." /> : null}
    </LightScreen>
  );
}

export function EventDetailScreen({ route }: any) {
  const { userId, profile } = useAuth();
  const event = route.params.event as SacredEvent;
  const [name, setName] = useState(profile?.name || "");
  const [email, setEmail] = useState(profile?.email || "");
  const [phone, setPhone] = useState(profile?.phone || "");
  const [city, setCity] = useState(profile?.city || "");
  const [message, setMessage] = useState("");

  async function submit() {
    await registerForEvent({ user_id: userId, event_id: event.id, name, email, phone, city, message });
    Alert.alert("Interest registered", "Sacred Circle can contact you with event details.");
  }

  return (
    <LightScreen>
      <LogoMark compact />
      <AppHeader title={event.title} subtitle={event.description} eyebrow="Event" />
      <PremiumCard>
        <MetaText>{event.event_date ? new Date(event.event_date).toLocaleString([], { dateStyle: "medium", timeStyle: "short" }) : "Date to be announced"}</MetaText>
        <BodyText>{event.location || "Location will be shared by Sacred Circle."}</BodyText>
      </PremiumCard>
      {event.registration_enabled ? (
        <PremiumCard>
          <Text style={local.cardTitle}>Register Interest</Text>
          <View style={local.formStack}>
            <TextField label="Name" value={name} onChangeText={setName} />
            <TextField label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" />
            <TextField label="Phone optional" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
            <TextField label="City optional" value={city} onChangeText={setCity} />
            <TextField label="Message optional" value={message} onChangeText={setMessage} multiline />
            <PrimaryButton label="Register Interest" onPress={submit} disabled={!name || !email} />
          </View>
        </PremiumCard>
      ) : null}
    </LightScreen>
  );
}

export function VideosListScreen() {
  const { videos, settings } = useAppData();
  return (
    <LightScreen>
      <LogoMark compact />
      <AppHeader title="Videos" subtitle="YouTube links only. Videos are not downloaded into the app." />
      {videos.map((video) => (
        <PremiumCard key={video.id}>
          <StatusBadge label={video.category || "Video"} />
          <Text style={local.cardTitle}>{video.title}</Text>
          {video.description ? <BodyText>{video.description}</BodyText> : null}
          <PrimaryButton label="Open YouTube" icon={<VideoIcon color="#FFFFFF" size={18} />} onPress={() => openUrl(video.youtube_url)} />
        </PremiumCard>
      ))}
      {!videos.length ? <SecondaryButton label="Open YouTube Channel" onPress={() => openUrl(settings.youtube_channel_url)} /> : null}
    </LightScreen>
  );
}

export function AboutScreen() {
  const { pages, settings } = useAppData();
  const about = pages.find((page) => page.slug === "about");
  return (
    <LightScreen>
      <LogoMark compact />
      <AppHeader title={about?.title || "About Sacred Circle"} subtitle={about?.subtitle || "Meditation, healing and spiritual wisdom."} />
      <PremiumCard>
        <BodyText>{about?.body || "Sacred Circle offers meditation, inner-awareness content and online Sunday sessions."}</BodyText>
      </PremiumCard>
      <Text style={local.disclaimer}>{settings.disclaimer_text || DISCLAIMER}</Text>
    </LightScreen>
  );
}

export function ContactScreen() {
  const { userId, profile } = useAuth();
  const { settings } = useAppData();
  const [name, setName] = useState(profile?.name || "");
  const [email, setEmail] = useState(profile?.email || "");
  const [phone, setPhone] = useState(profile?.phone || "");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function submitContact() {
    if (!name.trim() || !email.trim() || !message.trim()) return;
    setBusy(true);
    try {
      await createContactSubmission({
        user_id: userId,
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || null,
        message: message.trim()
      });
      setMessage("");
      Alert.alert("Message sent", "Sacred Circle has received your note.");
    } catch {
      Alert.alert("Could not send", "Please try again, or use email/WhatsApp from the contact card.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <LightScreen>
      <LogoMark compact />
      <AppHeader title="Contact" subtitle="Get help with sessions, recordings, events or app access." />
      <PremiumCard>
        <MetaText>{settings.sunday_session_time || "Sunday session timing is shown on the published session card."}</MetaText>
        {settings.contact_email ? <BodyText>Email: {settings.contact_email}</BodyText> : null}
        <View style={local.buttonRow}>
          {settings.contact_email ? <PrimaryButton label="Email Sacred Circle" icon={<Mail color="#FFFFFF" size={18} />} onPress={() => openUrl(`mailto:${settings.contact_email}`)} /> : null}
          {!isPlaceholderUrl(settings.whatsapp_group_url) ? <SecondaryButton label="WhatsApp" icon={<MessageCircle color={colors.navy} size={18} />} onPress={() => openUrl(settings.whatsapp_group_url)} /> : null}
        </View>
      </PremiumCard>
      <PremiumCard>
        <Text style={local.cardTitle}>Quick Note</Text>
        <View style={local.formStack}>
          <TextField label="Name" value={name} onChangeText={setName} />
          <TextField label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" />
          <TextField label="Phone optional" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
          <TextField label="Message" value={message} onChangeText={setMessage} multiline />
          <PrimaryButton label={busy ? "Sending..." : "Send Message"} onPress={submitContact} disabled={busy || !name.trim() || !email.trim() || !message.trim()} />
          {settings.contact_email ? <SecondaryButton label="Use Email Instead" onPress={() => openUrl(`mailto:${settings.contact_email}?subject=Sacred Circle App Message&body=${encodeURIComponent(`${name}\n${email}\n${phone}\n\n${message}`)}`)} disabled={!message} /> : null}
        </View>
      </PremiumCard>
    </LightScreen>
  );
}

export function ProfileScreen({ navigation }: any) {
  const { profile, signOut } = useAuth();

  return (
    <LightScreen>
      <LogoMark compact />
      <AppHeader title="My Profile" subtitle="Only the details needed for sessions and access." />
      <PremiumCard>
        <Info label="Name" value={profile?.name} />
        <Info label="Email" value={profile?.email} />
        <Info label="Phone" value={profile?.phone || "Optional"} />
        <Info label="City" value={profile?.city || "Optional"} />
      </PremiumCard>
      <EmptyState title="Protected recordings stay locked" body="Open a recording and enter its six-digit Sacred Access Key each time you want to listen." />
      <SecondaryButton label="Back to More" onPress={() => navigation.goBack()} />
      <SecondaryButton label="Logout" icon={<LogOut color={colors.navy} size={18} />} onPress={signOut} />
    </LightScreen>
  );
}

export function HelpScreen() {
  return (
    <LightScreen>
      <LogoMark compact />
      <AppHeader title="Help" subtitle="A very simple guide for the app." />
      <HelpItem title="Joining a session" body="Open Home or Sunday Sessions, confirm the displayed date and time, then tap Join Session." />
      <HelpItem title="Entering a Sacred Access Key" body="Enter the key shared during the live Sunday session to unlock that session's protected recording." />
      <HelpItem title="Playing and downloading audio" body="Open Audio, choose a published meditation and tap Play. A download option appears only when that audio supports offline listening." />
      <HelpItem title="Contacting support" body="Open Contact and Help from More to send a message or use the verified contact email." />
      <Text style={local.disclaimer}>{DISCLAIMER}</Text>
    </LightScreen>
  );
}

function SacredKeyBlock({ sessionId, completeSacredKey, onSuccess }: { sessionId: string; completeSacredKey: (sessionId: string, code: string) => Promise<string>; onSuccess: (accessCode: string) => Promise<void> }) {
  const inputRef = useRef<TextInput>(null);
  const [code, setCode] = useState("");
  const [focused, setFocused] = useState(false);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(false);
  const shake = useSharedValue(0);

  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shake.value }]
  }));

  function updateCode(next: string) {
    setCode(next.replace(/\D/g, "").slice(0, SACRED_KEY_LENGTH));
    setMessage("");
  }

  function triggerShake() {
    shake.value = withSequence(
      withTiming(-5, { duration: 60 }),
      withTiming(5, { duration: 80 }),
      withTiming(-3, { duration: 70 }),
      withTiming(0, { duration: 90 })
    );
  }

  async function submit() {
    if (code.length !== SACRED_KEY_LENGTH) {
      setMessage(`Please enter all ${SACRED_KEY_LENGTH} digits of the Sacred Access Key.`);
      triggerShake();
      return;
    }
    setBusy(true);
    const result = await completeSacredKey(sessionId, code);
    setBusy(false);
    if (result === "unlocked" || result === "already_unlocked") {
      setSuccess(true);
      setMessage("");
      setTimeout(async () => {
        await onSuccess(code);
      }, 1250);
      return;
    }
    triggerShake();
    if (result === "expired_code") setMessage("This Sacred Access Key has expired.");
    else if (result === "rate_limited") setMessage("Too many attempts. Please wait 15 minutes before trying again.");
    else if (result === "auth_required" || result === "service_unavailable") setMessage("Please sign in and try again.");
    else setMessage("This key is not correct for this session.");
  }

  return (
    <View style={local.formStack}>
      <Text style={local.keyInstruction}>Enter the six-digit key shared during the live Sunday session. You will enter it again the next time you open this recording.</Text>
      <Pressable onPress={() => inputRef.current?.focus()}>
        <TextInput
          ref={inputRef}
          value={code}
          onChangeText={updateCode}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          keyboardType="number-pad"
          maxLength={SACRED_KEY_LENGTH}
          textContentType="oneTimeCode"
          style={local.hiddenCodeInput}
        />
        <Animated.View style={[local.codeBoxes, shakeStyle]}>
          {Array.from({ length: SACRED_KEY_LENGTH }, (_, item) => (
            <CodeBox key={item} filled={Boolean(code[item])} active={focused && code.length === item} value={code[item]} />
          ))}
        </Animated.View>
      </Pressable>
      {message ? <Text style={message.startsWith("Recording") ? local.successText : local.errorText}>{message}</Text> : null}
      <PrimaryButton label={busy ? "Checking..." : "Open Recording"} icon={<Unlock color="#FFFFFF" size={18} />} onPress={submit} disabled={busy} />
      {success ? <UnlockSuccess /> : null}
    </View>
  );
}

function CodeBox({ filled, active, value }: { filled: boolean; active: boolean; value?: string }) {
  const scale = useSharedValue(1);

  useEffect(() => {
    if (!filled) return;
    scale.value = withSequence(
      withTiming(1.06, { duration: 110, easing: Easing.out(Easing.cubic) }),
      withTiming(1, { duration: 150, easing: Easing.out(Easing.cubic) })
    );
  }, [filled, scale, value]);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }]
  }));

  return (
    <Animated.View style={[local.codeBox, active && local.codeBoxActive, filled && local.codeBoxFilled, style]}>
      <Text style={local.codeBoxText}>{filled ? "•" : ""}</Text>
    </Animated.View>
  );
}

function UnlockSuccess() {
  return (
    <View style={local.unlockSuccess}>
      <LottieView source={unlockSuccessAnimation} autoPlay loop={false} style={local.unlockLottie} />
      <FadeUp delay={180} fromY={6}>
        <Text style={local.unlockSuccessTitle}>Access Key Accepted</Text>
      </FadeUp>
    </View>
  );
}

function SessionSummaryCard({ session, primaryLabel, onPrimary, secondaryLabel, onSecondary, onPress }: { session: Session; primaryLabel: string; onPrimary: () => void; secondaryLabel: string; onSecondary: () => void; onPress?: () => void }) {
  const date = session.session_date ? new Date(session.session_date) : null;
  return (
    <Pressable onPress={onPress}>
      <PremiumCard>
        <StatusBadge label={session.status === "live" ? "Live Now" : "Every Sunday"} tone={session.status === "live" ? "success" : "gold"} />
        <Text style={local.cardTitle}>{session.title}</Text>
        <MetaText>{date ? date.toLocaleString([], { weekday: "long", hour: "2-digit", minute: "2-digit" }) : "Every Sunday"} · 4:00 PM IST · Live on Zoom</MetaText>
        <BodyText>{session.topic || session.description}</BodyText>
        <View style={local.buttonRow}>
          <PrimaryButton label={primaryLabel} onPress={onPrimary} />
          <SecondaryButton label={secondaryLabel} onPress={onSecondary} />
        </View>
      </PremiumCard>
    </Pressable>
  );
}

function PastSessionCard({ session, state, onPress }: { session: Session; state: string; onPress: () => void }) {
  const available = state !== "not_uploaded";
  const tone = available ? "warning" : "danger";
  const label = available ? "Key required" : "Not uploaded";
  return (
    <Pressable onPress={onPress}>
      <PremiumCard>
        <StatusBadge label={label} tone={tone as any} />
        <Text style={local.cardTitle}>{session.title}</Text>
        <MetaText>{session.session_date ? new Date(session.session_date).toLocaleDateString() : "Past session"}</MetaText>
        <BodyText>{session.topic || session.description}</BodyText>
        <View style={local.buttonRow}>
          <SecondaryButton label={available ? "Enter Sacred Key" : "View"} onPress={onPress} />
        </View>
      </PremiumCard>
    </Pressable>
  );
}

function AudioResourceCard({ resource, unlocked, onPress }: { resource: Resource; unlocked: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress}>
      <PremiumCard>
        <View style={local.audioTop}>
          <View style={local.audioIcon}>{unlocked ? <Headphones color={colors.gold} size={24} /> : <Lock color={colors.warning} size={24} />}</View>
          <View style={{ flex: 1 }}>
            <Text style={local.cardTitle}>{resource.title}</Text>
            <MetaText>{resource.category} {resource.duration_seconds ? `· ${formatDuration(resource.duration_seconds)}` : ""}</MetaText>
          </View>
        </View>
        <BodyText>{unlocked ? resource.description : "Enter the Sacred Access Key shared during the live Sunday session to unlock this healing recording."}</BodyText>
        <View style={local.buttonRow}>
          <SecondaryButton label={unlocked ? "Play" : "Enter Key"} onPress={onPress} />
        </View>
      </PremiumCard>
    </Pressable>
  );
}

function MoreItem({ title, subtitle, onPress }: { title: string; subtitle: string; onPress: () => void }) {
  return (
    <Pressable style={local.moreItem} onPress={onPress}>
      <View style={{ flex: 1 }}>
        <Text style={local.moreTitle}>{title}</Text>
        <Text style={local.moreSubtitle}>{subtitle}</Text>
      </View>
      <ChevronRight color={colors.gold} size={22} />
    </Pressable>
  );
}

function Info({ label, value }: { label: string; value?: string | null }) {
  return (
    <View style={local.infoRow}>
      <Text style={local.infoLabel}>{label}</Text>
      <Text style={local.infoValue}>{value || "Not added"}</Text>
    </View>
  );
}

function HelpItem({ title, body }: { title: string; body: string }) {
  return (
    <PremiumCard>
      <Text style={local.cardTitle}>{title}</Text>
      <BodyText>{body}</BodyText>
    </PremiumCard>
  );
}

function QuoteImageCard({ wide, compact: compactProp, quote, author }: { wide?: boolean; compact?: boolean; quote: string; author: string }) {
  const { width } = useWindowDimensions();
  const compact = compactProp ?? width < 520;

  return (
    <View style={[local.quoteImageWrap, compact && local.quoteImageWrapPhone, wide && local.quoteImageWrapWide]}>
      <ImageBackground source={quoteLakeBackground} resizeMode="cover" imageStyle={[local.quoteImageRadius, compact && local.quoteImageRadiusPhone]} style={[local.quoteImage, compact && local.quoteImagePhone]}>
        <LinearGradient colors={["rgba(17,29,58,0.00)", "rgba(17,29,58,0.10)", "rgba(17,29,58,0.28)"]} locations={[0, 0.48, 1]} style={local.quoteImageGradient} />
        <IlluminatedOm compact={compact} />
        <PremiumOrbitRings size={compact ? 94 : 132} style={[local.quoteOrbit, compact && local.quoteOrbitPhone]} />
        <View style={[local.quoteTextPanel, compact && local.quoteTextPanelPhone]}>
          <Text style={[local.quoteMark, compact && local.quoteMarkPhone]}>“</Text>
          <Text style={[local.quoteImageText, compact && local.quoteImageTextPhone]}>{quote}</Text>
          <View style={[local.quoteSmallRule, compact && local.quoteSmallRulePhone]} />
          <Text style={[local.quoteImageSource, compact && local.quoteImageSourcePhone]}>— {author}</Text>
        </View>
      </ImageBackground>
    </View>
  );
}

function IlluminatedOm({ compact }: { compact: boolean }) {
  const reducedMotion = useReducedMotionFlag();
  const glow = useSharedValue(0);

  useEffect(() => {
    if (reducedMotion) return;
    glow.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1800, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 1800, easing: Easing.inOut(Easing.sin) })
      ),
      -1,
      false
    );
  }, [glow, reducedMotion]);

  const haloStyle = useAnimatedStyle(() => ({
    opacity: reducedMotion ? 0.58 : 0.46 + glow.value * 0.34,
    transform: [{ scale: reducedMotion ? 1 : 0.9 + glow.value * 0.18 }]
  }));

  return (
    <View pointerEvents="none" style={[local.omIllumination, compact && local.omIlluminationPhone]}>
      <Animated.View style={[local.omHaloOuter, compact && local.omHaloOuterPhone, haloStyle]} />
      <Animated.View style={[local.omHaloInner, compact && local.omHaloInnerPhone, haloStyle]} />
      <Animated.View style={[local.omLightCore, compact && local.omLightCorePhone, haloStyle]} />
    </View>
  );
}

function formatMillis(value: number) {
  if (!value || Number.isNaN(value)) return "0:00";
  const totalSeconds = Math.floor(value / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

const local = StyleSheet.create({
  homeTopBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 14, marginBottom: 34 },
  menuButton: { width: 42, height: 42, borderRadius: 21, backgroundColor: "rgba(255,255,255,0.72)", borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center", ...shadows.soft },
  menuButtonPhone: { width: 34, height: 34, borderRadius: 17 },
  homeActions: { flexDirection: "row", alignItems: "center", gap: 12 },
  homeActionsPhone: { gap: 8 },
  notifyWrap: { width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center" },
  notifyWrapPhone: { width: 34, height: 34, borderRadius: 17 },
  notifyDot: { position: "absolute", top: 5, right: 5, width: 12, height: 12, borderRadius: 6, backgroundColor: colors.gold },
  notifyDotPhone: { top: 3, right: 3, width: 10, height: 10, borderRadius: 5 },
  avatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: colors.navy, borderWidth: 3, borderColor: "#FFFFFF", alignItems: "center", justifyContent: "center", ...shadows.card },
  avatarPhone: { width: 42, height: 42, borderRadius: 21, borderWidth: 2 },
  avatarText: { color: "#FFFFFF", fontSize: 22, fontWeight: "900" },
  avatarTextPhone: { fontSize: 18 },
  heroGrid: { gap: 20, marginBottom: 20 },
  heroGridPhone: { flexDirection: "row", alignItems: "stretch", gap: 8 },
  heroGridWide: { flexDirection: "row", alignItems: "stretch" },
  sessionColumn: { flex: 1 },
  sessionColumnPhone: { flex: 1.35 },
  quoteColumn: { flex: 0.82 },
  quoteColumnPhone: { flex: 1 },
  flexOne: { flex: 1 },
  homeIntro: { marginBottom: 28 },
  homeGreeting: { color: colors.navy, fontFamily: "Georgia", fontSize: 52, lineHeight: 60 },
  homeGreetingPhone: { fontSize: 27, lineHeight: 34 },
  homeRule: { width: 44, height: 2, backgroundColor: colors.gold, marginTop: 10, marginBottom: 14 },
  homeSubtext: { color: colors.bodyDark, fontSize: 17, lineHeight: 25 },
  homeSubtextPhone: { fontSize: 13, lineHeight: 20 },
  quoteImageWrap: { alignSelf: "stretch", maxWidth: 440, borderTopLeftRadius: 220, borderTopRightRadius: 220, borderBottomLeftRadius: 22, borderBottomRightRadius: 22, overflow: "hidden", ...shadows.card },
  quoteImageWrapPhone: { maxWidth: "100%", borderTopLeftRadius: 18, borderTopRightRadius: 18, borderBottomLeftRadius: 18, borderBottomRightRadius: 18 },
  quoteImageWrapWide: { flex: 1, minWidth: 330, alignSelf: "stretch" },
  quoteImage: { width: "100%", aspectRatio: 0.79, minHeight: 420, justifyContent: "flex-end" },
  quoteImagePhone: { minHeight: 314, aspectRatio: undefined },
  quoteImageRadius: { borderTopLeftRadius: 220, borderTopRightRadius: 220, borderBottomLeftRadius: 22, borderBottomRightRadius: 22 },
  quoteImageRadiusPhone: { borderRadius: 18 },
  quoteImageGradient: { ...StyleSheet.absoluteFill },
  omIllumination: { position: "absolute", top: 92, alignSelf: "center", width: 138, height: 124, alignItems: "center", justifyContent: "center" },
  omIlluminationPhone: { top: 66, width: 92, height: 88 },
  omHaloOuter: { position: "absolute", width: 132, height: 132, borderRadius: 66, backgroundColor: "rgba(255,246,216,0.38)", shadowColor: "#FFF2BF", shadowOpacity: 0.86, shadowRadius: 28, shadowOffset: { width: 0, height: 0 } },
  omHaloOuterPhone: { width: 86, height: 86, borderRadius: 43 },
  omHaloInner: { position: "absolute", width: 82, height: 82, borderRadius: 41, backgroundColor: "rgba(255,255,255,0.32)", shadowColor: "#D6A348", shadowOpacity: 0.62, shadowRadius: 18, shadowOffset: { width: 0, height: 0 } },
  omHaloInnerPhone: { width: 56, height: 56, borderRadius: 28 },
  omLightCore: { width: 26, height: 26, borderRadius: 13, backgroundColor: "rgba(255,240,177,0.58)", shadowColor: "#D6A348", shadowOpacity: 0.8, shadowRadius: 20, shadowOffset: { width: 0, height: 0 } },
  omLightCorePhone: { width: 18, height: 18, borderRadius: 9 },
  quoteOrbit: { position: "absolute", top: 88, alignSelf: "center" },
  quoteOrbitPhone: { top: 48 },
  quoteTextPanel: { paddingHorizontal: 50, paddingBottom: 42, paddingTop: 38, backgroundColor: "transparent" },
  quoteTextPanelPhone: { paddingHorizontal: 18, paddingBottom: 22, paddingTop: 22, backgroundColor: "transparent" },
  quoteMark: { color: "rgba(255,255,255,0.9)", fontFamily: "Georgia", fontSize: 46, lineHeight: 35 },
  quoteMarkPhone: { fontSize: 22, lineHeight: 18 },
  quoteImageText: { color: "#FFFFFF", fontFamily: "Georgia", fontSize: 24, lineHeight: 34, textShadowColor: "rgba(17,29,58,0.26)", textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 6 },
  quoteImageTextPhone: { fontSize: 14, lineHeight: 20 },
  quoteSmallRule: { width: 58, height: 2, backgroundColor: colors.gold, marginTop: 22, marginBottom: 14 },
  quoteSmallRulePhone: { width: 34, marginTop: 10, marginBottom: 8 },
  quoteImageSource: { color: "rgba(255,255,255,0.88)", fontSize: 14, textShadowColor: "rgba(17,29,58,0.22)", textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 5 },
  quoteImageSourcePhone: { fontSize: 11 },
  twoColumn: { gap: 20, marginBottom: 20 },
  twoColumnPhone: { flexDirection: "row", gap: 8, alignItems: "stretch" },
  twoColumnWide: { flexDirection: "row", alignItems: "stretch" },
  categoryGrid: { flexDirection: "row", flexWrap: "wrap", gap: 18, marginBottom: 20 },
  categoryGridPhone: { flexWrap: "nowrap", gap: 8 },
  categoryCell: { flex: 1, minWidth: 0 },
  announcementCard: { marginBottom: 20 },
  announcementText: { color: colors.navy, fontSize: 17, lineHeight: 25, marginTop: 12 },
  bottomGrid: { gap: 20 },
  bottomGridPhone: { flexDirection: "row", gap: 8, alignItems: "stretch" },
  bottomGridWide: { flexDirection: "row", alignItems: "stretch" },
  eventColumn: { flex: 1.2 },
  rightStack: { flex: 0.92, gap: 18 },
  topRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  bellButton: { width: 46, height: 46, borderRadius: 23, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.7)", borderWidth: 1, borderColor: colors.border },
  cardTitle: { color: colors.navy, fontFamily: "Georgia", fontSize: 24, lineHeight: 30, marginTop: 10, marginBottom: 8 },
  resourceBody: { color: colors.body, fontSize: 15, lineHeight: 23, marginTop: 8, marginBottom: 8 },
  buttonRow: { gap: 10, marginTop: spacing.md },
  progressTrack: { height: 7, borderRadius: 999, backgroundColor: "rgba(20,33,66,0.12)", marginVertical: spacing.md, overflow: "hidden" },
  progressFill: { width: "42%", height: "100%", backgroundColor: colors.gold },
  shortcutWrap: { gap: spacing.sm, marginBottom: spacing.md },
  shortcutCard: { minHeight: 64, borderRadius: radii.lg, backgroundColor: "rgba(255,255,255,0.78)", borderWidth: 1, borderColor: colors.border, paddingHorizontal: spacing.lg, flexDirection: "row", gap: spacing.md, alignItems: "center", ...shadows.soft },
  shortcutText: { color: colors.navy, fontWeight: "800", fontSize: 17 },
  categoryStack: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: spacing.md },
  categoryPill: { color: colors.navy, backgroundColor: colors.goldWash, paddingHorizontal: 12, paddingVertical: 8, borderRadius: radii.round, fontWeight: "800", overflow: "hidden" },
  moreItem: { minHeight: 76, borderRadius: radii.lg, backgroundColor: "rgba(255,255,255,0.82)", borderWidth: 1, borderColor: colors.border, padding: spacing.md, marginBottom: spacing.sm, flexDirection: "row", alignItems: "center", gap: 12 },
  moreTitle: { color: colors.navy, fontSize: 18, fontWeight: "900" },
  moreSubtitle: { color: colors.mutedText, fontSize: 14, marginTop: 3, lineHeight: 19 },
  logoutItem: { minHeight: 60, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginTop: spacing.md },
  logoutText: { color: colors.danger, fontSize: 17, fontWeight: "900" },
  formStack: { gap: spacing.md, marginTop: spacing.sm },
  keyInstruction: { color: colors.bodyDark, fontSize: 14, lineHeight: 20 },
  hiddenCodeInput: { position: "absolute", width: 1, height: 1, opacity: 0 },
  codeBoxes: { flexDirection: "row", gap: 7, marginTop: 2, marginBottom: 2 },
  codeBox: { flex: 1, height: 52, borderRadius: 11, borderWidth: 1, borderColor: colors.borderStrong, backgroundColor: "rgba(255,255,255,0.74)", alignItems: "center", justifyContent: "center" },
  codeBoxActive: { borderColor: colors.goldBorder, shadowColor: "#C99332", shadowOpacity: 0.16, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 2 },
  codeBoxFilled: { borderColor: "rgba(201,147,50,0.32)" },
  codeBoxText: { color: colors.navy, fontSize: 24, lineHeight: 26 },
  unlockSuccess: { alignItems: "center", justifyContent: "center", paddingVertical: 8 },
  unlockLottie: { width: 132, height: 132 },
  unlockSuccessTitle: { color: colors.navy, fontFamily: "Georgia", fontSize: 22, lineHeight: 28, textAlign: "center" },
  errorText: { color: colors.danger, fontWeight: "800", lineHeight: 21 },
  successText: { color: colors.success, fontWeight: "800", lineHeight: 21 },
  player: { flex: 1, width: "100%", maxWidth: 520, alignItems: "center", justifyContent: "center", alignSelf: "center", gap: 14, paddingVertical: 10 },
  playerCompact: { gap: 9, paddingVertical: 2 },
  playerEyebrow: { flexDirection: "row", alignItems: "center", gap: 7, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, backgroundColor: "rgba(246,231,198,0.56)", borderWidth: 1, borderColor: "rgba(201,147,50,0.20)" },
  playerEyebrowText: { color: colors.gold, fontSize: 11, fontWeight: "900", letterSpacing: 1.4 },
  playerArtworkShell: { width: 286, height: 286, borderRadius: 34, padding: 7, backgroundColor: "rgba(255,253,248,0.92)", borderWidth: 1, borderColor: colors.goldBorder, ...shadows.lifted },
  playerArtworkShellCompact: { width: 210, height: 210, borderRadius: 28, padding: 6 },
  playerArtwork: { width: "100%", height: "100%", overflow: "hidden", alignItems: "center", justifyContent: "center", borderRadius: 28 },
  playerArtworkImage: { width: "100%", height: "100%", borderRadius: 28 },
  playerArtworkShade: { ...StyleSheet.absoluteFill, borderRadius: 28 },
  playerArtworkButton: { width: 72, height: 72, borderRadius: 36, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(17,29,58,0.88)", borderWidth: 1, borderColor: "rgba(255,255,255,0.48)", ...shadows.button },
  playerCopy: { width: "100%", alignItems: "center", paddingHorizontal: 8 },
  playerTitle: { color: colors.navy, fontFamily: "Georgia", fontSize: 31, lineHeight: 37, textAlign: "center" },
  playerTitleCompact: { fontSize: 24, lineHeight: 29 },
  playerCategory: { color: colors.gold, fontWeight: "900", fontSize: 13, letterSpacing: 0.5, marginTop: 5, textTransform: "uppercase" },
  playerTimeline: { width: "100%", maxWidth: 460, borderRadius: 20, backgroundColor: "rgba(255,253,248,0.72)", borderWidth: 1, borderColor: "rgba(201,147,50,0.14)", paddingHorizontal: 13, paddingTop: 7, paddingBottom: 9 },
  playerSlider: { width: "100%", height: 34 },
  playerTimes: { width: "100%", flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 2 },
  playerDuration: { color: colors.mutedText, fontSize: 13, fontVariant: ["tabular-nums"] },
  playerControls: { width: "100%", maxWidth: 330, flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 2 },
  playerSkipButton: { width: 58, height: 58, borderRadius: 29, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,253,248,0.86)", borderWidth: 1, borderColor: colors.borderStrong, ...shadows.soft },
  playerSkipText: { position: "absolute", color: colors.navy, fontSize: 9, lineHeight: 10, fontWeight: "900" },
  playerPlayButton: { width: 76, height: 76, borderRadius: 38, alignItems: "center", justifyContent: "center", backgroundColor: colors.navy, borderWidth: 4, borderColor: "rgba(246,231,198,0.92)", ...shadows.button },
  playerControlPressed: { opacity: 0.82, transform: [{ scale: 0.97 }] },
  playerControlDisabled: { opacity: 0.45 },
  playerBackgroundNote: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, marginTop: 2 },
  playerBackgroundNoteText: { color: colors.body, fontSize: 12.5, lineHeight: 17, textAlign: "center" },
  audioTop: { flexDirection: "row", gap: spacing.md, alignItems: "center", marginBottom: spacing.sm },
  audioIcon: { width: 50, height: 50, borderRadius: 25, backgroundColor: colors.goldWash, alignItems: "center", justifyContent: "center" },
  infoRow: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  infoLabel: { color: colors.mutedText, fontWeight: "700", marginBottom: 3 },
  infoValue: { color: colors.navy, fontWeight: "900", fontSize: 16 },
  disclaimer: { color: colors.paleText, fontSize: 12, lineHeight: 18, textAlign: "center", marginTop: spacing.md }
});

"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type FormEvent } from "react";
import {
  SACRED_KEY_LENGTH,
  formatDuration,
  getYouTubeThumbnailUrl,
  type Profile as MemberProfile,
  type Resource,
  type SacredEvent,
  type Session,
  type Video as SacredVideo,
  demoSessions,
  demoResources,
  demoEvents,
  demoSettings,
  demoVideos
} from "@sacred-circle/lib";
import type { Session as AuthSession } from "@supabase/supabase-js";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import {
  ArrowLeft,
  Bell,
  Calendar,
  CheckCircle,
  ChevronRight,
  Clock,
  FileText,
  Headphones,
  Home,
  Info,
  Key,
  Lock,
  LogOut,
  Mail,
  MapPin,
  MoreHorizontal,
  Pause,
  Play,
  Search,
  Trash2,
  User,
  Video,
  X
} from "lucide-react";
import "./landing.css";

type TabName = "home" | "audio" | "video" | "more";
type VideoSort = "library" | "latest";

type LandingVideo = {
  id: string;
  title: string;
  description: string;
  youtubeUrl: string;
  thumbnailUrl: string;
  category: string;
  displayOrder: number;
  createdAt: string | null;
};

const LotusSvg = ({ className, size = 32, style }: { className?: string; size?: number; style?: CSSProperties }) => (
  <svg className={className} width={size} height={size} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 22C12 22 17 18 19 15C21 12 21 9 19 8C17 7 15 9 13.5 10.5C14.5 7.5 14 4.5 12 2C10 4.5 9.5 7.5 10.5 10.5C9 9 7 7 5 8C3 9 3 12 5 15C7 18 12 22 12 22Z" />
    <path d="M12 22C12 22 8 19 6 17C4 15 3.5 12 4.5 10.5" />
    <path d="M12 22C12 22 16 19 18 17C20 15 20.5 12 19.5 10.5" />
  </svg>
);

export default function LandingPage() {
  const [authReady, setAuthReady] = useState(!supabase);
  const [authSession, setAuthSession] = useState<AuthSession | null>(null);
  const [profile, setProfile] = useState<MemberProfile | null>(null);
  const [profileDraft, setProfileDraft] = useState({ name: "", phone: "", city: "", state: "", date_of_birth: "" });
  const [registrationCount, setRegistrationCount] = useState(0);

  const [sessions, setSessions] = useState<Session[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [events, setEvents] = useState<SacredEvent[]>([]);
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [siteVideos, setSiteVideos] = useState<LandingVideo[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<TabName>("home");
  const [showProfilePage, setShowProfilePage] = useState(false);
  const [selectedVideoCategory, setSelectedVideoCategory] = useState("All Videos");
  const [videoSearch, setVideoSearch] = useState("");
  const [videoSort, setVideoSort] = useState<VideoSort>("library");
  const [selectedAudioCategory, setSelectedAudioCategory] = useState("All Audio");
  const [audioSearch, setAudioSearch] = useState("");

  const [currentTrack, setCurrentTrack] = useState<Resource | null>(null);
  const [audioUrl, setAudioUrl] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const [protectedTrack, setProtectedTrack] = useState<Resource | null>(null);
  const [keyDigits, setKeyDigits] = useState<string[]>(() => Array(SACRED_KEY_LENGTH).fill(""));
  const [unlockBusy, setUnlockBusy] = useState(false);

  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authEmail, setAuthEmail] = useState("");
  const [authBusy, setAuthBusy] = useState(false);
  const [authNotice, setAuthNotice] = useState("");
  const [profileBusy, setProfileBusy] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const [showEventModal, setShowEventModal] = useState(false);
  const [eventSubmitting, setEventSubmitting] = useState(false);
  const [eventRegistrationSuccess, setEventRegistrationSuccess] = useState(false);
  const [eventForm, setEventForm] = useState({ name: "", email: "", phone: "", city: "" });

  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const [showStarter, setShowStarter] = useState(true);
  const [starterClosing, setStarterClosing] = useState(false);
  const splashTimersRef = useRef<{ fade?: NodeJS.Timeout; hide?: NodeJS.Timeout }>({});

  const replaySplash = useCallback(() => {
    if (splashTimersRef.current.fade) clearTimeout(splashTimersRef.current.fade);
    if (splashTimersRef.current.hide) clearTimeout(splashTimersRef.current.hide);
    
    setStarterClosing(false);
    setShowStarter(true);
    
    splashTimersRef.current.fade = setTimeout(() => setStarterClosing(true), 3100);
    splashTimersRef.current.hide = setTimeout(() => setShowStarter(false), 3600);
  }, []);

  useEffect(() => {
    splashTimersRef.current.fade = setTimeout(() => setStarterClosing(true), 3100);
    splashTimersRef.current.hide = setTimeout(() => setShowStarter(false), 3600);
    return () => {
      if (splashTimersRef.current.fade) clearTimeout(splashTimersRef.current.fade);
      if (splashTimersRef.current.hide) clearTimeout(splashTimersRef.current.hide);
    };
  }, []);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const videoSearchRef = useRef<HTMLInputElement>(null);
  const keyInputRefs = useRef<Array<HTMLInputElement | null>>([]);

  const user = authSession?.user || null;

  useEffect(() => {
    if (!supabase) return;
    let active = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setAuthSession(data.session);
      setAuthReady(true);
    });

    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setAuthSession(nextSession);
      setAuthReady(true);
    });

    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);

  const loadData = useCallback(async () => {
    if (!supabase || !isSupabaseConfigured) {
      setSessions([]);
      setResources([]);
      setEvents([]);
      setSettings({});
      setSiteVideos([]);
      setDataError("Sacred Circle is not connected to its content service.");
      setDataLoading(false);
      return;
    }

    setDataLoading(true);
    setDataError(null);

    const failures: string[] = [];
    try {
      const [sessionsResult, resourcesResult, eventsResult, settingsResult, videosResult] = await Promise.all([
        supabase.from("sessions").select("*").order("session_date", { ascending: true }),
        supabase.from("resources").select("*").eq("status", "published").order("display_order", { ascending: true }),
        supabase.from("events").select("*").eq("status", "published").order("event_date", { ascending: true, nullsFirst: false }),
        supabase.from("app_settings").select("key,value"),
        supabase.from("videos").select("*").eq("status", "published").order("display_order", { ascending: true })
      ]);

      if (sessionsResult.error) failures.push(`Sessions: ${sessionsResult.error.message}`);
      if (resourcesResult.error) failures.push(`Audio: ${resourcesResult.error.message}`);
      if (eventsResult.error) failures.push(`Events: ${eventsResult.error.message}`);
      if (settingsResult.error) failures.push(`Settings: ${settingsResult.error.message}`);
      if (videosResult.error) failures.push(`Videos: ${videosResult.error.message}`);

      const dbSessions = (sessionsResult.data || []) as Session[];
      setSessions(dbSessions.length > 0 ? dbSessions : demoSessions);

      const dbResources = (resourcesResult.data || []) as Resource[];
      setResources(dbResources.length > 0 ? dbResources : demoResources);

      const dbEvents = (eventsResult.data || []) as SacredEvent[];
      setEvents(dbEvents.length > 0 ? dbEvents : demoEvents);

      const dbSettings = Object.fromEntries((settingsResult.data || []).map((item) => [String(item.key), String(item.value)]));
      const demoSettingsMap: Record<string, string> = {};
      demoSettings.forEach((item) => {
        demoSettingsMap[item.key] = item.value;
      });
      setSettings({ ...demoSettingsMap, ...dbSettings });

      const dbVideos = (videosResult.data || []) as SacredVideo[];
      setSiteVideos(
        (dbVideos.length > 0 ? dbVideos : demoVideos)
          .map(mapDbVideoToLandingVideo)
          .filter((video): video is LandingVideo => video !== null)
      );

      if (user) {
        const [profileResult, sessionRegistrationsResult, eventRegistrationsResult] = await Promise.all([
          supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
          supabase.from("session_registrations").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("status", "registered"),
          supabase.from("event_registrations").select("id", { count: "exact", head: true }).eq("user_id", user.id)
        ]);

        if (profileResult.error) failures.push(`Profile: ${profileResult.error.message}`);
        if (sessionRegistrationsResult.error) failures.push(`Session registrations: ${sessionRegistrationsResult.error.message}`);
        if (eventRegistrationsResult.error) failures.push(`Event registrations: ${eventRegistrationsResult.error.message}`);

        const loadedProfile = (profileResult.data || null) as MemberProfile | null;
        setProfile(loadedProfile);
        setProfileDraft({
          name: loadedProfile?.name || "",
          phone: loadedProfile?.phone || "",
          city: loadedProfile?.city || "",
          state: loadedProfile?.state || "",
          date_of_birth: loadedProfile?.date_of_birth || ""
        });
        setEventForm((current) => ({
          ...current,
          name: loadedProfile?.name || current.name,
          email: user.email || loadedProfile?.email || current.email,
          phone: loadedProfile?.phone || current.phone,
          city: loadedProfile?.city || current.city
        }));
        setRegistrationCount(sessionRegistrationsResult.count || 0);
      } else {
        setProfile(null);
        setProfileDraft({ name: "", phone: "", city: "", state: "", date_of_birth: "" });
        setRegistrationCount(0);
      }

      if (failures.length) setDataError(failures.join(" "));
    } catch (error) {
      setDataError(errorMessage(error, "Unable to load Sacred Circle content."));
    } finally {
      setDataLoading(false);
    }
  }, [user?.id, user?.email]);

  useEffect(() => {
    if (authReady) void loadData();
  }, [authReady, loadData]);

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
    };
  }, []);

  useEffect(() => {
    if (!audioUrl) return;
    audioRef.current?.pause();
    const audio = new Audio(audioUrl);
    audioRef.current = audio;

    const onTimeUpdate = () => setCurrentTime(audio.currentTime || 0);
    const onLoadedMetadata = () => setDuration(Number.isFinite(audio.duration) ? audio.duration : currentTrack?.duration_seconds || 0);
    const onEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("ended", onEnded);
    audio.play()
      .then(() => setIsPlaying(true))
      .catch(() => {
        setIsPlaying(false);
        showToast("The audio could not start. Please try again.", "error");
      });

    return () => {
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("ended", onEnded);
      audio.pause();
    };
  }, [audioUrl]);

  const videoCategories = useMemo(
    () => ["All Videos", ...Array.from(new Set(siteVideos.map((video) => video.category))).sort((a, b) => a.localeCompare(b))],
    [siteVideos]
  );

  useEffect(() => {
    if (!videoCategories.includes(selectedVideoCategory)) setSelectedVideoCategory("All Videos");
  }, [selectedVideoCategory, videoCategories]);

  const filteredVideos = useMemo(() => {
    const search = videoSearch.trim().toLocaleLowerCase();
    const filtered = siteVideos.filter((video) => {
      const categoryMatch = selectedVideoCategory === "All Videos" || video.category === selectedVideoCategory;
      const searchMatch = !search || `${video.title} ${video.description} ${video.category}`.toLocaleLowerCase().includes(search);
      return categoryMatch && searchMatch;
    });

    return [...filtered].sort((left, right) => {
      if (videoSort === "latest") {
        const dateDifference = dateValue(right.createdAt) - dateValue(left.createdAt);
        if (dateDifference) return dateDifference;
      }
      return left.displayOrder - right.displayOrder || left.title.localeCompare(right.title);
    });
  }, [selectedVideoCategory, siteVideos, videoSearch, videoSort]);

  const featuredVideo = filteredVideos[0] || null;
  const libraryVideos = featuredVideo ? filteredVideos.slice(1) : [];

  const audios = useMemo(() => resources.filter(isRealPlayableAudio), [resources]);
  const publicAudios = useMemo(() => audios.filter((resource) => resource.access_type === "public"), [audios]);
  const audioCategories = useMemo(
    () => ["All Audio", ...Array.from(new Set(audios.map((resource) => resource.category.trim()).filter(Boolean))).sort((a, b) => a.localeCompare(b))],
    [audios]
  );

  useEffect(() => {
    if (!audioCategories.includes(selectedAudioCategory)) setSelectedAudioCategory("All Audio");
  }, [audioCategories, selectedAudioCategory]);

  const filteredAudios = useMemo(() => {
    const search = audioSearch.trim().toLocaleLowerCase();
    return audios.filter((resource) => {
      const categoryMatch = selectedAudioCategory === "All Audio" || resource.category === selectedAudioCategory;
      const searchMatch = !search || `${resource.title} ${resource.description} ${resource.category}`.toLocaleLowerCase().includes(search);
      return categoryMatch && searchMatch;
    });
  }, [audioSearch, audios, selectedAudioCategory]);

  const featuredAudio = filteredAudios.find((resource) => resource.is_featured) || filteredAudios[0] || null;
  const audioList = featuredAudio ? filteredAudios.filter((resource) => resource.id !== featuredAudio.id) : [];

  const now = Date.now();
  const nextSession = sessions.find((session) => session.status === "live") || sessions.find((session) => session.status === "upcoming" && dateValue(session.session_date) >= now) || null;
  const nextEvent = events.find((event) => event.event_date && dateValue(event.event_date) >= now) || null;
  const displayName = profile?.name?.trim() || user?.email?.split("@")[0] || "";
  const heroFirstName = firstName(displayName);
  const memberEmail = profile?.email || user?.email || "";
  const avatarInitial = (displayName || memberEmail || "S").slice(0, 1).toUpperCase();
  const avatarUrl = safeHttpUrl(
    typeof user?.user_metadata?.avatar_url === "string"
      ? user.user_metadata.avatar_url
      : typeof user?.user_metadata?.picture === "string"
        ? user.user_metadata.picture
        : null
  );
  const memberSince = profile?.created_at ? formatMonthYear(profile.created_at) : "";
  const homeTitle = heroFirstName ? `Namaste, ${heroFirstName} Ji` : "Welcome to Sacred Circle";
  const homeSubtitle = user
    ? "Your sessions, recordings and Sacred Circle media are gathered here."
    : "Sign in to access sessions, audio resources and your Sacred Circle profile.";
  const currentYear = new Date().getFullYear();

  function showToast(message: string, type: "success" | "error") {
    setToast({ message, type });
    window.setTimeout(() => setToast(null), 3200);
  }

  function goToTab(tab: TabName) {
    setShowProfilePage(false);
    setActiveTab(tab);
  }

  function requestSignIn() {
    setAuthNotice("");
    setAuthEmail(user?.email || "");
    setShowAuthModal(true);
  }

  async function sendMagicLink(event: FormEvent) {
    event.preventDefault();
    if (!supabase || !authEmail.trim()) return;
    setAuthBusy(true);
    setAuthNotice("");
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: authEmail.trim(),
        options: { emailRedirectTo: `${window.location.origin}/` }
      });
      if (error) throw error;
      setAuthNotice("Check your email and open the secure Sacred Circle sign-in link.");
    } catch (error) {
      setAuthNotice(errorMessage(error, "Unable to send the sign-in link."));
    } finally {
      setAuthBusy(false);
    }
  }

  async function signOut() {
    if (!supabase) return;
    const { error } = await supabase.auth.signOut();
    if (error) {
      showToast(error.message, "error");
      return;
    }
    audioRef.current?.pause();
    setAudioUrl("");
    setCurrentTrack(null);
    setIsPlaying(false);
    setProfile(null);
    setShowProfilePage(false);
    showToast("Signed out successfully.", "success");
  }

  async function saveProfile(event: FormEvent) {
    event.preventDefault();
    if (!supabase || !user) return;
    const name = profileDraft.name.trim();
    if (!name) {
      showToast("Please enter your name.", "error");
      return;
    }
    const phoneDigits = profileDraft.phone.replace(/\D/g, "");
    if (phoneDigits.length < 10 || phoneDigits.length > 15) {
      showToast("Please enter a valid mobile number.", "error");
      return;
    }
    if (profileDraft.city.trim().length < 2) {
      showToast("Please enter your city.", "error");
      return;
    }
    if (profileDraft.state.trim().length < 2) {
      showToast("Please enter your state.", "error");
      return;
    }
    if (!profileDraft.date_of_birth || Number.isNaN(new Date(`${profileDraft.date_of_birth}T00:00:00`).getTime()) || new Date(`${profileDraft.date_of_birth}T00:00:00`) > new Date()) {
      showToast("Please enter a valid date of birth.", "error");
      return;
    }

    setProfileBusy(true);
    try {
      const profileValues = {
        name,
        phone: profileDraft.phone.trim() || null,
        city: profileDraft.city.trim() || null,
        state: profileDraft.state.trim() || null,
        date_of_birth: profileDraft.date_of_birth.trim() || null
      };
      const { data, error } = profile
        ? await supabase.from("profiles").update(profileValues).eq("id", user.id).select("*").single()
        : await supabase.from("profiles").insert({
            id: user.id,
            email: user.email || memberEmail,
            role: "user",
            ...profileValues
          }).select("*").single();
      if (error) throw error;
      setProfile(data as MemberProfile);
      showToast("Profile updated.", "success");
    } catch (error) {
      showToast(errorMessage(error, "Unable to update your profile."), "error");
    } finally {
      setProfileBusy(false);
    }
  }

  async function deleteAccount() {
    if (!supabase || !user) return;
    const confirmed = window.confirm("Permanently delete your Sacred Circle account and profile? This cannot be undone.");
    if (!confirmed) return;

    setDeleteBusy(true);
    try {
      const { error } = await supabase.functions.invoke("delete-account");
      if (error) throw error;
      await supabase.auth.signOut({ scope: "local" });
      audioRef.current?.pause();
      setAuthSession(null);
      setProfile(null);
      setResources([]);
      setSessions([]);
      setEvents([]);
      setSettings({});
      setRegistrationCount(0);
      setCurrentTrack(null);
      setAudioUrl("");
      setIsPlaying(false);
      setShowProfilePage(false);
      goToTab("home");
      showToast("Your Sacred Circle account has been deleted.", "success");
    } catch (error) {
      showToast(errorMessage(error, "Unable to delete your account."), "error");
    } finally {
      setDeleteBusy(false);
    }
  }

  async function submitEventRegistration(event: FormEvent) {
    event.preventDefault();
    if (!supabase || !nextEvent || !eventForm.name.trim() || !eventForm.email.trim()) return;
    setEventSubmitting(true);
    try {
      const { error } = await supabase.from("event_registrations").insert({
        event_id: nextEvent.id,
        user_id: user?.id || null,
        name: eventForm.name.trim(),
        email: eventForm.email.trim(),
        phone: eventForm.phone.trim() || null,
        city: eventForm.city.trim() || null
      });
      if (error) throw error;
      setEventRegistrationSuccess(true);
      showToast("Event registration saved.", "success");
      if (user) await loadData();
    } catch (error) {
      showToast(errorMessage(error, "Unable to register for this event."), "error");
    } finally {
      setEventSubmitting(false);
    }
  }

  async function resolveResourceUrl(resource: Resource, accessCode?: string) {
    const directUrl = realExternalAudioUrl(resource.external_url);
    if (resource.access_type === "public" && directUrl) return directUrl;
    if (!supabase || !user) throw new Error("Please sign in to play this audio.");
    const { data, error } = await supabase.functions.invoke("get-resource-url", {
      body: {
        resource_id: resource.id,
        ...(resource.access_type === "session_protected" && accessCode ? { access_code: accessCode } : {})
      }
    });
    if (error) throw error;
    const url = safeHttpUrl(data?.url);
    if (!url) throw new Error("A playable audio URL was not returned.");
    return url;
  }

  async function playTrack(resource: Resource, accessCode?: string) {
    if (resource.access_type === "session_protected" && !accessCode) {
      if (!user) {
        requestSignIn();
        return false;
      }
      setProtectedTrack(resource);
      setKeyDigits(Array(SACRED_KEY_LENGTH).fill(""));
      window.setTimeout(() => keyInputRefs.current[0]?.focus(), 120);
      return false;
    }

    setIsAudioLoading(true);
    try {
      const url = await resolveResourceUrl(resource, accessCode);
      setCurrentTrack(resource);
      setCurrentTime(0);
      setDuration(resource.duration_seconds || 0);
      setAudioUrl(url);
      return true;
    } catch (error) {
      showToast(errorMessage(error, "This audio is unavailable."), "error");
      return false;
    } finally {
      setIsAudioLoading(false);
    }
  }

  function playOrToggle(resource: Resource) {
    if (currentTrack?.id === resource.id && audioRef.current) {
      handlePlayToggle();
      return;
    }
    void playTrack(resource);
  }

  function handlePlayToggle() {
    if (!audioRef.current) {
      if (currentTrack) void playTrack(currentTrack);
      return;
    }
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play()
        .then(() => setIsPlaying(true))
        .catch(() => showToast("The audio could not start. Please try again.", "error"));
    }
  }

  function handleScrub(event: React.MouseEvent<HTMLDivElement>) {
    if (!progressBarRef.current || !audioRef.current || !duration) return;
    const bounds = progressBarRef.current.getBoundingClientRect();
    const percentage = Math.min(Math.max((event.clientX - bounds.left) / bounds.width, 0), 1);
    const nextTime = percentage * duration;
    audioRef.current.currentTime = nextTime;
    setCurrentTime(nextTime);
  }

  function handleKeyDigitChange(index: number, value: string) {
    const cleanValue = value.replace(/[^0-9]/g, "");
    const nextDigits = [...keyDigits];
    if (cleanValue.length > 1) {
      cleanValue.slice(0, SACRED_KEY_LENGTH - index).split("").forEach((digit, offset) => {
        nextDigits[index + offset] = digit;
      });
    } else {
      nextDigits[index] = cleanValue.slice(-1);
    }
    setKeyDigits(nextDigits);
    if (cleanValue) {
      const nextIndex = Math.min(index + Math.max(cleanValue.length, 1), SACRED_KEY_LENGTH - 1);
      keyInputRefs.current[nextIndex]?.focus();
    }
  }

  async function unlockRecording() {
    const code = keyDigits.join("");
    if (!supabase || !user) {
      requestSignIn();
      return;
    }
    if (!protectedTrack?.session_id || code.length !== SACRED_KEY_LENGTH) {
      showToast(`Enter the complete ${SACRED_KEY_LENGTH}-digit Sacred Access Key.`, "error");
      return;
    }

    setUnlockBusy(true);
    try {
      const { data, error } = await supabase.rpc("unlock_session_recording", {
        p_session_id: protectedTrack.session_id,
        p_code: code
      });
      if (error) throw error;
      const result = String(data || "");
      if (!["unlocked", "already_unlocked"].includes(result)) {
        if (result === "rate_limited") throw new Error("Too many attempts. Please wait 15 minutes before trying again.");
        if (result === "expired_code") throw new Error("This Sacred Access Key has expired.");
        if (result === "auth_required") throw new Error("Please sign in before entering a Sacred Access Key.");
        throw new Error("The Sacred Access Key is incorrect.");
      }
      const started = await playTrack(protectedTrack, code);
      if (started) {
        setProtectedTrack(null);
        setKeyDigits(Array(SACRED_KEY_LENGTH).fill(""));
        showToast("Access key accepted. The recording is now playing.", "success");
      }
    } catch (error) {
      const message = errorMessage(error, "The Sacred Access Key was not accepted.");
      showToast(message.includes("expired_code") ? "This Sacred Access Key has expired." : message.includes("invalid_code") ? "The Sacred Access Key is incorrect." : message, "error");
      setKeyDigits(Array(SACRED_KEY_LENGTH).fill(""));
      keyInputRefs.current[0]?.focus();
    } finally {
      setUnlockBusy(false);
    }
  }

  function handleMouseMove(event: React.MouseEvent<HTMLDivElement>) {
    const bounds = event.currentTarget.getBoundingClientRect();
    event.currentTarget.style.setProperty("--mouse-x", String(((event.clientX - bounds.left) / bounds.width - 0.5) * 2));
    event.currentTarget.style.setProperty("--mouse-y", String(((event.clientY - bounds.top) / bounds.height - 0.5) * 2));
  }

  return (
    <div className="landing-page" onMouseMove={handleMouseMove} onMouseLeave={(event) => {
      event.currentTarget.style.setProperty("--mouse-x", "0");
      event.currentTarget.style.setProperty("--mouse-y", "0");
    }}>
      <div className="ambient-particles" aria-hidden="true">
        {Array.from({ length: 12 }).map((_, index) => <div key={index} className={`particle particle-${index}`} />)}
      </div>

      {toast ? (
        <div className={`toast toast-${toast.type}`} role="status">
          {toast.type === "success" ? <CheckCircle size={16} /> : <X size={16} />}
          <span>{toast.message}</span>
        </div>
      ) : null}

      <div className="landing-container">
        {showStarter ? (
          <div className={`starter-screen ${starterClosing ? "fade-out" : ""}`}>
            <img src="/starter-water-temple.png" className="starter-bg-image" alt="" />
            <div className="starter-veil" />
            <div className="starter-sun-glow" />
            <div className="starter-particles">
              {Array.from({ length: 15 }).map((_, index) => (
                <span key={index} className={`starter-particle starter-particle-${index}`} />
              ))}
            </div>
            
            <div className="starter-mandala-wrap">
              <div className="starter-mandala-circle" />
              <div className="starter-logo-glow" />
              <div className="starter-logo-shell">
                <img src="/sacred-flame-logo.png" className="starter-logo-img" alt="" />
                <div className="starter-flame-overlay">
                  <div className="starter-flame-glow" />
                  <div className="starter-flame-svg-wrap">
                    <svg viewBox="0 0 100 100" className="starter-flame-svg">
                      <path d="M50,15 C55,35 68,45 68,60 C68,75 58,85 50,85 C42,85 32,75 32,60 C32,45 45,35 50,15 Z" fill="#FF8C00" />
                      <path d="M50,30 C53,45 60,52 60,62 C60,72 55,78 50,78 C45,78 40,72 40,62 C40,52 47,45 50,30 Z" fill="#FFD700" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            <div className="starter-greeting-wrap">
              <div className="starter-top-lotus">
                <LotusSvg size={28} style={{ color: "#C99332" }} />
              </div>

              <h2 className="starter-title">Jai Gurudev</h2>

              <div className="starter-bottom-divider">
                <div className="starter-bottom-divider-line" />
                <div className="starter-bottom-divider-diamond" />
                <div className="starter-bottom-divider-line" />
              </div>

              <p className="starter-subtitle">Preparing your sacred space...</p>

              <div className="starter-dots">
                <span className="starter-dot muted" />
                <span className="starter-dot active" />
                <span className="starter-dot muted" />
              </div>
            </div>
          </div>
        ) : null}
        <div className="landing-main-content-flow" style={{ opacity: showStarter ? 0 : 1, visibility: showStarter ? "hidden" : "visible", transition: "opacity 0.35s ease", flex: 1, display: "flex", flexDirection: "column", height: "100%" }}>
          <header className={`landing-header ${activeTab === "home" ? "landing-header-home-hidden" : ""}`}>
          {activeTab === "home" ? (
            <>
              <div className="header-brand-left premium-header-brand">
                <img src="/sacred-flame-logo.png" alt="Sacred Circle" className="premium-header-logo" />
                <div className="header-brand-text-wrap"><span className="brand-title">SACRED CIRCLE</span></div>
              </div>
              <button className="premium-avatar premium-avatar-button" onClick={() => user ? (setActiveTab("more"), setShowProfilePage(true)) : requestSignIn()} aria-label={user ? "Open profile" : "Sign in"}>
                {avatarUrl ? <img src={avatarUrl} alt="" className="premium-user-avatar-image" /> : avatarInitial}
              </button>
            </>
          ) : activeTab === "video" ? (
            <div className="premium-profile-header premium-video-library-header">
              <button onClick={() => goToTab("audio")} aria-label="Back to Audio Library"><ArrowLeft size={22} /></button>
              <div className="header-tab-title-wrap"><h1 className="header-tab-title">Video Library</h1><LotusSvg size={28} className="header-tab-icon" /></div>
              <button onClick={() => videoSearchRef.current?.focus()} aria-label="Search videos"><Search size={22} /></button>
            </div>
          ) : activeTab === "audio" ? (
            <div className="header-tab-title-wrap"><h1 className="header-tab-title">Audio Library</h1><LotusSvg size={28} className="header-tab-icon" /></div>
          ) : showProfilePage ? (
            <div className="premium-profile-header">
              <button onClick={() => setShowProfilePage(false)} aria-label="Back to More"><ArrowLeft size={22} /></button>
              <div className="header-tab-title-wrap"><h1 className="header-tab-title">My Profile</h1><LotusSvg size={28} className="header-tab-icon" /></div>
              <span aria-hidden="true" />
            </div>
          ) : (
            <div className="header-tab-title-wrap"><h1 className="header-tab-title">More</h1><MoreHorizontal size={26} className="header-tab-icon" /></div>
          )}
        </header>

        {!isSupabaseConfigured ? <StatePanel tone="error" title="Content service not configured" body="Add the production Supabase environment values before publishing this site." /> : null}
        {dataLoading ? <StatePanel title="Loading your sacred space" body="Fetching the latest sessions and media…" /> : null}
        {!dataLoading && dataError ? <StatePanel tone="error" title="Some content could not be loaded" body={dataError} actionLabel="Try again" onAction={() => void loadData()} /> : null}

        {!dataLoading && activeTab === "home" ? (
          <>
            <section className="premium-home-hero">
              <div className="premium-home-hero-wash" aria-hidden="true" />
              <div className="premium-home-hero-topwash" aria-hidden="true" />
              <img className="premium-home-hero-mandala" src="/sacred-mandala-alpha.png" alt="" aria-hidden="true" />
              <header className="premium-home-hero-top">
                <img src="/sacred-flame-logo.png" alt="Sacred Circle" className="premium-home-hero-logo" />
                <div className="premium-home-hero-actions">
                  <button className="premium-home-hero-bell" aria-label="Notifications"><Bell size={21} /></button>
                  <button className="premium-home-hero-avatar" onClick={() => user ? (setActiveTab("more"), setShowProfilePage(true)) : requestSignIn()} aria-label={user ? "Open profile" : "Sign in"}>
                    {avatarUrl ? <img src={avatarUrl} alt="" className="premium-user-avatar-image" /> : avatarInitial}
                  </button>
                </div>
              </header>
              <div className="premium-home-hero-greeting">
                <h1>{homeTitle}</h1>
                <span />
                <p>{homeSubtitle}</p>
              </div>

              {nextSession ? (
                <div className="premium-hero-session-card">
                  <div className="premium-hero-session-glow" aria-hidden="true" />
                  <div className="premium-hero-session-copy">
                    <span className="premium-hero-session-pill">Live Session</span>
                    <h2>{nextSession.title}</h2>
                    <div className="premium-hero-session-meta">
                      <div><Calendar size={18} /><span>{formatHeroSessionDay(nextSession.session_date)}</span></div>
                      <div><Clock size={18} /><span>{formatHeroSessionTime(nextSession.session_date)}</span></div>
                      <div><Video size={18} /><span>Live on Zoom</span></div>
                    </div>
                  </div>
                  <div className="premium-hero-session-art" aria-hidden="true"><img src="/landing-session-lotus.png" alt="" /></div>
                  <div className="premium-hero-session-actions">
                    {safeExternalLink(nextSession.zoom_link || settings.default_zoom_link) ? <a href={String(safeExternalLink(nextSession.zoom_link || settings.default_zoom_link))} target="_blank" rel="noreferrer" className="premium-btn premium-btn-primary">Join Session <span>→</span></a> : <button className="premium-btn premium-btn-primary" onClick={requestSignIn}>Join Session <span>→</span></button>}
                  </div>
                </div>
              ) : null}
            </section>
            {!nextSession ? (
              <StatePanel title={user ? "No upcoming session" : "Sign in to view sessions"} body={user ? "New sessions will appear here after they are published." : "Session details are available to Sacred Circle members."} actionLabel={user ? undefined : "Sign in"} onAction={user ? undefined : requestSignIn} />
            ) : null}

            {publicAudios[0] ? (
              <section className="premium-audio-card">
                <span className="premium-kicker">Featured Audio</span>
                <div className="premium-audio-layout">
                  <button className="premium-audio-thumb" onClick={() => playOrToggle(publicAudios[0])} aria-label={`${currentTrack?.id === publicAudios[0].id && isPlaying ? "Pause" : "Play"} ${publicAudios[0].title}`}>
                    <img src="/landing-shivir-lake.png" alt="" />
                    <span>{currentTrack?.id === publicAudios[0].id && isPlaying ? <Pause size={21} fill="currentColor" /> : <Play size={21} fill="currentColor" />}</span>
                  </button>
                  <div className="premium-audio-main">
                    <h3>{publicAudios[0].title}</h3>
                    <p>{publicAudios[0].description}</p>
                    <div className="premium-audio-duration"><Headphones size={17} /><span>{formatDuration(publicAudios[0].duration_seconds || 0)}</span></div>
                    <div className="premium-progress-line"><span style={{ width: currentTrack?.id === publicAudios[0].id && duration ? `${Math.min((currentTime / duration) * 100, 100)}%` : "0%" }} /></div>
                    <div className="premium-time-row"><span>{currentTrack?.id === publicAudios[0].id ? formatPlayerTime(currentTime) : "00:00"}</span><span>{formatPlayerTime(publicAudios[0].duration_seconds || duration)}</span></div>
                  </div>
                  <button className="premium-listen-now" onClick={() => playOrToggle(publicAudios[0])} disabled={isAudioLoading}>
                    <span className="premium-listen-icon"><Play size={18} /></span>{isAudioLoading ? "Loading…" : currentTrack?.id === publicAudios[0].id && isPlaying ? "Pause" : "Listen Now"}
                  </button>
                </div>
              </section>
            ) : (
              <StatePanel title={user ? "No public audio available" : "Sign in for the audio library"} body={user ? "Only reviewed, playable Sacred Circle audio appears here." : "Audio resources are available after member sign-in."} actionLabel={user ? undefined : "Sign in"} onAction={user ? undefined : requestSignIn} />
            )}

            <section className="premium-library-card">
              <span className="premium-kicker">Sacred Library</span>
              <div className="premium-library-grid">
                <button onClick={() => goToTab("audio")}><Headphones size={37} /><span><strong>Audio Library</strong><small>{audios.length} {audios.length === 1 ? "Audio" : "Audios"}</small></span></button>
                <button onClick={() => goToTab("video")}><Video size={36} /><span><strong>Video Library</strong><small>{siteVideos.length} Videos</small></span></button>
              </div>
              <button className="premium-library-cta" onClick={() => goToTab("audio")}>Explore Library <span>→</span></button>
            </section>

            {nextEvent ? (
              <section className="premium-shivir-card">
                <span className="premium-kicker">Next Event</span>
                <div className="premium-shivir-layout">
                  <img src={safeHttpUrl(nextEvent.image_url) || "/landing-shivir-lake.png"} alt="" />
                  <div className="premium-shivir-copy">
                    <h3>{nextEvent.title}</h3>
                    {nextEvent.location ? <div><MapPin size={17} /><span>{nextEvent.location}</span></div> : null}
                    {nextEvent.event_date ? <div><Calendar size={17} /><span>{formatDateTime(nextEvent.event_date)}</span></div> : null}
                  </div>
                  <div className="premium-shivir-symbol"><img src="/landing-om-mandala.png" alt="" /></div>
                  {nextEvent.registration_enabled ? <button className="premium-shivir-button" onClick={() => { setEventRegistrationSuccess(false); setShowEventModal(true); }}>Register Interest <span>→</span></button> : null}
                </div>
              </section>
            ) : null}
          </>
        ) : null}

        {!dataLoading && activeTab === "video" ? (
          <div className="premium-tab-page premium-video-library-page">
            <section className="premium-video-hero">
              <img src="/landing-shivir-lake.png" alt="" />
              <div className="premium-video-hero-copy"><h2>Wisdom for Awakening</h2><p>Explore Sacred Circle talks, teachings and guided insights.</p></div>
            </section>

            <div className="premium-video-chip-strip" aria-label="Video categories">
              {videoCategories.map((category) => <button key={category} className={selectedVideoCategory === category ? "active" : ""} onClick={() => setSelectedVideoCategory(category)}>{category}</button>)}
            </div>

            <div className="production-library-controls">
              <label className="premium-search-box"><Search size={19} /><input ref={videoSearchRef} aria-label="Search videos" placeholder="Search videos…" value={videoSearch} onChange={(event) => setVideoSearch(event.target.value)} /></label>
              <select className="production-sort-select" aria-label="Sort videos" value={videoSort} onChange={(event) => setVideoSort(event.target.value as VideoSort)}>
                <option value="library">Library order</option>
                <option value="latest">Latest first</option>
              </select>
            </div>

            {featuredVideo ? (
              <section className="premium-video-library-section">
                <div className="premium-section-head premium-video-section-head"><h2><Video size={19} /> Featured Video</h2><span className="production-result-count">{filteredVideos.length} results</span></div>
                <article className="premium-video-featured-large">
                  <a href={featuredVideo.youtubeUrl} target="_blank" rel="noreferrer" className="premium-video-featured-thumb" aria-label={`Open ${featuredVideo.title} on YouTube`}><img src={featuredVideo.thumbnailUrl} alt={featuredVideo.title} /><span className="premium-video-play-large"><Play size={30} fill="currentColor" /></span></a>
                  <div className="premium-video-featured-copy"><h3>{featuredVideo.title}</h3>{featuredVideo.description ? <p>{featuredVideo.description}</p> : null}<div className="premium-video-meta"><span><Video size={18} /> YouTube video</span><i /><strong>{featuredVideo.category}</strong></div></div>
                </article>
              </section>
            ) : (
              <StatePanel title={siteVideos.length ? "No videos match" : "No videos published"} body={siteVideos.length ? "Try another category or search term." : "Published YouTube videos will appear here."} />
            )}

            {libraryVideos.length ? (
              <section className="premium-video-library-section">
                <div className="premium-video-list-head"><h2>All Videos</h2></div>
                <div className="premium-video-list">
                  {libraryVideos.map((video) => <article className="premium-video-list-row production-video-row" key={video.id}><a href={video.youtubeUrl} target="_blank" rel="noreferrer" className="premium-video-list-thumb" aria-label={`Open ${video.title} on YouTube`}><img src={video.thumbnailUrl} alt={video.title} /><span><Play size={17} fill="currentColor" /></span></a><div className="premium-video-list-copy"><h3>{video.title}</h3><div className="premium-video-row-meta"><span><Video size={15} /> YouTube</span><strong>{video.category}</strong></div></div><a className="production-open-link" href={video.youtubeUrl} target="_blank" rel="noreferrer" aria-label={`Open ${video.title}`}><ChevronRight size={19} /></a></article>)}
                </div>
              </section>
            ) : null}
          </div>
        ) : null}

        {!dataLoading && activeTab === "audio" ? (
          <div className="premium-tab-page premium-meditations-page">
            {!user ? <AuthPrompt title="Sign in for the audio library" body="Sacred Circle audio and protected session recordings are available to signed-in members." onSignIn={requestSignIn} /> : null}
            <div className="premium-search-row"><label className="premium-search-box"><Search size={19} /><input aria-label="Search audio" placeholder="Search audio…" value={audioSearch} onChange={(event) => setAudioSearch(event.target.value)} /></label></div>
            <div className="premium-chip-row production-chip-row" aria-label="Audio categories">{audioCategories.map((category) => <button key={category} className={selectedAudioCategory === category ? "active" : ""} onClick={() => setSelectedAudioCategory(category)}>{category}</button>)}</div>

            {featuredAudio ? (
              <section className="premium-media-section">
                <div className="premium-section-head"><h2>Featured Audio</h2><span className="production-result-count">{filteredAudios.length} results</span></div>
                <article className="premium-featured-card production-featured-audio">
                  <img src="/landing-shivir-lake.png" alt="" />
                  <button className="premium-featured-play" onClick={() => playOrToggle(featuredAudio)} aria-label={`${currentTrack?.id === featuredAudio.id && isPlaying ? "Pause" : "Play"} ${featuredAudio.title}`}>{currentTrack?.id === featuredAudio.id && isPlaying ? <Pause size={26} fill="currentColor" /> : <Play size={26} fill="currentColor" />}</button>
                  <div className="premium-featured-info"><span>{featuredAudio.access_type === "session_protected" ? "Session Recording" : "Featured"}</span><h3>{featuredAudio.title}</h3><p>{formatDuration(featuredAudio.duration_seconds || 0)} · {featuredAudio.category}</p></div>
                </article>
              </section>
            ) : (
              <StatePanel title={user && audios.length ? "No audio matches" : "No playable audio published"} body={user && audios.length ? "Try another category or search term." : "Only reviewed Sacred Circle audio with a real media source is shown here."} />
            )}

            {audioList.length ? (
              <section className="premium-media-section">
                <div className="premium-section-head"><h2>Audio Library</h2></div>
                <div className="premium-audio-list">
                  {audioList.map((resource) => {
                    const active = currentTrack?.id === resource.id;
                    const locked = resource.access_type === "session_protected" && !active;
                    const status = active ? isPlaying ? "Playing" : "Paused" : locked ? "Key required" : "Play";
                    return <button className="premium-audio-row production-audio-row" key={resource.id} onClick={() => playOrToggle(resource)}><span className="premium-audio-row-thumb"><img src="/landing-shivir-lake.png" alt="" /><span>{locked ? <Lock size={15} /> : active && isPlaying ? <Pause size={15} fill="currentColor" /> : <Play size={15} fill="currentColor" />}</span></span><span className="premium-audio-row-copy"><h3>{resource.title}</h3><p>{formatDuration(resource.duration_seconds || 0)} · {resource.category}</p></span><span className={`production-audio-status ${locked ? "locked" : ""}`}>{status}</span></button>;
                  })}
                </div>
              </section>
            ) : null}

            {currentTrack ? (
              <section className="production-player" aria-label="Audio player">
                <div><span className="premium-kicker">Now Playing</span><h2>{currentTrack.title}</h2><p>{currentTrack.category}</p></div>
                <div className="production-player-controls"><button onClick={handlePlayToggle} aria-label={isPlaying ? "Pause audio" : "Play audio"}>{isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}</button><div className="production-player-progress" ref={progressBarRef} onClick={handleScrub}><span style={{ width: duration ? `${Math.min((currentTime / duration) * 100, 100)}%` : "0%" }} /></div><span>{formatPlayerTime(currentTime)} / {formatPlayerTime(duration)}</span></div>
              </section>
            ) : null}

          </div>
        ) : null}

        {!dataLoading && activeTab === "more" && showProfilePage ? (
          <div className="premium-profile-page">
            {!user ? <AuthPrompt title="Sign in to your profile" body="Use your email to access your Sacred Circle profile and recording permissions." onSignIn={requestSignIn} /> : (
              <>
                <section className="premium-profile-hero-card">
                  <img className="premium-profile-hero-bg" src="/landing-shivir-lake.png" alt="" />
                  <div className="premium-profile-hero-content"><div className="premium-profile-avatar-wrap"><div className="premium-profile-avatar-large">{avatarUrl ? <img src={avatarUrl} alt="" className="premium-user-avatar-image" /> : <span className="production-profile-initial">{avatarInitial}</span>}</div></div><div className="premium-profile-identity"><h2>{displayName || "Sacred member"}</h2><span><LotusSvg size={15} /> Sacred Member</span><p>{memberEmail}</p>{memberSince ? <p>Member since {memberSince}</p> : null}</div></div>
                </section>

                <section className="premium-profile-stats production-real-stats">
                  <div className="premium-profile-stat"><span><Calendar size={27} /></span><strong>{registrationCount}</strong><small>Sessions Attended</small></div>
                  <div className="premium-profile-stat"><span><Lock size={28} /></span><strong>Every play</strong><small>Sacred Key Required</small></div>
                </section>

                <section className="production-profile-form-card">
                  <div className="premium-profile-section-head"><div><h2>Personal Details</h2><p>Keep only the details Sacred Circle needs for sessions and support.</p></div></div>
                  <form className="production-profile-form" onSubmit={saveProfile}><label>Name *<input value={profileDraft.name} onChange={(event) => setProfileDraft({ ...profileDraft, name: event.target.value })} autoComplete="name" required /></label><label>Email<input value={memberEmail} readOnly disabled /></label><label>Date of Birth *<input type="date" max={new Date().toISOString().slice(0, 10)} value={profileDraft.date_of_birth} onChange={(event) => setProfileDraft({ ...profileDraft, date_of_birth: event.target.value })} required /></label><label>City *<input value={profileDraft.city} onChange={(event) => setProfileDraft({ ...profileDraft, city: event.target.value })} autoComplete="address-level2" required /></label><label>State *<input value={profileDraft.state} onChange={(event) => setProfileDraft({ ...profileDraft, state: event.target.value })} autoComplete="address-level1" required /></label><label>Phone (optional)<input value={profileDraft.phone} onChange={(event) => setProfileDraft({ ...profileDraft, phone: event.target.value })} autoComplete="tel" /></label><button className="premium-btn premium-btn-primary" type="submit" disabled={profileBusy}>{profileBusy ? "Saving…" : "Save Profile"}</button></form>
                </section>

                <section className="production-account-actions"><button className="production-signout-button" onClick={() => void signOut()}><LogOut size={18} /> Sign Out</button><button className="production-delete-button" onClick={() => void deleteAccount()} disabled={deleteBusy}><Trash2 size={18} /> {deleteBusy ? "Deleting…" : "Delete Account"}</button></section>
              </>
            )}
          </div>
        ) : null}

        {!dataLoading && activeTab === "more" && !showProfilePage ? (
          <div className="premium-tab-page premium-more-page">
            {user ? (
              <section className="premium-more-profile" onClick={() => setShowProfilePage(true)} role="button" tabIndex={0} onKeyDown={(event) => { if (event.key === "Enter") setShowProfilePage(true); }}><div className="premium-more-avatar">{avatarUrl ? <img src={avatarUrl} alt="" className="premium-user-avatar-image" /> : avatarInitial}</div><div className="premium-more-profile-copy"><h2>{displayName || "Sacred member"}</h2><p>{memberEmail}</p><span><LotusSvg size={14} /> Sacred Member</span></div><ChevronRight size={22} /></section>
            ) : <AuthPrompt title="Sign in to Sacred Circle" body="Access your profile, registrations and protected recordings with a secure email link." onSignIn={requestSignIn} />}

            <section className="premium-more-list">
              {user ? <button className="premium-more-row" onClick={() => setShowProfilePage(true)}><span><User size={18} /></span><strong>My Profile</strong><ChevronRight size={18} /></button> : null}
              <button className="premium-more-row" onClick={() => goToTab("audio")}><span><Headphones size={18} /></span><strong>Audio Library</strong><ChevronRight size={18} /></button>
              <button className="premium-more-row" onClick={() => goToTab("video")}><span><Video size={18} /></span><strong>Video Library</strong><ChevronRight size={18} /></button>
              <button className="premium-more-row" onClick={replaySplash}><span><Play size={18} /></span><strong>Replay Splash Animation</strong><ChevronRight size={18} /></button>
              {nextEvent?.registration_enabled ? <button className="premium-more-row" onClick={() => { setEventRegistrationSuccess(false); setShowEventModal(true); }}><span><LotusSvg size={18} /></span><strong>{nextEvent.title}</strong><ChevronRight size={18} /></button> : null}
            </section>

            {(safeExternalLink(settings.whatsapp_group_url) || settings.contact_email) ? <section className="premium-more-list production-link-list">{safeExternalLink(settings.whatsapp_group_url) ? <a className="premium-more-row" href={settings.whatsapp_group_url} target="_blank" rel="noreferrer"><span><Key size={18} /></span><strong>WhatsApp Community</strong><ChevronRight size={18} /></a> : null}{settings.contact_email ? <a className="premium-more-row" href={`mailto:${settings.contact_email}`}><span><Mail size={18} /></span><strong>Contact Sacred Circle</strong><ChevronRight size={18} /></a> : null}</section> : null}
            <section className="premium-more-list production-link-list">
              <a className="premium-more-row" href="https://sacred-circle-app.vercel.app/about-sacred-circle" target="_blank" rel="noreferrer"><span><Info size={18} /></span><strong>About Sacred Circle</strong><ChevronRight size={18} /></a>
              <a className="premium-more-row" href="https://sacred-circle-app.vercel.app/privacy-policy" target="_blank" rel="noreferrer"><span><Lock size={18} /></span><strong>Privacy Policy</strong><ChevronRight size={18} /></a>
              <a className="premium-more-row" href="https://sacred-circle-app.vercel.app/terms-of-use" target="_blank" rel="noreferrer"><span><FileText size={18} /></span><strong>Terms of Use</strong><ChevronRight size={18} /></a>
              <a className="premium-more-row" href="https://sacred-circle-app.vercel.app/account-deletion" target="_blank" rel="noreferrer"><span><Trash2 size={18} /></span><strong>Account & Data Deletion</strong><ChevronRight size={18} /></a>
            </section>
          </div>
        ) : null}

        {!dataLoading && activeTab !== "more" ? (
          <footer className="landing-footer"><div className="footer-brand"><img src="/sacred-circle-logo.png" alt="Sacred Circle" className="footer-logo" /><span className="footer-brand-text">Sacred Circle</span></div><div className="footer-links">{settings.contact_email ? <a href={`mailto:${settings.contact_email}`} className="footer-link">Contact</a> : null}<a href="https://sacred-circle-app.vercel.app/privacy-policy" className="footer-link">Privacy</a><a href="https://sacred-circle-app.vercel.app/terms-of-use" className="footer-link">Terms</a>{safeExternalLink(settings.whatsapp_group_url) ? <><span className="footer-dot">•</span><a href={settings.whatsapp_group_url} target="_blank" rel="noreferrer" className="footer-link">WhatsApp</a></> : null}</div><p className="footer-copy">© {currentYear} Sacred Circle</p></footer>
        ) : null}
        </div>
      </div>

      <nav className="tab-bar" aria-label="Primary navigation" style={{ opacity: showStarter ? 0 : 1, pointerEvents: showStarter ? "none" : "auto", transition: "opacity 0.35s ease" }}>
        <button className={`tab-item ${activeTab === "home" ? "active" : ""}`} onClick={() => goToTab("home")}><Home size={20} /><span className="tab-label">Home</span></button>
        <button className={`tab-item ${activeTab === "audio" ? "active" : ""}`} onClick={() => goToTab("audio")}><Headphones size={20} /><span className="tab-label">Audio</span></button>
        <button className={`tab-item ${activeTab === "video" ? "active" : ""}`} onClick={() => goToTab("video")}><Video size={20} /><span className="tab-label">Video</span></button>
        <button className={`tab-item ${activeTab === "more" ? "active" : ""}`} onClick={() => goToTab("more")}><MoreHorizontal size={20} /><span className="tab-label">More</span></button>
      </nav>

      {protectedTrack ? (
        <div className="modal-overlay" onClick={() => { setProtectedTrack(null); setKeyDigits(Array(SACRED_KEY_LENGTH).fill("")); }}>
          <div className="modal-content production-key-modal" onClick={(event) => event.stopPropagation()}>
            <button className="modal-close" onClick={() => { setProtectedTrack(null); setKeyDigits(Array(SACRED_KEY_LENGTH).fill("")); }} aria-label="Close Sacred Access Key"><X size={16} /></button>
            <div className="access-key-card">
              <div className="access-key-header"><span className="key-icon-circle"><Key size={19} /></span><div><h3 className="access-key-title">Sacred Access Key</h3><p className="access-key-desc">Enter the six-digit key shared for this session. You will enter it again the next time you open the recording.</p></div></div>
              <p className="production-key-track">{protectedTrack.title}</p>
              <div className="digit-inputs" aria-label="Six-digit Sacred Access Key">
                {keyDigits.map((digit, index) => (
                  <input
                    key={index}
                    ref={(element) => { keyInputRefs.current[index] = element; }}
                    className="digit-input"
                    value={digit}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={index === 0 ? SACRED_KEY_LENGTH : 1}
                    autoComplete={index === 0 ? "one-time-code" : "off"}
                    aria-label={`Sacred Access Key digit ${index + 1}`}
                    onChange={(event) => handleKeyDigitChange(index, event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Backspace" && !digit && index > 0) keyInputRefs.current[index - 1]?.focus();
                      if (event.key === "Enter" && keyDigits.every(Boolean)) void unlockRecording();
                    }}
                  />
                ))}
              </div>
              <button className="unlock-btn" disabled={unlockBusy || !keyDigits.every(Boolean)} onClick={() => void unlockRecording()}>{unlockBusy ? "Checking key…" : "Open Recording"}</button>
            </div>
          </div>
        </div>
      ) : null}

      {showAuthModal ? (
        <div className="modal-overlay" onClick={() => setShowAuthModal(false)}>
          <div className="modal-content production-auth-modal" onClick={(event) => event.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowAuthModal(false)} aria-label="Close sign-in"><X size={16} /></button>
            <LotusSvg size={42} className="production-auth-lotus" />
            <h3 className="modal-title">Sign in to Sacred Circle</h3>
            <p className="modal-desc">We will email you a secure sign-in link. No password is required.</p>
            <form className="booking-form" onSubmit={sendMagicLink}><div className="form-group"><label className="form-label">Email address</label><input type="email" required className="form-input" value={authEmail} onChange={(event) => setAuthEmail(event.target.value)} autoComplete="email" placeholder="you@example.com" disabled={authBusy} /></div><button type="submit" className="btn btn-primary" disabled={authBusy || !isSupabaseConfigured}>{authBusy ? "Sending…" : "Email Sign-in Link"}</button></form>
            {authNotice ? <p className="production-auth-notice" role="status">{authNotice}</p> : null}
          </div>
        </div>
      ) : null}

      {showEventModal && nextEvent ? (
        <div className="modal-overlay" onClick={() => { setShowEventModal(false); setEventRegistrationSuccess(false); }}>
          <div className="modal-content" onClick={(event) => event.stopPropagation()}>
            <button className="modal-close" onClick={() => { setShowEventModal(false); setEventRegistrationSuccess(false); }} aria-label="Close event registration"><X size={16} /></button>
            {!eventRegistrationSuccess ? <><h3 className="modal-title">Register for {nextEvent.title}</h3><p className="modal-desc">Share the details Sacred Circle needs to follow up about this event.</p><form className="booking-form" onSubmit={submitEventRegistration}><div className="form-group"><label className="form-label">Full name</label><input required className="form-input" value={eventForm.name} onChange={(event) => setEventForm({ ...eventForm, name: event.target.value })} /></div><div className="form-group"><label className="form-label">Email</label><input type="email" required className="form-input" value={eventForm.email} onChange={(event) => setEventForm({ ...eventForm, email: event.target.value })} /></div><div className="form-group"><label className="form-label">Phone (optional)</label><input type="tel" className="form-input" value={eventForm.phone} onChange={(event) => setEventForm({ ...eventForm, phone: event.target.value })} /></div><div className="form-group"><label className="form-label">City (optional)</label><input className="form-input" value={eventForm.city} onChange={(event) => setEventForm({ ...eventForm, city: event.target.value })} /></div><button type="submit" className="btn btn-primary" disabled={eventSubmitting}>{eventSubmitting ? "Saving…" : "Confirm Registration"}</button></form></> : <div className="success-state"><div className="success-icon-wrapper"><CheckCircle size={28} /></div><h3 className="modal-title">Registration saved</h3><p className="modal-desc">Sacred Circle has received your interest in {nextEvent.title}.</p><button className="btn btn-primary" onClick={() => { setShowEventModal(false); setEventRegistrationSuccess(false); }}>Done</button></div>}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function StatePanel({ title, body, tone = "neutral", actionLabel, onAction }: { title: string; body: string; tone?: "neutral" | "error"; actionLabel?: string; onAction?: () => void }) {
  return <section className={`production-state-panel ${tone === "error" ? "error" : ""}`}><div><h2>{title}</h2><p>{body}</p></div>{actionLabel && onAction ? <button onClick={onAction}>{actionLabel}</button> : null}</section>;
}

function AuthPrompt({ title, body, onSignIn }: { title: string; body: string; onSignIn: () => void }) {
  return <section className="production-auth-prompt"><span><User size={24} /></span><div><h2>{title}</h2><p>{body}</p></div><button onClick={onSignIn}>Sign in</button></section>;
}

function mapDbVideoToLandingVideo(video: SacredVideo): LandingVideo | null {
  const youtubeUrl = String(video.youtube_url || "").trim();
  const generatedThumbnail = getYouTubeThumbnailUrl(youtubeUrl, "hqdefault");
  const title = String(video.title || "").trim();
  if (!generatedThumbnail || !title) return null;
  return {
    id: String(video.id),
    title,
    description: String(video.description || "").trim(),
    youtubeUrl,
    thumbnailUrl: safeHttpUrl(video.thumbnail_url) || generatedThumbnail,
    category: String(video.category || "Uncategorized").trim() || "Uncategorized",
    displayOrder: Number(video.display_order || 0),
    createdAt: video.created_at || null
  };
}

function isRealPlayableAudio(resource: Resource) {
  if (resource.type !== "audio") return false;
  const storagePath = String(resource.storage_path || "").toLocaleLowerCase();
  if (storagePath.includes("/demo/") || storagePath.startsWith("demo/")) return false;
  const directUrl = realExternalAudioUrl(resource.external_url);
  const storedAudio = ["r2", "supabase"].includes(resource.storage_provider) && Boolean(resource.storage_path);
  return Boolean(directUrl || storedAudio);
}

function realExternalAudioUrl(value?: string | null) {
  const url = safeHttpUrl(value);
  if (!url) return null;
  try {
    const hostname = new URL(url).hostname.toLocaleLowerCase();
    if (hostname === "soundhelix.com" || hostname.endsWith(".soundhelix.com")) return null;
    return url;
  } catch {
    return null;
  }
}

function safeHttpUrl(value?: string | null) {
  if (!value) return null;
  try {
    const parsed = new URL(String(value).trim());
    return ["http:", "https:"].includes(parsed.protocol) ? parsed.toString() : null;
  } catch {
    return null;
  }
}

function safeExternalLink(value?: string | null) {
  const url = safeHttpUrl(value);
  if (!url || url.includes("1234567890")) return null;
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes("wa.me") && parsed.pathname === "/") return null;
    return url;
  } catch {
    return null;
  }
}

function firstName(value?: string | null) {
  const first = (value || "").trim().split(/\s+/)[0]?.replace(/[^A-Za-z]/g, "") || "";
  return first ? `${first.slice(0, 1).toUpperCase()}${first.slice(1).toLowerCase()}` : "";
}

function formatDateTime(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" });
}

function formatHeroSessionDay(value?: string | null) {
  return "Every Sunday";
}

function formatHeroSessionTime(value?: string | null) {
  return "4:00 PM IST";
}

function formatMonthYear(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-IN", { month: "short", year: "numeric" });
}

function formatPlayerTime(value: number) {
  const safeValue = Number.isFinite(value) && value > 0 ? value : 0;
  const minutes = Math.floor(safeValue / 60);
  const seconds = Math.floor(safeValue % 60);
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function dateValue(value?: string | null) {
  const time = value ? new Date(value).getTime() : 0;
  return Number.isFinite(time) ? time : 0;
}

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback;
}

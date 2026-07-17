import AsyncStorage from "@react-native-async-storage/async-storage";

const RECENT_AUDIO_KEY = "sacred-circle-recent-audio";
const MAX_RECENT_AUDIO = 8;

export async function recordRecentlyPlayedAudio(resourceId: string) {
  if (!resourceId) return;
  const existing = await getRecentlyPlayedAudioIds();
  const next = [resourceId, ...existing.filter((id) => id !== resourceId)].slice(0, MAX_RECENT_AUDIO);
  await AsyncStorage.setItem(RECENT_AUDIO_KEY, JSON.stringify(next));
}

export async function getRecentlyPlayedAudioIds() {
  const stored = await AsyncStorage.getItem(RECENT_AUDIO_KEY);
  if (!stored) return [];
  try {
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === "string") : [];
  } catch {
    return [];
  }
}

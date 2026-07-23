import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { Platform } from "react-native";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false
  })
});

const SUNDAY_NOTIFICATION_CHANNEL = "sunday-sessions";

async function ensureSundayNotificationChannel() {
  if (Platform.OS !== "android") return;
  await Notifications.setNotificationChannelAsync(SUNDAY_NOTIFICATION_CHANNEL, {
    name: "Sunday session reminders",
    description: "Reminders and updates for Sacred Circle Sunday sessions.",
    importance: Notifications.AndroidImportance.HIGH,
    sound: "default",
    vibrationPattern: [0, 250, 180, 250],
    lightColor: "#C99332"
  });
}

export async function requestNotificationPermissions() {
  if (Platform.OS === "web") return false;
  await ensureSundayNotificationChannel();
  const existing = await Notifications.getPermissionsAsync();
  let status = existing.status;
  if (status !== "granted") {
    const requested = await Notifications.requestPermissionsAsync();
    status = requested.status;
  }
  return status === "granted";
}

export async function getExpoPushToken() {
  if (Platform.OS === "web") return null;
  const allowed = await requestNotificationPermissions();
  if (!allowed) return null;

  const projectId = Constants.expoConfig?.extra?.eas?.projectId || process.env.EXPO_PUBLIC_EAS_PROJECT_ID;
  if (!projectId || String(projectId).includes("$")) return null;

  const token = await Notifications.getExpoPushTokenAsync({ projectId: String(projectId) });
  return token.data;
}

export async function scheduleSundayReminder(title: string, body: string, date: Date) {
  if (Platform.OS === "web") return null;
  const allowed = await requestNotificationPermissions();
  if (!allowed) return null;
  return Notifications.scheduleNotificationAsync({
    content: { title, body },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date,
      channelId: Platform.OS === "android" ? SUNDAY_NOTIFICATION_CHANNEL : undefined
    }
  });
}

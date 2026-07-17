import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { Platform } from "react-native";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false
  })
});

export async function requestNotificationPermissions() {
  const existing = await Notifications.getPermissionsAsync();
  let status = existing.status;
  if (status !== "granted") {
    const requested = await Notifications.requestPermissionsAsync();
    status = requested.status;
  }
  return status === "granted";
}

export async function getExpoPushToken() {
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
      date
    }
  });
}

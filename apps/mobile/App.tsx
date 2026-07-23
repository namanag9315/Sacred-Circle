import "react-native-gesture-handler";
import "react-native-url-polyfill/auto";

import { useEffect } from "react";
import { setAudioModeAsync } from "expo-audio";
import { StatusBar } from "expo-status-bar";
import { AuthProvider } from "./src/context/AuthContext";
import { AppNavigator } from "./src/navigation/AppNavigator";

export default function App() {
  useEffect(() => {
    void setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: true,
      interruptionMode: "doNotMix"
    }).catch((error) => {
      console.warn("Unable to configure background audio:", error);
    });
  }, []);

  return (
    <AuthProvider>
      <StatusBar style="dark" />
      <AppNavigator />
    </AuthProvider>
  );
}

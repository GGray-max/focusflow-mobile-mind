
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.focustask.app',
  appName: 'FocusTask',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    cleartext: true // Allow cleartext connections for debugging
  },
  // Capacitor plugin configuration
  plugins: {
    LocalNotifications: {
      smallIcon: "ic_stat_focus_brain",
      iconColor: "#8B5CF6",
      sound: true, // Enable sounds
      // Enable exact notifications and background support
      schedule: {
        allowWhileIdle: true
      },
      channelDefaults: {
        importance: 5, // High importance for all channels
        visibility: 1, // Public
        vibration: true,
        lights: true
      }
    },
    // Allow for app state management
    App: {
      backgroundColor: "#8B5CF6",
      webDir: "dist"
    }
  },
  // Android specific configuration
  android: {
    buildOptions: {
      keystorePath: null,
      keystorePassword: null,
      keystoreAlias: null,
      keystoreAliasPassword: null,
      releaseType: "APK"
    },
    iconBackground: "#8B5CF6", // Purple background for adaptive icons
    backgroundColor: "#8B5CF6", // App background color
    icon: "resources/icon", // Focus brain icon
    // Define custom notification icons
    icons: [
      {
        name: "ic_stat_focus_brain",
        folder: "resources/notifications",
        scale: ["mdpi", "hdpi", "xhdpi", "xxhdpi", "xxxhdpi"]
      }
    ]
  },
  // Make sure background task handling is enabled for iOS
  ios: {
    contentInset: "always"
  }
};

export default config;

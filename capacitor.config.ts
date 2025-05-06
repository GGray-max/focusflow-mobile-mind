
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.focustask.app',
  appName: 'FocusTask',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  // Capacitor plugin configuration
  plugins: {
    LocalNotifications: {
      smallIcon: "ic_stat_focus_brain",
      iconColor: "#8B5CF6",
      sound: "beep.wav",
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
    icons: [
      {
        name: "ic_stat_focus_brain",
        folder: "resources/notifications",
        scale: ["mdpi", "hdpi", "xhdpi", "xxhdpi", "xxxhdpi"]
      }
    ]
  }
};

export default config;

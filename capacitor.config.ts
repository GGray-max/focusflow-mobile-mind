
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
      smallIcon: "ic_stat_notification",
      iconColor: "#8B5CF6",
      sound: "beep.wav",
      // Enable exact notifications
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
    }
  }
};

export default config;


import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.1e6cfafd31b140ceb4c99f530fa6e4d6',
  appName: 'FocusFlow',
  webDir: 'dist',
  server: {
    url: 'https://1e6cfafd-31b1-40ce-b4c9-9f530fa6e4d6.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    LocalNotifications: {
      smallIcon: "ic_stat_icon_config_sample",
      iconColor: "#8B5CF6",
      sound: "beep.wav",
    }
  }
};

export default config;

import { PermissionsAndroid, Platform, Alert, Linking } from 'react-native';
import { check, PERMISSIONS, request, RESULTS } from 'react-native-permissions';

type PermissionStatus = 'granted' | 'denied' | 'blocked' | 'unavailable' | 'limited';

class PermissionService {
  // Check if we're running on Android
  static isAndroid = Platform.OS === 'android';

  // Check and request microphone permission
  static async checkAndRequestMicrophonePermission(): Promise<PermissionStatus> {
    if (!this.isAndroid) return 'granted'; // Skip on non-Android

    try {
      // Check if we already have permission
      const hasPermission = await check(PERMISSIONS.ANDROID.RECORD_AUDIO);
      
      if (hasPermission === RESULTS.GRANTED) {
        return 'granted';
      }

      // If permission hasn't been denied before, request it
      if (hasPermission === RESULTS.DENIED) {
        const result = await request(PERMISSIONS.ANDROID.RECORD_AUDIO);
        return result as PermissionStatus;
      }

      // If permission was denied before, show rationale
      if (hasPermission === RESULTS.BLOCKED) {
        return 'blocked';
      }

      return hasPermission as PermissionStatus;
    } catch (error) {
      console.error('Error checking microphone permission:', error);
      return 'unavailable';
    }
  }

  // Check and request overlay permission (for drawing over other apps)
  static async checkAndRequestOverlayPermission(): Promise<boolean> {
    if (!this.isAndroid) return true; // Skip on non-Android

    try {
      // On Android 10+ we need to check for overlay permission
      if (Platform.Version >= 29) {
        const hasPermission = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.SYSTEM_ALERT_WINDOW
        );

        if (!hasPermission) {
          // Request the permission
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.SYSTEM_ALERT_WINDOW,
            {
              title: 'Overlay Permission',
              message: 'FocusFlow needs overlay permission to show timers over other apps',
              buttonNeutral: 'Ask Me Later',
              buttonNegative: 'Cancel',
              buttonPositive: 'OK',
            },
          );
          
          if (granted === PermissionsAndroid.RESULTS.GRANTED) {
            return true;
          } else {
            // If permission is denied, show a dialog to guide user to settings
            Alert.alert(
              'Permission Required',
              'Overlay permission is required to show timers over other apps. Please enable it in app settings.',
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Open Settings', onPress: () => this.openAppSettings() },
              ],
            );
            return false;
          }
        }
        return true;
      }
      return true; // No overlay permission needed for older Android versions
    } catch (error) {
      console.error('Error checking overlay permission:', error);
      return false;
    }
  }

  // Open app settings
  static openAppSettings() {
    if (this.isAndroid) {
      Linking.openSettings();
    } else {
      Linking.openURL('app-settings:');
    }
  }

  // Show permission rationale dialog
  static showPermissionRationale(
    title: string,
    message: string,
    onGranted: () => void,
    onDenied: () => void = () => {}
  ) {
    Alert.alert(
      title,
      message,
      [
        {
          text: 'Not Now',
          style: 'cancel',
          onPress: onDenied,
        },
        {
          text: 'Continue',
          onPress: onGranted,
        },
      ],
      { cancelable: false }
    );
  }
}

export default new PermissionService();


type PermissionStatus = 'granted' | 'denied' | 'blocked' | 'unavailable' | 'limited';

class PermissionService {
  // Check and request microphone permission for web
  static async checkAndRequestMicrophonePermission(): Promise<PermissionStatus> {
    try {
      // Check if we're in a browser environment
      if (typeof navigator === 'undefined' || !navigator.mediaDevices) {
        return 'unavailable';
      }

      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Stop the stream immediately as we only needed permission
      stream.getTracks().forEach(track => track.stop());
      
      return 'granted';
    } catch (error: any) {
      console.error('Error checking microphone permission:', error);
      
      if (error.name === 'NotAllowedError') {
        return 'denied';
      } else if (error.name === 'NotFoundError') {
        return 'unavailable';
      }
      
      return 'denied';
    }
  }

  // Web apps don't need overlay permission - this is a no-op
  static async checkAndRequestOverlayPermission(): Promise<boolean> {
    return true; // Web apps don't need overlay permission
  }

  // Open browser settings (limited functionality)
  static openAppSettings() {
    // In web browsers, we can't directly open settings
    // We can only suggest the user to check their browser settings
    alert('Please check your browser settings to manage permissions for this site.');
  }

  // Show permission rationale dialog using browser alert
  static showPermissionRationale(
    title: string,
    message: string,
    onGranted: () => void,
    onDenied: () => void = () => {}
  ) {
    const granted = confirm(`${title}\n\n${message}\n\nWould you like to continue?`);
    
    if (granted) {
      onGranted();
    } else {
      onDenied();
    }
  }
}

export default PermissionService;

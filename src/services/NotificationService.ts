
import { LocalNotifications, ScheduleOptions, ActionPerformed, Channel, LocalNotificationsPlugin } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { toast } from '@/components/ui/use-toast';

class NotificationService {
  private channels: Channel[] = [
    {
      id: 'task-notifications',
      name: 'Task Notifications',
      description: 'Notifications for task reminders',
      importance: 5, // High importance
      visibility: 1, // Public
      sound: 'beep.wav',
      vibration: true,
      lights: true
    },
    {
      id: 'timer-notifications',
      name: 'Timer Notifications',
      description: 'Notifications for timer completion',
      importance: 5, // High importance
      visibility: 1, // Public
      sound: 'timer-complete.mp3',
      vibration: true,
      lights: true
    },
    {
      id: 'urgent-notifications',
      name: 'Urgent Notifications',
      description: 'Notifications for urgent reminders',
      importance: 5, // High importance
      visibility: 1, // Public
      sound: 'urgent.wav',
      vibration: true,
      lights: true
    }
  ];

  private permissionRequested = false;
  private hasPermission = false;

  constructor() {
    this.initializeChannels();
    this.registerListeners();
  }

  public async initializeChannels() {
    if (Capacitor.isNativePlatform()) {
      try {
        // Create channels with default sounds first
        await LocalNotifications.createChannel(this.channels[0]);
        await LocalNotifications.createChannel(this.channels[1]);
        await LocalNotifications.createChannel(this.channels[2]);
        console.log('Notification channels created');
        
        // After creating channels, check if we have custom sounds
        await this.setupCustomSounds();
      } catch (error) {
        console.error('Error creating notification channels:', error);
      }
    }
  }

  private async setupCustomSounds() {
    try {
      const customTaskSound = localStorage.getItem('customTaskSound');
      const customTimerSound = localStorage.getItem('customTimerSound');
      
      // Update channel with custom sounds if available
      if (customTaskSound) {
        const taskChannel = {...this.channels[0], sound: 'custom-task-sound.mp3'};
        await LocalNotifications.createChannel(taskChannel);
        console.log('Updated task channel with custom sound');
      }
      
      if (customTimerSound) {
        const timerChannel = {...this.channels[1], sound: 'custom-timer-sound.mp3'};
        await LocalNotifications.createChannel(timerChannel);
        console.log('Updated timer channel with custom sound');
      }
    } catch (error) {
      console.error('Error setting up custom sounds:', error);
    }
  }

  private registerListeners() {
    try {
      // Listen for notification received when app is in foreground
      LocalNotifications.addListener('localNotificationReceived', (notification) => {
        console.log('Notification received in foreground:', notification);
      });

      // Listen for notification action (e.g., when user taps the notification)
      LocalNotifications.addListener('localNotificationActionPerformed', (action: ActionPerformed) => {
        console.log('Notification action performed:', action);
      });

      // Listen for app resume event to check for pending notifications
      if (Capacitor.isNativePlatform()) {
        try {
          document.addEventListener('resume', this.checkPendingNotifications);
          console.log('Resume event listener registered');
        } catch (error) {
          console.error('Error registering resume event listener:', error);
        }
      }
    } catch (error) {
      console.error('Error registering notification listeners:', error);
    }
  }

  private async checkPendingNotifications() {
    try {
      const pendingNotifications = await LocalNotifications.getPending();
      console.log('Pending notifications:', pendingNotifications);
    } catch (error) {
      console.error('Error checking pending notifications:', error);
    }
  }

  async requestPermissions(): Promise<boolean> {
    try {
      // Don't request permissions repeatedly if already denied
      if (this.permissionRequested && !this.hasPermission) {
        console.log('Permissions already requested and denied');
        return false;
      }

      // Check current permission status first
      const currentStatus = await LocalNotifications.checkPermissions();
      console.log('Current notification permission status:', currentStatus);
      
      if (currentStatus.display === 'granted') {
        this.hasPermission = true;
        return true;
      }

      // Only request if not already denied
      if (currentStatus.display === 'prompt') {
        this.permissionRequested = true;
        const permissionState = await LocalNotifications.requestPermissions();
        console.log('Notification permission request result:', permissionState);
        
        this.hasPermission = permissionState.display === 'granted';
        
        if (!this.hasPermission) {
          // Only show toast once when permission is first denied
          if (!localStorage.getItem('notificationPermissionDenied')) {
            localStorage.setItem('notificationPermissionDenied', 'true');
            toast({
              title: "Notifications disabled",
              description: "To receive task reminders, please enable notifications in your device settings and refresh the app.",
              variant: "destructive"
            });
          }
        } else {
          // Clear the denial flag if permission is granted
          localStorage.removeItem('notificationPermissionDenied');
        }
        
        return this.hasPermission;
      }

      // Permission was already denied
      if (currentStatus.display === 'denied') {
        this.hasPermission = false;
        return false;
      }

      return false;
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      return false;
    }
  }

  async scheduleTaskNotification(taskId: string, title: string, body: string, scheduledTime: Date, isUrgent: boolean = false): Promise<void> {
    // Check permission before attempting to schedule
    const hasPermission = await this.checkAndRequestPermission();
    
    if (!hasPermission) {
      console.warn('Cannot schedule notification: permission not granted');
      // Show fallback notification in browser
      this.showBrowserNotification(title, body);
      return;
    }
    
    const useUrgentStyle = isUrgent && localStorage.getItem('urgentNotifications') === 'true';
    
    try {
      // Calculate a numeric id from the taskId string (must be an integer)
      const numericId = parseInt(taskId.replace(/\D/g, '').slice(0, 8) || '1000');
      
      // Ensure the scheduledTime is in the future
      const notificationTime = new Date(scheduledTime);
      if (notificationTime.getTime() <= Date.now()) {
        console.warn('Scheduled time is in the past, adjusting to now + 5 seconds');
        notificationTime.setTime(Date.now() + 5000);
      }
      
      // Schedule the notification with exact timing
      await LocalNotifications.schedule({
        notifications: [
          {
            id: numericId,
            title: title,
            body: body,
            schedule: { 
              at: notificationTime,
              allowWhileIdle: true, // Ensure delivery even in doze mode
              repeats: false // One-time notification
            },
            sound: useUrgentStyle ? 'urgent.wav' : localStorage.getItem('customTaskSound') ? 'custom-task-sound.mp3' : 'beep.wav',
            smallIcon: 'ic_stat_focus_brain',
            iconColor: '#8B5CF6',
            channelId: useUrgentStyle ? 'urgent-notifications' : 'task-notifications',
            autoCancel: true,
            ongoing: false,
            extra: {
              taskId: taskId,
              isUrgent: useUrgentStyle
            }
          }
        ]
      });
      
      console.log(`Scheduled ${useUrgentStyle ? 'urgent ' : ''}task notification for task ${taskId} at ${notificationTime.toISOString()}`);
    } catch (error) {
      console.error('Error scheduling notification:', error);
      toast({
        title: "Failed to set notification",
        description: "There was an error scheduling your task notification.",
        variant: "destructive"
      });
    }
  }

  private async checkAndRequestPermission(): Promise<boolean> {
    if (this.hasPermission) {
      return true;
    }

    return await this.requestPermissions();
  }

  private showBrowserNotification(title: string, body: string) {
    // Fallback to browser notifications if available
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body, icon: '/favicon.ico' });
    } else if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          new Notification(title, { body, icon: '/favicon.ico' });
        }
      });
    }
  }

  async scheduleTimerNotification(title: string, body: string, scheduledTime: Date) {
    const hasPermission = await this.checkAndRequestPermission();
    
    if (!hasPermission) {
      console.warn('Cannot schedule timer notification: permission not granted');
      this.showBrowserNotification(title, body);
      return false;
    }
    
    // Determine which sound to use (custom or default)
    const hasCustomSound = localStorage.getItem('customTimerSound') !== null;
    
    try {
      // Generate a unique ID for timer notifications
      const numericId = Math.floor(Date.now() / 1000);
      
      await LocalNotifications.schedule({
        notifications: [
          {
            id: numericId,
            title: title,
            body: body,
            schedule: { 
              at: scheduledTime,
              allowWhileIdle: true
            },
            sound: hasCustomSound ? 'custom-timer-sound.mp3' : 'timer-complete.mp3',
            smallIcon: 'ic_stat_focus_brain',
            iconColor: '#8B5CF6',
            channelId: 'timer-notifications',
            autoCancel: true,
            ongoing: false
          }
        ]
      });
      
      console.log(`Timer notification scheduled at ${scheduledTime.toISOString()}`);
      return true;
    } catch (error) {
      console.error('Error scheduling timer notification:', error);
      toast({
        title: "Failed to set notification",
        description: "There was an error scheduling your timer notification.",
        variant: "destructive"
      });
      return false;
    }
  }

  async cancelNotification(taskId: string) {
    try {
      const notificationId = parseInt(taskId.replace(/\D/g, '').slice(0, 8) || '1000');
      await LocalNotifications.cancel({ notifications: [{ id: notificationId }] });
      console.log(`Cancelled notification for task ${taskId}`);
      return true;
    } catch (error) {
      console.error('Error cancelling notification:', error);
      return false;
    }
  }

  async cancelAllNotifications() {
    try {
      const pending = await LocalNotifications.getPending();
      if (pending.notifications.length > 0) {
        await LocalNotifications.cancel({ notifications: pending.notifications });
      }
      console.log('Cancelled all notifications');
      return true;
    } catch (error) {
      console.error('Error cancelling all notifications:', error);
      return false;
    }
  }

  // Method to update custom sound for notifications (called from SoundService)
  async updateCustomSound(type: 'timer' | 'task', soundName: string) {
    try {
      if (!Capacitor.isNativePlatform()) {
        return true; // Only needed for native platforms
      }

      const channelId = type === 'timer' ? 'timer-notifications' : 'task-notifications';
      const channelIndex = type === 'timer' ? 1 : 0;
      const soundFileName = type === 'timer' ? 'custom-timer-sound.mp3' : 'custom-task-sound.mp3';
      
      // If soundName is empty, reset to default
      if (!soundName) {
        const defaultSound = type === 'timer' ? 'timer-complete.mp3' : 'beep.wav';
        const defaultChannel = {...this.channels[channelIndex], sound: defaultSound};
        await LocalNotifications.createChannel(defaultChannel);
        console.log(`Reset ${type} notification channel to default sound`);
        return true;
      }
      
      // Update the channel with the new sound
      const updatedChannel = {
        ...this.channels[channelIndex],
        sound: soundFileName
      };
      
      await LocalNotifications.createChannel(updatedChannel);
      console.log(`Updated ${type} notification channel with custom sound: ${soundName}`);
      return true;
    } catch (error) {
      console.error(`Error updating ${type} custom sound:`, error);
      return false;
    }
  }

  // Get current permission status
  getPermissionStatus(): boolean {
    return this.hasPermission;
  }

  // Reset permission request flag (useful for testing)
  resetPermissionState() {
    this.permissionRequested = false;
    this.hasPermission = false;
    localStorage.removeItem('notificationPermissionDenied');
  }
}

export default new NotificationService();

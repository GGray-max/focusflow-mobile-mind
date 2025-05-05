
import { LocalNotifications, ScheduleOptions, ActionPerformed, Channel } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';

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
    }
  ];

  constructor() {
    this.initializeChannels();
    this.registerListeners();
  }

  private async initializeChannels() {
    if (Capacitor.isNativePlatform()) {
      try {
        await LocalNotifications.createChannel(this.channels[0]);
        await LocalNotifications.createChannel(this.channels[1]);
        console.log('Notification channels created');
      } catch (error) {
        console.error('Error creating notification channels:', error);
      }
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
        // You can handle navigation or other actions here
      });

      // Listen for app resume event to check for pending notifications
      if (Capacitor.isNativePlatform()) {
        try {
          // Check if we're on a platform where app state is supported (mobile)
          if (typeof document !== 'undefined') {
            document.addEventListener('visibilitychange', () => {
              if (document.visibilityState === 'visible') {
                this.checkPendingNotifications();
              }
            });
            console.log('Visibility change listener registered');
          }
        } catch (error) {
          console.error('Error registering visibility change listener:', error);
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

  async requestPermissions() {
    try {
      const permissionState = await LocalNotifications.requestPermissions();
      console.log('Notification permission state:', permissionState);
      return permissionState.display === 'granted';
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      return false;
    }
  }

  async scheduleTaskNotification(taskId: string, title: string, body: string, scheduledTime: Date, sound = 'beep.wav') {
    const hasPermission = await this.requestPermissions();
    
    if (!hasPermission) {
      console.warn('Notification permission not granted');
      return false;
    }
    
    // Get the custom sound if set
    const customSound = localStorage.getItem('customTaskSound') ? 'custom-task-sound.mp3' : sound;
    
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
              allowWhileIdle: true // Ensure delivery even in doze mode
            },
            sound: customSound,
            smallIcon: 'ic_stat_notification',
            iconColor: '#8B5CF6',
            channelId: 'task-notifications',
            autoCancel: true,
            ongoing: false,
            extra: {
              taskId: taskId
            }
          }
        ]
      });
      
      console.log(`Notification scheduled for task ${taskId} at ${notificationTime.toISOString()}`);
      return true;
    } catch (error) {
      console.error('Error scheduling notification:', error);
      return false;
    }
  }

  async scheduleTimerNotification(title: string, body: string, scheduledTime: Date) {
    const hasPermission = await this.requestPermissions();
    
    if (!hasPermission) {
      console.warn('Notification permission not granted');
      return false;
    }
    
    // Get the custom sound if set
    const customSound = localStorage.getItem('customTimerSound') ? 'custom-timer-sound.mp3' : 'timer-complete.mp3';
    
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
            sound: customSound,
            smallIcon: 'ic_stat_notification',
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
      // Use cancel with empty array to cancel all notifications
      await LocalNotifications.cancel({ notifications: [] });
      console.log('Cancelled all notifications');
      return true;
    } catch (error) {
      console.error('Error cancelling all notifications:', error);
      return false;
    }
  }
}

export default new NotificationService();

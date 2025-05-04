
import { LocalNotifications } from '@capacitor/local-notifications';

class NotificationService {
  async requestPermissions() {
    const permissionState = await LocalNotifications.requestPermissions();
    return permissionState.display === 'granted';
  }

  async scheduleTaskNotification(taskId: string, title: string, body: string, scheduledTime: Date) {
    const hasPermission = await this.requestPermissions();
    
    if (!hasPermission) {
      console.warn('Notification permission not granted');
      return false;
    }
    
    await LocalNotifications.schedule({
      notifications: [
        {
          id: parseInt(taskId.replace(/\D/g, '').slice(0, 8) || '1000'),
          title: title,
          body: body,
          schedule: { at: scheduledTime },
          sound: 'beep.wav',
          smallIcon: 'ic_stat_notification',
          iconColor: '#8B5CF6',
          autoCancel: true
        }
      ]
    });
    
    return true;
  }

  async cancelNotification(taskId: string) {
    const notificationId = parseInt(taskId.replace(/\D/g, '').slice(0, 8) || '1000');
    await LocalNotifications.cancel({ notifications: [{ id: notificationId }] });
  }
}

export default new NotificationService();

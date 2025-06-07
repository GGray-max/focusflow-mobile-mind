import React, { createContext, useContext, useState, useEffect } from 'react';
import { LocalNotifications } from '@capacitor/local-notifications';
import { useToast } from '@/components/ui/use-toast';
import NotificationService from '../services/NotificationService';

type Notification = {
  id: number;
  title: string;
  body: string;
  date: Date;
  isUrgent?: boolean;
  scheduleAt?: string;
};

interface NotificationContextType {
  notifications: Notification[];
  urgentNotification: Notification | null;
  scheduleNotification: (notification: Omit<Notification, 'id'>) => Promise<number | null>;
  dismissUrgentNotification: () => void;
  cancelNotification: (id: number) => Promise<boolean>;
  requestPermissions: () => Promise<void>;
  hasPermission: boolean;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [urgentNotification, setUrgentNotification] = useState<Notification | null>(null);
  const [hasPermission, setHasPermission] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const initialize = async () => {
      try {
        // Initialize notification service
        await NotificationService.initializeChannels();
        const permission = await NotificationService.requestPermissions();
        setHasPermission(permission);
        if (!permission) {
          toast({
            title: "Notifications disabled",
            description: "Please enable notifications in your device settings.",
            variant: "destructive"
          });
        }
      } catch (error) {
        console.error('Error initializing notifications:', error);
      }
    };
    initialize();
  }, [toast]);

  const requestPermissions = async () => {
    try {
      const result = await NotificationService.requestPermissions();
      const granted = result;
      setHasPermission(granted);
      if (!granted) {
        toast({
          title: 'Permissions Needed',
          description: 'Please enable notification permissions in your device settings to receive task reminders.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      toast({
        title: 'Permission Error',
        description: 'Failed to request notification permissions. Please enable them in settings.',
        variant: 'destructive',
      });
      setHasPermission(false);
    }
  };

  const scheduleNotification = async (notification: Omit<Notification, 'id'>) => {
    try {
      const useUrgentStyle = notification.isUrgent && localStorage.getItem('urgentNotifications') === 'true';
      const newNotification = { id: Date.now(), ...notification, isUrgent: useUrgentStyle ? true : notification.isUrgent };
      setNotifications((prev) => [...prev, newNotification]);
      if (useUrgentStyle) {
        setUrgentNotification(newNotification);
      }

      if (notification.scheduleAt) {
        await NotificationService.scheduleTaskNotification(
          newNotification.id.toString(),
          newNotification.title,
          newNotification.body || 'Reminder',
          new Date(notification.scheduleAt),
          useUrgentStyle
        );
      }
      return newNotification.id;
    } catch (error) {
      console.error('Error scheduling notification:', error);
      toast({
        title: "Notification Error",
        description: "Failed to schedule notification",
        variant: "destructive"
      });
      return null;
    }
  };

  const dismissUrgentNotification = () => {
    setUrgentNotification(null);
  };

  const cancelNotification = async (id: number) => {
    try {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      if (urgentNotification?.id === id) {
        setUrgentNotification(null);
      }
      await NotificationService.cancelNotification(id.toString());
      return true;
    } catch (error) {
      console.error('Error cancelling notification:', error);
      return false;
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        urgentNotification,
        scheduleNotification,
        dismissUrgentNotification,
        cancelNotification,
        requestPermissions,
        hasPermission,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

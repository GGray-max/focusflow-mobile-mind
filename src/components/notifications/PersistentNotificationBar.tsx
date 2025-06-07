import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Check } from 'lucide-react';
import { Button } from '../ui/button';
import { useNotification } from '../../contexts/NotificationContext';

const PersistentNotificationBar = () => {
  const { urgentNotification, dismissUrgentNotification } = useNotification();
  const [ringtone, setRingtone] = useState<HTMLAudioElement | null>(null);

  useEffect(() => {
    let vibrationInterval: NodeJS.Timeout | null = null;

    if (urgentNotification && !ringtone) {
      // Play continuous ringtone only if not already playing
      const audio = new Audio('/sounds/urgent.wav');
      audio.loop = true;
      setRingtone(audio);
      audio.play().catch((error) => {
        console.error('Audio play error:', error);
        // Fallback to a different sound if urgent.wav fails
        const fallbackAudio = new Audio('/sounds/beep.wav');
        fallbackAudio.loop = true;
        setRingtone(fallbackAudio);
        fallbackAudio.play().catch((fbError) => console.error('Fallback audio error:', fbError));
      });

      // Trigger continuous vibration if supported
      if (navigator.vibrate) {
        const vibrate = () => {
          navigator.vibrate(400); // Single vibration for 400ms
        };
        vibrate();
        vibrationInterval = setInterval(vibrate, 800); // Repeat every 800ms for a pulsing effect
      }
    } else if (!urgentNotification && ringtone) {
      ringtone.pause();
      ringtone.currentTime = 0;
      setRingtone(null);
      if (vibrationInterval) {
        clearInterval(vibrationInterval);
        vibrationInterval = null;
      }
      // Stop vibration
      if (navigator.vibrate) {
        navigator.vibrate(0);
      }
    }

    return () => {
      if (ringtone) {
        ringtone.pause();
        ringtone.currentTime = 0;
      }
      if (vibrationInterval) {
        clearInterval(vibrationInterval);
      }
      // Stop vibration
      if (navigator.vibrate) {
        navigator.vibrate(0);
      }
    };
  }, [urgentNotification, ringtone]);

  return (
    <AnimatePresence>
      {urgentNotification && (
        <motion.div
          initial={{ y: '-100%' }}
          animate={{ y: 0 }}
          exit={{ y: '-100%' }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed top-0 left-0 right-0 bg-red-500 text-white p-4 z-50 shadow-md"
          role="alert"
          aria-label="Urgent Notification"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Bell className="w-5 h-5 animate-pulse" />
              <span className="font-semibold">{urgentNotification.title}</span>
              <span className="text-sm">{urgentNotification.body}</span>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={dismissUrgentNotification}
              className="bg-white text-red-500 hover:bg-gray-100"
            >
              <Check className="w-4 h-4 mr-1" />
              Notified
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PersistentNotificationBar;

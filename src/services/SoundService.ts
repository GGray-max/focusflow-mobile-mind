
import { Howl } from 'howler';
import { Capacitor } from '@capacitor/core';

class SoundService {
  private sounds: Record<string, Howl> = {};
  private customSounds: Record<string, Howl> = {};

  constructor() {
    this.sounds = {
      timerComplete: new Howl({
        src: ['/sounds/timer-complete.mp3'],
        volume: 0.7,
        preload: true
      }),
      timerTick: new Howl({
        src: ['/sounds/timer-tick.mp3'],
        volume: 0.3,
        preload: true
      })
    };
    
    // Load custom sounds from localStorage if available
    this.loadCustomSounds();
  }

  private loadCustomSounds() {
    try {
      const customTimerSound = localStorage.getItem('customTimerSound');
      const customTaskSound = localStorage.getItem('customTaskSound');
      
      if (customTimerSound) {
        this.customSounds.timerComplete = new Howl({
          src: [customTimerSound],
          volume: 0.7,
          preload: true
        });
      }
      
      if (customTaskSound) {
        this.customSounds.taskNotification = new Howl({
          src: [customTaskSound],
          volume: 0.7,
          preload: true
        });
      }
    } catch (error) {
      console.error('Error loading custom sounds:', error);
    }
  }

  play(soundName: 'timerComplete' | 'timerTick' | 'taskNotification') {
    // Check for custom sound first
    if (this.customSounds[soundName]) {
      this.customSounds[soundName].play();
      return;
    }
    
    // Fall back to default sound
    const sound = this.sounds[soundName] || this.sounds.timerComplete;
    if (sound) {
      sound.play();
    }
  }

  stop(soundName: 'timerComplete' | 'timerTick' | 'taskNotification') {
    // Check for custom sound first
    if (this.customSounds[soundName]) {
      this.customSounds[soundName].stop();
      return;
    }
    
    const sound = this.sounds[soundName];
    if (sound) {
      sound.stop();
    }
  }
  
  // Method to set custom sounds from device storage
  async setCustomSound(type: 'timer' | 'task', fileUrl: string) {
    try {
      if (type === 'timer') {
        // Store the sound in localStorage
        localStorage.setItem('customTimerSound', fileUrl);
        
        // Create a Howl for in-app playback
        this.customSounds.timerComplete = new Howl({
          src: [fileUrl],
          volume: 0.7,
          preload: true
        });
        
        // For native notifications, we need to save the file locally
        if (Capacitor.isNativePlatform()) {
          try {
            // Convert blob URL to file and save it to app storage
            const response = await fetch(fileUrl);
            const blob = await response.blob();
            
            // Save to device storage using a FileSystem plugin would go here
            // For now, we'll use the blob URL as is since we're storing in localStorage
            console.log('Custom timer sound set for notifications');
          } catch (error) {
            console.error('Error saving custom timer sound to device:', error);
          }
        }
      } else {
        // Store the task notification sound
        localStorage.setItem('customTaskSound', fileUrl);
        
        // Create a Howl for in-app playback
        this.customSounds.taskNotification = new Howl({
          src: [fileUrl],
          volume: 0.7,
          preload: true
        });
        
        // For native notifications
        if (Capacitor.isNativePlatform()) {
          try {
            // Convert blob URL to file and save to app storage (similar to timer sound)
            const response = await fetch(fileUrl);
            const blob = await response.blob();
            
            // Implementation would involve a FileSystem plugin
            console.log('Custom task sound set for notifications');
          } catch (error) {
            console.error('Error saving custom task sound to device:', error);
          }
        }
      }
      return true;
    } catch (error) {
      console.error('Error setting custom sound:', error);
      return false;
    }
  }
  
  // Method to get file from device storage
  async getFileFromDevice(): Promise<string | null> {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'audio/*';
      
      input.onchange = (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (!file) {
          resolve(null);
          return;
        }
        
        const url = URL.createObjectURL(file);
        resolve(url);
      };
      
      input.click();
    });
  }
}

export default new SoundService();

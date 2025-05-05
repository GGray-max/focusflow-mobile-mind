
import { Howl } from 'howler';
import { Capacitor } from '@capacitor/core';
import { toast } from '@/components/ui/use-toast';

class SoundService {
  private sounds: Record<string, Howl> = {};
  private customSounds: Record<string, Howl> = {};
  private customSoundNames: Record<string, string> = {};

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
      }),
      taskNotification: new Howl({
        src: ['/sounds/timer-complete.mp3'], // Reuse the timer sound for task notification by default
        volume: 0.7,
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
      const customTimerSoundName = localStorage.getItem('customTimerSoundName');
      const customTaskSoundName = localStorage.getItem('customTaskSoundName');
      
      if (customTimerSound) {
        this.customSounds.timerComplete = new Howl({
          src: [customTimerSound],
          volume: 0.7,
          preload: true
        });
        
        this.customSoundNames.timerComplete = customTimerSoundName || 'Custom Timer Sound';
      }
      
      if (customTaskSound) {
        this.customSounds.taskNotification = new Howl({
          src: [customTaskSound],
          volume: 0.7,
          preload: true
        });
        
        this.customSoundNames.taskNotification = customTaskSoundName || 'Custom Task Sound';
      }
      
      console.log('Custom sounds loaded:', this.customSoundNames);
    } catch (error) {
      console.error('Error loading custom sounds:', error);
    }
  }

  play(soundName: 'timerComplete' | 'timerTick' | 'taskNotification') {
    // Check for custom sound first
    if (this.customSounds[soundName]) {
      console.log(`Playing custom sound: ${this.customSoundNames[soundName]}`);
      this.customSounds[soundName].play();
      return true;
    }
    
    // Fall back to default sound
    const sound = this.sounds[soundName] || this.sounds.timerComplete;
    if (sound) {
      console.log(`Playing default sound: ${soundName}`);
      sound.play();
      return true;
    }
    
    return false;
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
  
  getCustomSoundName(type: 'timer' | 'task'): string | null {
    const soundKey = type === 'timer' ? 'timerComplete' : 'taskNotification';
    return this.customSoundNames[soundKey] || null;
  }
  
  // Method to set custom sounds from device storage
  async setCustomSound(type: 'timer' | 'task', fileUrl: string, fileName: string) {
    try {
      if (type === 'timer') {
        // Create a Howl for in-app playback
        const newSound = new Howl({
          src: [fileUrl],
          volume: 0.7,
          preload: true
        });
        
        // Test play the sound to see if it works
        newSound.once('load', () => {
          // Store the sound in localStorage
          localStorage.setItem('customTimerSound', fileUrl);
          localStorage.setItem('customTimerSoundName', fileName);
          
          this.customSounds.timerComplete = newSound;
          this.customSoundNames.timerComplete = fileName;
          
          // For native notifications, save to device storage if on a native platform
          if (Capacitor.isNativePlatform()) {
            // Implementation for saving to device storage would go here
            console.log('Custom timer sound set for notifications');
          }
        });
        
        // Handle load errors
        newSound.once('loaderror', () => {
          toast({
            title: "Error loading sound",
            description: "The selected file is not a valid audio file",
            variant: "destructive"
          });
          return false;
        });
        
      } else {
        // For task notifications
        const newSound = new Howl({
          src: [fileUrl],
          volume: 0.7,
          preload: true
        });
        
        newSound.once('load', () => {
          // Store the task notification sound
          localStorage.setItem('customTaskSound', fileUrl);
          localStorage.setItem('customTaskSoundName', fileName);
          
          this.customSounds.taskNotification = newSound;
          this.customSoundNames.taskNotification = fileName;
          
          if (Capacitor.isNativePlatform()) {
            // Implementation for saving to device storage would go here
            console.log('Custom task sound set for notifications');
          }
        });
        
        newSound.once('loaderror', () => {
          toast({
            title: "Error loading sound",
            description: "The selected file is not a valid audio file",
            variant: "destructive"
          });
          return false;
        });
      }
      return true;
    } catch (error) {
      console.error('Error setting custom sound:', error);
      toast({
        title: "Error setting custom sound",
        description: "Failed to set custom sound. Please try again.",
        variant: "destructive"
      });
      return false;
    }
  }
  
  // Method to get file from device storage
  async getFileFromDevice(): Promise<{url: string, name: string} | null> {
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
        resolve({
          url,
          name: file.name
        });
      };
      
      input.click();
    });
  }
}

export default new SoundService();

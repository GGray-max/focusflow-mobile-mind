
import { Howl } from 'howler';

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
        localStorage.setItem('customTimerSound', fileUrl);
        this.customSounds.timerComplete = new Howl({
          src: [fileUrl],
          volume: 0.7,
          preload: true
        });
      } else {
        localStorage.setItem('customTaskSound', fileUrl);
        this.customSounds.taskNotification = new Howl({
          src: [fileUrl],
          volume: 0.7,
          preload: true
        });
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

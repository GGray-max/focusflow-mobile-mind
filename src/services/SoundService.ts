
import { Howl } from 'howler';
import { Capacitor } from '@capacitor/core';
import { toast } from '@/components/ui/use-toast';
import NotificationService from './NotificationService';
import { Filesystem, Directory } from '@capacitor/filesystem';

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
  
  // Enhanced method to set custom sounds for both in-app and notifications
  async setCustomSound(type: 'timer' | 'task', fileUrl: string, fileName: string) {
    try {
      if (type === 'timer') {
        // Create a Howl for in-app playback
        const newSound = new Howl({
          src: [fileUrl],
          volume: 0.7,
          preload: true
        });
        
        // Set up a one-time load event handler
        return new Promise<boolean>((resolve) => {
          // Test play the sound to see if it works
          newSound.once('load', async () => {
            // Store the sound in localStorage
            localStorage.setItem('customTimerSound', fileUrl);
            localStorage.setItem('customTimerSoundName', fileName);
            
            this.customSounds.timerComplete = newSound;
            this.customSoundNames.timerComplete = fileName;
            
            // For native notifications, prepare sound file for notifications
            if (Capacitor.isNativePlatform()) {
              try {
                await this.copyCustomSoundToNative(fileUrl, 'custom-timer-sound.mp3');
                
                // Update notification channel
                await NotificationService.updateCustomSound('timer', fileName);
              } catch (error) {
                console.warn('Could not copy sound for native notifications:', error);
              }
            }
            
            // Play the sound once to let the user hear it
            newSound.play();
            resolve(true);
          });
          
          // Handle load errors
          newSound.once('loaderror', () => {
            toast({
              title: "Error loading sound",
              description: "The selected file is not a valid audio file",
              variant: "destructive"
            });
            resolve(false);
          });
        });
      } else {
        // For task notifications
        const newSound = new Howl({
          src: [fileUrl],
          volume: 0.7,
          preload: true
        });
        
        return new Promise<boolean>((resolve) => {
          newSound.once('load', async () => {
            // Store the task notification sound
            localStorage.setItem('customTaskSound', fileUrl);
            localStorage.setItem('customTaskSoundName', fileName);
            
            this.customSounds.taskNotification = newSound;
            this.customSoundNames.taskNotification = fileName;
            
            if (Capacitor.isNativePlatform()) {
              try {
                await this.copyCustomSoundToNative(fileUrl, 'custom-task-sound.mp3');
                
                // Update notification channel
                await NotificationService.updateCustomSound('task', fileName);
              } catch (error) {
                console.warn('Could not copy sound for native notifications:', error);
              }
            }
            
            // Play the sound once to let the user hear it
            newSound.play();
            resolve(true);
          });
          
          newSound.once('loaderror', () => {
            toast({
              title: "Error loading sound",
              description: "The selected file is not a valid audio file",
              variant: "destructive"
            });
            resolve(false);
          });
        });
      }
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
  
  // Helper method to copy custom sounds to native app storage for notifications
  private async copyCustomSoundToNative(fileUrl: string, targetFileName: string): Promise<string> {
    if (!Capacitor.isNativePlatform()) {
      return fileUrl; // Return original URL if not on native platform
    }
    
    try {
      // For blob URLs, we need to fetch and get the blob data
      let soundBlob: Blob;
      if (fileUrl.startsWith('blob:')) {
        const response = await fetch(fileUrl);
        soundBlob = await response.blob();
      } else {
        // For other URLs, just fetch them
        const response = await fetch(fileUrl);
        soundBlob = await response.blob();
      }
      
      // Convert blob to base64
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = async () => {
          try {
            // The result will be a base64 string
            const base64Data = reader.result as string;
            const base64Sound = base64Data.split(',')[1]; // Remove the data URL prefix
            
            // Write to app directory
            await Filesystem.writeFile({
              path: targetFileName,
              data: base64Sound,
              directory: Directory.Data
            });
            
            console.log(`Custom sound saved as ${targetFileName}`);
            resolve(targetFileName);
          } catch (error) {
            console.error('Error saving sound file:', error);
            reject(error);
          }
        };
        reader.onerror = () => reject(new Error('Error reading file'));
        reader.readAsDataURL(soundBlob);
      });
    } catch (error) {
      console.error('Error processing sound file:', error);
      throw error;
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

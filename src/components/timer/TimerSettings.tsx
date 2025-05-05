
import React, { useState, useEffect } from 'react';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { useTimer } from '@/contexts/TimerContext';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Clock, Volume2, VolumeX, Moon, Sun, Play } from 'lucide-react';
import SoundService from '@/services/SoundService';
import { toast } from '@/components/ui/use-toast';

const TimerSettings: React.FC = () => {
  const { 
    state: { focusDuration, breakDuration, focusSessions, totalFocusTime, soundEnabled, tickEnabled },
    setFocusDuration,
    setBreakDuration,
    toggleSound,
    toggleTickSound
  } = useTimer();
  
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return document.documentElement.classList.contains('dark');
  });
  
  const [customTimerSound, setCustomTimerSound] = useState<string | null>(null);
  const [customTaskSound, setCustomTaskSound] = useState<string | null>(null);
  
  // Load custom sound names when component mounts
  useEffect(() => {
    const timerSoundName = SoundService.getCustomSoundName('timer');
    const taskSoundName = SoundService.getCustomSoundName('task');
    setCustomTimerSound(timerSoundName);
    setCustomTaskSound(taskSoundName);
  }, []);
  
  // Format total time
  const formatTotalTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };
  
  // Make sure focusSessions is defined before accessing it
  const totalSessions = focusSessions?.length || 0;
  const completedSessions = focusSessions?.filter(session => session.completed)?.length || 0;
  
  // Play sample sound when enabling
  const handleSoundToggle = (checked: boolean) => {
    toggleSound(checked);
    if (checked) {
      setTimeout(() => {
        SoundService.play('timerComplete');
        toast({
          title: "Sound enabled",
          description: "You will hear this sound when your timer completes"
        });
      }, 300);
    }
  };
  
  const handleTickToggle = (checked: boolean) => {
    toggleTickSound(checked);
    if (checked) {
      setTimeout(() => {
        SoundService.play('timerTick');
        toast({
          title: "Tick sound enabled",
          description: "You will hear this sound in the last 5 seconds"
        });
      }, 300);
    }
  };

  const toggleDarkMode = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    
    if (newDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('darkMode', 'true');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('darkMode', 'false');
    }
    
    toast({
      title: newDarkMode ? "Dark mode enabled" : "Light mode disabled",
      description: "Your theme preference has been saved",
    });
  };
  
  // Function to select custom sound
  const handleSelectCustomSound = async (type: 'timer' | 'task') => {
    const fileData = await SoundService.getFileFromDevice();
    if (fileData) {
      const success = await SoundService.setCustomSound(type, fileData.url, fileData.name);
      if (success) {
        toast({
          title: `Custom ${type} sound set`,
          description: `${fileData.name} will now be used for ${type} notifications`,
        });
        
        // Update the displayed sound name
        if (type === 'timer') {
          setCustomTimerSound(fileData.name);
        } else {
          setCustomTaskSound(fileData.name);
        }
      }
    }
  };
  
  // Function to preview custom sound
  const previewSound = (type: 'timer' | 'task') => {
    if (type === 'timer') {
      SoundService.play('timerComplete');
      toast({
        title: "Preview timer sound",
        description: "Playing timer completion sound",
      });
    } else {
      SoundService.play('taskNotification');
      toast({
        title: "Preview task sound",
        description: "Playing task notification sound",
      });
    }
  };
  
  return (
    <div className="space-y-6 mt-4">
      <Card className="p-4 border-focus-200 dark:border-focus-700 dark:bg-gray-800/90 dark:shadow-lg transition-all">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-medium flex items-center gap-2">
            <Clock size={18} className="text-focus-400" />
            Timer Settings
          </h3>
          <Button 
            onClick={toggleDarkMode}
            variant="ghost" 
            size="icon" 
            className="rounded-full h-8 w-8 bg-gray-100 dark:bg-gray-700 transition-colors"
          >
            {isDarkMode ? (
              <Sun size={16} className="text-amber-400" />
            ) : (
              <Moon size={16} className="text-focus-400" />
            )}
          </Button>
        </div>
      
        <div className="space-y-6">
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label>Focus Duration: {focusDuration} min</Label>
            </div>
            <Slider 
              value={[focusDuration]} 
              onValueChange={(value) => setFocusDuration(value[0])} 
              max={60}
              min={5}
              step={5}
              className="my-4"
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <Label>Break Duration: {breakDuration} min</Label>
            </div>
            <Slider 
              value={[breakDuration]} 
              onValueChange={(value) => setBreakDuration(value[0])} 
              max={30}
              min={1}
              step={1}
              className="my-4"
            />
          </div>
          
          <div className="pt-2 border-t border-gray-100 dark:border-gray-700 transition-colors">
            <h4 className="text-sm text-gray-500 dark:text-gray-400 mb-3">Quick Stats</h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 transition-colors">
                <p className="text-gray-500 dark:text-gray-400">Total Focus Time</p>
                <p className="font-semibold text-lg text-focus-500 dark:text-focus-300">{formatTotalTime(totalFocusTime || 0)}</p>
              </div>
              <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 transition-colors">
                <p className="text-gray-500 dark:text-gray-400">Sessions Completed</p>
                <p className="font-semibold text-lg text-focus-500 dark:text-focus-300">{completedSessions}/{totalSessions}</p>
              </div>
            </div>
          </div>
        </div>
      </Card>
      
      <Card className="p-4 border-focus-200 dark:border-focus-700 dark:bg-gray-800/90 dark:shadow-lg transition-all">
        <h3 className="font-medium mb-3 text-foreground">Sound Settings</h3>
        
        <div className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label className="text-sm text-foreground">Timer Completion Sound</Label>
            <div className="flex items-center justify-between p-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700/60 transition-colors">
              <span className="text-sm flex items-center gap-2 text-foreground">
                {soundEnabled ? 
                  <Volume2 size={16} className="text-focus-400" /> : 
                  <VolumeX size={16} className="text-gray-400" />
                }
                Timer completion sound
              </span>
              <Switch 
                checked={soundEnabled !== undefined ? soundEnabled : true} 
                onCheckedChange={handleSoundToggle}
                id="sound-enabled" 
              />
            </div>
            
            {soundEnabled && (
              <div className="ml-6 space-y-3 mt-2">
                <div className="flex items-center gap-2">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => handleSelectCustomSound('timer')}
                    className="text-xs"
                  >
                    Select Custom Sound
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => previewSound('timer')}
                    className="text-xs flex items-center gap-1"
                  >
                    <Play size={12} /> Preview
                  </Button>
                </div>
                {customTimerSound && (
                  <p className="text-xs text-focus-400 dark:text-focus-300">
                    Current: {customTimerSound}
                  </p>
                )}
              </div>
            )}
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between p-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700/60 transition-colors">
              <span className="text-sm flex items-center gap-2 text-foreground">
                {tickEnabled ? 
                  <Volume2 size={16} className="text-focus-400" /> : 
                  <VolumeX size={16} className="text-gray-400" />
                }
                Tick sound in last 5 seconds
              </span>
              <Switch 
                checked={tickEnabled !== undefined ? tickEnabled : true} 
                onCheckedChange={handleTickToggle}
                id="tick-sound-enabled" 
              />
            </div>
          </div>
          
          <div className="space-y-2 mt-4">
            <Label className="text-sm text-foreground">Task Notification Sound</Label>
            <div className="flex items-center gap-2">
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => handleSelectCustomSound('task')}
                className="text-xs"
              >
                Select Custom Sound
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => previewSound('task')}
                className="text-xs flex items-center gap-1"
              >
                <Play size={12} /> Preview
              </Button>
            </div>
            {customTaskSound && (
              <p className="text-xs text-focus-400 dark:text-focus-300">
                Current: {customTaskSound}
              </p>
            )}
          </div>
          
          <div className="pt-2">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Sounds will play when your timer completes or when tasks reach their due time
            </p>
          </div>
        </div>
      </Card>
      
      <Card className="p-4 border-focus-200 dark:border-focus-700 dark:bg-gray-800/90 dark:shadow-lg transition-all">
        <h3 className="font-medium mb-3 text-foreground">Distraction Blocking</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          The app will help you stay focused by simulating the blocking of 
          distracting websites and apps during focus sessions.
        </p>
        
        <div className="space-y-3 mt-4">
          <Label className="text-sm text-foreground">Apps to block during focus time</Label>
          <div className="flex gap-2">
            <Input 
              placeholder="Add app name"
              className="flex-1 dark:bg-gray-700 dark:border-gray-600 text-foreground"
              disabled // Simulated functionality
            />
            <Button variant="outline" disabled>Add</Button>
          </div>
          <div className="pt-2 mb-4">
            <p className="text-xs text-gray-500 dark:text-gray-400 italic">
              Note: The blocking is simulated in this offline mobile app. 
              For actual website/app blocking, you'll need a dedicated 
              system-level blocking app.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default TimerSettings;

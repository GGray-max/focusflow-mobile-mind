
import React from 'react';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { useTimer } from '@/contexts/TimerContext';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Clock } from 'lucide-react';

const TimerSettings: React.FC = () => {
  const { 
    state: { focusDuration, breakDuration, focusSessions, totalFocusTime },
    setFocusDuration,
    setBreakDuration
  } = useTimer();
  
  // Format total time
  const formatTotalTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };
  
  const totalSessions = focusSessions.length;
  const completedSessions = focusSessions.filter(session => session.completed).length;

  return (
    <div className="space-y-6 mt-4">
      <Card className="p-4 border-focus-200">
        <h3 className="font-medium flex items-center gap-2 mb-4">
          <Clock size={18} className="text-focus-400" />
          Timer Settings
        </h3>
      
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
          
          <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
            <h4 className="text-sm text-gray-500 mb-3">Quick Stats</h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-gray-500">Total Focus Time</p>
                <p className="font-semibold">{formatTotalTime(totalFocusTime)}</p>
              </div>
              <div>
                <p className="text-gray-500">Sessions Completed</p>
                <p className="font-semibold">{completedSessions}/{totalSessions}</p>
              </div>
            </div>
          </div>
        </div>
      </Card>
      
      <Card className="p-4 border-focus-200">
        <h3 className="font-medium mb-3">Distraction Blocking</h3>
        <p className="text-sm text-gray-500 mb-4">
          The app will help you stay focused by simulating the blocking of 
          distracting websites and apps during focus sessions.
        </p>
        
        <div className="space-y-3 mt-4">
          <Label className="text-sm">Apps to block during focus time</Label>
          <div className="flex gap-2">
            <Input 
              placeholder="Add app name"
              className="flex-1"
              disabled // Simulated functionality
            />
            <Button variant="outline" disabled>Add</Button>
          </div>
          <div className="pt-2 mb-4">
            <p className="text-xs text-gray-500 italic">
              Note: The blocking is simulated in this offline mobile app. 
              For actual website/app blocking, you'll need a dedicated 
              system-level blocking app.
            </p>
          </div>
          
          <div className="space-y-2 border-t pt-4 mt-4">
            <Label className="text-sm">Sound Settings</Label>
            <div className="flex items-center justify-between">
              <span className="text-sm">Timer completion sound</span>
              <Switch defaultChecked id="sound-enabled" />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Tick sound in last 5 seconds</span>
              <Switch defaultChecked id="tick-sound-enabled" />
            </div>
            <div className="pt-2">
              <p className="text-xs text-gray-500">
                Sounds will play when your timer completes or when approaching the end
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default TimerSettings;

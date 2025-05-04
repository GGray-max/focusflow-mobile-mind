
import React from 'react';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { useTimer } from '@/contexts/TimerContext';

const TimerSettings: React.FC = () => {
  const { 
    state: { focusDuration, breakDuration },
    setFocusDuration,
    setBreakDuration
  } = useTimer();

  return (
    <div className="space-y-6 mt-8">
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
    </div>
  );
};

export default TimerSettings;

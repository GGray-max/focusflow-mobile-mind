
import React from 'react';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Play, Pause, RefreshCw, Coffee } from 'lucide-react';
import { useTimer } from '@/contexts/TimerContext';
import { cn } from '@/lib/utils';

const TimerDisplay: React.FC = () => {
  const { 
    state: { 
      timeLeft, 
      isRunning, 
      mode,
      focusDuration,
      breakDuration,
      currentTask,
      streakDays
    },
    startTimer,
    pauseTimer,
    resetTimer,
    switchToBreak,
    switchToFocus
  } = useTimer();

  // Format time to mm:ss
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate progress percentage
  const calculateProgress = () => {
    const totalSeconds = mode === 'focus' ? focusDuration * 60 : breakDuration * 60;
    return 100 - (timeLeft / totalSeconds) * 100;
  };

  return (
    <div className="flex flex-col items-center">
      {streakDays > 0 && (
        <div className="mb-2 px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-semibold">
          🔥 {streakDays} day streak
        </div>
      )}
      
      <div className={cn(
        "w-64 h-64 rounded-full border-8 flex items-center justify-center transition-colors relative",
        mode === 'focus' ? 'border-focus-300' : 'border-green-300',
        isRunning && (mode === 'focus' ? 'bg-focus-100' : 'bg-green-100')
      )}>
        <div className="text-center">
          <div className="text-5xl font-bold">{formatTime(timeLeft)}</div>
          <div className="text-sm mt-2 capitalize text-gray-600">
            {mode === 'idle' ? 'Ready' : mode} Mode
          </div>
          {currentTask && (
            <div className="text-xs mt-1 text-gray-500 max-w-[200px] overflow-hidden text-ellipsis">
              {currentTask}
            </div>
          )}
        </div>
      </div>

      <Progress 
        value={calculateProgress()} 
        className="w-64 h-2 mt-4" 
      />

      <div className="flex gap-3 mt-6">
        {mode === 'idle' || mode === 'focus' ? (
          <>
            {isRunning ? (
              <Button 
                variant="outline" 
                size="lg" 
                onClick={pauseTimer}
                className="h-14 w-14 rounded-full"
              >
                <Pause size={24} />
              </Button>
            ) : (
              <Button 
                onClick={() => startTimer()} 
                size="lg"
                className="h-14 w-14 rounded-full bg-focus-400 hover:bg-focus-500"
              >
                <Play size={24} />
              </Button>
            )}

            <Button 
              variant="outline"
              size="lg" 
              onClick={resetTimer}
              className="h-14 w-14 rounded-full"
            >
              <RefreshCw size={24} />
            </Button>

            {!isRunning && mode === 'focus' && (
              <Button 
                variant="outline"
                size="lg" 
                onClick={switchToBreak}
                className="h-14 w-14 rounded-full"
              >
                <Coffee size={24} />
              </Button>
            )}
          </>
        ) : (
          <>
            {isRunning ? (
              <Button 
                variant="outline" 
                size="lg" 
                onClick={pauseTimer}
                className="h-14 w-14 rounded-full"
              >
                <Pause size={24} />
              </Button>
            ) : (
              <Button 
                variant="secondary"
                size="lg"
                onClick={() => startTimer()}
                className="h-14 w-14 rounded-full bg-green-500 hover:bg-green-600 text-white"
              >
                <Play size={24} />
              </Button>
            )}

            <Button 
              variant="outline" 
              size="lg" 
              onClick={resetTimer}
              className="h-14 w-14 rounded-full"
            >
              <RefreshCw size={24} />
            </Button>

            {!isRunning && (
              <Button 
                variant="outline" 
                size="lg" 
                onClick={switchToFocus}
                className="h-14 w-14 rounded-full"
              >
                <RefreshCw size={24} />
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default TimerDisplay;

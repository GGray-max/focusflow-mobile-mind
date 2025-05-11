
import React from 'react';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Play, Pause, RefreshCw, Coffee } from 'lucide-react';
import { useTimer } from '@/contexts/TimerContext';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

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
    <motion.div 
      className="flex flex-col items-center"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {streakDays > 0 && (
        <motion.div 
          className="mb-3 px-4 py-1.5 bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 rounded-full text-xs font-semibold flex items-center gap-1.5 shadow-sm"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <span className="text-base">🔥</span> {streakDays} day streak
        </motion.div>
      )}
      
      <motion.div 
        className={cn(
          "w-64 sm:w-72 h-64 sm:h-72 rounded-full border-8 flex items-center justify-center transition-all duration-500 shadow-lg relative",
          mode === 'focus' 
            ? 'border-focus-300 dark:border-focus-500' 
            : 'border-green-300 dark:border-green-500',
          isRunning && (mode === 'focus' 
            ? 'bg-focus-100/70 dark:bg-focus-900/30' 
            : 'bg-green-100/70 dark:bg-green-900/30')
        )}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <div className="text-center">
          <motion.div 
            className="text-5xl sm:text-6xl font-bold text-gray-800 dark:text-gray-100"
            key={timeLeft}
            initial={{ opacity: 0.5, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            {formatTime(timeLeft)}
          </motion.div>

          <motion.div 
            className="text-sm mt-3 capitalize text-gray-600 dark:text-gray-300 font-medium"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            {mode === 'idle' ? 'Ready' : mode} Mode
          </motion.div>
          
          {currentTask && (
            <motion.div 
              className="text-xs mt-1.5 text-gray-500 dark:text-gray-400 max-w-[220px] overflow-hidden text-ellipsis px-4"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              {currentTask}
            </motion.div>
          )}
        </div>
        
        {isRunning && (
          <div className="absolute inset-0 rounded-full animate-pulse-gentle pointer-events-none">
            <div className={cn(
              "absolute inset-[4px] rounded-full opacity-20",
              mode === 'focus' ? 'bg-focus-200 dark:bg-focus-600' : 'bg-green-200 dark:bg-green-600'
            )}/>
          </div>
        )}
      </motion.div>

      <Progress 
        value={calculateProgress()} 
        className={cn(
          "w-64 sm:w-72 h-2.5 mt-5",
          mode === 'focus' ? 'bg-focus-100 dark:bg-focus-900/40' : 'bg-green-100 dark:bg-green-900/40'
        )}
      />

      <motion.div 
        className="flex gap-3 mt-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        {mode === 'idle' || mode === 'focus' ? (
          <>
            {isRunning ? (
              <Button 
                variant="outline" 
                size="lg" 
                onClick={pauseTimer}
                className="h-14 w-14 rounded-full shadow-sm hover:shadow"
              >
                <Pause size={24} />
              </Button>
            ) : (
              <Button 
                onClick={() => startTimer()} 
                size="lg"
                className="h-14 w-14 rounded-full bg-focus-400 hover:bg-focus-500 shadow-md hover:shadow-lg"
              >
                <Play size={24} />
              </Button>
            )}

            <Button 
              variant="outline"
              size="lg" 
              onClick={resetTimer}
              className="h-14 w-14 rounded-full shadow-sm hover:shadow"
              aria-label="Reset timer"
            >
              <RefreshCw size={24} />
            </Button>

            {!isRunning && mode === 'focus' && (
              <Button 
                variant="outline"
                size="lg" 
                onClick={switchToBreak}
                className="h-14 w-14 rounded-full shadow-sm hover:shadow"
                aria-label="Take a break"
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
                className="h-14 w-14 rounded-full shadow-sm hover:shadow"
                aria-label="Pause timer"
              >
                <Pause size={24} />
              </Button>
            ) : (
              <Button 
                variant="secondary"
                size="lg"
                onClick={() => startTimer()}
                className="h-14 w-14 rounded-full bg-green-500 hover:bg-green-600 text-white shadow-md hover:shadow-lg"
                aria-label="Start break timer"
              >
                <Play size={24} />
              </Button>
            )}

            <Button 
              variant="outline" 
              size="lg" 
              onClick={resetTimer}
              className="h-14 w-14 rounded-full shadow-sm hover:shadow"
              aria-label="Reset timer"
            >
              <RefreshCw size={24} />
            </Button>

            {!isRunning && (
              <Button 
                variant="outline" 
                size="lg" 
                onClick={switchToFocus}
                className="h-14 w-14 rounded-full shadow-sm hover:shadow"
                aria-label="Back to focus mode"
              >
                <RefreshCw size={24} />
              </Button>
            )}
          </>
        )}
      </motion.div>
    </motion.div>
  );
};

export default TimerDisplay;

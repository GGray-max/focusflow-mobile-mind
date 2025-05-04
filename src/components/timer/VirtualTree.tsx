
import React, { useEffect, useState } from 'react';
import { TreeDeciduous } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTimer } from '@/contexts/TimerContext';

const treeStages = [
  { minTime: 0, maxTime: 5 * 60, size: 24, color: "text-green-300" },
  { minTime: 5 * 60, maxTime: 10 * 60, size: 32, color: "text-green-400" },
  { minTime: 10 * 60, maxTime: 15 * 60, size: 40, color: "text-green-500" },
  { minTime: 15 * 60, maxTime: 20 * 60, size: 48, color: "text-green-600" },
  { minTime: 20 * 60, maxTime: Infinity, size: 56, color: "text-green-700" }
];

const VirtualTree: React.FC = () => {
  const { state: { isRunning, timeLeft, focusDuration, mode } } = useTimer();
  const [treeHealth, setTreeHealth] = useState(100);
  const [isAppActive, setIsAppActive] = useState(true);
  const [lastInteractionTime, setLastInteractionTime] = useState(Date.now());
  
  // Calculate elapsed time in focus session
  const elapsedSeconds = focusDuration * 60 - timeLeft;
  
  // Determine current tree stage based on elapsed time
  const currentStage = treeStages.find(
    stage => elapsedSeconds >= stage.minTime && elapsedSeconds < stage.maxTime
  ) || treeStages[0];

  // Handle visibility change to detect when user leaves the app
  useEffect(() => {
    const handleVisibilityChange = () => {
      const isVisible = document.visibilityState === 'visible';
      setIsAppActive(isVisible);

      if (isVisible) {
        // User came back to the app
        const currentTime = Date.now();
        const timeAway = (currentTime - lastInteractionTime) / 1000; // in seconds
        
        // Reduce tree health if away during an active focus session
        if (isRunning && mode === 'focus' && timeAway > 5) {
          const healthReduction = Math.min(Math.floor(timeAway / 5) * 10, treeHealth);
          setTreeHealth(prev => Math.max(0, prev - healthReduction));
        }
      }
      
      setLastInteractionTime(Date.now());
    };

    // User activity monitoring
    const handleUserActivity = () => {
      setLastInteractionTime(Date.now());
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('mousemove', handleUserActivity);
    window.addEventListener('keypress', handleUserActivity);
    window.addEventListener('touchstart', handleUserActivity);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('mousemove', handleUserActivity);
      window.removeEventListener('keypress', handleUserActivity);
      window.removeEventListener('touchstart', handleUserActivity);
    };
  }, [isRunning, lastInteractionTime, mode, treeHealth]);

  // Reset tree health when starting a new session
  useEffect(() => {
    if (mode === 'focus' && isRunning) {
      setTreeHealth(100);
    }
  }, [mode, isRunning]);

  if (mode !== 'focus') {
    return null;
  }

  return (
    <div className="flex flex-col items-center mt-4">
      <div className={cn(
        "transition-all duration-1000 transform",
        isRunning ? "scale-100" : "scale-90 opacity-70",
        !isAppActive && "animate-pulse"
      )}>
        <TreeDeciduous 
          size={currentStage.size} 
          className={cn(
            currentStage.color, 
            "transition-all duration-500",
            treeHealth < 50 && "opacity-70",
            treeHealth < 25 && "opacity-50",
            treeHealth === 0 && "text-gray-400"
          )}
          strokeWidth={1.5}
        />
      </div>
      
      {isRunning && (
        <div className="mt-2 text-xs text-gray-500">
          {treeHealth === 100 ? (
            <p className="text-green-600">Your tree is growing beautifully!</p>
          ) : treeHealth > 50 ? (
            <p className="text-green-500">Keep focusing, your tree is growing!</p>
          ) : treeHealth > 25 ? (
            <p className="text-amber-500">Don't leave! Your tree needs attention.</p>
          ) : treeHealth > 0 ? (
            <p className="text-red-500">Your tree is dying! Come back!</p>
          ) : (
            <p className="text-gray-500">Your tree has died. Start a new session.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default VirtualTree;

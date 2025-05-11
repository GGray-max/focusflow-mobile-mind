
import React, { useEffect, useState } from 'react';
import { TreeDeciduous, Leaf } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTimer } from '@/contexts/TimerContext';
import { motion } from 'framer-motion';

const treeStages = [
  { minTime: 0, maxTime: 5 * 60, size: 24, color: "text-green-300", leaves: 0 },
  { minTime: 5 * 60, maxTime: 10 * 60, size: 32, color: "text-green-400", leaves: 1 },
  { minTime: 10 * 60, maxTime: 15 * 60, size: 40, color: "text-green-500", leaves: 2 },
  { minTime: 15 * 60, maxTime: 20 * 60, size: 48, color: "text-green-600", leaves: 3 },
  { minTime: 20 * 60, maxTime: Infinity, size: 56, color: "text-green-700", leaves: 5 }
];

const VirtualTree: React.FC = () => {
  const { state: { isRunning, timeLeft, focusDuration, mode, treeHealth } } = useTimer();
  const [isShaking, setIsShaking] = useState(false);
  const [showWaterEffect, setShowWaterEffect] = useState(false);
  const [lastStageIndex, setLastStageIndex] = useState(0);
  const [showGrowthAnimation, setShowGrowthAnimation] = useState(false);
  
  // Calculate elapsed time in focus session
  const elapsedSeconds = focusDuration * 60 - timeLeft;
  
  // Determine current tree stage based on elapsed time
  const currentStage = treeStages.find(
    stage => elapsedSeconds >= stage.minTime && elapsedSeconds < stage.maxTime
  ) || treeStages[0];

  const currentStageIndex = treeStages.indexOf(currentStage);

  // Handle tree stage changes and trigger growth animation
  useEffect(() => {
    if (currentStageIndex > lastStageIndex) {
      setShowGrowthAnimation(true);
      setTimeout(() => setShowGrowthAnimation(false), 1000);
      setLastStageIndex(currentStageIndex);
    }
  }, [currentStageIndex, lastStageIndex]);

  // Handle tree shake effect
  const handleTreeInteraction = () => {
    if (isRunning && mode === 'focus') {
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
      
      // Show water animation effect
      setShowWaterEffect(true);
      setTimeout(() => setShowWaterEffect(false), 1500);
    }
  };

  // Generate leaves around the tree based on current stage
  const renderLeaves = () => {
    const leaves = [];
    for (let i = 0; i < currentStage.leaves; i++) {
      const angle = (i * (360 / currentStage.leaves)) * (Math.PI / 180);
      const x = Math.cos(angle) * 25;
      const y = Math.sin(angle) * 25;
      
      leaves.push(
        <motion.div 
          key={i}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ 
            opacity: showGrowthAnimation ? [0, 1, 1] : 1, 
            scale: showGrowthAnimation ? [0, 1.2, 1] : 1,
            x: showGrowthAnimation ? [0, x * 1.2, x] : x,
            y: showGrowthAnimation ? [0, y * 1.2, y] : y
          }}
          transition={{ duration: 0.5, delay: i * 0.1 }}
          style={{ 
            position: 'absolute',
            transform: `translate(${x}px, ${y}px)`,
          }}
          className={cn(
            "transition-all duration-300",
            treeHealth < 50 && "opacity-70",
            treeHealth < 25 && "opacity-40"
          )}
        >
          <Leaf size={12} className={currentStage.color} strokeWidth={1.5} />
        </motion.div>
      );
    }
    return leaves;
  };

  return (
    <div className="flex flex-col items-center mt-4 mb-6">
      {/* Water drop effect */}
      {showWaterEffect && (
        <motion.div
          initial={{ y: -20, opacity: 1, scale: 0.5 }}
          animate={{ y: 0, opacity: 0, scale: 1 }}
          transition={{ duration: 1.5 }}
          className="absolute mb-16 text-blue-400 dark:text-blue-300"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L5.5 8.5C2.5 11.5 2.5 16.5 5.5 19.5C8.5 22.5 13.5 22.5 16.5 19.5C19.5 16.5 19.5 11.5 16.5 8.5L12 2Z" />
          </svg>
        </motion.div>
      )}
      
      <motion.div 
        className={cn(
          "relative cursor-pointer transition-all duration-500",
          isRunning ? "scale-100" : "scale-90 opacity-80"
        )}
        animate={{ 
          rotate: isShaking ? [-5, 5, -3, 3, 0] : 0,
          scale: showGrowthAnimation ? [1, 1.2, 1] : 1
        }}
        transition={{ 
          duration: isShaking ? 0.5 : 0.3,
          type: "spring", 
          stiffness: 300 
        }}
        onClick={handleTreeInteraction}
        whileHover={{ scale: isRunning ? 1.1 : 1 }}
        whileTap={{ scale: isRunning ? 0.95 : 1 }}
        aria-label={isRunning ? "Water your tree" : "Tree"}
        role="button"
      >
        <TreeDeciduous 
          size={currentStage.size} 
          className={cn(
            "transition-all duration-500",
            currentStage.color,
            treeHealth < 50 && "opacity-70",
            treeHealth < 25 && "opacity-50",
            treeHealth === 0 && "text-gray-400",
            isRunning && "filter drop-shadow-md"
          )}
          strokeWidth={1.5}
        />
        
        {/* Render leaves around tree */}
        {renderLeaves()}
        
        {/* Tree glow effect when running */}
        {isRunning && treeHealth > 50 && (
          <div 
            className={cn(
              "absolute inset-0 rounded-full -z-10 opacity-50 blur-md",
              currentStage.color
            )}
          />
        )}
      </motion.div>
      
      <motion.div 
        className="mt-4 text-xs text-gray-500 dark:text-gray-400 text-center"
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        {treeHealth === 100 ? (
          <p className="text-green-600 dark:text-green-500">Your tree is growing beautifully! <span className="text-sm">✨</span></p>
        ) : treeHealth > 50 ? (
          <p className="text-green-500 dark:text-green-400">Keep focusing, your tree is growing! <span className="text-sm">🌱</span></p>
        ) : treeHealth > 25 ? (
          <p className="text-amber-500">Don't leave! Your tree needs attention.</p>
        ) : treeHealth > 0 ? (
          <p className="text-red-500 animate-pulse">Your tree is dying! Come back!</p>
        ) : (
          <p className="text-gray-500">Your tree has died. Start a new session.</p>
        )}
        
        {isRunning && treeHealth > 0 && (
          <p className="mt-1.5 text-xs opacity-75">
            Tap the tree to water it
          </p>
        )}
      </motion.div>
    </div>
  );
};

export default VirtualTree;

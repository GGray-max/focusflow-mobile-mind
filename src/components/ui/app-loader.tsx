import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVisionBoard } from '@/contexts/VisionBoardContext';

interface AppLoaderProps {
  onFinished: () => void;
}

const AppLoader: React.FC<AppLoaderProps> = ({ onFinished }) => {
  const { getRandomEntry } = useVisionBoard();
  const [isVisible, setIsVisible] = useState(true);
  const [motivationalQuote, setMotivationalQuote] = useState<string | null>(null);

  useEffect(() => {
    try {
      // Check if startup motivation is enabled
      const startupMotivationEnabled = localStorage.getItem('showMotivationOnStartup') !== 'false';
      
      // Only show motivational quotes if enabled
      if (startupMotivationEnabled) {
        // Try to get a random motivational quote from vision board
        try {
          const entry = getRandomEntry();
          if (entry) {
            setMotivationalQuote(entry.description);
          }
        } catch (err) {
          console.log('Could not load motivational quote:', err);
        }
      }
    } catch (err) {
      console.log('Error in AppLoader initialization:', err);
    }
    
    // Display the loader for a short amount of time then trigger the fade out
    // Use a slightly longer duration if showing a quote
    const displayDuration = motivationalQuote ? 3000 : 2500;
    
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, displayDuration);

    return () => clearTimeout(timer);
  }, [getRandomEntry, motivationalQuote]);

  // When the exit animation is complete, call onFinished
  const handleAnimationComplete = () => {
    if (!isVisible) {
      onFinished();
    }
  };

  return (
    <AnimatePresence onExitComplete={handleAnimationComplete}>
      {isVisible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-white dark:bg-gray-900"
        >
          <div className="flex flex-col items-center">
            {/* Animated logo */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ 
                duration: 0.5, 
                type: 'spring',
                stiffness: 200
              }}
              className="mb-6"
            >
              <div className="w-20 h-20 bg-focus-400 rounded-full flex items-center justify-center shadow-lg">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  width="40" 
                  height="40" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  className="text-white"
                >
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                </svg>
              </div>
            </motion.div>
            
            {/* FocusFlow text animated */}
            <motion.div 
              className="text-center"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <h1 className="text-3xl font-bold bg-gradient-to-r from-focus-400 to-focus-300 text-transparent bg-clip-text">
                FocusFlow
              </h1>
              
              <motion.div
                className="mt-4"
                initial={{ width: 0 }}
                animate={{ width: "100%" }}
                transition={{ duration: 1.5, delay: 0.5 }}
              >
                <div className="h-1 bg-gradient-to-r from-focus-400 to-focus-300 rounded-full" />
              </motion.div>
              
              {motivationalQuote && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 1 }}
                  className="mt-6 max-w-xs text-center text-sm text-gray-600 dark:text-gray-300 italic"
                >
                  "{motivationalQuote}"
                </motion.p>
              )}
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AppLoader;

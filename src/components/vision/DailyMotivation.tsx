import React, { useState, useEffect } from 'react';
import { useVisionBoard } from '@/contexts/VisionBoardContext';
import { Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

interface DailyMotivationProps {
  showOnHomeOnly?: boolean;
}

const DailyMotivation: React.FC<DailyMotivationProps> = ({ showOnHomeOnly = false }) => {
  const { getRandomEntry } = useVisionBoard();
  const navigate = useNavigate();
  const [motivationalEntry, setMotivationalEntry] = useState<any>(null);
  const [showMotivation, setShowMotivation] = useState(false);

  useEffect(() => {
    try {
      // Check if motivational reminders are enabled
      const motivationalRemindersEnabled = localStorage.getItem('showMotivationalReminders') !== 'false';
      
      // If disabled, don't show anything
      if (!motivationalRemindersEnabled) {
        setShowMotivation(false);
        return;
      }
      
      // Check if we've shown motivation today
      const lastShownDate = localStorage.getItem('lastMotivationDate');
      const today = new Date().toDateString();
      
      // Only show once per day
      if (lastShownDate !== today) {
        try {
          const entry = getRandomEntry();
          if (entry) {
            setMotivationalEntry(entry);
            setShowMotivation(true);
            localStorage.setItem('lastMotivationDate', today);
          }
        } catch (err) {
          console.log('Error getting random vision board entry:', err);
          setShowMotivation(false);
        }
      }
    } catch (err) {
      console.log('Error in DailyMotivation component:', err);
      setShowMotivation(false);
    }
  }, [getRandomEntry]);

  if (!motivationalEntry || !showMotivation) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="mb-6 p-4 bg-gradient-to-r from-focus-50 to-focus-100 dark:from-focus-900 dark:to-focus-800 rounded-xl border border-focus-200 dark:border-focus-700 shadow-sm"
      >
        <div className="flex items-start gap-3">
          <div className="bg-white dark:bg-gray-800 p-2 rounded-full shadow-sm">
            <Sparkles size={18} className="text-focus-400" />
          </div>
          
          <div className="flex-1">
            <h3 className="font-medium text-focus-700 dark:text-focus-300 text-sm">Daily Motivation</h3>
            <p className="text-sm mt-1 text-gray-700 dark:text-gray-300 italic">
              "{motivationalEntry.description}"
            </p>
            <div className="mt-2 flex justify-end">
              <button 
                onClick={() => navigate('/vision-board')}
                className="text-xs text-focus-500 hover:text-focus-600 dark:text-focus-400 dark:hover:text-focus-300"
              >
                View Vision Board →
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default DailyMotivation;

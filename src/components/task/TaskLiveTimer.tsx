import React, { useEffect, useState } from 'react';
import { useTimer } from '@/contexts/TimerContext';
import { Clock } from 'lucide-react';
import { formatTime } from '@/services/TimerService';
import { motion } from 'framer-motion';

interface TaskLiveTimerProps {
  taskId: string;
}

const TaskLiveTimer: React.FC<TaskLiveTimerProps> = ({ taskId }) => {
  const { state } = useTimer();
  const [isActive, setIsActive] = useState(false);
  
  // Check if this task is currently being timed
  useEffect(() => {
    setIsActive(
      state.isRunning && 
      state.mode === 'focus' && 
      state.currentTaskId === taskId
    );
  }, [state.isRunning, state.mode, state.currentTaskId, taskId]);

  if (!isActive) return null;
  
  return (
    <motion.div 
      className="bg-focus-400 text-white px-3 py-2 rounded-md flex items-center justify-center gap-2 shadow-md"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Clock size={16} className="animate-pulse" />
      <span className="font-medium">{formatTime(state.timeLeft * 1000)}</span>
    </motion.div>
  );
};

export default TaskLiveTimer;

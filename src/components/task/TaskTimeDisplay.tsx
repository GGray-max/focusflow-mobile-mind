import React from 'react';
import { formatTime } from '@/services/TimerService';
import { Task } from '@/contexts/TaskContext';

interface TaskTimeDisplayProps {
  task: Task;
  showLabel?: boolean;
  className?: string;
}

/**
 * Component to display the total time spent on a task
 */
const TaskTimeDisplay: React.FC<TaskTimeDisplayProps> = ({ 
  task, 
  showLabel = true,
  className = '' 
}) => {
  if (!task.totalTimeSpent || task.totalTimeSpent === 0) {
    return showLabel ? (
      <div className={`text-xs text-gray-500 ${className}`}>
        No time tracked
      </div>
    ) : null;
  }

  const formattedTime = formatTime(task.totalTimeSpent);

  return (
    <div className={`${className} flex items-center gap-1`}>
      <span className="text-xs font-medium">
        {showLabel && 'Time Spent: '}
        <span className="text-violet-600 dark:text-violet-400">{formattedTime}</span>
      </span>
    </div>
  );
};

export default TaskTimeDisplay;

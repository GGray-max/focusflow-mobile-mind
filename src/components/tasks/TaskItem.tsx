
import React from 'react';
import { Task } from '@/contexts/TaskContext';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { Star, ChevronRight, Calendar } from 'lucide-react';
import { format } from 'date-fns';

interface TaskItemProps {
  task: Task;
  onToggleComplete: () => void;
  onTogglePriority: () => void;
  onClick: () => void;
}

const TaskItem: React.FC<TaskItemProps> = ({ 
  task, 
  onToggleComplete, 
  onTogglePriority,
  onClick 
}) => {
  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleComplete();
  };

  const handleStarClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onTogglePriority();
  };

  // Calculate progress if there are subtasks
  const progress = task.subtasks.length 
    ? Math.round((task.subtasks.filter(st => st.completed).length / task.subtasks.length) * 100) 
    : task.completed 
      ? 100 
      : 0;
      
  const priorityColors = {
    high: 'border-red-400 bg-red-100 dark:bg-red-900/20',
    medium: 'border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20',
    low: 'border-blue-400 bg-blue-50 dark:bg-blue-900/20'
  };

  return (
    <div 
      className={cn(
        "bg-white dark:bg-gray-800 rounded-xl p-4 mb-3 shadow-sm border border-gray-100 dark:border-gray-700",
        "transition-all duration-200 hover:shadow-md active:scale-99",
        task.isPriority && !task.completed && "border-l-4 border-l-focus-400",
        task.completed && "opacity-70"
      )}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1">
          <div onClick={handleCheckboxClick} className="flex-shrink-0">
            <Checkbox 
              checked={task.completed}
              className={cn(
                "rounded-full h-5 w-5 border-2",
                task.priority === 'high' ? "border-red-400" : 
                task.priority === 'medium' ? "border-yellow-400" : 
                "border-blue-400"
              )}
            />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className={cn(
              "text-base font-medium line-clamp-1",
              task.completed && "line-through opacity-70"
            )}>
              {task.title}
            </h3>
            
            {task.subtasks.length > 0 && (
              <div className="mt-2 flex items-center gap-2">
                <div className="h-2 flex-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className={cn(
                      "h-2 rounded-full transition-all duration-500",
                      progress === 100 ? "bg-green-500" : "bg-focus-400"
                    )}
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <span className="text-xs text-gray-500 font-medium">
                  {task.subtasks.filter(st => st.completed).length}/{task.subtasks.length}
                </span>
              </div>
            )}
            
            {task.dueDate && (
              <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                <Calendar size={12} className="inline-block" />
                {format(new Date(task.dueDate), "MMM d")}
              </p>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={handleStarClick}
            className="focus:outline-none transform transition-transform hover:scale-110"
          >
            <Star 
              size={18} 
              className={cn(
                "transition-colors",
                task.isPriority 
                  ? "fill-focus-400 text-focus-400" 
                  : "text-gray-300 dark:text-gray-600"
              )} 
            />
          </button>
          <div className="flex items-center justify-center h-6 w-6 rounded-full bg-gray-100 dark:bg-gray-700">
            <ChevronRight size={14} className="text-gray-400" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskItem;

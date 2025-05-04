
import React from 'react';
import { Task } from '@/contexts/TaskContext';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { Star, ChevronRight } from 'lucide-react';
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

  return (
    <div 
      className={cn(
        "bg-white dark:bg-gray-800 rounded-lg p-4 mb-3 shadow-sm border border-gray-100 dark:border-gray-700",
        "transition-all duration-200 hover:shadow-md",
        task.completed && "opacity-70"
      )}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1">
          <div onClick={handleCheckboxClick}>
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
          <div className="flex-1">
            <h3 className={cn(
              "text-base font-medium line-clamp-1",
              task.completed && "line-through opacity-70"
            )}>
              {task.title}
            </h3>
            
            {task.subtasks.length > 0 && (
              <div className="mt-1 flex items-center gap-2">
                <div className="h-1 flex-1 bg-gray-200 dark:bg-gray-700 rounded-full">
                  <div 
                    className={cn(
                      "h-1 rounded-full",
                      progress === 100 ? "bg-green-500" : "bg-focus-400"
                    )}
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <span className="text-xs text-gray-500">
                  {task.subtasks.filter(st => st.completed).length}/{task.subtasks.length}
                </span>
              </div>
            )}
            
            {task.dueDate && (
              <p className="text-xs text-gray-500 mt-1">
                {format(new Date(task.dueDate), "MMM d")}
              </p>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={handleStarClick}
            className="focus:outline-none"
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
          <ChevronRight size={18} className="text-gray-400" />
        </div>
      </div>
    </div>
  );
};

export default TaskItem;

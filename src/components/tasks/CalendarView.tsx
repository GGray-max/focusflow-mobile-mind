
import React, { useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { useTasks, Task } from '@/contexts/TaskContext';
import { format, startOfDay, isSameDay, isValid } from 'date-fns';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';

interface CalendarViewProps {
  onTaskSelect: (task: Task) => void;
}

const CalendarView: React.FC<CalendarViewProps> = ({ onTaskSelect }) => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const { state } = useTasks();
  const { tasks } = state;

  // Group tasks by date
  const tasksByDate = tasks.reduce((acc, task) => {
    if (task.dueDate) {
      try {
        const taskDate = new Date(task.dueDate);
        
        // Validate date before using it
        if (isValid(taskDate)) {
          const dateStr = startOfDay(taskDate).toISOString();
          if (!acc[dateStr]) {
            acc[dateStr] = [];
          }
          acc[dateStr].push(task);
        }
      } catch (error) {
        console.error("Invalid date in task:", task);
      }
    }
    return acc;
  }, {} as Record<string, Task[]>);

  // Get tasks for selected date
  const tasksForSelectedDate = tasks.filter(task => {
    if (!task.dueDate) return false;
    
    try {
      const taskDate = new Date(task.dueDate);
      return isValid(taskDate) && isSameDay(taskDate, selectedDate);
    } catch (error) {
      return false;
    }
  });

  // Custom day renderer to show tasks count
  const renderDay = (day: Date) => {
    if (!isValid(day)) return <div>{day.getDate()}</div>;
    
    try {
      const dateStr = startOfDay(day).toISOString();
      const dateHasTasks = tasksByDate[dateStr]?.length > 0;
      const taskCount = tasksByDate[dateStr]?.length || 0;
      
      return (
        <div className="relative">
          <div>{day.getDate()}</div>
          {dateHasTasks && (
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2">
              <Badge 
                variant="secondary" 
                className={cn(
                  "text-[0.6rem] h-4 min-w-4 px-1 flex items-center justify-center",
                  tasksByDate[dateStr].some(t => t.isPriority) 
                    ? "bg-focus-200 text-focus-800" 
                    : "bg-muted"
                )}
              >
                {taskCount}
              </Badge>
            </div>
          )}
        </div>
      );
    } catch (error) {
      // If there's any error processing the date, just show the day number
      return <div>{day.getDate()}</div>;
    }
  };
  
  // Get task color based on priority
  const getTaskColor = (priority: string, completed: boolean) => {
    if (completed) return "bg-gray-100 text-gray-500 border-gray-200";
    
    switch (priority) {
      case 'high':
        return "bg-red-50 border-red-200 text-red-700";
      case 'medium':
        return "bg-orange-50 border-orange-200 text-orange-700";
      case 'low':
        return "bg-blue-50 border-blue-200 text-blue-700";
      default:
        return "bg-gray-50 border-gray-200 text-gray-700";
    }
  };

  return (
    <div className="space-y-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="p-4 bg-white dark:bg-gray-800 shadow-sm">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(date) => date && setSelectedDate(date)}
            className="rounded-md pointer-events-auto"
          />
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <h3 className="text-lg font-medium mb-2">
          Tasks for {format(selectedDate, 'MMMM d, yyyy')}
        </h3>
        
        <Card className="bg-white dark:bg-gray-800 shadow-sm">
          <ScrollArea className="h-[300px] rounded-md">
            {tasksForSelectedDate.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">
                No tasks scheduled for this day
              </div>
            ) : (
              <div className="p-2 space-y-2">
                {tasksForSelectedDate.map((task) => (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3 }}
                    className={cn(
                      "p-3 rounded-md border cursor-pointer flex items-center",
                      getTaskColor(task.priority, task.completed)
                    )}
                    onClick={() => onTaskSelect(task)}
                  >
                    <div className="flex-1">
                      <div className={cn("font-medium", task.completed && "line-through")}>{task.title}</div>
                      <div className="text-xs flex items-center mt-1 space-x-2">
                        {task.dueTime && (
                          <span>{task.dueTime}</span>
                        )}
                        {task.category && (
                          <Badge variant="outline" className="font-normal text-xs">
                            {task.category}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </ScrollArea>
        </Card>
      </motion.div>
    </div>
  );
};

export default CalendarView;

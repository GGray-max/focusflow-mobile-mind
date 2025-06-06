import React, { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { useTasks } from '@/contexts/TaskContext';
import { format, isSameDay, isToday, parseISO } from 'date-fns';
import { 
  CheckCircle2, 
  Circle, 
  CalendarDays, 
  ChevronLeft, 
  ChevronRight,
  CalendarIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import TaskItem from '@/components/tasks/TaskItem';

const TaskCalendarView: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const { state, toggleComplete, togglePriority } = useTasks();

  // Calculate task dates
  const taskDates = useMemo(() => {
    const dates: Record<string, { scheduled: number, completed: number }> = {};
    
    state.tasks.forEach(task => {
      if (task.dueDate) {
        const dateKey = task.dueDate.split('T')[0];
        if (!dates[dateKey]) {
          dates[dateKey] = { scheduled: 0, completed: 0 };
        }
        dates[dateKey].scheduled++;
      }
      
      if (task.completed && task.completedAt) {
        const dateKey = task.completedAt.split('T')[0];
        if (!dates[dateKey]) {
          dates[dateKey] = { scheduled: 0, completed: 0 };
        }
        dates[dateKey].completed++;
      }
    });
    
    return dates;
  }, [state.tasks]);
  
  // Get tasks for selected date
  const tasksForSelectedDate = useMemo(() => {
    if (!selectedDate) return { scheduled: [], completed: [] };
    
    const scheduled = state.tasks.filter(task => 
      task.dueDate && isSameDay(parseISO(task.dueDate), selectedDate)
    );
    
    const completed = state.tasks.filter(task => 
      task.completed && 
      task.completedAt && 
      isSameDay(parseISO(task.completedAt), selectedDate)
    );
    
    return { scheduled, completed };
  }, [selectedDate, state.tasks]);
  
  // Customize calendar rendering to show task indicators
  const renderDay = (day: Date) => {
    const dateKey = format(day, 'yyyy-MM-dd');
    const hasScheduled = taskDates[dateKey]?.scheduled > 0;
    const hasCompleted = taskDates[dateKey]?.completed > 0;
    const isSelected = selectedDate && isSameDay(day, selectedDate);
    
    return (
      <div className="relative w-full h-full">
        <div className={`flex flex-col items-center justify-center w-full h-full ${isToday(day) ? 'font-bold' : ''} ${isSelected ? 'text-white' : ''}`}>
          {day.getDate()}
          
          {/* Task indicators */}
          <div className="flex mt-1 gap-1">
            {hasScheduled && (
              <div className="h-1.5 w-1.5 rounded-full bg-focus-400" />
            )}
            {hasCompleted && (
              <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
            )}
          </div>
        </div>
      </div>
    );
  };
  
  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium flex items-center">
            <CalendarDays size={18} className="mr-2 text-focus-400" />
            Tasks Calendar
          </h2>
          <div className="flex space-x-2">
            <Button
              variant={viewMode === 'calendar' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('calendar')}
              className={viewMode === 'calendar' ? 'bg-focus-400 hover:bg-focus-500' : ''}
            >
              <CalendarIcon size={16} className="mr-1" />
              Calendar
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
              className={viewMode === 'list' ? 'bg-focus-400 hover:bg-focus-500' : ''}
            >
              <CheckCircle2 size={16} className="mr-1" />
              List
            </Button>
          </div>
        </div>
        
        <AnimatePresence mode="wait">
          {viewMode === 'calendar' ? (
            <motion.div
              key="calendar"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                className="rounded-md border"
                components={{
                  Day: (props) => renderDay(props.date)
                }}
              />
            </motion.div>
          ) : (
            <motion.div
              key="list"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              {selectedDate && (
                <div className="flex items-center justify-between pb-2 border-b">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => {
                      setSelectedDate(prev => {
                        if (!prev) return new Date();
                        const newDate = new Date(prev);
                        newDate.setDate(prev.getDate() - 1);
                        return newDate;
                      });
                    }}
                  >
                    <ChevronLeft size={16} />
                  </Button>
                  <h3 className="text-sm font-medium">
                    {isToday(selectedDate) 
                      ? 'Today' 
                      : format(selectedDate, 'EEEE, MMMM d, yyyy')}
                  </h3>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => {
                      setSelectedDate(prev => {
                        if (!prev) return new Date();
                        const newDate = new Date(prev);
                        newDate.setDate(prev.getDate() + 1);
                        return newDate;
                      });
                    }}
                  >
                    <ChevronRight size={16} />
                  </Button>
                </div>
              )}
              
              {/* Scheduled Tasks */}
              {tasksForSelectedDate.scheduled.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-2 flex items-center">
                    <CalendarDays size={14} className="mr-1 text-focus-400" />
                    Scheduled Tasks
                  </h4>
                  <div className="space-y-2">
                    {tasksForSelectedDate.scheduled.map(task => (
                      <TaskItem
                        key={`scheduled-${task.id}`}
                        task={task}
                        onToggleComplete={() => toggleComplete(task.id)}
                        onTogglePriority={() => togglePriority(task.id)}
                        onClick={() => {}}
                      />
                    ))}
                  </div>
                </div>
              )}
              
              {/* Completed Tasks */}
              {tasksForSelectedDate.completed.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-2 flex items-center">
                    <CheckCircle2 size={14} className="mr-1 text-green-500" />
                    Completed Tasks
                  </h4>
                  <div className="space-y-2">
                    {tasksForSelectedDate.completed.map(task => (
                      <TaskItem
                        key={`completed-${task.id}`}
                        task={task}
                        onToggleComplete={() => toggleComplete(task.id)}
                        onTogglePriority={() => togglePriority(task.id)}
                        onClick={() => {}}
                      />
                    ))}
                  </div>
                </div>
              )}
              
              {tasksForSelectedDate.scheduled.length === 0 && 
               tasksForSelectedDate.completed.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Circle size={32} className="mx-auto mb-2 opacity-30" />
                  <p>No tasks for this date</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </div>
  );
};

export default TaskCalendarView;

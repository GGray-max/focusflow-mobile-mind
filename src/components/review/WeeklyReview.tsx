
import React, { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { useTimer } from '@/contexts/TimerContext';
import { useTasks } from '@/contexts/TaskContext';
import { useProcrastination } from '@/contexts/ProcrastinationContext';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';

const WeeklyReview: React.FC = () => {
  const { state: timerState } = useTimer();
  const { state: { tasks } } = useTasks();
  const { state: { entries } } = useProcrastination();
  
  const weekData = useMemo(() => {
    const today = new Date();
    const start = startOfWeek(today, { weekStartsOn: 1 });
    const end = endOfWeek(today, { weekStartsOn: 1 });
    
    // Create an array of days in the current week
    const days = eachDayOfInterval({ start, end });
    
    return days.map(day => {
      // Find focus sessions for this day
      const dayFocusSessions = timerState.focusSessions ? timerState.focusSessions.filter(session => 
        isSameDay(new Date(session.date), day)
      ) : [];
      
      // Calculate total focus time in hours
      const focusHours = dayFocusSessions.reduce((total, session) => 
        total + session.duration / 3600, 0);
      
      // Count completed tasks for this day
      const completedTasks = tasks ? tasks.filter(task => {
        const taskDate = task.completedAt ? new Date(task.completedAt) : null;
        return taskDate && isSameDay(taskDate, day);
      }).length : 0;
      
      // Count procrastination entries for this day
      const procrastinationCount = entries ? entries.filter(entry =>
        isSameDay(new Date(entry.timestamp), day)
      ).length : 0;
      
      return {
        day: format(day, 'EEE'),
        fullDate: format(day, 'yyyy-MM-dd'),
        focusHours: parseFloat(focusHours.toFixed(1)),
        completedTasks,
        procrastinationCount
      };
    });
  }, [timerState.focusSessions, tasks, entries]);
  
  return (
    <motion.div
      className="space-y-6 mt-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="p-4">
        <h3 className="text-md font-medium mb-4">Focus Hours & Tasks Completed</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={weekData}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <XAxis dataKey="day" />
              <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
              <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
              <Tooltip />
              <Bar yAxisId="left" dataKey="focusHours" fill="#8884d8" name="Focus Hours" />
              <Bar yAxisId="right" dataKey="completedTasks" fill="#82ca9d" name="Tasks" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
      
      <Card className="p-4">
        <h3 className="text-md font-medium mb-4">Procrastination Spikes</h3>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={weekData}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="procrastinationCount" fill="#FF7070" name="Procrastination Entries" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
      
      <Card className="p-4">
        <h3 className="text-md font-medium mb-2">This Week's Completed Tasks</h3>
        <div className="mt-2 space-y-2 max-h-64 overflow-y-auto">
          {tasks
            .filter(task => {
              if (!task.completed || !task.completedAt) return false;
              const completedDate = new Date(task.completedAt);
              const start = startOfWeek(new Date(), { weekStartsOn: 1 });
              const end = endOfWeek(new Date(), { weekStartsOn: 1 });
              return completedDate >= start && completedDate <= end;
            })
            .map(task => (
              <div 
                key={task.id}
                className="p-2 bg-gray-50 dark:bg-gray-800 rounded-md flex items-center justify-between"
              >
                <div>
                  <p className="font-medium">{task.title}</p>
                  <p className="text-xs text-gray-500">
                    {task.completedAt ? format(new Date(task.completedAt), 'EEE, MMM d') : ''}
                  </p>
                </div>
                <div className="text-green-500 text-xs font-medium">Completed</div>
              </div>
            ))
          }
          {tasks.filter(task => task.completed && task.completedAt).length === 0 && (
            <p className="text-gray-500 text-sm py-4 text-center">No tasks completed this week</p>
          )}
        </div>
      </Card>
    </motion.div>
  );
};

export default WeeklyReview;

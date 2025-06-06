import React, { useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { useTimer } from '@/contexts/TimerContext';
import { useTasks } from '@/contexts/TaskContext';
import { useProcrastination } from '@/contexts/ProcrastinationContext';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, TooltipProps } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { formatHoursToHoursMinutes } from '@/lib/formatters';

const WeeklyReview: React.FC = () => {
  const { state: timerState } = useTimer();
  const { state: { tasks } } = useTasks();
  const { state: { entries } } = useProcrastination();
  const [chartLoaded, setChartLoaded] = useState(false);
  
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
      // For accurate conversion: milliseconds / (1000 * 60 * 60) = hours
      const focusHours = dayFocusSessions.reduce((total, session) => 
        total + session.duration / (1000 * 60 * 60), 0);
      
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

  // Set chart as loaded after initial render
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setChartLoaded(true);
    }, 300);
    return () => clearTimeout(timer);
  }, []);
  
  // Custom tooltip formatter for focus hours
  const CustomTooltipFormatter = (value: any, name: string) => {
    if (name === 'Focus Hours') {
      return [formatHoursToHoursMinutes(Number(value)), name];
    }
    return [value, name];
  };
  
  // Custom label formatter for tooltip to show full date
  const CustomLabelFormatter = (label: string) => {
    const dayData = weekData.find(day => day.day === label);
    return dayData ? format(new Date(dayData.fullDate), 'EEEE, MMMM d') : label;
  };
  
  return (
    <motion.div
      className="space-y-6 mt-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Card className="p-4 overflow-hidden">
          <h3 className="text-md font-medium mb-4">Focus Hours & Tasks Completed</h3>
          <div className="h-64">
            <AnimatePresence>
              {chartLoaded && (
                <motion.div 
                  className="h-full w-full"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={weekData}
                      margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    >
                      <XAxis dataKey="day" />
                      <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                      <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                      <Tooltip 
                        contentStyle={{ 
                          borderRadius: '8px',
                          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                          border: '1px solid rgba(0, 0, 0, 0.1)'
                        }}
                        formatter={CustomTooltipFormatter}
                        labelFormatter={CustomLabelFormatter}
                      />
                      <Bar 
                        yAxisId="left" 
                        dataKey="focusHours" 
                        fill="#8884d8" 
                        name="Focus Hours"
                        radius={[4, 4, 0, 0]}
                        animationDuration={1500}
                        animationEasing="ease-in-out"
                      />
                      <Bar 
                        yAxisId="right" 
                        dataKey="completedTasks" 
                        fill="#82ca9d" 
                        name="Tasks Completed"
                        radius={[4, 4, 0, 0]}
                        animationDuration={1500}
                        animationEasing="ease-in-out"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </Card>
      </motion.div>
      
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <Card className="p-4">
          <h3 className="text-md font-medium mb-4">Procrastination Spikes</h3>
          <div className="h-48">
            <AnimatePresence>
              {chartLoaded && (
                <motion.div 
                  className="h-full w-full"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={weekData}
                      margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    >
                      <XAxis dataKey="day" />
                      <YAxis />
                      <Tooltip 
                        contentStyle={{ 
                          borderRadius: '8px',
                          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                          border: '1px solid rgba(0, 0, 0, 0.1)'
                        }}
                        labelFormatter={CustomLabelFormatter}
                      />
                      <Bar 
                        dataKey="procrastinationCount" 
                        fill="#FF7070" 
                        name="Procrastination Entries"
                        radius={[4, 4, 0, 0]}
                        animationDuration={1500}
                        animationEasing="ease-in-out"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </Card>
      </motion.div>
      
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.6 }}
      >
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
              .map((task, index) => (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 + 0.2 }}
                >
                  <div 
                    className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md flex items-center justify-between hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div>
                      <p className="font-medium">{task.title}</p>
                      <p className="text-xs text-gray-500">
                        {task.completedAt ? format(new Date(task.completedAt), 'EEE, MMM d') : ''}
                      </p>
                    </div>
                    <div className="text-green-500 text-xs font-medium bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-full">Completed</div>
                  </div>
                </motion.div>
              ))
            }
            {tasks.filter(task => task.completed && task.completedAt).length === 0 && (
              <p className="text-gray-500 text-sm py-4 text-center">No tasks completed this week</p>
            )}
          </div>
        </Card>
      </motion.div>
    </motion.div>
  );
};

export default WeeklyReview;

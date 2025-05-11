
import React, { useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { useTimer } from '@/contexts/TimerContext';
import { useTasks } from '@/contexts/TaskContext';
import { useProcrastination } from '@/contexts/ProcrastinationContext';
import { format, startOfMonth, endOfMonth, eachWeekOfInterval, startOfWeek, endOfWeek, isSameDay, isWithinInterval } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';

const MonthlyReview: React.FC = () => {
  const { state: timerState } = useTimer();
  const { state: { tasks } } = useTasks();
  const { state: { entries } } = useProcrastination();
  const [chartLoaded, setChartLoaded] = useState(false);

  // Set chart as loaded after initial render
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setChartLoaded(true);
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  // Group data by week for the month
  const monthData = useMemo(() => {
    const today = new Date();
    const monthStart = startOfMonth(today);
    const monthEnd = endOfMonth(today);
    
    // Generate weeks within the month
    const weekIntervals = eachWeekOfInterval(
      { start: monthStart, end: monthEnd },
      { weekStartsOn: 1 }
    );
    
    return weekIntervals.map((weekStart, index) => {
      const weekEnd = index === weekIntervals.length - 1 
        ? monthEnd 
        : endOfWeek(weekStart, { weekStartsOn: 1 });
      
      // Calculate focus hours for the week
      const weekFocusTime = timerState.focusSessions
        ? timerState.focusSessions
            .filter(session => {
              const sessionDate = new Date(session.date);
              return isWithinInterval(sessionDate, { start: weekStart, end: weekEnd });
            })
            .reduce((total, session) => total + session.duration / 3600, 0)
        : 0;
      
      // Count completed tasks for the week
      const weekCompletedTasks = tasks
        ? tasks.filter(task => {
            if (!task.completed || !task.completedAt) return false;
            const completedDate = new Date(task.completedAt);
            return isWithinInterval(completedDate, { start: weekStart, end: weekEnd });
          }).length
        : 0;
      
      // Count procrastination entries for the week
      const weekProcrastination = entries
        ? entries.filter(entry => {
            const entryDate = new Date(entry.timestamp);
            return isWithinInterval(entryDate, { start: weekStart, end: weekEnd });
          }).length
        : 0;
      
      return {
        week: `W${index + 1}`,
        weekRange: `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d')}`,
        focusHours: parseFloat(weekFocusTime.toFixed(1)),
        completedTasks: weekCompletedTasks,
        procrastinationCount: weekProcrastination
      };
    });
  }, [timerState.focusSessions, tasks, entries]);
  
  // Calculate task completion by tag/category
  const tasksByCategory = useMemo(() => {
    const categoryCounts: Record<string, number> = {};
    
    if (tasks) {
      tasks.forEach(task => {
        if (task.completed && task.completedAt) {
          const completedDate = new Date(task.completedAt);
          const monthStart = startOfMonth(new Date());
          const monthEnd = endOfMonth(new Date());
          
          if (isWithinInterval(completedDate, { start: monthStart, end: monthEnd })) {
            if (task.tags && Array.isArray(task.tags)) {
              task.tags.forEach(tag => {
                if (!categoryCounts[tag]) categoryCounts[tag] = 0;
                categoryCounts[tag]++;
              });
              
              // If no tags, count as "Uncategorized"
              if (task.tags.length === 0) {
                if (!categoryCounts["Uncategorized"]) categoryCounts["Uncategorized"] = 0;
                categoryCounts["Uncategorized"]++;
              }
            } else {
              // Handle case where task.tags is undefined
              if (!categoryCounts["Uncategorized"]) categoryCounts["Uncategorized"] = 0;
              categoryCounts["Uncategorized"]++;
            }
          }
        }
      });
    }
    
    return Object.keys(categoryCounts).map(category => ({
      name: category,
      value: categoryCounts[category]
    }));
  }, [tasks]);
  
  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#0088fe'];
  
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
          <h3 className="text-md font-medium mb-4">Monthly Progress</h3>
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
                      data={monthData}
                      margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    >
                      <XAxis dataKey="week" />
                      <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                      <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                      <Tooltip 
                        contentStyle={{ 
                          borderRadius: '8px',
                          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                          border: '1px solid rgba(0, 0, 0, 0.1)'
                        }}
                        formatter={(value, name) => [value, name === 'focusHours' ? 'Focus Hours' : 'Tasks Completed']}
                        labelFormatter={(label) => {
                          const item = monthData.find(d => d.week === label);
                          return item ? item.weekRange : label;
                        }}
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
                        animationBegin={300}
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
        <Card className="p-4 overflow-hidden">
          <h3 className="text-md font-medium mb-4">Tasks Completed by Category</h3>
          <div className="h-64">
            {tasksByCategory.length > 0 ? (
              <AnimatePresence>
                {chartLoaded && (
                  <motion.div 
                    className="h-full w-full"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={tasksByCategory}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          animationBegin={400}
                          animationDuration={1500}
                          animationEasing="ease-out"
                        >
                          {tasksByCategory.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Legend />
                        <Tooltip 
                          formatter={(value) => [`${value} tasks`, 'Completed']}
                          contentStyle={{ 
                            borderRadius: '8px',
                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                            border: '1px solid rgba(0, 0, 0, 0.1)'
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </motion.div>
                )}
              </AnimatePresence>
            ) : (
              <div className="h-full flex items-center justify-center">
                <p className="text-gray-500">No completed tasks this month</p>
              </div>
            )}
          </div>
        </Card>
      </motion.div>
      
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.6 }}
      >
        <Card className="p-4 overflow-hidden">
          <h3 className="text-md font-medium mb-4">Procrastination Trends</h3>
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
                      data={monthData}
                      margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    >
                      <XAxis dataKey="week" />
                      <YAxis />
                      <Tooltip 
                        contentStyle={{ 
                          borderRadius: '8px',
                          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                          border: '1px solid rgba(0, 0, 0, 0.1)'
                        }}
                        formatter={(value) => [`${value}`, 'Procrastination Entries']}
                        labelFormatter={(label) => {
                          const item = monthData.find(d => d.week === label);
                          return item ? item.weekRange : label;
                        }}
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
        transition={{ duration: 0.5, delay: 0.8 }}
      >
        <Card className="p-4">
          <h3 className="text-md font-medium mb-2">Monthly Summary</h3>
          <div className="grid grid-cols-2 gap-4 mt-2">
            <motion.div 
              className="bg-gray-50 dark:bg-gray-800 p-3 rounded-md"
              whileHover={{ scale: 1.02, y: -2 }}
              transition={{ duration: 0.3 }}
            >
              <p className="text-gray-500 text-sm">Total Focus Hours</p>
              <p className="text-2xl font-bold">
                {monthData.reduce((total, week) => total + week.focusHours, 0).toFixed(1)}
              </p>
            </motion.div>
            <motion.div 
              className="bg-gray-50 dark:bg-gray-800 p-3 rounded-md"
              whileHover={{ scale: 1.02, y: -2 }}
              transition={{ duration: 0.3 }}
            >
              <p className="text-gray-500 text-sm">Tasks Completed</p>
              <p className="text-2xl font-bold">
                {monthData.reduce((total, week) => total + week.completedTasks, 0)}
              </p>
            </motion.div>
            <motion.div 
              className="bg-gray-50 dark:bg-gray-800 p-3 rounded-md"
              whileHover={{ scale: 1.02, y: -2 }}
              transition={{ duration: 0.3 }}
            >
              <p className="text-gray-500 text-sm">Focus Sessions</p>
              <p className="text-2xl font-bold">
                {timerState.focusSessions 
                  ? timerState.focusSessions.filter(session => {
                      const sessionDate = new Date(session.date);
                      return isWithinInterval(sessionDate, {
                        start: startOfMonth(new Date()),
                        end: endOfMonth(new Date())
                      });
                    }).length
                  : 0}
              </p>
            </motion.div>
            <motion.div 
              className="bg-gray-50 dark:bg-gray-800 p-3 rounded-md"
              whileHover={{ scale: 1.02, y: -2 }}
              transition={{ duration: 0.3 }}
            >
              <p className="text-gray-500 text-sm">Procrastination Entries</p>
              <p className="text-2xl font-bold">
                {entries.filter(entry => {
                  const entryDate = new Date(entry.timestamp);
                  return isWithinInterval(entryDate, {
                    start: startOfMonth(new Date()),
                    end: endOfMonth(new Date())
                  });
                }).length}
              </p>
            </motion.div>
          </div>
        </Card>
      </motion.div>
    </motion.div>
  );
};

export default MonthlyReview;

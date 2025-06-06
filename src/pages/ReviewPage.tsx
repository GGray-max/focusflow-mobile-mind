
import React, { useState } from 'react';
import MobileLayout from '@/components/layout/MobileLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTimer } from '@/contexts/TimerContext';
import { useTasks } from '@/contexts/TaskContext';
import { useProcrastination } from '@/contexts/ProcrastinationContext';
import WeeklyReview from '@/components/review/WeeklyReview';
import MonthlyReview from '@/components/review/MonthlyReview';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, BarChart, PieChart } from 'lucide-react';
import { motion } from 'framer-motion';

const ReviewPage: React.FC = () => {
  const [view, setView] = useState<'weekly' | 'monthly'>('weekly');
  const { state: timerState } = useTimer();
  const { state: taskState } = useTasks();
  const { state: procrastinationState } = useProcrastination();

  return (
    <MobileLayout>
      <motion.div 
        className="text-center mb-6"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-2xl font-bold bg-gradient-to-r from-focus-400 to-focus-300 text-transparent bg-clip-text">Progress Review</h1>
        <p className="text-gray-500 text-sm">Track your productivity journey</p>
      </motion.div>

      <Tabs 
        defaultValue="weekly" 
        onValueChange={(value) => setView(value as 'weekly' | 'monthly')}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-2 mb-4 p-1 rounded-full bg-muted">
          <TabsTrigger 
            value="weekly" 
            className="flex items-center gap-2 rounded-full data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:shadow-soft transition-all"
          >
            <Calendar size={16} />
            Weekly
          </TabsTrigger>
          <TabsTrigger 
            value="monthly" 
            className="flex items-center gap-2 rounded-full data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:shadow-soft transition-all"
          >
            <Calendar size={16} />
            Monthly
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="weekly">
          <WeeklyReview />
        </TabsContent>
        
        <TabsContent value="monthly">
          <MonthlyReview />
        </TabsContent>
      </Tabs>
      
      <motion.div 
        className="mt-8 bg-gray-50 dark:bg-gray-800 rounded-xl p-4 shadow-soft"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <h2 className="font-medium text-lg mb-3 flex items-center">
          <BarChart size={18} className="mr-2 text-focus-400" />
          Quick Stats
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <motion.div 
            className="bg-white dark:bg-gray-700 p-4 rounded-lg shadow-sm hover:shadow-md transition-all duration-300"
            whileHover={{ y: -2 }}
          >
            <div className="text-gray-500 text-sm">Total Focus Time</div>
            <div className="text-xl font-semibold flex items-center gap-1 mt-2">
              <Clock size={18} className="text-focus-400" />
              {Math.round(timerState.totalFocusTime / (1000 * 60 * 60))} hrs
            </div>
          </motion.div>
          <motion.div 
            className="bg-white dark:bg-gray-700 p-4 rounded-lg shadow-sm hover:shadow-md transition-all duration-300"
            whileHover={{ y: -2 }}
          >
            <div className="text-gray-500 text-sm">Tasks Completed</div>
            <div className="text-xl font-semibold flex items-center gap-1 mt-2">
              <PieChart size={18} className="text-focus-400" />
              {taskState.tasks.filter(t => t.completed).length}
            </div>
          </motion.div>
        </div>
      </motion.div>
    </MobileLayout>
  );
};

export default ReviewPage;

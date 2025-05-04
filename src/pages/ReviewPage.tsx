
import React, { useState } from 'react';
import MobileLayout from '@/components/layout/MobileLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTimer } from '@/contexts/TimerContext';
import { useTasks } from '@/contexts/TaskContext';
import { useProcrastination } from '@/contexts/ProcrastinationContext';
import WeeklyReview from '@/components/review/WeeklyReview';
import MonthlyReview from '@/components/review/MonthlyReview';
import { Button } from '@/components/ui/button';
import { Calendar, Clock } from 'lucide-react';
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
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="weekly" className="flex items-center gap-2">
            <Calendar size={16} />
            Weekly
          </TabsTrigger>
          <TabsTrigger value="monthly" className="flex items-center gap-2">
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
      
      <div className="mt-8 bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
        <h2 className="font-medium text-lg mb-2">Quick Stats</h2>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white dark:bg-gray-700 p-3 rounded-md shadow-sm">
            <div className="text-gray-500 text-sm">Total Focus Time</div>
            <div className="text-xl font-semibold flex items-center gap-1 mt-1">
              <Clock size={18} className="text-focus-400" />
              {Math.round(timerState.totalFocusTime / 60)} hrs
            </div>
          </div>
          <div className="bg-white dark:bg-gray-700 p-3 rounded-md shadow-sm">
            <div className="text-gray-500 text-sm">Tasks Completed</div>
            <div className="text-xl font-semibold mt-1">
              {taskState.tasks.filter(t => t.completed).length}
            </div>
          </div>
        </div>
      </div>
    </MobileLayout>
  );
};

export default ReviewPage;

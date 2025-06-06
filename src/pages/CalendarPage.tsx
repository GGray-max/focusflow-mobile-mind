import React from 'react';
import MobileLayout from '@/components/layout/MobileLayout';
import TaskCalendarView from '@/components/calendar/TaskCalendarView';
import { motion } from 'framer-motion';
import { Calendar } from 'lucide-react';

const CalendarPage: React.FC = () => {
  return (
    <MobileLayout>
      <motion.div 
        className="text-center mb-6"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-2xl font-bold bg-gradient-to-r from-focus-400 to-focus-300 text-transparent bg-clip-text">Calendar View</h1>
        <p className="text-gray-500 text-sm">Track your scheduled and completed tasks</p>
      </motion.div>
      
      <TaskCalendarView />
    </MobileLayout>
  );
};

export default CalendarPage;

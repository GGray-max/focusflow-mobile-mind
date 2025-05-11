
import React from 'react';
import MobileLayout from '@/components/layout/MobileLayout';
import TimerDisplay from '@/components/timer/TimerDisplay';
import TimerSettings from '@/components/timer/TimerSettings';
import VirtualTree from '@/components/timer/VirtualTree';
import DistractionBlocker from '@/components/timer/DistractionBlocker';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTasks } from '@/contexts/TaskContext';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useTimer } from '@/contexts/TimerContext';
import { motion } from 'framer-motion';

const TimerPage: React.FC = () => {
  const { state: { tasks } } = useTasks();
  const { startTimer } = useTimer();
  const navigate = useNavigate();
  
  // Get priority tasks for suggestions
  const priorityTasks = tasks
    .filter(task => !task.completed && task.isPriority)
    .slice(0, 3);
    
  const handleTaskSelect = (taskTitle: string) => {
    startTimer(taskTitle);
  };
  
  return (
    <MobileLayout>
      <motion.div 
        className="text-center mb-6"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-2xl font-bold bg-gradient-to-r from-focus-400 to-focus-300 text-transparent bg-clip-text">Focus Timer</h1>
        <p className="text-gray-500 text-sm dark:text-gray-400">Stay focused and grow your tree</p>
      </motion.div>
      
      <div className="flex flex-col items-center">
        <TimerDisplay />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
          className="w-full"
        >
          <VirtualTree />
        </motion.div>
      </div>
      
      <Tabs defaultValue="focus" className="mt-6">
        <TabsList className="grid w-full grid-cols-2 rounded-xl">
          <TabsTrigger value="focus" className="rounded-lg data-[state=active]:shadow-sm">Timer</TabsTrigger>
          <TabsTrigger value="settings" className="rounded-lg data-[state=active]:shadow-sm">Settings</TabsTrigger>
        </TabsList>
        
        <TabsContent value="focus" className="mt-4">
          <DistractionBlocker />
          
          {priorityTasks.length > 0 && (
            <motion.div 
              className="mt-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">Focus suggestions:</h3>
              <div className="space-y-2">
                {priorityTasks.map((task, index) => (
                  <motion.div 
                    key={task.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + (index * 0.1) }}
                  >
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left h-auto py-3 shadow-sm hover:shadow transition-all duration-200 hover:border-focus-300 rounded-xl"
                      onClick={() => handleTaskSelect(task.title)}
                    >
                      <div>
                        <p>{task.title}</p>
                        {task.subtasks.length > 0 && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {task.subtasks.filter(st => !st.completed).length} subtasks remaining
                          </p>
                        )}
                      </div>
                    </Button>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
          
          {priorityTasks.length === 0 && (
            <motion.div 
              className="mt-6 bg-gray-50/80 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <h3 className="font-medium text-foreground">No priority tasks</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Mark important tasks as priority to see them here
              </p>
              <Button 
                variant="outline" 
                className="mt-3 shadow-sm hover:shadow"
                onClick={() => navigate('/')}
              >
                View All Tasks
              </Button>
            </motion.div>
          )}
        </TabsContent>
        
        <TabsContent value="settings">
          <TimerSettings />
        </TabsContent>
      </Tabs>
    </MobileLayout>
  );
};

export default TimerPage;

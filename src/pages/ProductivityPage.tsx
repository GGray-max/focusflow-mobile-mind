
import React, { useState } from 'react';
import MobileLayout from '@/components/layout/MobileLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import TaskBoard from '@/components/tasks/TaskBoard';
import AnalyticsDashboard from '@/components/analytics/AnalyticsDashboard';
import PomodoroTimer from '@/components/timer/PomodoroTimer';
import { useTasks } from '@/contexts/TaskContext';
import { motion } from 'framer-motion';
import { BarChart, Timer, Calendar, Target } from 'lucide-react';

const ProductivityPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('board');
  const { state: { tasks }, addFocusTime } = useTasks();

  const handleSessionComplete = (taskId: string, duration: number) => {
    addFocusTime(taskId, duration);
  };

  return (
    <MobileLayout>
      <motion.div 
        className="h-full flex flex-col"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="px-4 py-6">
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <h1 className="text-2xl font-bold bg-gradient-to-r from-focus-400 to-focus-300 text-transparent bg-clip-text">
              Productivity Hub
            </h1>
            <p className="text-muted-foreground">Manage tasks, track time, and analyze your productivity</p>
          </motion.div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <div className="px-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="board" className="flex items-center gap-1">
                <Calendar size={16} />
                <span className="hidden sm:inline">Board</span>
              </TabsTrigger>
              <TabsTrigger value="timer" className="flex items-center gap-1">
                <Timer size={16} />
                <span className="hidden sm:inline">Timer</span>
              </TabsTrigger>
              <TabsTrigger value="analytics" className="flex items-center gap-1">
                <BarChart size={16} />
                <span className="hidden sm:inline">Analytics</span>
              </TabsTrigger>
              <TabsTrigger value="focus" className="flex items-center gap-1">
                <Target size={16} />
                <span className="hidden sm:inline">Focus</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 overflow-hidden">
            <TabsContent value="board" className="h-full m-0 p-4">
              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="h-full"
              >
                <TaskBoard />
              </motion.div>
            </TabsContent>

            <TabsContent value="timer" className="h-full m-0 p-4">
              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="h-full flex justify-center items-start pt-8"
              >
                <PomodoroTimer 
                  onSessionComplete={handleSessionComplete}
                />
              </motion.div>
            </TabsContent>

            <TabsContent value="analytics" className="h-full m-0">
              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="h-full overflow-y-auto"
              >
                <AnalyticsDashboard />
              </motion.div>
            </TabsContent>

            <TabsContent value="focus" className="h-full m-0 p-4">
              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="h-full flex flex-col justify-center items-center space-y-6"
              >
                <div className="text-center space-y-2">
                  <h2 className="text-xl font-semibold text-foreground">Deep Focus Mode</h2>
                  <p className="text-muted-foreground">
                    Choose a task and enter deep focus mode with Pomodoro technique
                  </p>
                </div>

                {tasks.filter(task => !task.completed && task.isPriority).length > 0 ? (
                  <div className="space-y-4 w-full max-w-md">
                    <h3 className="text-sm font-medium text-muted-foreground">Priority Tasks:</h3>
                    {tasks
                      .filter(task => !task.completed && task.isPriority)
                      .slice(0, 3)
                      .map(task => (
                        <PomodoroTimer
                          key={task.id}
                          task={task}
                          onSessionComplete={handleSessionComplete}
                        />
                      ))}
                  </div>
                ) : (
                  <div className="text-center space-y-4 max-w-md">
                    <div className="text-6xl">🎯</div>
                    <div className="space-y-2">
                      <h3 className="text-lg font-medium text-foreground">No Priority Tasks</h3>
                      <p className="text-muted-foreground text-sm">
                        Mark some tasks as priority to see them here for focused work sessions.
                      </p>
                    </div>
                  </div>
                )}
              </motion.div>
            </TabsContent>
          </div>
        </Tabs>
      </motion.div>
    </MobileLayout>
  );
};

export default ProductivityPage;

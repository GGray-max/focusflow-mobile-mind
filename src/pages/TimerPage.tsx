
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
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-focus-400 to-focus-300 text-transparent bg-clip-text">Focus Timer</h1>
        <p className="text-gray-500 text-sm">Stay focused and grow your tree</p>
      </div>
      
      <div className="flex flex-col items-center">
        <TimerDisplay />
        <VirtualTree />
      </div>
      
      <Tabs defaultValue="focus" className="mt-8">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="focus">Timer</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
        
        <TabsContent value="focus" className="mt-4">
          <DistractionBlocker />
          
          {priorityTasks.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-medium text-gray-500 mb-3">Focus suggestions:</h3>
              <div className="space-y-2">
                {priorityTasks.map(task => (
                  <Button
                    key={task.id}
                    variant="outline"
                    className="w-full justify-start text-left h-auto py-3"
                    onClick={() => handleTaskSelect(task.title)}
                  >
                    <div>
                      <p>{task.title}</p>
                      {task.subtasks.length > 0 && (
                        <p className="text-xs text-gray-500 mt-1">
                          {task.subtasks.filter(st => !st.completed).length} subtasks remaining
                        </p>
                      )}
                    </div>
                  </Button>
                ))}
              </div>
            </div>
          )}
          
          {priorityTasks.length === 0 && (
            <div className="mt-6 bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <h3 className="font-medium">No priority tasks</h3>
              <p className="text-sm text-gray-500 mt-1">
                Mark important tasks as priority to see them here
              </p>
              <Button 
                variant="outline" 
                className="mt-3"
                onClick={() => navigate('/')}
              >
                View All Tasks
              </Button>
            </div>
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

import React, { useState } from 'react';
import MobileLayout from '@/components/layout/MobileLayout';
import { Button } from '@/components/ui/button';
import { Plus, Filter, Star } from 'lucide-react';
import { useTasks, Task } from '@/contexts/TaskContext';
import TaskItem from '@/components/tasks/TaskItem';
import AddTaskDialog from '@/components/tasks/AddTaskDialog';
import TaskDetailDialog from '@/components/tasks/TaskDetailDialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

const TasksPage: React.FC = () => {
  const [isAddTaskDialogOpen, setIsAddTaskDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showOnlyPriority, setShowOnlyPriority] = useState(false);
  
  const { state, toggleComplete, togglePriority } = useTasks();
  const { tasks, loading } = state;
  
  // Filter and sort tasks
  const incompleteTasks = tasks.filter(task => !task.completed);
  const completedTasks = tasks.filter(task => task.completed);
  
  // Apply priority filter if needed
  const filteredIncompleteTasks = showOnlyPriority 
    ? incompleteTasks.filter(task => task.isPriority)
    : incompleteTasks;

  // Sort tasks by priority and due date
  const sortedIncompleteTasks = [...filteredIncompleteTasks].sort((a, b) => {
    // First by isPriority
    if (a.isPriority && !b.isPriority) return -1;
    if (!a.isPriority && b.isPriority) return 1;
    
    // Then by priority level
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
    if (priorityDiff !== 0) return priorityDiff;
    
    // Finally by due date if available
    if (a.dueDate && b.dueDate) {
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    }
    if (a.dueDate) return -1;
    if (b.dueDate) return 1;
    
    return 0;
  });

  return (
    <MobileLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-focus-400 to-focus-300 text-transparent bg-clip-text">FocusFlow</h1>
            <p className="text-gray-500 text-sm">Manage your tasks</p>
          </div>
          
          <div className="space-x-2 flex items-center">
            <Button 
              variant="outline" 
              size="icon" 
              onClick={() => setShowOnlyPriority(!showOnlyPriority)}
              className={cn(
                "rounded-full transition-all", 
                showOnlyPriority 
                  ? "bg-focus-100 text-focus-400 border-focus-200" 
                  : "hover:border-focus-300 hover:text-focus-400"
              )}
            >
              <Star size={18} className={showOnlyPriority ? "fill-focus-300" : ""} />
            </Button>
            
            <Button 
              onClick={() => setIsAddTaskDialogOpen(true)}
              className="rounded-full bg-focus-400 hover:bg-focus-500 shadow-md"
            >
              <Plus size={18} className="mr-1" /> Add Task
            </Button>
          </div>
        </div>
        
        <Tabs defaultValue="active" className="w-full">
          <TabsList className="grid w-full grid-cols-2 rounded-lg bg-muted mb-4">
            <TabsTrigger 
              value="active" 
              className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:shadow-sm rounded-md"
            >
              Active ({incompleteTasks.length})
            </TabsTrigger>
            <TabsTrigger 
              value="completed" 
              className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:shadow-sm rounded-md"
            >
              Completed ({completedTasks.length})
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="active" className="mt-0">
            {loading ? (
              <div className="py-12 flex flex-col items-center justify-center space-y-3">
                <div className="h-8 w-8 rounded-full border-4 border-focus-300 border-t-transparent animate-spin"></div>
                <p className="text-gray-500 text-sm">Loading tasks...</p>
              </div>
            ) : sortedIncompleteTasks.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center">
                <div className="bg-gray-100 dark:bg-gray-800 rounded-full p-4 mb-3">
                  <Star size={30} className="text-gray-400" />
                </div>
                <p className="text-gray-500 text-center px-4">
                  {showOnlyPriority 
                    ? "No priority tasks found" 
                    : "No active tasks found. Add a task to get started!"}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {sortedIncompleteTasks.map(task => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    onToggleComplete={() => toggleComplete(task.id)}
                    onTogglePriority={() => togglePriority(task.id)}
                    onClick={() => setSelectedTask(task)}
                  />
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="completed" className="mt-0">
            {loading ? (
              <div className="py-12 flex flex-col items-center justify-center space-y-3">
                <div className="h-8 w-8 rounded-full border-4 border-focus-300 border-t-transparent animate-spin"></div>
                <p className="text-gray-500 text-sm">Loading tasks...</p>
              </div>
            ) : completedTasks.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center">
                <div className="bg-gray-100 dark:bg-gray-800 rounded-full p-4 mb-3">
                  <Filter size={30} className="text-gray-400" />
                </div>
                <p className="text-gray-500">No completed tasks yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {completedTasks.map(task => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    onToggleComplete={() => toggleComplete(task.id)}
                    onTogglePriority={() => togglePriority(task.id)}
                    onClick={() => setSelectedTask(task)}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
      
      <AddTaskDialog 
        isOpen={isAddTaskDialogOpen} 
        onClose={() => setIsAddTaskDialogOpen(false)} 
      />
      
      <TaskDetailDialog 
        task={selectedTask} 
        isOpen={!!selectedTask} 
        onClose={() => setSelectedTask(null)} 
      />
    </MobileLayout>
  );
};

export default TasksPage;

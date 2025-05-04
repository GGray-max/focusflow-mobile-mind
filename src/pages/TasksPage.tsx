
import React, { useState } from 'react';
import MobileLayout from '@/components/layout/MobileLayout';
import { Button } from '@/components/ui/button';
import { Plus, Filter, Star } from 'lucide-react';
import { useTasks, Task } from '@/contexts/TaskContext';
import TaskItem from '@/components/tasks/TaskItem';
import AddTaskDialog from '@/components/tasks/AddTaskDialog';
import TaskDetailDialog from '@/components/tasks/TaskDetailDialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">FocusFlow</h1>
          <p className="text-gray-500 text-sm">Manage your tasks</p>
        </div>
        
        <div className="space-x-2">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => setShowOnlyPriority(!showOnlyPriority)}
            className={showOnlyPriority ? "bg-focus-100 text-focus-400" : ""}
          >
            <Star size={20} className={showOnlyPriority ? "fill-focus-300" : ""} />
          </Button>
          
          <Button onClick={() => setIsAddTaskDialogOpen(true)}>
            <Plus size={20} className="mr-2" /> Add Task
          </Button>
        </div>
      </div>
      
      <Tabs defaultValue="active" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="active">Active ({incompleteTasks.length})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({completedTasks.length})</TabsTrigger>
        </TabsList>
        
        <TabsContent value="active" className="mt-4">
          {loading ? (
            <div className="py-8 text-center">Loading tasks...</div>
          ) : sortedIncompleteTasks.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-gray-500">
                {showOnlyPriority 
                  ? "No priority tasks found" 
                  : "No active tasks found. Add a task to get started!"}
              </p>
            </div>
          ) : (
            <div className="space-y-1">
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
        
        <TabsContent value="completed" className="mt-4">
          {loading ? (
            <div className="py-8 text-center">Loading tasks...</div>
          ) : completedTasks.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-gray-500">No completed tasks yet</p>
            </div>
          ) : (
            <div className="space-y-1">
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

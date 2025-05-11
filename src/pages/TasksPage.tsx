
import React, { useState } from 'react';
import MobileLayout from '@/components/layout/MobileLayout';
import { Button } from '@/components/ui/button';
import { Plus, Filter, Star, Calendar, RepeatIcon, Search, Mic, ArrowUp, ArrowDown, SlidersHorizontal } from 'lucide-react';
import { useTasks, Task } from '@/contexts/TaskContext';
import TaskItem from '@/components/tasks/TaskItem';
import AddTaskDialog from '@/components/tasks/AddTaskDialog';
import TaskDetailDialog from '@/components/tasks/TaskDetailDialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';
import { Pagination } from '@/components/ui/pagination';
import TaskFiltersDialog from '@/components/tasks/TaskFiltersDialog';
import TaskSortDialog from '@/components/tasks/TaskSortDialog';
import SpeechRecognition from '@/components/tasks/SpeechRecognition';
import CalendarView from '@/components/tasks/CalendarView';
import FreeTimeAnalysis from '@/components/tasks/FreeTimeAnalysis';
import { toast } from '@/components/ui/use-toast';

const TasksPage: React.FC = () => {
  const [isAddTaskDialogOpen, setIsAddTaskDialogOpen] = useState(false);
  const [isFiltersDialogOpen, setIsFiltersDialogOpen] = useState(false);
  const [isSortDialogOpen, setIsSortDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showOnlyPriority, setShowOnlyPriority] = useState(false);
  const [showMonthlyTasks, setShowMonthlyTasks] = useState(false);
  const [showRecurringTasks, setShowRecurringTasks] = useState(false);
  const [isVoiceInputActive, setIsVoiceInputActive] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [showFreeTimeAnalysis, setShowFreeTimeAnalysis] = useState(false);
  
  const { 
    state, 
    toggleComplete, 
    togglePriority, 
    setSearchTerm, 
    getPaginatedTasks,
    getTotalPages,
    setPage,
    getFilteredAndSortedTasks
  } = useTasks();
  
  const { 
    tasks, 
    loading, 
    searchTerm,
    currentPage,
    tasksPerPage
  } = state;
  
  // Filter tasks
  const incompleteTasks = tasks.filter(task => !task.completed);
  const completedTasks = tasks.filter(task => task.completed);
  
  // Apply filters
  let filteredIncompleteTasks = [...incompleteTasks];
  
  // Priority filter
  if (showOnlyPriority) {
    filteredIncompleteTasks = filteredIncompleteTasks.filter(task => task.isPriority);
  }
  
  // Monthly tasks filter
  if (showMonthlyTasks) {
    filteredIncompleteTasks = filteredIncompleteTasks.filter(task => task.isMonthlyTask);
  }
  
  // Recurring tasks filter
  if (showRecurringTasks) {
    filteredIncompleteTasks = filteredIncompleteTasks.filter(
      task => task.recurrence && task.recurrence !== 'none'
    );
  }

  // Get paginated tasks
  const paginatedTasks = getPaginatedTasks();
  const totalPages = getTotalPages();
  
  // Voice recognition callback
  const handleSpeechResult = (text: string) => {
    if (text) {
      // Simple command handling
      if (text.toLowerCase().includes('add task')) {
        const taskTitle = text.replace(/add task/i, '').trim();
        if (taskTitle) {
          setIsAddTaskDialogOpen(true);
          // We'll use this in the AddTaskDialog component
          localStorage.setItem('voiceTaskTitle', taskTitle);
          toast({
            title: "Voice command detected",
            description: `Adding new task: "${taskTitle}"`,
          });
        }
      } else if (text.toLowerCase().includes('search for')) {
        const searchQuery = text.replace(/search for/i, '').trim();
        setSearchTerm(searchQuery);
        toast({
          title: "Voice search",
          description: `Searching for: "${searchQuery}"`,
        });
      } else {
        // Just use as search term
        setSearchTerm(text);
      }
    }
    
    setIsVoiceInputActive(false);
  };

  return (
    <MobileLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-focus-400 to-focus-300 text-transparent bg-clip-text">FocusFlow</h1>
            <p className="text-muted-foreground text-sm">Manage your tasks</p>
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
              title="Priority Tasks"
            >
              <Star size={18} className={showOnlyPriority ? "fill-focus-300" : ""} />
            </Button>
            
            <Button 
              variant="outline" 
              size="icon" 
              onClick={() => setShowMonthlyTasks(!showMonthlyTasks)}
              className={cn(
                "rounded-full transition-all", 
                showMonthlyTasks 
                  ? "bg-focus-100 text-focus-400 border-focus-200" 
                  : "hover:border-focus-300 hover:text-focus-400"
              )}
              title="Monthly Tasks"
            >
              <Calendar size={18} className={showMonthlyTasks ? "text-focus-400" : ""} />
            </Button>
            
            <Button 
              variant="outline" 
              size="icon" 
              onClick={() => setShowRecurringTasks(!showRecurringTasks)}
              className={cn(
                "rounded-full transition-all", 
                showRecurringTasks 
                  ? "bg-focus-100 text-focus-400 border-focus-200" 
                  : "hover:border-focus-300 hover:text-focus-400"
              )}
              title="Recurring Tasks"
            >
              <RepeatIcon size={18} className={showRecurringTasks ? "text-focus-400" : ""} />
            </Button>
            
            <Button 
              onClick={() => setIsAddTaskDialogOpen(true)}
              className="rounded-full bg-focus-400 hover:bg-focus-500 shadow-md"
            >
              <Plus size={18} className="mr-1" /> Add Task
            </Button>
          </div>
        </div>
        
        {/* Search and view toggle */}
        <div className="flex items-center space-x-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tasks..."
              className="pl-10 pr-10 rounded-full border-focus-200 focus-within:border-focus-400"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1.5 h-6 w-6 text-muted-foreground"
                onClick={() => setSearchTerm('')}
              >
                ×
              </Button>
            )}
          </div>
          
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => setIsVoiceInputActive(true)}
            className="rounded-full"
            title="Voice Input"
          >
            <Mic size={18} className={isVoiceInputActive ? "text-red-500 animate-pulse" : ""} />
          </Button>
          
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => setIsFiltersDialogOpen(true)}
            className="rounded-full" 
            title="Filters"
          >
            <Filter size={18} />
          </Button>
          
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => setIsSortDialogOpen(true)}
            className="rounded-full"
            title="Sort"
          >
            <SlidersHorizontal size={18} />
          </Button>
        </div>
        
        {/* View mode toggle */}
        <div className="flex space-x-2 justify-center">
          <Button 
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
            className="rounded-full"
          >
            List View
          </Button>
          <Button 
            variant={viewMode === 'calendar' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('calendar')}
            className="rounded-full"
          >
            Calendar View
          </Button>
          <Button 
            variant="outline"
            size="sm"
            onClick={() => setShowFreeTimeAnalysis(true)}
            className="rounded-full"
          >
            Free Time
          </Button>
        </div>
        
        {viewMode === 'list' ? (
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
                  <p className="text-muted-foreground text-sm">Loading tasks...</p>
                </div>
              ) : paginatedTasks.length === 0 ? (
                <div className="py-12 flex flex-col items-center justify-center">
                  <div className="bg-gray-100 dark:bg-gray-800 rounded-full p-4 mb-3">
                    {showMonthlyTasks ? (
                      <Calendar size={30} className="text-gray-400" />
                    ) : showRecurringTasks ? (
                      <RepeatIcon size={30} className="text-gray-400" />
                    ) : searchTerm ? (
                      <Search size={30} className="text-gray-400" />
                    ) : (
                      <Star size={30} className="text-gray-400" />
                    )}
                  </div>
                  <p className="text-muted-foreground text-center px-4">
                    {searchTerm 
                      ? "No tasks match your search"
                      : showOnlyPriority 
                      ? "No priority tasks found"
                      : showMonthlyTasks
                      ? "No monthly tasks found"
                      : showRecurringTasks
                      ? "No recurring tasks found" 
                      : "No active tasks found. Add a task to get started!"}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <AnimatePresence>
                    {paginatedTasks.filter(task => !task.completed).map((task, index) => (
                      <motion.div
                        key={task.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.2, delay: index * 0.05 }}
                      >
                        <TaskItem
                          task={task}
                          onToggleComplete={() => toggleComplete(task.id)}
                          onTogglePriority={() => togglePriority(task.id)}
                          onClick={() => setSelectedTask(task)}
                        />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  
                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex justify-center mt-6">
                      <Pagination>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => setPage(Math.max(1, currentPage - 1))}
                          disabled={currentPage === 1}
                          className="mr-2"
                        >
                          Previous
                        </Button>
                        <span className="flex h-9 items-center justify-center text-sm">
                          Page {currentPage} of {totalPages}
                        </span>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => setPage(Math.min(totalPages, currentPage + 1))}
                          disabled={currentPage === totalPages}
                          className="ml-2"
                        >
                          Next
                        </Button>
                      </Pagination>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="completed" className="mt-0">
              {loading ? (
                <div className="py-12 flex flex-col items-center justify-center space-y-3">
                  <div className="h-8 w-8 rounded-full border-4 border-focus-300 border-t-transparent animate-spin"></div>
                  <p className="text-muted-foreground text-sm">Loading tasks...</p>
                </div>
              ) : completedTasks.length === 0 ? (
                <div className="py-12 flex flex-col items-center justify-center">
                  <div className="bg-gray-100 dark:bg-gray-800 rounded-full p-4 mb-3">
                    <Filter size={30} className="text-gray-400" />
                  </div>
                  <p className="text-muted-foreground">No completed tasks yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <AnimatePresence>
                    {completedTasks.map((task, index) => (
                      <motion.div
                        key={task.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.2, delay: index * 0.05 }}
                      >
                        <TaskItem
                          task={task}
                          onToggleComplete={() => toggleComplete(task.id)}
                          onTogglePriority={() => togglePriority(task.id)}
                          onClick={() => setSelectedTask(task)}
                        />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </TabsContent>
          </Tabs>
        ) : (
          <CalendarView onTaskSelect={setSelectedTask} />
        )}
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
      
      <TaskFiltersDialog
        isOpen={isFiltersDialogOpen}
        onClose={() => setIsFiltersDialogOpen(false)}
      />
      
      <TaskSortDialog
        isOpen={isSortDialogOpen}
        onClose={() => setIsSortDialogOpen(false)}
      />
      
      <FreeTimeAnalysis
        isOpen={showFreeTimeAnalysis}
        onClose={() => setShowFreeTimeAnalysis(false)}
      />
      
      <SpeechRecognition 
        isActive={isVoiceInputActive}
        onSpeechResult={handleSpeechResult}
        onCancel={() => setIsVoiceInputActive(false)}
      />
    </MobileLayout>
  );
};

export default TasksPage;

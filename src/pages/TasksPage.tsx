import React, { useState } from 'react';
import MobileLayout from '@/components/layout/MobileLayout';
import { Button } from '@/components/ui/button';
import { Plus, Filter, Star, Calendar, Search, Mic, ArrowUp, ArrowDown, SlidersHorizontal, Repeat as RepeatIcon, ArrowLeft, ArrowRight } from 'lucide-react';
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
import DailyMotivation from '@/components/vision/DailyMotivation';
import { toast } from '@/components/ui/use-toast';

const TasksPage: React.FC = () => {
  const [isAddTaskDialogOpen, setIsAddTaskDialogOpen] = useState(false);
  const [isFiltersDialogOpen, setIsFiltersDialogOpen] = useState(false);
  const [isSortDialogOpen, setIsSortDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showOnlyPriority, setShowOnlyPriority] = useState(false);
  const [showMonthlyTasks, setShowMonthlyTasks] = useState(false);
  // Add the missing state variable for recurring tasks
  const [showRecurringTasks, setShowRecurringTasks] = useState(false);
  const [isVoiceInputActive, setIsVoiceInputActive] = useState(false);
  // Calendar view removed as requested
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
  
  // Recurring tasks filtering now handled in filters dialog

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
      <div className="space-y-3 sm:space-y-6 max-w-full overflow-hidden px-2 sm:px-0">
        <DailyMotivation showOnHomeOnly={true} />
        <div className="flex flex-wrap justify-between items-center gap-2">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-focus-400 to-focus-300 text-transparent bg-clip-text">FocusFlow</h1>
            <p className="text-muted-foreground text-sm">Manage your tasks</p>
          </div>
          
          <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
            <Button 
              variant="outline" 
              size="icon" 
              onClick={() => setShowOnlyPriority(!showOnlyPriority)}
              className={cn(
                "rounded-full transition-all h-8 w-8 sm:h-9 sm:w-9", 
                showOnlyPriority 
                  ? "bg-focus-100 text-focus-400 border-focus-200" 
                  : "hover:border-focus-300 hover:text-focus-400"
              )}
              title="Priority Tasks"
            >
              <Star size={16} className={showOnlyPriority ? "fill-focus-300" : ""} />
            </Button>
            
            <Button 
              variant="outline" 
              size="icon" 
              onClick={() => setShowMonthlyTasks(!showMonthlyTasks)}
              className={cn(
                "rounded-full transition-all h-8 w-8 sm:h-9 sm:w-9", 
                showMonthlyTasks 
                  ? "bg-focus-100 text-focus-400 border-focus-200" 
                  : "hover:border-focus-300 hover:text-focus-400"
              )}
              title="Monthly Tasks"
            >
              <Calendar size={16} className={showMonthlyTasks ? "text-focus-400" : ""} />
            </Button>
            
            <Button 
              onClick={() => setIsAddTaskDialogOpen(true)}
              className="rounded-full bg-focus-400 hover:bg-focus-500 shadow-md text-xs sm:text-sm py-1 px-2 sm:py-2 sm:px-3 h-8 sm:h-9"
            >
              <Plus size={16} className="mr-1" /> <span className="whitespace-nowrap">Add Task</span>
            </Button>
          </div>
        </div>
        
        {/* Search and view toggle */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tasks..."
              className="pl-8 pr-8 h-8 sm:h-9 rounded-full border-focus-200 focus-within:border-focus-400 text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                className="absolute right-2 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground hover:text-gray-600 focus:outline-none flex items-center justify-center"
                onClick={() => setSearchTerm('')}
                aria-label="Clear search"
              >
                <span className="text-lg leading-none">&times;</span>
              </button>
            )}
          </div>
          
          <div className="flex gap-1 sm:gap-2">
            <Button 
              variant="outline" 
              size="icon" 
              onClick={() => setIsVoiceInputActive(true)}
              className="rounded-full h-8 w-8 sm:h-9 sm:w-9"
              title="Voice Input"
            >
              <Mic size={16} className={isVoiceInputActive ? "text-red-500 animate-pulse" : ""} />
            </Button>
            
            <Button 
              variant="outline" 
              size="icon" 
              onClick={() => setIsFiltersDialogOpen(true)}
              className="rounded-full h-8 w-8 sm:h-9 sm:w-9" 
              title="Filters"
            >
              <Filter size={16} />
            </Button>
            
            <Button 
              variant="outline" 
              size="icon" 
              onClick={() => setIsSortDialogOpen(true)}
              className="rounded-full h-8 w-8 sm:h-9 sm:w-9"
              title="Sort"
            >
              <SlidersHorizontal size={16} />
            </Button>
          </div>
        </div>
        
        {/* Free Time Analysis */}
        <div className="flex justify-center px-2">
          <Button 
            variant="outline"
            size="sm"
            onClick={() => setShowFreeTimeAnalysis(true)}
            className="rounded-full transition-all duration-300 transform hover:bg-focus-100 hover:text-focus-400 hover:border-focus-300 h-8 text-xs sm:text-sm w-full max-w-xs"
          >
            <Calendar size={14} className="mr-1.5 flex-shrink-0" />
            <span className="truncate">Free Time Analysis</span>
          </Button>
        </div>
        
        {
          <Tabs defaultValue="active" className="w-full">
            <TabsList className="grid w-full grid-cols-2 rounded-lg bg-muted mb-4 h-auto py-1">
              <TabsTrigger 
                value="active" 
                className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:shadow-sm rounded-md text-xs sm:text-sm py-1.5"
              >
                Active ({incompleteTasks.length})
              </TabsTrigger>
              <TabsTrigger 
                value="completed" 
                className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:shadow-sm rounded-md text-xs sm:text-sm py-1.5"
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
                <div className="py-8 sm:py-12 flex flex-col items-center justify-center space-y-3 sm:space-y-4">
                  <div className="p-2 sm:p-3 rounded-full bg-gray-100 dark:bg-gray-800 inline-flex">
                    {showMonthlyTasks ? (
                      <Calendar size={24} className="text-gray-400" />
                    ) : (typeof showRecurringTasks !== 'undefined' && showRecurringTasks) ? (
                      <RepeatIcon size={24} className="text-gray-400" />
                    ) : searchTerm ? (
                      <Search size={24} className="text-gray-400" />
                    ) : (
                      <Star size={24} className="text-gray-400" />
                    )}
                  </div>
                  <p className="text-muted-foreground text-center text-sm px-2 sm:px-4 max-w-xs">
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
                <div className="space-y-2 sm:space-y-3 overflow-hidden">
                  <AnimatePresence>
                    {paginatedTasks.filter(task => !task.completed).map((task, index) => (
                      <motion.div
                        key={task.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.2, delay: Math.min(index * 0.05, 0.3) }}
                        className="overflow-hidden"
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
                    <div className="flex justify-center mt-3 sm:mt-6">
                      <Pagination className="flex flex-wrap gap-1 sm:gap-2 justify-center items-center">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => setPage(Math.max(1, currentPage - 1))}
                          disabled={currentPage === 1}
                          className="px-1 sm:px-2 h-7 sm:h-8 text-xs sm:text-sm min-w-[40px] sm:min-w-[60px]"
                        >
                          <ArrowLeft size={12} className="sm:mr-1" />
                          <span className="hidden sm:inline">Prev</span>
                        </Button>
                        <span className="flex h-7 sm:h-8 items-center justify-center text-xs sm:text-sm px-1 sm:px-2 bg-gray-50 dark:bg-gray-800 rounded">
                          <span className="hidden xs:inline">Page</span> {currentPage}/{totalPages}
                        </span>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => setPage(Math.min(totalPages, currentPage + 1))}
                          disabled={currentPage === totalPages}
                          className="px-1 sm:px-2 h-7 sm:h-8 text-xs sm:text-sm min-w-[40px] sm:min-w-[60px]"
                        >
                          <span className="hidden sm:inline">Next</span>
                          <ArrowRight size={12} className="sm:ml-1" />
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
        }
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

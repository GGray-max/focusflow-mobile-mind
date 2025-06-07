import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { format } from 'date-fns';
import { Task, useTasks } from '@/contexts/TaskContext';
import { useTimer } from '@/contexts/TimerContext';
import { Calendar, Clock, Trash, Check, Edit, Save, X, RotateCcw, Timer } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from '@/components/ui/use-toast';
import TaskTimeDisplay from '@/components/task/TaskTimeDisplay';
import { formatTime } from '@/services/TimerService';
import TaskLiveTimer from '@/components/task/TaskLiveTimer';

interface TaskDetailDialogProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
}

const TaskDetailDialog: React.FC<TaskDetailDialogProps> = ({ task, isOpen, onClose }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [newSubtask, setNewSubtask] = useState('');
  const [editedTask, setEditedTask] = useState<Task | null>(null);
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
  
  const { toggleComplete, toggleSubtask, addSubtask, deleteTask, updateTask, state, resetTaskTime, addFocusTime } = useTasks();
  const { categories } = state;
  const { startTimer, addEventListener, removeEventListener, switchToFocus, state: timerState } = useTimer();
  
  // Check if this task is currently being timed
  const isTaskActive = task ? (
    timerState.isRunning && 
    timerState.mode === 'focus' && 
    timerState.currentTaskId === task.id
  ) : false;
  const navigate = useNavigate();

  useEffect(() => {
    if (task) {
      setEditedTask({...task});
      setDueDate(task.dueDate ? new Date(task.dueDate) : undefined);
    }
  }, [task]);

  const handleStartFocusSession = () => {
    if (task) {
      // Default to 25 minutes (Pomodoro session) if no duration specified
      const durationSeconds = (task.duration || 25) * 60;
      
      // Always switch to focus mode first
      switchToFocus();
      
      // Start the timer with the task name and ID
      startTimer(durationSeconds, task.title, task.id);
      
      // Set up listener to track time when session ends
      setupTimerListeners(task.id);
      
      onClose();
      navigate('/timer');
    }
  };
  
  // Set up listeners to track time when timer sessions end or are stopped
  const setupTimerListeners = (taskId: string) => {
    const handleTimerFinished = (data: any) => {
      if (data.taskId === taskId) {
        // Add the completed session time to the task
        addFocusTime(taskId, data.duration);
        // Remove the listener once handled
        removeTimerListener();
      }
    };
    
    const handleTimerStopped = (data: any) => {
      if (data.taskId === taskId && data.timeSpent > 0) {
        // Add the partial session time to the task
        addFocusTime(taskId, data.timeSpent);
        // Remove the listener once handled
        removeTimerListener();
      }
    };
    
    // Setup listeners for timer events - using the context instance
    addEventListener('timerFinished', handleTimerFinished);
    addEventListener('timerStopped', handleTimerStopped);
    
    // Function to remove listeners
    const removeTimerListener = () => {
      removeEventListener('timerFinished', handleTimerFinished);
      removeEventListener('timerStopped', handleTimerStopped);
    };
  };
  
  // Handle resetting the accumulated time for a task
  const handleResetTaskTime = () => {
    if (task) {
      resetTaskTime(task.id);
      toast({
        title: "Time reset",
        description: "Time tracking has been reset for this task",
      });
    }
  };

  const handleAddSubtask = () => {
    if (task && newSubtask.trim()) {
      addSubtask(task.id, newSubtask.trim());
      setNewSubtask('');
    }
  };

  const handleDeleteTask = () => {
    if (task) {
      deleteTask(task.id);
      onClose();
      toast({
        title: "Task deleted",
        description: "The task has been successfully deleted",
      });
    }
  };
  
  const handleSaveChanges = () => {
    if (editedTask && dueDate) {
      const updatedTask = {
        ...editedTask,
        dueDate: dueDate.toISOString()
      };
      
      updateTask(updatedTask);
      setIsEditing(false);
      toast({
        title: "Task updated",
        description: "Changes have been successfully saved",
      });
    } else if (editedTask) {
      updateTask(editedTask);
      setIsEditing(false);
      toast({
        title: "Task updated",
        description: "Changes have been successfully saved",
      });
    }
  };
  
  const handleCancel = () => {
    if (task) {
      setEditedTask({...task});
      setDueDate(task.dueDate ? new Date(task.dueDate) : undefined);
    }
    setIsEditing(false);
  };

  if (!task || !editedTask) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] md:max-w-[600px] max-h-[80vh] overflow-y-auto bg-white dark:bg-gray-800 rounded-xl shadow-xl p-0 flex flex-col">
        <DialogTitle>Task Details - {task.title}</DialogTitle>
        <DialogHeader className="sticky top-0 z-10 bg-background pt-4 pb-2">
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Checkbox 
                checked={task.completed} 
                onCheckedChange={() => toggleComplete(task.id)}
                disabled={isEditing}
              />
              {!isEditing ? (
                <span className={task.completed ? 'line-through opacity-70' : ''}>
                  {task.title}
                </span>
              ) : (
                <Input 
                  value={editedTask.title}
                  onChange={(e) => setEditedTask({...editedTask, title: e.target.value})}
                  className="border-focus-200 focus:border-focus-400"
                />
              )}
            </div>
            
            {!isEditing ? (
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => setIsEditing(true)}
                title="Edit Task"
              >
                <Edit size={18} />
              </Button>
            ) : (
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleCancel}
                  title="Cancel"
                >
                  <X size={18} className="text-red-500" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleSaveChanges}
                  title="Save Changes"
                >
                  <Save size={18} className="text-green-500" />
                </Button>
              </div>
            )}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 my-2 pb-4">
          <AnimatePresence mode="wait">
            {isEditing ? (
              <motion.div 
                className="space-y-4"
                key="edit-form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={editedTask.description || ''}
                    onChange={(e) => setEditedTask({...editedTask, description: e.target.value})}
                    placeholder="Add description..."
                    className="border-focus-200 focus:border-focus-400"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select
                    value={editedTask.category || 'Personal'}
                    onValueChange={(value) => setEditedTask({...editedTask, category: value})}
                  >
                    <SelectTrigger className="border-focus-200 focus:border-focus-400">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Due Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal border-focus-200",
                            !dueDate && "text-muted-foreground"
                          )}
                        >
                          <Calendar className="mr-2 h-4 w-4" />
                          {dueDate ? format(dueDate, "PPP") : "No date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          mode="single"
                          selected={dueDate}
                          onSelect={setDueDate}
                          initialFocus
                          className="pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Due Time</Label>
                    <div className="flex space-x-2 items-center">
                      <Input 
                        type="time"
                        value={editedTask.dueTime || ''}
                        onChange={(e) => setEditedTask({...editedTask, dueTime: e.target.value})}
                        className="border-focus-200 focus:border-focus-400"
                      />
                      <Clock className="h-4 w-4 text-gray-400" />
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Start Time</Label>
                    <Input 
                      type="time"
                      value={editedTask.startTime || ''}
                      onChange={(e) => setEditedTask({...editedTask, startTime: e.target.value})}
                      className="border-focus-200 focus:border-focus-400"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>End Time</Label>
                    <Input 
                      type="time"
                      value={editedTask.endTime || ''}
                      onChange={(e) => setEditedTask({...editedTask, endTime: e.target.value})}
                      className="border-focus-200 focus:border-focus-400"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <RadioGroup 
                    value={editedTask.priority} 
                    onValueChange={(value) => 
                      setEditedTask({...editedTask, priority: value as 'low' | 'medium' | 'high'})
                    }
                    className="flex"
                  >
                    <div className="flex items-center space-x-2 flex-1 justify-center">
                      <RadioGroupItem value="low" id="edit-low" />
                      <Label htmlFor="edit-low" className="cursor-pointer">Low</Label>
                    </div>
                    <div className="flex items-center space-x-2 flex-1 justify-center">
                      <RadioGroupItem value="medium" id="edit-medium" />
                      <Label htmlFor="edit-medium" className="cursor-pointer">Medium</Label>
                    </div>
                    <div className="flex items-center space-x-2 flex-1 justify-center">
                      <RadioGroupItem value="high" id="edit-high" />
                      <Label htmlFor="edit-high" className="cursor-pointer">High</Label>
                    </div>
                  </RadioGroup>
                </div>
                
                <div className="space-y-2">
                  <Label>Recurrence</Label>
                  <Select
                    value={editedTask.recurrence || 'none'}
                    onValueChange={(value) => 
                      setEditedTask({
                        ...editedTask, 
                        recurrence: value as 'none' | 'daily' | 'weekly' | 'monthly'
                      })
                    }
                  >
                    <SelectTrigger className="border-focus-200 focus:border-focus-400">
                      <SelectValue placeholder="Set recurrence" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Does not repeat</SelectItem>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                className="space-y-4"
                key="view-task"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                {task.description && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Description</h4>
                    <p className="text-sm">{task.description}</p>
                  </div>
                )}
                
                <div className="flex flex-wrap gap-2">
                  {task.dueDate && (
                    <div className="bg-focus-100 text-focus-600 px-2 py-1 rounded-md text-xs flex items-center">
                      <Calendar size={12} className="mr-1" />
                      Due: {format(new Date(task.dueDate), "MMM d")}
                      {task.dueTime && ` at ${task.dueTime}`}
                    </div>
                  )}
                  
                  {task.category && (
                    <div className="bg-gray-100 text-gray-600 px-2 py-1 rounded-md text-xs">
                      Category: {task.category}
                    </div>
                  )}
                  
                  <div className={`px-2 py-1 rounded-md text-xs ${
                    task.priority === 'high' 
                      ? 'bg-red-100 text-red-700' 
                      : task.priority === 'medium'
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-blue-100 text-blue-700'
                  }`}>
                    {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)} Priority
                  </div>
                  
                  {task.recurrence && task.recurrence !== 'none' && (
                    <div className="bg-purple-100 text-purple-700 px-2 py-1 rounded-md text-xs">
                      Repeats: {task.recurrence}
                    </div>
                  )}
                </div>
                
                {(task.startTime || task.endTime) && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Scheduled Time</h4>
                    <div className="bg-focus-50 text-focus-600 px-3 py-2 rounded-md text-sm flex items-center">
                      <Clock size={14} className="mr-2" />
                      {task.startTime && task.endTime ? (
                        <span>{task.startTime} - {task.endTime}</span>
                      ) : task.startTime ? (
                        <span>Starts at {task.startTime}</span>
                      ) : (
                        <span>Ends at {task.endTime}</span>
                      )}
                      {task.duration && <span className="ml-2">({task.duration} min)</span>}
                    </div>
                  </div>
                )}
                
                {/* Time tracking section */}
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Time Tracking</h4>
                  
                  {task.totalTimeSpent && task.totalTimeSpent > 0 ? (
                    <div className="bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300 px-3 py-2 rounded-md text-sm">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Timer size={14} className="mr-2" />
                          <TaskTimeDisplay task={task} />
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={handleResetTaskTime}
                          className="h-6 w-6 p-0"
                          title="Reset time tracking"
                        >
                          <RotateCcw size={12} />
                        </Button>
                      </div>
                      
                      {/* Show focus session history if available */}
                      {task.focusSessions && task.focusSessions.length > 0 && (
                        <div className="mt-2 text-xs text-violet-600 dark:text-violet-400 ml-6">
                          <div>Recent sessions:</div>
                          <ul className="list-disc pl-4 mt-1 space-y-1">
                            {task.focusSessions.slice(-3).reverse().map((session, idx) => (
                              <li key={idx}>
                                {formatTime(session.duration)} on {format(new Date(session.date), 'MMM d, h:mm a')}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="bg-gray-100 dark:bg-gray-800 px-3 py-2 rounded-md text-sm text-gray-500">
                      <div className="flex items-center">
                        <Timer size={14} className="mr-2" />
                        <span>No time tracked yet</span>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          <div>
            <h4 className="text-sm font-medium text-gray-500 mb-2">Subtasks</h4>
            
            {task.subtasks.length === 0 ? (
              <p className="text-sm text-gray-400">No subtasks yet</p>
            ) : (
              <div className="space-y-2">
                {task.subtasks.map((subtask) => (
                  <motion.div 
                    key={subtask.id} 
                    className="flex items-center gap-3"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Checkbox 
                      checked={subtask.completed}
                      onCheckedChange={() => toggleSubtask(task.id, subtask.id)}
                      id={subtask.id}
                      disabled={isEditing}
                    />
                    <label 
                      htmlFor={subtask.id}
                      className={`text-sm flex-1 cursor-pointer ${subtask.completed ? 'line-through opacity-70' : ''}`}
                    >
                      {subtask.title}
                    </label>
                  </motion.div>
                ))}
              </div>
            )}
            
            <div className="flex items-center space-x-2 mt-3">
              <Input
                value={newSubtask}
                onChange={(e) => setNewSubtask(e.target.value)}
                placeholder="Add a subtask"
                className="flex-1 border-focus-200 focus:border-focus-400"
                disabled={isEditing}
              />
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleAddSubtask}
                size="sm"
                disabled={isEditing}
              >
                Add
              </Button>
            </div>
          </div>
        </div>
        
        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          {!isEditing && (
            <>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDeleteTask}
                className="w-full sm:w-auto"
              >
                <Trash size={16} className="mr-1" /> Delete
              </Button>
              {isTaskActive ? (
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <TaskLiveTimer taskId={task.id} />
                </div>
              ) : (
                <Button
                  onClick={handleStartFocusSession}
                  className="w-full sm:w-auto bg-focus-400 hover:bg-focus-500"
                >
                  <Clock size={16} className="mr-1" /> Start Focus Session {task.duration ? `(${task.duration} min)` : ''}
                </Button>
              )}
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TaskDetailDialog;

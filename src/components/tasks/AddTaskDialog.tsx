import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { CalendarIcon, Clock, BellRing, RepeatIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useTasks, Task } from '@/contexts/TaskContext';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import NotificationService from '@/services/NotificationService';
import { toast } from '@/components/ui/use-toast';
import { motion } from 'framer-motion';
import { ScrollArea } from '@/components/ui/scroll-area';

interface AddTaskDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const AddTaskDialog: React.FC<AddTaskDialogProps> = ({ isOpen, onClose }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
  const [dueTime, setDueTime] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [subtasks, setSubtasks] = useState<string[]>([]);
  const [newSubtask, setNewSubtask] = useState('');
  const [enableNotification, setEnableNotification] = useState(false);
  const [hasNotificationPermission, setHasNotificationPermission] = useState(false);
  const [recurrence, setRecurrence] = useState<'none' | 'daily' | 'weekly' | 'monthly'>('none');
  const [isMonthlyTask, setIsMonthlyTask] = useState(false);
  const [category, setCategory] = useState<string>('Personal');
  const [newCategory, setNewCategory] = useState('');
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [duration, setDuration] = useState<number | undefined>(30);
  
  const { addTask, state, addCategory } = useTasks();
  const { categories } = state;

  useEffect(() => {
    // Check notification permission on load
    const checkPermission = async () => {
      const hasPermission = await NotificationService.requestPermissions();
      setHasNotificationPermission(hasPermission);
    };
    
    checkPermission();
    
    // Check for voice input from speech recognition
    const voiceTaskTitle = localStorage.getItem('voiceTaskTitle');
    if (voiceTaskTitle && isOpen) {
      setTitle(voiceTaskTitle);
      localStorage.removeItem('voiceTaskTitle');
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) return;
    
    const hasValidNotification = enableNotification && dueDate && dueTime;
    let notifyAt: string | undefined = undefined;
    
    if (hasValidNotification) {
      const notificationDate = new Date(dueDate!);
      const [hours, minutes] = dueTime.split(':').map(Number);
      notificationDate.setHours(hours, minutes);
      notifyAt = notificationDate.toISOString();
    }
    
    const taskId = Date.now().toString();
    
    // Calculate duration if start and end times are provided
    let calculatedDuration = duration;
    if (startTime && endTime) {
      const start = startTime.split(':').map(Number);
      const end = endTime.split(':').map(Number);
      
      const startMinutes = start[0] * 60 + start[1];
      const endMinutes = end[0] * 60 + end[1];
      
      if (endMinutes > startMinutes) {
        calculatedDuration = endMinutes - startMinutes;
      }
    }
    
    const newTask: Omit<Task, 'id' | 'createdAt'> = {
      title: title.trim(),
      description: description.trim(),
      completed: false,
      dueDate: dueDate ? dueDate.toISOString() : undefined,
      dueTime: dueTime || undefined,
      startTime: startTime || undefined,
      endTime: endTime || undefined,
      duration: calculatedDuration,
      notifyAt,
      hasNotification: !!hasValidNotification,
      priority,
      category,
      tags: [],
      subtasks: subtasks.map((text, index) => ({
        id: `new-subtask-${index}`,
        title: text,
        completed: false,
        createdAt: new Date().toISOString(),
      })),
      isPriority: false,
      recurrence: recurrence,
      isMonthlyTask: isMonthlyTask,
      isActive: recurrence !== 'none' ? true : undefined,
      completedAt: undefined,
      updatedAt: new Date().toISOString(),
      totalTimeSpent: 0,
      focusSessions: [],
    };
    
    addTask(newTask);

    // Schedule notification if enabled
    if (hasValidNotification && notifyAt) {
      const notificationTime = new Date(notifyAt);
      
      if (!hasNotificationPermission) {
        const granted = await NotificationService.requestPermissions();
        setHasNotificationPermission(granted);
        
        if (!granted) {
          toast({
            title: "Notification permission required",
            description: "Please enable notifications to receive task reminders",
            variant: "destructive"
          });
        }
      }
      
      if (hasNotificationPermission) {
        NotificationService.scheduleTaskNotification(
          taskId,
          `Task Due: ${title}`,
          description || 'Time to complete your task!',
          notificationTime
        );
      }
    }
    
    handleClose();
  };

  const handleAddSubtask = () => {
    if (newSubtask.trim()) {
      setSubtasks([...subtasks, newSubtask.trim()]);
      setNewSubtask('');
    }
  };

  const removeSubtask = (index: number) => {
    const newSubtasks = [...subtasks];
    newSubtasks.splice(index, 1);
    setSubtasks(newSubtasks);
  };

  const handleAddNewCategory = () => {
    if (newCategory.trim()) {
      addCategory(newCategory.trim());
      setCategory(newCategory.trim());
      setNewCategory('');
      setIsAddingCategory(false);
    }
  };

  const handleSelectDuration = (mins: number) => {
    setDuration(mins);
    if (startTime) {
      // Calculate end time based on start time and duration
      const [hours, minutes] = startTime.split(':').map(Number);
      const totalMinutes = hours * 60 + minutes + mins;
      const newHours = Math.floor(totalMinutes / 60) % 24;
      const newMinutes = totalMinutes % 60;
      
      setEndTime(`${newHours.toString().padStart(2, '0')}:${newMinutes.toString().padStart(2, '0')}`);
    }
  };

  const handleClose = () => {
    setTitle('');
    setDescription('');
    setDueDate(undefined);
    setDueTime('');
    setPriority('medium');
    setSubtasks([]);
    setNewSubtask('');
    setEnableNotification(false);
    setRecurrence('none');
    setIsMonthlyTask(false);
    setCategory('Personal');
    setNewCategory('');
    setIsAddingCategory(false);
    setStartTime('');
    setEndTime('');
    setDuration(30);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px] md:max-w-[550px] h-[90vh] flex flex-col overflow-hidden bg-background border-border">
        <DialogHeader className="shrink-0 px-6 pt-6">
          <DialogTitle className="text-foreground">Add New Task</DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden px-6">
          <div className="h-full overflow-y-auto pr-2" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            <style jsx>{`
              .h-full::-webkit-scrollbar {
                display: none;
              }
            `}</style>
            <form onSubmit={handleSubmit} className="space-y-4 pt-4 pb-4">
              <motion.div 
                className="space-y-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Label htmlFor="title" className="text-foreground">Task Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter task title"
                  required
                  className="bg-background border-border text-foreground"
                />
              </motion.div>
              
              <motion.div 
                className="space-y-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: 0.05 }}
              >
                <Label htmlFor="description" className="text-foreground">Description (Optional)</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter task details"
                  rows={3}
                  className="bg-background border-border text-foreground"
                />
              </motion.div>
              
              <motion.div 
                className="space-y-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: 0.1 }}
              >
                <Label htmlFor="category" className="text-foreground">Category</Label>
                {!isAddingCategory ? (
                  <div className="flex space-x-2">
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger className="w-full bg-background border-border text-foreground">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent className="bg-background border-border">
                        {categories.map((cat) => (
                          <SelectItem key={cat} value={cat} className="text-foreground">
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsAddingCategory(true)}
                      className="border-border text-foreground"
                    >
                      New
                    </Button>
                  </div>
                ) : (
                  <div className="flex space-x-2">
                    <Input
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      placeholder="New category name"
                      className="flex-1 bg-background border-border text-foreground"
                    />
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={handleAddNewCategory}
                      className="border-border text-foreground"
                    >
                      Add
                    </Button>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      onClick={() => setIsAddingCategory(false)}
                      className="text-foreground"
                    >
                      Cancel
                    </Button>
                  </div>
                )}
              </motion.div>
              
              <motion.div 
                className="flex items-center space-x-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: 0.15 }}
              >
                <Switch
                  id="monthlyTask"
                  checked={isMonthlyTask}
                  onCheckedChange={setIsMonthlyTask}
                />
                <Label htmlFor="monthlyTask" className="text-foreground">This is a monthly task</Label>
              </motion.div>
              
              <motion.div 
                className="space-y-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: 0.2 }}
              >
                <Label htmlFor="recurrence" className="text-foreground">Repeat Task</Label>
                <Select 
                  value={recurrence} 
                  onValueChange={(value) => setRecurrence(value as 'none' | 'daily' | 'weekly' | 'monthly')}
                >
                  <SelectTrigger className="w-full bg-background border-border text-foreground" id="recurrence">
                    <SelectValue placeholder="Select recurrence" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border-border">
                    <SelectItem value="none" className="text-foreground">Does not repeat</SelectItem>
                    <SelectItem value="daily" className="text-foreground">Daily</SelectItem>
                    <SelectItem value="weekly" className="text-foreground">Weekly</SelectItem>
                    <SelectItem value="monthly" className="text-foreground">Monthly</SelectItem>
                  </SelectContent>
                </Select>
                {recurrence !== 'none' && (
                  <div className="flex items-center mt-2 px-3 py-2 rounded-md bg-accent">
                    <RepeatIcon className="h-4 w-4 mr-2 text-primary" />
                    <span className="text-sm text-foreground">
                      This task will automatically repeat {recurrence}
                    </span>
                  </div>
                )}
              </motion.div>
              
              <motion.div 
                className="space-y-4"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: 0.25 }}
              >
                <div className="space-y-2">
                  <Label className="text-foreground">Due Date (Optional)</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal bg-background border-border",
                          !dueDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dueDate ? format(dueDate, "PPP") : "Select a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-background border-border" align="start">
                      <Calendar
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
                  <Label htmlFor="dueTime" className="text-foreground">Due Time (Optional)</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      id="dueTime"
                      type="time"
                      value={dueTime}
                      onChange={(e) => setDueTime(e.target.value)}
                      className="flex-1 bg-background border-border text-foreground"
                    />
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startTime" className="text-foreground">Start Time (Optional)</Label>
                    <Input
                      id="startTime"
                      type="time"
                      value={startTime}
                      onChange={(e) => {
                        setStartTime(e.target.value);
                        if (duration && e.target.value) {
                          // Update end time based on duration
                          const [hours, minutes] = e.target.value.split(':').map(Number);
                          const totalMinutes = hours * 60 + minutes + (duration || 0);
                          const newHours = Math.floor(totalMinutes / 60) % 24;
                          const newMinutes = totalMinutes % 60;
                          
                          setEndTime(`${newHours.toString().padStart(2, '0')}:${newMinutes.toString().padStart(2, '0')}`);
                        }
                      }}
                      className="bg-background border-border text-foreground"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="endTime" className="text-foreground">End Time (Optional)</Label>
                    <Input
                      id="endTime"
                      type="time"
                      value={endTime}
                      onChange={(e) => {
                        setEndTime(e.target.value);
                        if (startTime && e.target.value) {
                          // Update duration based on start and end times
                          const start = startTime.split(':').map(Number);
                          const end = e.target.value.split(':').map(Number);
                          
                          const startMinutes = start[0] * 60 + start[1];
                          const endMinutes = end[0] * 60 + end[1];
                          
                          if (endMinutes > startMinutes) {
                            setDuration(endMinutes - startMinutes);
                          }
                        }
                      }}
                      className="bg-background border-border text-foreground"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-foreground">Duration</Label>
                  <div className="grid grid-cols-4 gap-2">
                    <Button 
                      type="button" 
                      variant={duration === 30 ? "default" : "outline"}
                      onClick={() => handleSelectDuration(30)}
                      className="w-full"
                    >
                      30 min
                    </Button>
                    <Button 
                      type="button"
                      variant={duration === 60 ? "default" : "outline"}
                      onClick={() => handleSelectDuration(60)}
                      className="w-full"
                    >
                      60 min
                    </Button>
                    <Button 
                      type="button"
                      variant={duration === 90 ? "default" : "outline"}
                      onClick={() => handleSelectDuration(90)}
                      className="w-full"
                    >
                      90 min
                    </Button>
                    <Button 
                      type="button"
                      variant={duration !== 30 && duration !== 60 && duration !== 90 ? "default" : "outline"}
                      onClick={() => {
                        const customDuration = prompt("Enter custom duration in minutes:", duration?.toString() || "30");
                        if (customDuration) {
                          const mins = parseInt(customDuration);
                          if (!isNaN(mins) && mins > 0) {
                            handleSelectDuration(mins);
                          }
                        }
                      }}
                      className="w-full"
                    >
                      Custom
                    </Button>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 pt-2">
                  <Switch
                    id="enableNotification"
                    checked={enableNotification}
                    onCheckedChange={async (checked) => {
                      setEnableNotification(checked);
                      
                      if (checked && !hasNotificationPermission) {
                        const granted = await NotificationService.requestPermissions();
                        setHasNotificationPermission(granted);
                        
                        if (!granted) {
                          toast({
                            title: "Notification permission required",
                            description: "Please enable notifications in your browser/device settings",
                            variant: "destructive"
                          });
                        }
                      }
                    }}
                  />
                  <Label htmlFor="enableNotification" className="cursor-pointer">
                    <div className="flex items-center">
                      <BellRing className="h-4 w-4 mr-2 text-primary" />
                      <span className="text-foreground">Notify me at this time</span>
                    </div>
                  </Label>
                </div>
                
                {enableNotification && (!dueDate || !dueTime) && (
                  <p className="text-xs text-destructive">
                    Please set both date and time to enable notifications
                  </p>
                )}
              </motion.div>
              
              <motion.div 
                className="space-y-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: 0.3 }}
              >
                <Label className="text-foreground">Priority</Label>
                <RadioGroup 
                  defaultValue="medium" 
                  value={priority}
                  onValueChange={(value) => setPriority(value as 'low' | 'medium' | 'high')}
                  className="flex"
                >
                  <div className="flex items-center space-x-2 flex-1 justify-center">
                    <RadioGroupItem value="low" id="low" />
                    <Label htmlFor="low" className="cursor-pointer text-foreground">Low</Label>
                  </div>
                  <div className="flex items-center space-x-2 flex-1 justify-center">
                    <RadioGroupItem value="medium" id="medium" />
                    <Label htmlFor="medium" className="cursor-pointer text-foreground">Medium</Label>
                  </div>
                  <div className="flex items-center space-x-2 flex-1 justify-center">
                    <RadioGroupItem value="high" id="high" />
                    <Label htmlFor="high" className="cursor-pointer text-foreground">High</Label>
                  </div>
                </RadioGroup>
              </motion.div>
              
              <motion.div 
                className="space-y-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: 0.35 }}
              >
                <Label htmlFor="subtasks" className="text-foreground">Add Subtasks</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    id="subtasks"
                    value={newSubtask}
                    onChange={(e) => setNewSubtask(e.target.value)}
                    placeholder="Enter subtask"
                    className="flex-1 bg-background border-border text-foreground"
                  />
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={handleAddSubtask}
                    className="border-border text-foreground"
                  >
                    Add
                  </Button>
                </div>
                
                {subtasks.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {subtasks.map((task, index) => (
                      <motion.div 
                        key={index} 
                        className="flex justify-between items-center bg-accent p-2 rounded-md"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <span className="text-sm text-foreground">{task}</span>
                        <Button 
                          type="button"
                          variant="ghost" 
                          size="sm" 
                          onClick={() => removeSubtask(index)}
                          className="text-foreground"
                        >
                          Remove
                        </Button>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            </form>
          </div>
        </div>
        
        <DialogFooter className="shrink-0 px-6 py-4 border-t border-border bg-background">
          <Button 
            type="button" 
            variant="outline" 
            onClick={handleClose} 
            className="border-border text-foreground hover:bg-accent"
          >
            Cancel
          </Button>
          <Button 
            type="button" 
            onClick={handleSubmit} 
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            Add Task
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddTaskDialog;

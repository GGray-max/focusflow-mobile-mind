
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { CalendarIcon, Clock, BellRing } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useTasks, Task } from '@/contexts/TaskContext';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import NotificationService from '@/services/NotificationService';
import { toast } from '@/components/ui/use-toast';

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

  const { addTask } = useTasks();

  useEffect(() => {
    // Check notification permission on load
    const checkPermission = async () => {
      const hasPermission = await NotificationService.requestPermissions();
      setHasNotificationPermission(hasPermission);
    };
    
    checkPermission();
  }, []);

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
    
    const newTask: Omit<Task, 'id' | 'createdAt'> = {
      title: title.trim(),
      description: description.trim(),
      completed: false,
      dueDate: dueDate ? dueDate.toISOString() : undefined,
      dueTime: dueTime || undefined,
      notifyAt,
      hasNotification: !!hasValidNotification,
      priority,
      tags: [],
      subtasks: subtasks.map((text, index) => ({
        id: `new-subtask-${index}`,
        title: text,
        completed: false,
      })),
      isPriority: false,
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
        const scheduled = await NotificationService.scheduleTaskNotification(
          taskId,
          `Task Due: ${title}`,
          description || 'Time to complete your task!',
          notificationTime
        );
        
        if (scheduled) {
          toast({
            title: "Task reminder set",
            description: `You will be notified at ${format(notificationTime, 'PPpp')}`,
          });
        }
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

  const handleClose = () => {
    setTitle('');
    setDescription('');
    setDueDate(undefined);
    setDueTime('');
    setPriority('medium');
    setSubtasks([]);
    setNewSubtask('');
    setEnableNotification(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Task</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label htmlFor="title">Task Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter task title"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter task details"
              rows={3}
            />
          </div>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Due Date (Optional)</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dueDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dueDate ? format(dueDate, "PPP") : "Select a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dueDate}
                    onSelect={setDueDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="dueTime">Due Time (Optional)</Label>
              <div className="flex items-center space-x-2">
                <Input
                  id="dueTime"
                  type="time"
                  value={dueTime}
                  onChange={(e) => setDueTime(e.target.value)}
                  className="flex-1"
                />
                <Clock className="h-4 w-4 text-gray-400" />
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
                  <BellRing className="h-4 w-4 mr-2 text-focus-400" />
                  Notify me at this time
                </div>
              </Label>
            </div>
            
            {enableNotification && (!dueDate || !dueTime) && (
              <p className="text-xs text-amber-500">
                Please set both date and time to enable notifications
              </p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label>Priority</Label>
            <RadioGroup 
              defaultValue="medium" 
              value={priority}
              onValueChange={(value) => setPriority(value as 'low' | 'medium' | 'high')}
              className="flex"
            >
              <div className="flex items-center space-x-2 flex-1 justify-center">
                <RadioGroupItem value="low" id="low" />
                <Label htmlFor="low" className="cursor-pointer">Low</Label>
              </div>
              <div className="flex items-center space-x-2 flex-1 justify-center">
                <RadioGroupItem value="medium" id="medium" />
                <Label htmlFor="medium" className="cursor-pointer">Medium</Label>
              </div>
              <div className="flex items-center space-x-2 flex-1 justify-center">
                <RadioGroupItem value="high" id="high" />
                <Label htmlFor="high" className="cursor-pointer">High</Label>
              </div>
            </RadioGroup>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="subtasks">Add Subtasks</Label>
            <div className="flex items-center space-x-2">
              <Input
                id="subtasks"
                value={newSubtask}
                onChange={(e) => setNewSubtask(e.target.value)}
                placeholder="Enter subtask"
                className="flex-1"
              />
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleAddSubtask}
              >
                Add
              </Button>
            </div>
            
            {subtasks.length > 0 && (
              <div className="mt-3 space-y-2">
                {subtasks.map((task, index) => (
                  <div key={index} className="flex justify-between items-center bg-gray-50 dark:bg-gray-800 p-2 rounded-md">
                    <span className="text-sm">{task}</span>
                    <Button 
                      type="button"
                      variant="ghost" 
                      size="sm" 
                      onClick={() => removeSubtask(index)}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit">Add Task</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddTaskDialog;

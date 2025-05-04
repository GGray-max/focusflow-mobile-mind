
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTasks } from '@/contexts/TaskContext';
import { useProcrastination } from '@/contexts/ProcrastinationContext';
import { toast } from '@/components/ui/use-toast';
import { AlertTriangle } from 'lucide-react';

const ProcrastinationForm: React.FC = () => {
  const [reason, setReason] = useState('');
  const [mood, setMood] = useState<'frustrated' | 'bored' | 'anxious' | 'tired' | 'distracted'>('bored');
  const [selectedTaskId, setSelectedTaskId] = useState<string>('');
  
  const { state: { tasks } } = useTasks();
  const { addEntry } = useProcrastination();
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!reason.trim()) {
      toast({
        title: 'Missing information',
        description: 'Please describe why you feel like procrastinating',
        variant: 'destructive',
      });
      return;
    }
    
    const taskName = selectedTaskId && selectedTaskId !== 'none'
      ? tasks.find(task => task.id === selectedTaskId)?.title 
      : undefined;
    
    addEntry({
      reason: reason.trim(),
      mood,
      taskId: selectedTaskId !== 'none' ? selectedTaskId : undefined,
      taskName,
    });
    
    toast({
      title: 'Procrastination feeling logged',
      description: 'You acknowledged your urge to procrastinate. That\'s a great first step!',
    });
    
    // Reset form
    setReason('');
    setMood('bored');
    setSelectedTaskId('');
  };
  
  const incompleteTasks = tasks.filter(task => !task.completed);
  
  const moodOptions = [
    { value: 'frustrated', label: 'Frustrated', bgColor: 'bg-red-100 dark:bg-red-900/20', iconColor: 'text-red-500' },
    { value: 'bored', label: 'Bored', bgColor: 'bg-yellow-100 dark:bg-yellow-900/20', iconColor: 'text-yellow-500' },
    { value: 'anxious', label: 'Anxious', bgColor: 'bg-purple-100 dark:bg-purple-900/20', iconColor: 'text-purple-500' },
    { value: 'tired', label: 'Tired', bgColor: 'bg-blue-100 dark:bg-blue-900/20', iconColor: 'text-blue-500' },
    { value: 'distracted', label: 'Distracted', bgColor: 'bg-green-100 dark:bg-green-900/20', iconColor: 'text-green-500' },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md">
      <div className="space-y-2">
        <Label htmlFor="task" className="text-sm font-medium">Related to Task (Optional)</Label>
        <Select value={selectedTaskId} onValueChange={setSelectedTaskId}>
          <SelectTrigger className="w-full bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700">
            <SelectValue placeholder="Select a task" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">None</SelectItem>
            {incompleteTasks.map((task) => (
              <SelectItem key={task.id} value={task.id}>
                {task.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="reason" className="text-sm font-medium">Why do you feel like procrastinating?</Label>
        <Textarea
          id="reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="I feel like procrastinating because..."
          rows={3}
          className="resize-none bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 focus:ring-focus-400 focus:border-focus-400"
        />
      </div>
      
      <div className="space-y-3">
        <Label className="text-sm font-medium">How do you feel right now?</Label>
        <RadioGroup 
          value={mood} 
          onValueChange={(value) => setMood(value as any)} 
          className="grid grid-cols-2 gap-3 sm:flex sm:flex-wrap sm:gap-2"
        >
          {moodOptions.map(option => (
            <div 
              key={option.value}
              className={`flex items-center space-x-2 ${option.bgColor} px-4 py-3 rounded-lg transition-transform hover:scale-105`}
            >
              <RadioGroupItem value={option.value} id={option.value} className="text-focus-400" />
              <Label 
                htmlFor={option.value} 
                className="cursor-pointer font-medium flex items-center"
              >
                <AlertTriangle className={`h-3.5 w-3.5 mr-1.5 ${option.iconColor}`} />
                {option.label}
              </Label>
            </div>
          ))}
        </RadioGroup>
      </div>
      
      <Button 
        type="submit" 
        className="w-full py-6 text-base font-medium bg-focus-400 hover:bg-focus-500 transition-all shadow-md hover:shadow-lg"
      >
        Log Procrastination Feeling
      </Button>
    </form>
  );
};

export default ProcrastinationForm;

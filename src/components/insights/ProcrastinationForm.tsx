
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTasks } from '@/contexts/TaskContext';
import { useProcrastination } from '@/contexts/ProcrastinationContext';
import { toast } from '@/components/ui/use-toast';

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
    
    const taskName = selectedTaskId 
      ? tasks.find(task => task.id === selectedTaskId)?.title 
      : undefined;
    
    addEntry({
      reason: reason.trim(),
      mood,
      taskId: selectedTaskId || undefined,
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
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="task">Related to Task (Optional)</Label>
        <Select value={selectedTaskId} onValueChange={setSelectedTaskId}>
          <SelectTrigger>
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
        <Label htmlFor="reason">Why do you feel like procrastinating?</Label>
        <Textarea
          id="reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="I feel like procrastinating because..."
          rows={3}
        />
      </div>
      
      <div className="space-y-2">
        <Label>How do you feel right now?</Label>
        <RadioGroup value={mood} onValueChange={(value) => setMood(value as any)} className="flex flex-wrap gap-2">
          <div className="flex items-center space-x-2 bg-red-100 px-3 py-2 rounded-md">
            <RadioGroupItem value="frustrated" id="frustrated" />
            <Label htmlFor="frustrated" className="cursor-pointer">Frustrated</Label>
          </div>
          <div className="flex items-center space-x-2 bg-yellow-100 px-3 py-2 rounded-md">
            <RadioGroupItem value="bored" id="bored" />
            <Label htmlFor="bored" className="cursor-pointer">Bored</Label>
          </div>
          <div className="flex items-center space-x-2 bg-purple-100 px-3 py-2 rounded-md">
            <RadioGroupItem value="anxious" id="anxious" />
            <Label htmlFor="anxious" className="cursor-pointer">Anxious</Label>
          </div>
          <div className="flex items-center space-x-2 bg-blue-100 px-3 py-2 rounded-md">
            <RadioGroupItem value="tired" id="tired" />
            <Label htmlFor="tired" className="cursor-pointer">Tired</Label>
          </div>
          <div className="flex items-center space-x-2 bg-green-100 px-3 py-2 rounded-md">
            <RadioGroupItem value="distracted" id="distracted" />
            <Label htmlFor="distracted" className="cursor-pointer">Distracted</Label>
          </div>
        </RadioGroup>
      </div>
      
      <Button type="submit" className="w-full">Log Procrastination Feeling</Button>
    </form>
  );
};

export default ProcrastinationForm;


import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { format } from 'date-fns';
import { Task, useTasks } from '@/contexts/TaskContext';
import { useTimer } from '@/contexts/TimerContext';
import { Clock, Trash } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface TaskDetailDialogProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
}

const TaskDetailDialog: React.FC<TaskDetailDialogProps> = ({ task, isOpen, onClose }) => {
  const [newSubtask, setNewSubtask] = useState('');
  const { toggleComplete, toggleSubtask, addSubtask, deleteTask } = useTasks();
  const { startTimer } = useTimer();
  const navigate = useNavigate();

  const handleStartFocusSession = () => {
    if (task) {
      startTimer(task.title);
      onClose();
      navigate('/timer');
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
    }
  };

  if (!task) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Checkbox 
                checked={task.completed} 
                onCheckedChange={() => toggleComplete(task.id)}
              />
              <span className={task.completed ? 'line-through opacity-70' : ''}>
                {task.title}
              </span>
            </div>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 my-2">
          {task.description && (
            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-1">Description</h4>
              <p className="text-sm">{task.description}</p>
            </div>
          )}
          
          <div className="flex flex-wrap gap-2">
            {task.dueDate && (
              <div className="bg-focus-100 text-focus-600 px-2 py-1 rounded-md text-xs">
                Due: {format(new Date(task.dueDate), "MMM d")}
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
          </div>
          
          <div>
            <h4 className="text-sm font-medium text-gray-500 mb-2">Subtasks</h4>
            
            {task.subtasks.length === 0 ? (
              <p className="text-sm text-gray-400">No subtasks yet</p>
            ) : (
              <div className="space-y-2">
                {task.subtasks.map((subtask) => (
                  <div key={subtask.id} className="flex items-center gap-3">
                    <Checkbox 
                      checked={subtask.completed}
                      onCheckedChange={() => toggleSubtask(task.id, subtask.id)}
                      id={subtask.id}
                    />
                    <label 
                      htmlFor={subtask.id}
                      className={`text-sm flex-1 cursor-pointer ${subtask.completed ? 'line-through opacity-70' : ''}`}
                    >
                      {subtask.title}
                    </label>
                  </div>
                ))}
              </div>
            )}
            
            <div className="flex items-center space-x-2 mt-3">
              <Input
                value={newSubtask}
                onChange={(e) => setNewSubtask(e.target.value)}
                placeholder="Add a subtask"
                className="flex-1"
              />
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleAddSubtask}
                size="sm"
              >
                Add
              </Button>
            </div>
          </div>
        </div>
        
        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDeleteTask}
            className="w-full sm:w-auto"
          >
            <Trash size={16} className="mr-1" /> Delete
          </Button>
          <Button
            onClick={handleStartFocusSession}
            className="w-full sm:w-auto"
          >
            <Clock size={16} className="mr-1" /> Start Focus Session
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TaskDetailDialog;

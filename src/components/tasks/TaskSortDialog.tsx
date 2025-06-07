import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useTasks } from '@/contexts/TaskContext';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { ArrowDown, ArrowUp } from 'lucide-react';
import { motion } from 'framer-motion';

interface TaskSortDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const TaskSortDialog: React.FC<TaskSortDialogProps> = ({ isOpen, onClose }) => {
  const { state, setSort } = useTasks();
  const { sortBy, sortDirection } = state;

  const handleSortChange = (value: string) => {
    setSort(value as 'priority' | 'dueDate' | 'category' | 'createdAt', sortDirection);
  };

  const handleDirectionChange = (value: string) => {
    setSort(sortBy, value as 'asc' | 'desc');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogTitle>Sort Tasks</DialogTitle>
        <div className="space-y-6 mt-2">
          <motion.div 
            className="space-y-3"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Label>Sort by</Label>
            <RadioGroup value={sortBy} onValueChange={handleSortChange} className="grid grid-cols-1 gap-2">
              <div className="flex items-center space-x-2 bg-gray-50 dark:bg-gray-800 p-2 rounded-md">
                <RadioGroupItem value="priority" id="sort-priority" />
                <Label htmlFor="sort-priority" className="cursor-pointer flex-1">Priority</Label>
              </div>
              <div className="flex items-center space-x-2 bg-gray-50 dark:bg-gray-800 p-2 rounded-md">
                <RadioGroupItem value="dueDate" id="sort-due-date" />
                <Label htmlFor="sort-due-date" className="cursor-pointer flex-1">Due Date</Label>
              </div>
              <div className="flex items-center space-x-2 bg-gray-50 dark:bg-gray-800 p-2 rounded-md">
                <RadioGroupItem value="category" id="sort-category" />
                <Label htmlFor="sort-category" className="cursor-pointer flex-1">Category</Label>
              </div>
              <div className="flex items-center space-x-2 bg-gray-50 dark:bg-gray-800 p-2 rounded-md">
                <RadioGroupItem value="createdAt" id="sort-created" />
                <Label htmlFor="sort-created" className="cursor-pointer flex-1">Created Date</Label>
              </div>
            </RadioGroup>
          </motion.div>

          <motion.div 
            className="space-y-3"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: 0.1 }}
          >
            <Label>Direction</Label>
            <div className="flex space-x-2">
              <Button
                variant={sortDirection === 'asc' ? 'default' : 'outline'}
                onClick={() => handleDirectionChange('asc')}
                className="flex-1"
              >
                <ArrowUp className="h-4 w-4 mr-2" />
                Ascending
              </Button>
              <Button
                variant={sortDirection === 'desc' ? 'default' : 'outline'}
                onClick={() => handleDirectionChange('desc')}
                className="flex-1"
              >
                <ArrowDown className="h-4 w-4 mr-2" />
                Descending
              </Button>
            </div>
          </motion.div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            onClick={onClose}
            className="bg-focus-400 hover:bg-focus-500"
          >
            Apply
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TaskSortDialog;

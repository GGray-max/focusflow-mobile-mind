
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useTasks } from '@/contexts/TaskContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { motion } from 'framer-motion';

interface TaskFiltersDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const TaskFiltersDialog: React.FC<TaskFiltersDialogProps> = ({ isOpen, onClose }) => {
  const { 
    state, 
    setFilterCategory, 
    setFilterPriority, 
    setFilterDueDate 
  } = useTasks();
  
  const { categories, filterCategory, filterPriority, filterDueDate } = state;
  const selectedDate = filterDueDate ? new Date(filterDueDate) : undefined;

  const handleReset = () => {
    setFilterCategory(null);
    setFilterPriority(null);
    setFilterDueDate(null);
    onClose();
  };

  const handleApply = () => {
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Filter Tasks</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <motion.div 
            className="space-y-2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Label htmlFor="filterCategory">Category</Label>
            <Select 
              value={filterCategory || "all"} 
              onValueChange={(value) => setFilterCategory(value === "all" ? null : value)}
            >
              <SelectTrigger id="filterCategory" className="border-focus-200 focus:border-focus-400">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </motion.div>

          <motion.div 
            className="space-y-2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: 0.05 }}
          >
            <Label htmlFor="filterPriority">Priority</Label>
            <Select 
              value={filterPriority || "all"} 
              onValueChange={(value) => setFilterPriority(value === "all" ? null : value)}
            >
              <SelectTrigger id="filterPriority" className="border-focus-200 focus:border-focus-400">
                <SelectValue placeholder="All Priorities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
          </motion.div>

          <motion.div 
            className="space-y-2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: 0.1 }}
          >
            <Label>Due Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal border-focus-200 focus:border-focus-400",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, "PPP") : "Any Date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <div className="p-2 flex justify-between">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setFilterDueDate(null)}
                  >
                    Clear
                  </Button>
                </div>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => setFilterDueDate(date ? date.toISOString() : null)}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </motion.div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleReset}
            className="border-focus-200 hover:border-focus-400"
          >
            Reset Filters
          </Button>
          <Button
            type="button"
            onClick={handleApply}
            className="bg-focus-400 hover:bg-focus-500"
          >
            Apply Filters
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TaskFiltersDialog;

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
    setFilterDueDate,
    setFilterRecurring
  } = useTasks();
  
  const { categories, filterCategory, filterPriority, filterDueDate, filterRecurring } = state;
  const selectedDate = filterDueDate ? new Date(filterDueDate) : undefined;

  const handleReset = () => {
    setFilterCategory(undefined);
    setFilterPriority(undefined);
    setFilterDueDate(undefined);
    setFilterRecurring(false);
    onClose();
  };

  const handleApply = () => {
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md rounded-xl border-0 shadow-lg">
        <DialogTitle>Filter Tasks</DialogTitle>
        <div className="space-y-5 py-4">
          <motion.div 
            className="space-y-2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Label htmlFor="filterCategory" className="font-medium text-sm">Category</Label>
            <Select 
              value={filterCategory || "all"} 
              onValueChange={(value) => setFilterCategory(value === "all" ? null : value)}
            >
              <SelectTrigger id="filterCategory" className="border-focus-200 focus:border-focus-400 rounded-lg h-11 transition-all">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent className="rounded-lg">
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
            <Label htmlFor="filterPriority" className="font-medium text-sm">Priority</Label>
            <Select 
              value={filterPriority || "all"} 
              onValueChange={(value) => setFilterPriority(value === "all" ? null : value)}
            >
              <SelectTrigger id="filterPriority" className="border-focus-200 focus:border-focus-400 rounded-lg h-11 transition-all">
                <SelectValue placeholder="All Priorities" />
              </SelectTrigger>
              <SelectContent className="rounded-lg">
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
            <Label htmlFor="filterRecurring" className="font-medium text-sm">Recurring</Label>
            <Select 
              value={filterRecurring ? "recurring" : "all"} 
              onValueChange={(value) => setFilterRecurring(value === "recurring")}
            >
              <SelectTrigger id="filterRecurring" className="border-focus-200 focus:border-focus-400 rounded-lg h-11 transition-all">
                <SelectValue placeholder="All Tasks" />
              </SelectTrigger>
              <SelectContent className="rounded-lg">
                <SelectItem value="all">All Tasks</SelectItem>
                <SelectItem value="recurring">Recurring Tasks Only</SelectItem>
                <SelectItem value="non-recurring">Non-Recurring Tasks Only</SelectItem>
              </SelectContent>
            </Select>
          </motion.div>

          <motion.div 
            className="space-y-2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: 0.15 }}
          >
            <Label className="font-medium text-sm">Due Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal border-focus-200 focus:border-focus-400 rounded-lg h-11",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4 opacity-70" />
                  {selectedDate ? format(selectedDate, "PPP") : "Any Date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 rounded-lg" align="start">
                <div className="p-3 flex justify-between border-b">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setFilterDueDate(null)}
                    className="text-sm hover:text-focus-500 transition-colors"
                  >
                    Clear
                  </Button>
                </div>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => setFilterDueDate(date ? date.toISOString() : null)}
                  initialFocus
                  className="rounded-lg"
                />
              </PopoverContent>
            </Popover>
          </motion.div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={handleReset}
            className="w-full sm:w-auto border-focus-200 hover:border-focus-400 hover:bg-focus-50 rounded-lg transition-all"
          >
            Reset Filters
          </Button>
          <Button
            type="button"
            onClick={handleApply}
            className="w-full sm:w-auto bg-focus-400 hover:bg-focus-500 rounded-lg transition-all"
          >
            Apply Filters
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TaskFiltersDialog;

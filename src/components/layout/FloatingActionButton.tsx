import React, { useState } from 'react';
import { Plus, CheckSquare, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const FloatingActionButton: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const handleAddTask = () => {
    setIsOpen(false);
    navigate('/tasks?add=true');
  };

  const handleAddVision = () => {
    setIsOpen(false);
    navigate('/vision-board?add=true');
  };

  return (
    <>
      <motion.div 
        className="fixed bottom-20 right-5 z-40 md:bottom-8 md:right-8"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <Button 
          className="w-14 h-14 rounded-full shadow-lg bg-primary hover:bg-primary/90 text-white"
          size="icon"
          onClick={() => setIsOpen(true)}
        >
          <Plus className="h-6 w-6" />
        </Button>
      </motion.div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-xs p-4">
          <DialogTitle>Quick Add</DialogTitle>
          <div className="flex flex-col gap-3 mt-4">
            <Button 
              variant="outline" 
              className="h-auto py-3 border-border/50 hover:bg-accent"
              onClick={handleAddTask}
            >
              <CheckSquare className="h-5 w-5 mr-2 text-primary" />
              Add New Task
            </Button>
            <Button 
              variant="outline" 
              className="h-auto py-3 border-border/50 hover:bg-accent"
              onClick={handleAddVision}
            >
              <Target className="h-5 w-5 mr-2 text-primary" />
              Add New Vision
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default FloatingActionButton;

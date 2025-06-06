import React, { useState } from 'react';
import MobileLayout from '@/components/layout/MobileLayout';
import { useVisionBoard } from '@/contexts/VisionBoardContext';
import { Plus, Pencil, Trash, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { format, isValid, parseISO } from 'date-fns';
import { toast } from '@/components/ui/use-toast';
import VisionEntryDialog from '@/components/vision/VisionEntryDialog';
import DeleteConfirmDialog from '@/components/vision/DeleteConfirmDialog';
import ErrorBoundary from '@/components/common/ErrorBoundary';

const VisionBoardPage: React.FC = () => {
  const { state, deleteEntry } = useVisionBoard();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<any>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState<string | null>(null);

  const handleAddClick = () => {
    setEditingEntry(null);
    setIsAddDialogOpen(true);
  };

  const handleEditClick = (entry: any) => {
    setEditingEntry(entry);
    setIsAddDialogOpen(true);
  };

  const handleDeleteClick = (id: string) => {
    setEntryToDelete(id);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (entryToDelete) {
      deleteEntry(entryToDelete);
      toast({
        title: "Vision entry deleted",
        description: "Your vision board entry has been removed.",
      });
      setIsDeleteDialogOpen(false);
      setEntryToDelete(null);
    }
  };

  return (
    <ErrorBoundary>
      <MobileLayout>
        <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-focus-400 to-focus-300 text-transparent bg-clip-text">Vision Board</h1>
            <p className="text-muted-foreground text-sm">Visualize your goals and dreams</p>
          </div>
          
          <Button 
            onClick={handleAddClick}
            className="rounded-full bg-focus-400 hover:bg-focus-500 shadow-md"
          >
            <Plus size={18} className="mr-1" /> Add Vision
          </Button>
        </div>
        
        {state.loading ? (
          <div className="py-12 flex flex-col items-center justify-center space-y-3">
            <div className="h-8 w-8 rounded-full border-4 border-focus-300 border-t-transparent animate-spin"></div>
            <p className="text-muted-foreground text-sm">Loading vision board...</p>
          </div>
        ) : state.entries.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center">
            <div className="bg-gray-100 dark:bg-gray-800 rounded-full p-6 mb-4">
              <AlertCircle size={40} className="text-gray-400" />
            </div>
            <p className="text-muted-foreground text-center max-w-xs mx-auto">
              Your vision board is empty. Add your goals, dreams, and inspiration to stay motivated.
            </p>
            <Button 
              onClick={handleAddClick}
              variant="outline"
              className="mt-6 border-focus-200 hover:border-focus-400 hover:bg-focus-50"
            >
              <Plus size={16} className="mr-1" /> Create First Vision
            </Button>
          </div>
        ) : (
          <AnimatePresence>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-6">
              {state.entries.map((entry, index) => (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden relative group"
                >
                  {entry.imageUrl && (
                    <div className="h-40 overflow-hidden">
                      <img 
                        src={entry.imageUrl} 
                        alt={entry.title} 
                        className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-300"
                      />
                    </div>
                  )}
                  
                  <div className="p-4">
                    <h3 className="font-semibold text-lg">{entry.title}</h3>
                    <p className="text-muted-foreground mt-1 text-sm line-clamp-3">{entry.description}</p>
                    
                    {entry.category && (
                      <div className="mt-2">
                        <span className="inline-block px-2 py-1 text-xs rounded-full bg-focus-100 text-focus-700 dark:bg-focus-900 dark:text-focus-300">
                          {entry.category}
                        </span>
                      </div>
                    )}
                    
                    <div className="flex justify-between items-center mt-3">
                      <span className="text-xs text-muted-foreground">
                        {entry.createdAt ? 
                          (() => {
                            try {
                              const date = parseISO(entry.createdAt);
                              return isValid(date) ? format(date, 'MMM d, yyyy') : 'No date available';
                            } catch (error) {
                              console.error('Invalid date format:', entry.createdAt);
                              return 'No date available';
                            }
                          })() 
                          : 'No date available'}
                      </span>
                      
                      <div className="space-x-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 rounded-full hover:bg-focus-100 text-gray-500 hover:text-focus-500"
                          onClick={() => handleEditClick(entry)}
                        >
                          <Pencil size={15} />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 rounded-full hover:bg-red-100 text-gray-500 hover:text-red-500"
                          onClick={() => handleDeleteClick(entry.id)}
                        >
                          <Trash size={15} />
                        </Button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </AnimatePresence>
        )}
        </div>
        
        <VisionEntryDialog
          isOpen={isAddDialogOpen}
          onClose={() => setIsAddDialogOpen(false)}
          editEntry={editingEntry}
        />
        
        <DeleteConfirmDialog
          isOpen={isDeleteDialogOpen}
          onClose={() => setIsDeleteDialogOpen(false)}
          onConfirm={confirmDelete}
        />
      </MobileLayout>
    </ErrorBoundary>
  );
};

export default VisionBoardPage;

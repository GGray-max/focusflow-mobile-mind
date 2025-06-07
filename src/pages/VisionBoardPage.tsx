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
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { X, Calendar, Check, Target, Sparkles } from 'lucide-react';
import { Input } from '@/components/ui/input';

const VisionBoardPage: React.FC = () => {
  const { state, deleteEntry, updateEntry } = useVisionBoard();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<any>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState<string | null>(null);
  const [selectedEntry, setSelectedEntry] = useState<any>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [completionDate, setCompletionDate] = useState<string>("");
  const [reflectionNote, setReflectionNote] = useState<string>("");

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

  const handleEntryClick = (entry: any) => {
    setSelectedEntry(entry);
    setCompletionDate(entry.completedAt || "");
    setReflectionNote(entry.notes || "");
    setIsDetailModalOpen(true);
  };

  const handleMarkAccomplished = () => {
    if (selectedEntry) {
      const updatedEntry = {
        ...selectedEntry,
        completed: true,
        completedAt: completionDate || new Date().toISOString(),
        notes: reflectionNote
      };
      updateEntry(updatedEntry);
      toast({
        title: "Vision Accomplished",
        description: `Congratulations on achieving ${updatedEntry.title}!`
      });
      setIsDetailModalOpen(false);
    }
  };

  return (
    <ErrorBoundary>
      <MobileLayout>
        <div className="space-y-8 px-1">
          {/* Enhanced Header Section */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-focus-50 to-primary/5 rounded-3xl -z-10" />
            <div className="p-6 sm:p-8">
              <div className="flex justify-between items-start">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-focus-400 to-focus-500 rounded-xl">
                      <Target className="h-6 w-6 text-white" />
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-focus-600 to-focus-400 text-transparent bg-clip-text">
                      Vision Board
                    </h1>
                  </div>
                  <p className="text-muted-foreground text-base max-w-md">
                    Visualize your dreams and turn them into reality
                  </p>
                  <div className="flex items-center gap-2 text-sm text-focus-600">
                    <Sparkles className="h-4 w-4" />
                    <span>{state.entries.length} vision{state.entries.length !== 1 ? 's' : ''} created</span>
                  </div>
                </div>
                
                <Button 
                  onClick={handleAddClick}
                  className="rounded-full bg-gradient-to-r from-focus-400 to-focus-500 hover:from-focus-500 hover:to-focus-600 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                  size="lg"
                >
                  <Plus size={20} className="mr-2" /> 
                  Add Vision
                </Button>
              </div>
            </div>
          </div>
          
          {state.loading ? (
            <div className="py-20 flex flex-col items-center justify-center space-y-4">
              <div className="relative">
                <div className="h-12 w-12 rounded-full border-4 border-focus-200 animate-spin"></div>
                <div className="absolute inset-0 h-12 w-12 rounded-full border-4 border-transparent border-t-focus-500 animate-spin"></div>
              </div>
              <p className="text-muted-foreground font-medium">Loading your visions...</p>
            </div>
          ) : state.entries.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center">
              <div className="relative mb-8">
                <div className="bg-gradient-to-br from-focus-100 to-focus-50 rounded-3xl p-8">
                  <Target size={64} className="text-focus-400 mx-auto" />
                </div>
                <div className="absolute -top-2 -right-2 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-full p-2">
                  <Sparkles size={20} className="text-white" />
                </div>
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">Start Your Vision Journey</h3>
              <p className="text-muted-foreground text-center max-w-md mx-auto mb-8 leading-relaxed">
                Create your first vision to start manifesting your dreams. Add images, goals, and inspiration to keep yourself motivated.
              </p>
              <Button 
                onClick={handleAddClick}
                className="rounded-full bg-gradient-to-r from-focus-400 to-focus-500 hover:from-focus-500 hover:to-focus-600 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                size="lg"
              >
                <Plus size={20} className="mr-2" /> 
                Create First Vision
              </Button>
            </div>
          ) : (
            <AnimatePresence>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-8">
                {state.entries.map((entry, index) => (
                  <motion.div
                    key={entry.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className="group relative"
                  >
                    <div 
                      className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 dark:border-gray-700 cursor-pointer transform hover:scale-[1.02]"
                      onClick={() => handleEntryClick(entry)}
                    >
                      {/* Enhanced Image Section */}
                      {entry.imageUrl && (
                        <div className="relative h-48 overflow-hidden">
                          <img 
                            src={entry.imageUrl} 
                            alt={entry.title} 
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                          
                          {/* Completion Badge */}
                          {entry.completed && (
                            <div className="absolute top-3 right-3 bg-green-500 text-white rounded-full p-2 shadow-lg">
                              <Check size={16} />
                            </div>
                          )}
                        </div>
                      )}
                      
                      {/* Enhanced Content Section */}
                      <div className="p-6 space-y-4">
                        <div>
                          <h3 className="font-bold text-lg text-foreground mb-2 line-clamp-2 group-hover:text-focus-600 transition-colors">
                            {entry.title}
                          </h3>
                          <p className="text-muted-foreground text-sm line-clamp-3 leading-relaxed">
                            {entry.description}
                          </p>
                        </div>
                        
                        {/* Category Badge */}
                        {entry.category && (
                          <div className="inline-flex items-center">
                            <span className="px-3 py-1.5 text-xs font-medium rounded-full bg-gradient-to-r from-focus-100 to-focus-50 text-focus-700 dark:from-focus-900 dark:to-focus-800 dark:text-focus-300 border border-focus-200 dark:border-focus-700">
                              {entry.category}
                            </span>
                          </div>
                        )}
                        
                        {/* Enhanced Footer */}
                        <div className="flex justify-between items-center pt-2 border-t border-gray-100 dark:border-gray-700">
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Calendar size={14} />
                            <span>
                              {entry.createdAt ? 
                                (() => {
                                  try {
                                    const date = parseISO(entry.createdAt);
                                    return isValid(date) ? format(date, 'MMM d, yyyy') : 'No date';
                                  } catch (error) {
                                    console.error('Invalid date format:', entry.createdAt);
                                    return 'No date';
                                  }
                                })() 
                                : 'No date'}
                            </span>
                          </div>
                          
                          {/* Action Buttons */}
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 rounded-full hover:bg-focus-100 text-gray-500 hover:text-focus-600 transition-colors"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditClick(entry);
                              }}
                            >
                              <Pencil size={14} />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 rounded-full hover:bg-red-100 text-gray-500 hover:text-red-600 transition-colors"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteClick(entry.id);
                              }}
                            >
                              <Trash size={14} />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </AnimatePresence>
          )}
        </div>
        
        {/* Enhanced Dialogs */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent className="sm:max-w-[500px] md:max-w-[700px] max-h-[85vh] overflow-y-auto bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border-0">
            <DialogTitle className="text-xl font-bold text-foreground">
              {editingEntry ? 'Edit Vision Entry' : 'Add Vision Entry'}
            </DialogTitle>
            <VisionEntryDialog
              isOpen={isAddDialogOpen}
              onClose={() => setIsAddDialogOpen(false)}
              editEntry={editingEntry}
            />
          </DialogContent>
        </Dialog>
        
        <DeleteConfirmDialog
          isOpen={isDeleteDialogOpen}
          onClose={() => setIsDeleteDialogOpen(false)}
          onConfirm={confirmDelete}
        />
        
        {/* Enhanced Detail Modal */}
        <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
          <DialogContent className="sm:max-w-[500px] md:max-w-[700px] max-h-[90vh] overflow-y-auto p-0 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border-0">
            <DialogTitle>View {selectedEntry?.title || 'Vision Entry'}</DialogTitle>
            {selectedEntry && (
              <div className="flex flex-col h-full">
                {/* Enhanced Image Header */}
                <div className="relative h-56 sm:h-64 md:h-72 overflow-hidden rounded-t-2xl">
                  {selectedEntry.imageUrl ? (
                    <img
                      src={selectedEntry.imageUrl}
                      alt={selectedEntry.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-focus-100 to-focus-50 dark:from-gray-700 dark:to-gray-600">
                      <Target size={64} className="text-focus-400 dark:text-gray-400" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-4 right-4 h-10 w-10 bg-black/50 hover:bg-black/70 text-white rounded-full backdrop-blur-sm"
                    onClick={() => setIsDetailModalOpen(false)}
                  >
                    <X size={20} />
                  </Button>
                </div>
                
                {/* Enhanced Content */}
                <div className="p-8 flex flex-col flex-grow space-y-6">
                  <div>
                    <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
                      {selectedEntry.title}
                    </h2>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                      <div className="flex items-center gap-2">
                        <Calendar size={16} />
                        <span>
                          {selectedEntry.createdAt ? 
                            (() => {
                              try {
                                const date = parseISO(selectedEntry.createdAt);
                                return isValid(date) ? format(date, 'MMMM d, yyyy') : 'No date';
                              } catch (error) {
                                console.error('Invalid date format:', selectedEntry.createdAt);
                                return 'No date';
                              }
                            })() 
                            : 'No date'}
                        </span>
                      </div>
                      {selectedEntry.category && (
                        <span className="px-3 py-1 text-xs font-medium rounded-full bg-gradient-to-r from-focus-100 to-focus-50 text-focus-700 dark:from-focus-900 dark:to-focus-800 dark:text-focus-300">
                          {selectedEntry.category}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <p className="text-foreground text-base leading-relaxed">
                    {selectedEntry.description}
                  </p>
                  
                  {/* Media Section - keep existing code */}
                  {selectedEntry.mediaItems && selectedEntry.mediaItems.length > 0 && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-foreground">Media</h3>
                      {selectedEntry.mediaItems.map((media: any) => (
                        <div key={media.id} className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
                          {media.type === 'audio' && (
                            <audio controls className="w-full">
                              <source src={media.url} type="audio/mpeg" />
                              Your browser does not support the audio element.
                            </audio>
                          )}
                          {media.type === 'video' && (
                            <video controls className="w-full rounded-lg">
                              <source src={media.url} type="video/mp4" />
                              Your browser does not support the video element.
                            </video>
                          )}
                          <p className="text-xs text-muted-foreground mt-2">
                            {media.type} - Added on {media.createdAt ? format(parseISO(media.createdAt), 'MMM d, yyyy') : 'N/A'}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Enhanced Accomplishment Section */}
                  {!selectedEntry.completed ? (
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-6 border border-green-200 dark:border-green-800">
                      <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                        <Check className="h-5 w-5 text-green-600" />
                        Mark as Accomplished
                      </h3>
                      <div className="space-y-4">
                        <Input
                          type="date"
                          value={completionDate.split('T')[0] || ''}
                          onChange={(e) => setCompletionDate(e.target.value)}
                          className="rounded-lg border-green-200 focus:border-green-400 focus:ring-green-200"
                          placeholder="Select completion date"
                        />
                        <Input
                          type="text"
                          value={reflectionNote}
                          onChange={(e) => setReflectionNote(e.target.value)}
                          className="rounded-lg border-green-200 focus:border-green-400 focus:ring-green-200"
                          placeholder="Add a reflection or note about this achievement"
                        />
                        <Button
                          onClick={handleMarkAccomplished}
                          className="w-full rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg"
                          disabled={!completionDate}
                        >
                          <Check size={18} className="mr-2" /> 
                          Mark as Accomplished
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-6 border border-green-200 dark:border-green-800">
                      <h3 className="text-lg font-semibold text-green-800 dark:text-green-300 mb-3 flex items-center gap-2">
                        <Check className="h-5 w-5" />
                        Accomplished
                      </h3>
                      <p className="text-green-700 dark:text-green-400">
                        Completed on: {selectedEntry.completedAt ? format(parseISO(selectedEntry.completedAt), 'MMMM d, yyyy') : 'N/A'}
                      </p>
                      {selectedEntry.notes && (
                        <p className="text-green-700 dark:text-green-400 mt-2">
                          <span className="font-medium">Reflection:</span> {selectedEntry.notes}
                        </p>
                      )}
                    </div>
                  )}
                  
                  {/* Enhanced Action Buttons */}
                  <div className="flex gap-3 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsDetailModalOpen(false);
                        handleEditClick(selectedEntry);
                      }}
                      className="flex-1 rounded-lg border-focus-200 hover:border-focus-400 hover:bg-focus-50 transition-colors"
                    >
                      <Pencil size={16} className="mr-2" /> 
                      Edit Vision
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => {
                        setIsDetailModalOpen(false);
                        handleDeleteClick(selectedEntry.id);
                      }}
                      className="flex-1 rounded-lg bg-red-500 hover:bg-red-600 transition-colors"
                    >
                      <Trash size={16} className="mr-2" /> 
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </MobileLayout>
    </ErrorBoundary>
  );
};

export default VisionBoardPage;

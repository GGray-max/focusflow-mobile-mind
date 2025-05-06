
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"; 
import { toast } from "@/components/ui/use-toast";
import { Volume2, VolumeX, Trash2, Music } from "lucide-react";
import SoundService from "@/services/SoundService";
import { motion } from "framer-motion";

interface CustomSoundSelectorProps {
  type: 'timer' | 'task';
  onSoundChanged?: () => void;
  className?: string;
}

const CustomSoundSelector: React.FC<CustomSoundSelectorProps> = ({ type, onSoundChanged, className }) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentSound, setCurrentSound] = useState<string | null>(
    SoundService.getCustomSoundName(type) || (type === 'timer' ? 'Default timer sound' : 'Default task sound')
  );
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    // Update sound name when it might have changed
    const soundName = SoundService.getCustomSoundName(type);
    setCurrentSound(soundName || (type === 'timer' ? 'Default timer sound' : 'Default task sound'));
  }, [type]);

  const handleSelectSound = async () => {
    try {
      const file = await SoundService.getFileFromDevice();
      if (!file) return;
      
      const result = await SoundService.setCustomSound(type, file.url, file.name);
      
      if (result) {
        setCurrentSound(file.name);
        toast({
          title: "Custom sound set",
          description: `${file.name} will now be used for ${type === 'timer' ? 'timer completion' : 'task notifications'}.`,
        });
        if (onSoundChanged) onSoundChanged();
      }
      
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error selecting sound:', error);
      toast({
        title: "Error setting custom sound",
        description: "Failed to set custom sound. Please try a different file.",
        variant: "destructive"
      });
    }
  };
  
  const resetToDefaultSound = async () => {
    SoundService.clearCustomSound(type);
    setCurrentSound(type === 'timer' ? 'Default timer sound' : 'Default task sound');
    if (onSoundChanged) onSoundChanged();
    setIsDialogOpen(false);
  };
  
  const playSound = () => {
    if (type === 'timer') {
      SoundService.play('timerComplete');
    } else {
      SoundService.play('taskNotification');
    }
    setIsPlaying(true);
    setTimeout(() => setIsPlaying(false), 2000);
  };
  
  const stopSound = () => {
    if (type === 'timer') {
      SoundService.stop('timerComplete');
    } else {
      SoundService.stop('taskNotification');
    }
    setIsPlaying(false);
  };

  return (
    <motion.div 
      className={`flex flex-col space-y-2 ${className}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Label htmlFor="customSound" className="text-sm font-medium">
        {type === 'timer' ? 'Timer Completion Sound' : 'Task Notification Sound'}
      </Label>
      <div className="flex items-center space-x-2">
        <div className="flex-1 text-sm px-3 py-2 rounded-md bg-secondary/60 dark:bg-secondary/30 border border-secondary dark:border-gray-700 truncate shadow-inner">
          {currentSound}
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={isPlaying ? stopSound : playSound}
          type="button"
          className="rounded-full h-9 w-9 bg-background shadow-sm hover:shadow"
        >
          {isPlaying ? 
            <VolumeX className="h-4 w-4 text-focus-500" /> : 
            <Volume2 className="h-4 w-4 text-focus-500" />
          }
        </Button>
        <Button
          variant="secondary"
          onClick={() => setIsDialogOpen(true)}
          type="button"
          className="rounded-lg shadow-sm hover:shadow-md transition-all"
        >
          <Music className="h-4 w-4 mr-2" />
          Change
        </Button>
      </div>

      <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <AlertDialogContent className="bg-white dark:bg-gray-800/95 backdrop-blur-lg border border-gray-200 dark:border-gray-700 shadow-lg">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">Select Custom Sound</AlertDialogTitle>
          </AlertDialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              Select an audio file (.mp3, .wav, .ogg) to use as your custom {type === 'timer' ? 'timer completion' : 'task notification'} sound.
            </p>
          </div>
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={resetToDefaultSound}
              type="button"
              className="text-destructive border-destructive hover:bg-destructive/10"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Reset to Default
            </Button>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSelectSound} className="bg-focus-400 hover:bg-focus-500">
              Select Audio File
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
};

export default CustomSoundSelector;

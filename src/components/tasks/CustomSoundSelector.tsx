
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"; 
import { toast } from "@/components/ui/use-toast";
import { Volume2, VolumeX } from "lucide-react";
import SoundService from "@/services/SoundService";

interface CustomSoundSelectorProps {
  type: 'timer' | 'task';
  onSoundChanged?: () => void;
}

const CustomSoundSelector: React.FC<CustomSoundSelectorProps> = ({ type, onSoundChanged }) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentSound, setCurrentSound] = useState<string | null>(
    SoundService.getCustomSoundName(type) || (type === 'timer' ? 'Default timer sound' : 'Default task sound')
  );
  const [isPlaying, setIsPlaying] = useState(false);

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
    <>
      <div className="flex flex-col space-y-2">
        <Label htmlFor="customSound">
          {type === 'timer' ? 'Timer Completion Sound' : 'Task Notification Sound'}
        </Label>
        <div className="flex items-center space-x-2">
          <div className="flex-1 text-sm px-3 py-2 rounded-md bg-secondary dark:bg-secondary/60 truncate">
            {currentSound}
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={isPlaying ? stopSound : playSound}
            type="button"
          >
            {isPlaying ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </Button>
          <Button
            variant="secondary"
            onClick={() => setIsDialogOpen(true)}
            type="button"
          >
            Change
          </Button>
        </div>
      </div>

      <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Select Custom Sound</AlertDialogTitle>
          </AlertDialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              Select an audio file (.mp3, .wav, .ogg) to use as your custom {type === 'timer' ? 'timer completion' : 'task notification'} sound.
            </p>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSelectSound}>Select File</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default CustomSoundSelector;


import React from 'react';
import MobileLayout from '@/components/layout/MobileLayout';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Trash2, Download, Share2, Music } from 'lucide-react';
import SoundService from '@/services/SoundService';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useTimer } from '@/contexts/TimerContext';
import { useTasks } from '@/contexts/TaskContext';
import { useProcrastination } from '@/contexts/ProcrastinationContext';
import { toast } from '@/components/ui/use-toast';

const SettingsPage: React.FC = () => {
  // Would integrate with device notification system in a real mobile app
  const [allowNotifications, setAllowNotifications] = React.useState(true);
  
  const { resetTimer } = useTimer();
  const { state: taskState } = useTasks();
  const { state: procrastinationState } = useProcrastination();
  
  const handleClearAllData = () => {
    localStorage.clear();
    window.location.reload();
  };
  
  const handleExportData = () => {
    const exportData = {
      tasks: taskState.tasks,
      procrastination: procrastinationState.entries,
      exportDate: new Date().toISOString(),
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.download = `focusflow-export-${new Date().toISOString().split('T')[0]}.json`;
    link.href = url;
    link.click();
    
    toast({
      title: "Data exported successfully",
      description: "Your tasks and insights have been saved to a file",
    });
  };
  
  return (
    <MobileLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-gray-500 text-sm">Customize your experience</p>
      </div>
      
      <div className="space-y-6">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
          <h2 className="text-lg font-medium mb-3">Notifications</h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="notifications" className="flex-1">
                Allow notifications
              </Label>
              <Switch 
                id="notifications" 
                checked={allowNotifications} 
                onCheckedChange={setAllowNotifications} 
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="endTimer" className="flex-1">
                Timer completion notification
              </Label>
              <Switch 
                id="endTimer" 
                disabled={!allowNotifications} 
                defaultChecked 
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="dailyReminder" className="flex-1">
                Daily task reminder
              </Label>
              <Switch 
                id="dailyReminder" 
                disabled={!allowNotifications} 
                defaultChecked 
              />
            </div>
            
            <div className="pt-2 border-t border-gray-100 dark:border-gray-700 mt-2">
              <h3 className="text-sm font-medium mb-2">Notification Sounds</h3>
              
              <div className="space-y-3">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="timerSound" className="text-sm">
                    Timer completion sound
                  </Label>
                  <Button 
                    variant="outline" 
                    size="sm"
                    id="timerSound"
                    onClick={async () => {
                      try {
                        const soundFile = await SoundService.getFileFromDevice();
                        if (soundFile) {
                          const success = await SoundService.setCustomSound('timer', soundFile);
                          if (success) {
                            toast({
                              title: "Timer sound updated",
                              description: "Your custom timer sound has been set"
                            });
                            // Play a preview
                            SoundService.play('timerComplete');
                          }
                        }
                      } catch (error) {
                        console.error('Error setting custom timer sound:', error);
                        toast({
                          title: "Error",
                          description: "Failed to set custom timer sound",
                          variant: "destructive"
                        });
                      }
                    }}
                    className="flex justify-between items-center"
                  >
                    <span>Choose custom sound</span>
                    <Music className="h-4 w-4 ml-2" />
                  </Button>
                </div>
                
                <div className="flex flex-col gap-2">
                  <Label htmlFor="taskSound" className="text-sm">
                    Task notification sound
                  </Label>
                  <Button 
                    variant="outline" 
                    size="sm"
                    id="taskSound"
                    onClick={async () => {
                      try {
                        const soundFile = await SoundService.getFileFromDevice();
                        if (soundFile) {
                          const success = await SoundService.setCustomSound('task', soundFile);
                          if (success) {
                            toast({
                              title: "Task sound updated",
                              description: "Your custom task notification sound has been set"
                            });
                            // Play a preview
                            SoundService.play('taskNotification');
                          }
                        }
                      } catch (error) {
                        console.error('Error setting custom task sound:', error);
                        toast({
                          title: "Error",
                          description: "Failed to set custom task sound",
                          variant: "destructive"
                        });
                      }
                    }}
                    className="flex justify-between items-center"
                  >
                    <span>Choose custom sound</span>
                    <Music className="h-4 w-4 ml-2" />
                  </Button>
                </div>
                
                <p className="text-xs text-gray-500 mt-1">
                  Select audio files from your device to use as custom notification sounds
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
          <h2 className="text-lg font-medium mb-3">Data Management</h2>
          
          <div className="space-y-3">
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={handleExportData}
            >
              <Download size={18} className="mr-2" />
              Export Your Data
            </Button>
            
            <Dialog>
              <DialogTrigger asChild>
                <Button 
                  variant="outline" 
                  className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50"
                >
                  <Trash2 size={18} className="mr-2" />
                  Clear All Data
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Clear all data?</DialogTitle>
                  <DialogDescription>
                    This will permanently delete all your tasks, timer settings, and insights. This action cannot be undone.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="outline" onClick={() => {}}>Cancel</Button>
                  <Button variant="destructive" onClick={handleClearAllData}>
                    Yes, delete everything
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
          <h2 className="text-lg font-medium mb-3">About</h2>
          <p className="text-sm text-gray-500">
            FocusFlow v1.0.0
            <br /><br />
            A productivity app designed to help you overcome procrastination and stay focused on your important tasks.
          </p>
        </div>
      </div>
    </MobileLayout>
  );
};

export default SettingsPage;


import React from 'react';
import MobileLayout from '@/components/layout/MobileLayout';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Trash2, Download, Share2 } from 'lucide-react';
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

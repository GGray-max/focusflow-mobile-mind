
import React, { useEffect } from 'react';
import MobileLayout from '@/components/layout/MobileLayout';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Trash2, Download, Share2, Moon, Sun } from 'lucide-react';
import CustomSoundSelector from '@/components/CustomSoundSelector';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useTimer } from '@/contexts/TimerContext';
import { useTasks } from '@/contexts/TaskContext';
import { useProcrastination } from '@/contexts/ProcrastinationContext';
import { toast } from '@/components/ui/use-toast';
import NotificationService from '@/services/NotificationService';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

const SettingsPage: React.FC = () => {
  // Would integrate with device notification system in a real mobile app
  const [allowNotifications, setAllowNotifications] = React.useState(true);
  const [isDarkMode, setIsDarkMode] = React.useState(() => {
    return localStorage.getItem('darkMode') === 'true' || 
           (!('darkMode' in localStorage) && 
            window.matchMedia('(prefers-color-scheme: dark)').matches);
  });
  
  const { resetTimer } = useTimer();
  const { state: taskState } = useTasks();
  const { state: procrastinationState } = useProcrastination();
  
  useEffect(() => {
    // Request notification permissions on page load
    const requestNotificationPermissions = async () => {
      const granted = await NotificationService.requestPermissions();
      setAllowNotifications(granted);
    };
    
    requestNotificationPermissions();
  }, []);
  
  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    localStorage.setItem('darkMode', newMode.toString());
    
    if (newMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    toast({
      title: newMode ? "Dark mode enabled" : "Light mode enabled",
      description: "Your theme preference has been saved",
    });
  };
  
  // Apply dark mode on initial load
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);
  
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
  
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };
  
  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };
  
  return (
    <MobileLayout>
      <motion.div 
        className="mb-6"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="text-2xl font-bold bg-gradient-to-r from-focus-400 to-focus-600 bg-clip-text text-transparent">Settings</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm">Customize your experience</p>
      </motion.div>
      
      <motion.div 
        className="space-y-6"
        variants={container}
        initial="hidden"
        animate="show"
      >
        <motion.div variants={item}>
          <Card className="overflow-hidden border border-gray-100 dark:border-gray-800 bg-white/80 dark:bg-gray-800/90 backdrop-blur-sm shadow-md hover:shadow-lg transition-all">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg font-medium">Appearance</CardTitle>
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={toggleDarkMode}
                  className="rounded-full h-9 w-9 bg-background shadow-sm hover:shadow"
                >
                  {isDarkMode ? (
                    <Sun className="h-5 w-5 text-amber-400" />
                  ) : (
                    <Moon className="h-5 w-5 text-focus-400" />
                  )}
                </Button>
              </div>
              <CardDescription className="text-sm text-gray-500 dark:text-gray-400">
                Toggle between dark and light mode for your comfort
              </CardDescription>
            </CardHeader>
          </Card>
        </motion.div>
        
        <motion.div variants={item}>
          <Card className="overflow-hidden border border-gray-100 dark:border-gray-800 bg-white/80 dark:bg-gray-800/90 backdrop-blur-sm shadow-md hover:shadow-lg transition-all">
            <CardHeader>
              <CardTitle className="text-lg font-medium">Notifications</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <Label htmlFor="notifications" className="flex-1 cursor-pointer">
                    Allow notifications
                  </Label>
                  <Switch 
                    id="notifications" 
                    checked={allowNotifications} 
                    onCheckedChange={async (checked) => {
                      if (checked) {
                        const granted = await NotificationService.requestPermissions();
                        setAllowNotifications(granted);
                        if (!granted) {
                          toast({
                            title: "Permission denied",
                            description: "Please enable notifications in your browser/device settings",
                            variant: "destructive"
                          });
                        }
                      } else {
                        setAllowNotifications(false);
                      }
                    }} 
                  />
                </div>
                
                <div className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <Label htmlFor="endTimer" className="flex-1 cursor-pointer">
                    Timer completion notification
                  </Label>
                  <Switch 
                    id="endTimer" 
                    disabled={!allowNotifications} 
                    defaultChecked 
                  />
                </div>
                
                <div className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <Label htmlFor="dailyReminder" className="flex-1 cursor-pointer">
                    Daily task reminder
                  </Label>
                  <Switch 
                    id="dailyReminder" 
                    disabled={!allowNotifications} 
                    defaultChecked 
                  />
                </div>
                
                <div className="pt-4 border-t border-gray-100 dark:border-gray-700 mt-4">
                  <h3 className="text-sm font-medium mb-4">Notification Sounds</h3>
                  
                  <div className="space-y-5">
                    <CustomSoundSelector type="timer" />
                    <CustomSoundSelector type="task" />
                    
                    <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                      Select audio files from your device to personalize notifications
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        
        <motion.div variants={item}>
          <Card className="overflow-hidden border border-gray-100 dark:border-gray-800 bg-white/80 dark:bg-gray-800/90 backdrop-blur-sm shadow-md hover:shadow-lg transition-all">
            <CardHeader>
              <CardTitle className="text-lg font-medium">Data Management</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                variant="outline" 
                className="w-full justify-start bg-white dark:bg-transparent hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all"
                onClick={handleExportData}
              >
                <Download size={18} className="mr-2 text-focus-500" />
                Export Your Data
              </Button>
              
              <Dialog>
                <DialogTrigger asChild>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start text-red-500 hover:text-red-600 bg-white dark:bg-transparent hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                  >
                    <Trash2 size={18} className="mr-2" />
                    Clear All Data
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-white dark:bg-gray-800/95 backdrop-blur-lg border border-gray-200 dark:border-gray-700">
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
            </CardContent>
          </Card>
        </motion.div>
        
        <motion.div variants={item}>
          <Card className="overflow-hidden border border-gray-100 dark:border-gray-800 bg-white/80 dark:bg-gray-800/90 backdrop-blur-sm shadow-md hover:shadow-lg transition-all">
            <CardHeader>
              <CardTitle className="text-lg font-medium">About</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-4">
                <h3 className="text-xl font-semibold bg-gradient-to-r from-focus-300 to-focus-500 bg-clip-text text-transparent">FocusFlow</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Version 1.0.0</p>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-4 px-4">
                  A productivity app designed to help you overcome procrastination 
                  and stay focused on your important tasks.
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </MobileLayout>
  );
};

export default SettingsPage;

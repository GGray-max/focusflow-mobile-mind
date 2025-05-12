
import React, { useState, useEffect } from 'react';
import { Ban, Lock, AppWindow, X, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useTimer } from '@/contexts/TimerContext';
import { Capacitor, Plugins } from '@capacitor/core';

// Define a custom interface for the native plugin
interface AppBlockerPlugin {
  isServiceEnabled(): Promise<{ enabled: boolean }>;
  requestBlockingPermission(): Promise<{ granted: boolean }>;
  setBlockedApps(options: { apps: string[] }): Promise<void>;
  getInstalledApps(): Promise<{ apps: Array<{ packageName: string, appName: string, icon?: string }> }>;
  startBlockingService(): Promise<void>;
  stopBlockingService(): Promise<void>;
}

// Define app category types
type AppCategory = 'social' | 'entertainment' | 'shopping' | 'news' | 'other';

// App interface
interface BlockedApp {
  packageName: string;
  appName: string;
  category: AppCategory;
  icon?: string;
}

const DistractionBlocker: React.FC = () => {
  const [isAddSiteDialogOpen, setIsAddSiteDialogOpen] = useState(false);
  const [isAppPickerOpen, setIsAppPickerOpen] = useState(false);
  const [isPermissionDialogOpen, setIsPermissionDialogOpen] = useState(false);
  const [blockedApps, setBlockedApps] = useState<BlockedApp[]>([]);
  const [installedApps, setInstalledApps] = useState<Array<{ packageName: string, appName: string }>>([]);
  const [newSite, setNewSite] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState<AppCategory>('social');
  const { state: { isRunning, mode } } = useTimer();
  const [isNativePlatform, setIsNativePlatform] = useState(false);
  const [serviceEnabled, setServiceEnabled] = useState(false);

  // Check if we're on a native platform and initialize
  useEffect(() => {
    const checkPlatform = async () => {
      const isNative = Capacitor.isNativePlatform();
      setIsNativePlatform(isNative);

      if (isNative) {
        try {
          // Try to load the saved blocked apps
          const savedApps = localStorage.getItem('blockedApps');
          if (savedApps) {
            setBlockedApps(JSON.parse(savedApps));
          }

          // Check if the service is enabled
          const AppBlocker = (Capacitor as any).Plugins.AppBlocker as AppBlockerPlugin;
          if (AppBlocker) {
            const result = await AppBlocker.isServiceEnabled();
            setServiceEnabled(result.enabled);
            
            if (!result.enabled && blockedApps.length > 0) {
              setIsPermissionDialogOpen(true);
            }
          }
        } catch (error) {
          console.error('Error initializing app blocker:', error);
        }
      }
    };

    checkPlatform();
  }, []);

  // When blocked apps change, save to storage and update native service
  useEffect(() => {
    if (blockedApps.length > 0) {
      localStorage.setItem('blockedApps', JSON.stringify(blockedApps));
      
      // Update the native blocking service if on native platform
      if (isNativePlatform && serviceEnabled) {
        try {
          const AppBlocker = (Capacitor as any).Plugins.AppBlocker as AppBlockerPlugin;
          if (AppBlocker) {
            AppBlocker.setBlockedApps({ 
              apps: blockedApps.map(app => app.packageName) 
            });
          }
        } catch (error) {
          console.error('Error updating blocked apps:', error);
        }
      }
    }
  }, [blockedApps, isNativePlatform, serviceEnabled]);

  // Effect for timer running state changes
  useEffect(() => {
    if (!isNativePlatform || !serviceEnabled) return;

    const updateBlockingService = async () => {
      try {
        const AppBlocker = (Capacitor as any).Plugins.AppBlocker as AppBlockerPlugin;
        if (!AppBlocker) return;

        if (isRunning && mode === 'focus' && blockedApps.length > 0) {
          await AppBlocker.startBlockingService();
          toast({
            title: "Distraction blocking activated",
            description: `Blocking ${blockedApps.length} apps during this focus session`,
          });
        } else {
          await AppBlocker.stopBlockingService();
          if (mode !== 'focus' && blockedApps.length > 0) {
            toast({
              title: "Distraction blocking deactivated",
              description: "You can now use all apps",
            });
          }
        }
      } catch (error) {
        console.error('Error updating blocking service:', error);
      }
    };

    updateBlockingService();
  }, [isRunning, mode, blockedApps.length, isNativePlatform, serviceEnabled]);

  const handleShowAppPicker = async () => {
    if (!isNativePlatform) {
      setIsAddSiteDialogOpen(true);
      return;
    }

    try {
      const AppBlocker = (Capacitor as any).Plugins.AppBlocker as AppBlockerPlugin;
      if (AppBlocker) {
        // First check if we have permission
        const permissionStatus = await AppBlocker.isServiceEnabled();
        if (!permissionStatus.enabled) {
          setIsPermissionDialogOpen(true);
          return;
        }

        // Get installed apps
        const result = await AppBlocker.getInstalledApps();
        setInstalledApps(result.apps);
        setIsAppPickerOpen(true);
      } else {
        // Fallback to website blocker on web
        setIsAddSiteDialogOpen(true);
      }
    } catch (error) {
      console.error('Error getting installed apps:', error);
      toast({
        title: "Error loading apps",
        description: "There was a problem loading installed apps",
        variant: "destructive"
      });
      // Fallback to website blocker
      setIsAddSiteDialogOpen(true);
    }
  };

  const requestPermission = async () => {
    if (!isNativePlatform) return;

    try {
      const AppBlocker = (Capacitor as any).Plugins.AppBlocker as AppBlockerPlugin;
      if (AppBlocker) {
        const result = await AppBlocker.requestBlockingPermission();
        setServiceEnabled(result.granted);
        setIsPermissionDialogOpen(false);
        
        if (result.granted) {
          toast({
            title: "Permission granted",
            description: "You can now block distracting apps during focus time",
          });
        } else {
          toast({
            title: "Permission required",
            description: "App blocking requires accessibility permissions",
            variant: "destructive"
          });
        }
      }
    } catch (error) {
      console.error('Error requesting permission:', error);
      toast({
        title: "Permission error",
        description: "Could not request blocking permission",
        variant: "destructive"
      });
    }
  };

  const addBlockedApp = (app: { packageName: string, appName: string }) => {
    const newApp: BlockedApp = {
      packageName: app.packageName,
      appName: app.appName,
      category: category,
    };

    if (!blockedApps.some(a => a.packageName === app.packageName)) {
      setBlockedApps([...blockedApps, newApp]);
      toast({
        title: "App blocked",
        description: `${app.appName} will be blocked during focus time`
      });
    }
    
    setIsAppPickerOpen(false);
  };

  const addBlockedWebsite = () => {
    if (newSite && !blockedApps.some(a => a.packageName === newSite)) {
      const newWebsite: BlockedApp = {
        packageName: newSite,
        appName: newSite,
        category: category
      };
      
      setBlockedApps([...blockedApps, newWebsite]);
      setNewSite('');
      
      toast({
        title: "Website blocked",
        description: `${newSite} will be blocked during focus time`
      });
    }
    
    setIsAddSiteDialogOpen(false);
  };

  const removeBlockedApp = (packageName: string) => {
    setBlockedApps(blockedApps.filter(a => a.packageName !== packageName));
    
    toast({
      title: "App removed",
      description: "App removed from blocklist"
    });
  };

  // Filter installed apps based on search query
  const filteredApps = searchQuery 
    ? installedApps.filter(app => 
        app.appName.toLowerCase().includes(searchQuery.toLowerCase()))
    : installedApps;

  // In a real app, this would interact with browser extensions or mobile app APIs
  // Here we're using the native capabilities if available, otherwise simulating the blocking behavior
  const isBlocking = isRunning && mode === 'focus' && serviceEnabled;

  return (
    <div className="space-y-4 mt-6">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-medium flex items-center">
          <Ban size={18} className="mr-2 text-gray-500" /> 
          Distraction Blocker
        </h3>
        
        <div className="flex items-center">
          <span className={`flex items-center text-sm ${isBlocking ? 'text-green-500' : 'text-gray-400'}`}>
            <Lock size={16} className={`mr-1 ${isBlocking ? 'fill-green-100' : ''}`} />
            {isBlocking ? 'Blocking active' : 'Not blocking'}
          </span>
        </div>
      </div>
      
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 space-y-3">
        {blockedApps.length === 0 ? (
          <div className="text-center py-4">
            <AppWindow size={32} className="mx-auto text-gray-400 mb-2" />
            <p className="text-sm text-gray-500 dark:text-gray-400">No apps blocked yet</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Block distracting apps to stay focused
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <ScrollArea className="max-h-48">
              <div className="space-y-2 pr-3">
                {blockedApps.map((app) => (
                  <div 
                    key={app.packageName} 
                    className="flex items-center justify-between bg-white dark:bg-gray-700 p-2 rounded-lg shadow-sm"
                  >
                    <div className="flex flex-col">
                      <span className="text-sm font-medium truncate max-w-[180px]">
                        {app.appName}
                      </span>
                      <Badge variant="outline" className="mt-1">
                        {app.category}
                      </Badge>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => removeBlockedApp(app.packageName)}
                      className="h-7 w-7 p-0"
                      disabled={isBlocking}
                    >
                      <X size={16} className="text-gray-500" />
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}
        
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={handleShowAppPicker}
          disabled={isBlocking}
        >
          {isNativePlatform ? "Add app to block" : "Add website to block"}
        </Button>
        
        {!serviceEnabled && isNativePlatform && (
          <div className="flex items-center p-2 mt-2 bg-amber-50 dark:bg-amber-900/30 rounded-md">
            <AlertCircle size={16} className="text-amber-500 mr-2 shrink-0" />
            <p className="text-xs text-amber-600 dark:text-amber-400">
              Accessibility service disabled. Enable for app blocking.
            </p>
            <Button 
              variant="ghost" 
              size="sm" 
              className="ml-2 h-6 text-amber-600 hover:text-amber-700 hover:bg-amber-100 dark:text-amber-400"
              onClick={() => setIsPermissionDialogOpen(true)}
            >
              Enable
            </Button>
          </div>
        )}
      </div>
      
      {/* Website Dialog for Web Platform */}
      <Dialog open={isAddSiteDialogOpen} onOpenChange={setIsAddSiteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Block distracting website</DialogTitle>
            <DialogDescription>
              Add websites that distract you during focus sessions
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label htmlFor="site" className="text-sm font-medium">
                Website
              </label>
              <Input
                id="site"
                placeholder="e.g., facebook.com, twitter.com"
                value={newSite}
                onChange={(e) => setNewSite(e.target.value)}
              />
            </div>
            
            <div className="grid gap-2">
              <label htmlFor="category" className="text-sm font-medium">
                Category
              </label>
              <Select value={category} onValueChange={(value) => setCategory(value as AppCategory)}>
                <SelectTrigger id="category">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="social">Social Media</SelectItem>
                  <SelectItem value="entertainment">Entertainment</SelectItem>
                  <SelectItem value="shopping">Shopping</SelectItem>
                  <SelectItem value="news">News</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddSiteDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={addBlockedWebsite}>
              Add to blocklist
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* App Picker Dialog for Native Platform */}
      <Dialog open={isAppPickerOpen} onOpenChange={setIsAppPickerOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Select app to block</DialogTitle>
            <DialogDescription>
              Choose apps to block during focus sessions
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            <div>
              <Input
                placeholder="Search apps..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="mb-4"
              />
              
              <div className="grid gap-2">
                <label className="text-sm font-medium">
                  Category
                </label>
                <Select value={category} onValueChange={(value) => setCategory(value as AppCategory)}>
                  <SelectTrigger id="app-category">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="social">Social Media</SelectItem>
                    <SelectItem value="entertainment">Entertainment</SelectItem>
                    <SelectItem value="shopping">Shopping</SelectItem>
                    <SelectItem value="news">News</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <ScrollArea className="max-h-[300px]">
              {filteredApps.length === 0 ? (
                <p className="text-center py-4 text-gray-500">No apps found</p>
              ) : (
                <div className="space-y-2 pr-3">
                  {filteredApps.map((app) => (
                    <Button 
                      key={app.packageName}
                      variant="outline"
                      className="w-full justify-start h-auto py-3"
                      onClick={() => addBlockedApp(app)}
                    >
                      <span className="truncate">{app.appName}</span>
                    </Button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAppPickerOpen(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Permission Request Dialog */}
      <AlertDialog open={isPermissionDialogOpen} onOpenChange={setIsPermissionDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Enable accessibility service</AlertDialogTitle>
            <AlertDialogDescription>
              To block distracting apps, FocusTask needs accessibility service permissions.
              This allows the app to monitor which apps are being used during focus time.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={requestPermission}>
              Enable
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default DistractionBlocker;

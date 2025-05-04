
import React, { useState } from 'react';
import { Ban, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { useTimer } from '@/contexts/TimerContext';

const DistractionBlocker: React.FC = () => {
  const [isAddSiteDialogOpen, setIsAddSiteDialogOpen] = useState(false);
  const [blockedSites, setBlockedSites] = useState<string[]>([]);
  const [newSite, setNewSite] = useState('');
  const [category, setCategory] = useState('social');
  const { state: { isRunning, mode } } = useTimer();

  const addBlockedSite = () => {
    if (newSite && !blockedSites.includes(newSite)) {
      setBlockedSites([...blockedSites, newSite]);
      setNewSite('');
    }
    setIsAddSiteDialogOpen(false);
  };

  const removeBlockedSite = (site: string) => {
    setBlockedSites(blockedSites.filter(s => s !== site));
  };

  // In a real app, this would interact with browser extensions or mobile app APIs
  // Here we're just simulating the blocking behavior
  const isBlocking = isRunning && mode === 'focus';

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
        {blockedSites.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-2">No sites blocked yet</p>
        ) : (
          <div className="space-y-2">
            {blockedSites.map(site => (
              <div key={site} className="flex items-center justify-between bg-white dark:bg-gray-700 p-2 rounded">
                <span className="text-sm truncate max-w-[200px]">{site}</span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => removeBlockedSite(site)}
                  className="h-7 w-7 p-0"
                  disabled={isBlocking}
                >
                  <Ban size={15} />
                </Button>
              </div>
            ))}
          </div>
        )}
        
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => setIsAddSiteDialogOpen(true)}
          disabled={isBlocking}
        >
          Add website to block
        </Button>
      </div>
      
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
              <Select value={category} onValueChange={setCategory}>
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
            <Button onClick={addBlockedSite}>
              Add to blocklist
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DistractionBlocker;

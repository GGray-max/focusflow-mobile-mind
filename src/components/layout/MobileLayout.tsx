
import React from 'react';
import { useLocation } from 'react-router-dom';
import { LayoutGrid, Clock, BarChart3, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { useTimer } from '@/contexts/TimerContext';

interface MobileLayoutProps {
  children: React.ReactNode;
}

const MobileLayout: React.FC<MobileLayoutProps> = ({ children }) => {
  const location = useLocation();
  const { state: timerState } = useTimer();
  const pathname = location.pathname;
  
  const isTimerRunning = timerState.isRunning;

  return (
    <div className="flex flex-col min-h-screen max-w-md mx-auto">
      <div className="flex-1 px-4 py-6 overflow-auto pb-20">
        {children}
      </div>
      
      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 max-w-md mx-auto">
        <div className="flex justify-around items-center h-16">
          <Link
            to="/"
            className={cn(
              "flex flex-col items-center justify-center w-full py-2",
              pathname === '/' ? "text-focus-400" : "text-gray-500"
            )}
          >
            <LayoutGrid size={24} />
            <span className="text-xs mt-1">Tasks</span>
          </Link>
          
          <Link
            to="/timer"
            className={cn(
              "flex flex-col items-center justify-center w-full py-2 relative",
              pathname === '/timer' ? "text-focus-400" : "text-gray-500",
              isTimerRunning && "text-focus-400"
            )}
          >
            <Clock size={24} />
            <span className="text-xs mt-1">Timer</span>
            {isTimerRunning && (
              <span className="absolute top-1 right-6 h-2 w-2 rounded-full bg-focus-400 animate-pulse-gentle"></span>
            )}
          </Link>
          
          <Link
            to="/insights"
            className={cn(
              "flex flex-col items-center justify-center w-full py-2",
              pathname === '/insights' ? "text-focus-400" : "text-gray-500"
            )}
          >
            <BarChart3 size={24} />
            <span className="text-xs mt-1">Insights</span>
          </Link>
          
          <Link
            to="/settings"
            className={cn(
              "flex flex-col items-center justify-center w-full py-2",
              pathname === '/settings' ? "text-focus-400" : "text-gray-500"
            )}
          >
            <Settings size={24} />
            <span className="text-xs mt-1">Settings</span>
          </Link>
        </div>
      </nav>
    </div>
  );
};

export default MobileLayout;

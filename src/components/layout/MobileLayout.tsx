
import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { LayoutGrid, Clock, BarChart3, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
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
    <div className="flex flex-col min-h-screen max-w-md mx-auto bg-gray-50 dark:bg-gray-900">
      <div className="flex-1 px-4 py-6 overflow-auto pb-20 bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
        {children}
      </div>
      
      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 max-w-md mx-auto shadow-lg rounded-t-xl">
        <div className="flex justify-around items-center h-16">
          <Link
            to="/tasks"
            className={cn(
              "flex flex-col items-center justify-center w-full py-1 rounded-md mx-1 transition-all",
              pathname === '/tasks' 
                ? "text-focus-400 bg-focus-100 dark:bg-focus-400/10" 
                : "text-gray-500 hover:text-focus-300 hover:bg-gray-50 dark:hover:bg-gray-800"
            )}
          >
            <LayoutGrid size={20} strokeWidth={2} />
            <span className="text-xs mt-1 font-medium">Tasks</span>
          </Link>
          
          <Link
            to="/timer"
            className={cn(
              "flex flex-col items-center justify-center w-full py-1 rounded-md mx-1 transition-all relative",
              pathname === '/timer' 
                ? "text-focus-400 bg-focus-100 dark:bg-focus-400/10" 
                : "text-gray-500 hover:text-focus-300 hover:bg-gray-50 dark:hover:bg-gray-800",
              isTimerRunning && "text-focus-400"
            )}
          >
            <Clock size={20} strokeWidth={2} />
            <span className="text-xs mt-1 font-medium">Timer</span>
            {isTimerRunning && (
              <span className="absolute top-1 right-6 h-2.5 w-2.5 rounded-full bg-focus-400 animate-pulse-gentle"></span>
            )}
          </Link>
          
          <Link
            to="/insights"
            className={cn(
              "flex flex-col items-center justify-center w-full py-1 rounded-md mx-1 transition-all",
              pathname === '/insights' 
                ? "text-focus-400 bg-focus-100 dark:bg-focus-400/10" 
                : "text-gray-500 hover:text-focus-300 hover:bg-gray-50 dark:hover:bg-gray-800"
            )}
          >
            <BarChart3 size={20} strokeWidth={2} />
            <span className="text-xs mt-1 font-medium">Insights</span>
          </Link>
          
          <Link
            to="/settings"
            className={cn(
              "flex flex-col items-center justify-center w-full py-1 rounded-md mx-1 transition-all",
              pathname === '/settings' 
                ? "text-focus-400 bg-focus-100 dark:bg-focus-400/10" 
                : "text-gray-500 hover:text-focus-300 hover:bg-gray-50 dark:hover:bg-gray-800"
            )}
          >
            <Settings size={20} strokeWidth={2} />
            <span className="text-xs mt-1 font-medium">Settings</span>
          </Link>
        </div>
      </nav>
    </div>
  );
};

export default MobileLayout;

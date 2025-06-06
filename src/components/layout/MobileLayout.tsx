
import React, { ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ListTodo, Clock, BarChart, Settings, PieChart, Calendar, Target } from 'lucide-react';

interface MobileLayoutProps {
  children: ReactNode;
}

const MobileLayout: React.FC<MobileLayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Navigation items
  const navItems = [
    { path: '/tasks', Icon: ListTodo, label: 'Tasks' },
    { path: '/timer', Icon: Clock, label: 'Timer' },
    { path: '/insights', Icon: BarChart, label: 'Insights' },
    { path: '/vision-board', Icon: Target, label: 'My Why' },
    { path: '/review', Icon: PieChart, label: 'Review' },
    { path: '/calendar', Icon: Calendar, label: 'Calendar' },
    { path: '/settings', Icon: Settings, label: 'Settings' },
  ];

  return (
    <div className="max-w-md mx-auto min-h-screen flex flex-col bg-background">
      {/* Main content with improved scrolling and padding */}
      <main className="flex-1 px-4 sm:px-6 pb-24 md:pb-28 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="h-full pt-4 sm:pt-6"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
      
      {/* Responsive bottom navigation bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 px-2 sm:px-4 py-2 z-10 shadow-[0_-1px_3px_rgba(0,0,0,0.05)]">
        <div className="max-w-md mx-auto overflow-x-auto scrollbar-hide">
          <div className="flex justify-between min-w-max">
            {navItems.map(({ path, Icon, label }) => {
              const isActive = location.pathname === path;
              return (
                <button
                  key={path}
                  className={`flex flex-col items-center justify-center px-2 sm:px-3 py-1 sm:py-2 relative min-w-[3rem] sm:min-w-[3.5rem] ${
                    isActive 
                      ? 'text-focus-400'
                      : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-300'
                  }`}
                  onClick={() => navigate(path)}
                  aria-label={label}
                >
                  {isActive && (
                    <motion.div 
                      layoutId="navigation-pill"
                      className="absolute -top-1 w-1/2 h-1 bg-focus-400 rounded-full"
                      initial={false}
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                  <Icon 
                    size={20} 
                    className={isActive ? 'animate-pulse-gentle' : 'transition-transform group-hover:scale-105'} 
                  />
                  <span className="text-[0.65rem] sm:text-xs mt-1 font-medium truncate max-w-[4rem]">{label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>
    </div>
  );
};

export default MobileLayout;

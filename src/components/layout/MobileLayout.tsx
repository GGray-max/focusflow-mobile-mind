
import React, { ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ListTodo, Clock, BarChart, Settings, PieChart, Calendar, Target } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

interface MobileLayoutProps {
  children: ReactNode;
}

const MobileLayout: React.FC<MobileLayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme } = useTheme();

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
    <div className="w-full min-h-screen flex flex-col bg-gradient-to-br from-background via-background to-background/95 mx-0 px-0 transition-all duration-500" data-theme={theme}>
      {/* Enhanced Main content */}
      <main className="flex-1 px-4 sm:px-6 pb-28 md:pb-32 overflow-y-auto mx-0" data-theme={theme}>
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            className="h-full pt-6 sm:pt-8 w-full"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
      
      {/* Enhanced Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-t border-gray-200/50 dark:border-gray-700/50 px-2 sm:px-4 py-3 z-50 shadow-2xl shadow-black/5 w-full mx-0 transition-all duration-500" data-theme={theme}>
        <div className="w-full mx-auto overflow-x-auto scrollbar-hide">
          <div className="flex justify-between w-full min-w-0 relative">
            {/* Active indicator background */}
            <motion.div 
              className="absolute top-0 h-1 bg-gradient-to-r from-focus-400 to-focus-500 rounded-full"
              layoutId="nav-indicator"
              style={{
                width: `${100 / navItems.length}%`,
                left: `${navItems.findIndex(item => item.path === location.pathname) * (100 / navItems.length)}%`
              }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            />
            
            {navItems.map(({ path, Icon, label }, index) => {
              const isActive = location.pathname === path;
              return (
                <motion.button
                  key={path}
                  className={`flex flex-col items-center justify-center px-2 sm:px-3 py-2 relative min-w-0 w-full sm:min-w-[3.5rem] transition-all duration-300 rounded-xl ${
                    isActive 
                      ? 'text-focus-500 bg-focus-50 dark:bg-focus-900/30 shadow-lg'
                      : 'text-gray-500 hover:text-focus-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                  onClick={() => navigate(path)}
                  aria-label={label}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <div className="relative">
                    <Icon 
                      size={22} 
                      className={`transition-all duration-300 ${
                        isActive ? 'scale-110' : ''
                      }`} 
                    />
                    {isActive && (
                      <motion.div 
                        className="absolute -inset-2 bg-focus-400/20 rounded-full -z-10"
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.2 }}
                      />
                    )}
                  </div>
                  <span className={`text-[0.65rem] sm:text-xs mt-1.5 font-medium truncate max-w-full sm:max-w-[4rem] transition-all duration-300 ${
                    isActive ? 'font-semibold' : ''
                  }`}>
                    {label}
                  </span>
                </motion.button>
              );
            })}
          </div>
        </div>
      </nav>
    </div>
  );
};

export default MobileLayout;

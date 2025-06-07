
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
    <div className="fixed inset-0 w-full h-full flex flex-col bg-background text-foreground overflow-hidden" data-theme={theme}>
      {/* Main content with proper scrolling */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden" style={{ paddingBottom: '80px', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        <style jsx>{`
          main::-webkit-scrollbar {
            display: none;
          }
        `}</style>
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            className="min-h-full w-full p-4"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
      
      {/* Fixed Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 h-20 bg-background border-t border-border z-50 flex items-center justify-around px-2 shadow-lg">
        {navItems.map(({ path, Icon, label }, index) => {
          const isActive = location.pathname === path;
          return (
            <motion.button
              key={path}
              className={`flex flex-col items-center justify-center p-2 min-w-0 flex-1 rounded-lg transition-all duration-300 ${
                isActive 
                  ? 'text-primary bg-primary/10'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
              }`}
              onClick={() => navigate(path)}
              aria-label={label}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.95 }}
            >
              <Icon 
                size={22} 
                className={`transition-all duration-300 ${
                  isActive ? 'scale-110' : ''
                }`} 
              />
              <span className="text-xs mt-1 font-medium truncate">
                {label}
              </span>
            </motion.button>
          );
        })}
      </nav>
    </div>
  );
};

export default MobileLayout;

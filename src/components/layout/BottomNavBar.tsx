
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ListTodo, Clock, BarChart, Settings, PieChart, Calendar, Target } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

const BottomNavBar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme } = useTheme();

  // Navigation items matching MobileLayout
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
    <div className="fixed bottom-4 left-4 right-4 z-50 flex justify-center pointer-events-none">
      <motion.nav 
        className="flex items-center justify-around bg-background/95 backdrop-blur-lg border border-border rounded-full shadow-lg px-3 py-2 pointer-events-auto"
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
        style={{ minWidth: '320px', maxWidth: '90vw' }}
      >
        {navItems.map(({ path, Icon, label }, index) => {
          const isActive = location.pathname === path;
          return (
            <motion.button
              key={path}
              className={`flex flex-col items-center justify-center p-2 rounded-full transition-all duration-300 min-w-0 ${
                isActive 
                  ? 'text-primary bg-primary/10 scale-110'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
              }`}
              onClick={() => navigate(path)}
              aria-label={label}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.95 }}
            >
              <Icon 
                size={18} 
                className={`transition-all duration-300 ${
                  isActive ? 'scale-110' : ''
                }`} 
              />
              <span className="text-[10px] mt-1 font-medium truncate max-w-12">
                {label}
              </span>
            </motion.button>
          );
        })}
      </motion.nav>
    </div>
  );
};

export default BottomNavBar;

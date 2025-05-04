
import React, { ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ListTodo, Clock, BarChart, Settings, PieChart } from 'lucide-react';

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
    { path: '/review', Icon: PieChart, label: 'Review' },
    { path: '/settings', Icon: Settings, label: 'Settings' },
  ];

  return (
    <div className="max-w-md mx-auto min-h-screen flex flex-col bg-background">
      <main className="flex-1 p-4 pb-20 overflow-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="h-full"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
      
      <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 px-4 py-2 z-10">
        <div className="max-w-md mx-auto">
          <div className="flex justify-between">
            {navItems.map(({ path, Icon, label }) => (
              <button
                key={path}
                className={`flex flex-col items-center justify-center flex-grow py-1 ${
                  location.pathname === path 
                    ? 'text-focus-400'
                    : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-300'
                }`}
                onClick={() => navigate(path)}
              >
                <Icon size={20} className={location.pathname === path ? 'animate-pulse' : ''} />
                <span className="text-[10px] mt-1">{label}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>
    </div>
  );
};

export default MobileLayout;

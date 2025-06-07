import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, CheckSquare, Target, Clock, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

const BottomNavBar: React.FC = () => {
  const location = useLocation();
  
  const navItems = [
    { path: '/', icon: <Home className="h-5 w-5" />, label: 'Home' },
    { path: '/tasks', icon: <CheckSquare className="h-5 w-5" />, label: 'Tasks' },
    { path: '/vision-board', icon: <Target className="h-5 w-5" />, label: 'Vision' },
    { path: '/timer', icon: <Clock className="h-5 w-5" />, label: 'Timer' },
    { path: '/settings', icon: <Settings className="h-5 w-5" />, label: 'Settings' },
  ];
  
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background dark:bg-background border-t border-border/50 shadow-lg z-30 md:hidden">
      <div className="flex justify-between items-center h-16 px-2 sm:px-4">
        {navItems.map((item) => (
          <Link 
            key={item.path} 
            to={item.path} 
            className="flex flex-col items-center justify-center w-full h-full"
          >
            <div className={cn(
              "flex flex-col items-center justify-center w-full h-full",
              location.pathname === item.path ? "text-primary dark:text-primary-foreground" : "text-muted-foreground"
            )}>
              <div className="relative">
                {item.icon}
                {location.pathname === item.path && (
                  <span className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-primary dark:bg-primary-foreground rounded-full"></span>
                )}
              </div>
              <span className="text-[10px] sm:text-xs font-medium mt-1">{item.label}</span>
            </div>
          </Link>
        ))}
      </div>
    </nav>
  );
};

export default BottomNavBar;

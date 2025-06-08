
import React, { createContext, useContext, useReducer, useCallback, useMemo, useEffect } from 'react';
import { toast } from '@/components/ui/use-toast';
import { 
  Task, 
  TaskNote, 
  TaskLink, 
  FocusSession, 
  SubTask, 
  TaskContextType,
  useTasks 
} from './TaskContext';

// Enhanced Task interface extends the base Task
export interface EnhancedTask extends Task {
  // All enhanced properties are now in the base Task interface
}

// Enhanced context type extends the base context
interface EnhancedTaskContextType extends TaskContextType {
  // All enhanced functions are now in the base TaskContextType
}

const EnhancedTaskContext = createContext<EnhancedTaskContextType | undefined>(undefined);

export const useEnhancedTasks = () => {
  const context = useContext(EnhancedTaskContext);
  if (!context) {
    throw new Error('useEnhancedTasks must be used within an EnhancedTaskProvider');
  }
  return context;
};

export const EnhancedTaskProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Simply use the existing TaskProvider which now includes all enhanced functionality
  const taskContext = useTasks();

  return (
    <EnhancedTaskContext.Provider value={taskContext}>
      {children}
    </EnhancedTaskContext.Provider>
  );
};

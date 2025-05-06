import React, { createContext, useContext, useEffect, useReducer, ReactNode } from 'react';
import NotificationService from '../services/NotificationService';
import { toast } from '@/components/ui/use-toast';

export interface Task {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  createdAt: string;
  completedAt?: string; // Track when tasks are completed
  dueDate?: string;
  dueTime?: string; // Time for notifications
  notifyAt?: string; // Exact date and time for notification
  hasNotification: boolean;
  priority: 'low' | 'medium' | 'high';
  tags: string[];
  subtasks: SubTask[];
  isPriority: boolean;
  recurrence?: 'none' | 'daily' | 'weekly' | 'monthly'; // New: recurrence property
  isMonthlyTask?: boolean; // New: flag for monthly task
  isActive?: boolean; // New: track if recurring task is active
  lastCompleted?: string; // New: track when recurring task was last completed
}

export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
}

interface TaskState {
  tasks: Task[];
  loading: boolean;
  error: string | null;
}

type TaskAction =
  | { type: 'ADD_TASK'; payload: Task }
  | { type: 'UPDATE_TASK'; payload: Task }
  | { type: 'DELETE_TASK'; payload: string }
  | { type: 'TOGGLE_COMPLETE'; payload: string }
  | { type: 'TOGGLE_SUBTASK'; payload: { taskId: string; subtaskId: string } }
  | { type: 'LOAD_TASKS'; payload: Task[] }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'ADD_SUBTASK'; payload: { taskId: string; subtask: SubTask } }
  | { type: 'DELETE_SUBTASK'; payload: { taskId: string; subtaskId: string } }
  | { type: 'TOGGLE_PRIORITY'; payload: string }
  | { type: 'TOGGLE_RECURRENCE_STATE'; payload: string }; // New: toggle recurring task active state

const initialState: TaskState = {
  tasks: [],
  loading: true,
  error: null,
};

const taskReducer = (state: TaskState, action: TaskAction): TaskState => {
  switch (action.type) {
    case 'ADD_TASK':
      return {
        ...state,
        tasks: [action.payload, ...state.tasks],
      };
    case 'UPDATE_TASK':
      return {
        ...state,
        tasks: state.tasks.map((task) =>
          task.id === action.payload.id ? action.payload : task
        ),
      };
    case 'DELETE_TASK':
      return {
        ...state,
        tasks: state.tasks.filter((task) => task.id !== action.payload),
      };
    case 'TOGGLE_COMPLETE':
      return {
        ...state,
        tasks: state.tasks.map((task) => {
          if (task.id !== action.payload) return task;
          
          const now = new Date().toISOString();
          const newCompletedStatus = !task.completed;
          
          // Handle recurring tasks
          if (task.recurrence && task.recurrence !== 'none' && newCompletedStatus) {
            // For recurring tasks, we don't mark as completed but record last completion
            return {
              ...task,
              lastCompleted: now,
            };
          }
          
          // Regular tasks or monthly tasks
          return {
            ...task, 
            completed: newCompletedStatus, 
            completedAt: newCompletedStatus ? now : undefined 
          };
        }),
      };
    case 'TOGGLE_SUBTASK':
      return {
        ...state,
        tasks: state.tasks.map((task) =>
          task.id === action.payload.taskId
            ? {
                ...task,
                subtasks: task.subtasks.map((subtask) =>
                  subtask.id === action.payload.subtaskId
                    ? { ...subtask, completed: !subtask.completed }
                    : subtask
                ),
              }
            : task
        ),
      };
    case 'LOAD_TASKS':
      return {
        ...state,
        tasks: action.payload,
        loading: false,
      };
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        loading: false,
      };
    case 'ADD_SUBTASK':
      return {
        ...state,
        tasks: state.tasks.map((task) =>
          task.id === action.payload.taskId
            ? {
                ...task,
                subtasks: [...task.subtasks, action.payload.subtask],
              }
            : task
        ),
      };
    case 'DELETE_SUBTASK':
      return {
        ...state,
        tasks: state.tasks.map((task) =>
          task.id === action.payload.taskId
            ? {
                ...task,
                subtasks: task.subtasks.filter(
                  (subtask) => subtask.id !== action.payload.subtaskId
                ),
              }
            : task
        ),
      };
    case 'TOGGLE_PRIORITY':
      return {
        ...state,
        tasks: state.tasks.map((task) =>
          task.id === action.payload
            ? { ...task, isPriority: !task.isPriority }
            : task
        ),
      };
    case 'TOGGLE_RECURRENCE_STATE':
      return {
        ...state,
        tasks: state.tasks.map((task) =>
          task.id === action.payload
            ? { ...task, isActive: !task.isActive }
            : task
        ),
      };
    default:
      return state;
  }
};

type TaskContextType = {
  state: TaskState;
  addTask: (task: Omit<Task, 'id' | 'createdAt'>) => Promise<void>;
  updateTask: (task: Task) => void;
  deleteTask: (id: string) => void;
  toggleComplete: (id: string) => void;
  toggleSubtask: (taskId: string, subtaskId: string) => void;
  addSubtask: (taskId: string, subtaskTitle: string) => void;
  deleteSubtask: (taskId: string, subtaskId: string) => void;
  togglePriority: (id: string) => void;
  toggleRecurrenceState: (id: string) => void; // New: toggle recurring task state
};

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export const TaskProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(taskReducer, initialState);

  useEffect(() => {
    const loadTasks = async () => {
      try {
        const savedTasks = localStorage.getItem('tasks');
        if (savedTasks) {
          dispatch({ type: 'LOAD_TASKS', payload: JSON.parse(savedTasks) });
        } else {
          dispatch({ type: 'LOAD_TASKS', payload: [] });
        }
      } catch (error) {
        console.error("Failed to load tasks:", error);
        dispatch({ type: 'SET_ERROR', payload: 'Failed to load tasks' });
      }
    };

    loadTasks();
  }, []);

  // Save tasks to localStorage whenever they change
  useEffect(() => {
    if (!state.loading) {
      localStorage.setItem('tasks', JSON.stringify(state.tasks));
    }
  }, [state.tasks, state.loading]);

  const addTask = async (task: Omit<Task, 'id' | 'createdAt'>) => {
    const now = new Date().toISOString();
    const taskId = Date.now().toString();
    
    const newTask: Task = {
      ...task,
      id: taskId,
      createdAt: now,
      hasNotification: task.hasNotification || false,
      isActive: task.recurrence && task.recurrence !== 'none' ? true : undefined,
    };
    
    dispatch({ type: 'ADD_TASK', payload: newTask });

    // Schedule notification if due date exists
    if (newTask.dueDate && newTask.hasNotification) {
      try {
        const dueDate = new Date(newTask.dueDate);
        if (newTask.dueTime) {
          const [hours, minutes] = newTask.dueTime.split(':').map(Number);
          dueDate.setHours(hours, minutes);
        }

        const scheduled = await NotificationService.scheduleTaskNotification(
          newTask.id,
          'Task Due',
          `Task "${newTask.title}" is due now!`,
          dueDate
        );
        
        if (scheduled) {
          console.log(`Notification scheduled for task ${newTask.id} at ${dueDate.toISOString()}`);
          toast({
            title: "Reminder set",
            description: `You'll be notified when "${newTask.title}" is due`,
          });
        }
      } catch (error) {
        console.error('Failed to schedule task notification:', error);
        toast({
          title: "Notification error",
          description: "Failed to schedule reminder. Check notification permissions.",
          variant: "destructive"
        });
      }
    }
  };

  const updateTask = (task: Task) => {
    dispatch({ type: 'UPDATE_TASK', payload: task });
    
    // If the task has a notification, update it
    if (task.hasNotification && task.dueDate && task.dueTime) {
      try {
        // Cancel existing notification
        NotificationService.cancelNotification(task.id);
        
        // Schedule new notification
        const dueDate = new Date(task.dueDate);
        const [hours, minutes] = task.dueTime.split(':').map(Number);
        dueDate.setHours(hours, minutes);
        
        NotificationService.scheduleTaskNotification(
          task.id,
          'Task Due',
          `Task "${task.title}" is due now!`,
          dueDate
        );
      } catch (error) {
        console.error('Failed to update task notification:', error);
      }
    } else if (!task.hasNotification) {
      // Cancel notification if it's been turned off
      NotificationService.cancelNotification(task.id);
    }
  };

  const deleteTask = (id: string) => {
    // Cancel any scheduled notifications for this task
    NotificationService.cancelNotification(id);
    dispatch({ type: 'DELETE_TASK', payload: id });
  };

  const toggleComplete = (id: string) => {
    const task = state.tasks.find(t => t.id === id);
    
    if (!task) return;
    
    dispatch({ type: 'TOGGLE_COMPLETE', payload: id });
    
    // If completing a non-recurring task, cancel any notifications
    if (!task.completed && (!task.recurrence || task.recurrence === 'none')) {
      NotificationService.cancelNotification(id);
    }
  };

  const toggleSubtask = (taskId: string, subtaskId: string) => {
    dispatch({ type: 'TOGGLE_SUBTASK', payload: { taskId, subtaskId } });
  };

  const addSubtask = (taskId: string, subtaskTitle: string) => {
    const subtask: SubTask = {
      id: `subtask-${Date.now()}`,
      title: subtaskTitle,
      completed: false,
    };
    dispatch({
      type: 'ADD_SUBTASK',
      payload: { taskId, subtask },
    });
  };

  const deleteSubtask = (taskId: string, subtaskId: string) => {
    dispatch({
      type: 'DELETE_SUBTASK',
      payload: { taskId, subtaskId },
    });
  };

  const togglePriority = (id: string) => {
    dispatch({ type: 'TOGGLE_PRIORITY', payload: id });
  };

  const toggleRecurrenceState = (id: string) => {
    dispatch({ type: 'TOGGLE_RECURRENCE_STATE', payload: id });
  };

  return (
    <TaskContext.Provider
      value={{
        state,
        addTask,
        updateTask,
        deleteTask,
        toggleComplete,
        toggleSubtask,
        addSubtask,
        deleteSubtask,
        togglePriority,
        toggleRecurrenceState,
      }}
    >
      {children}
    </TaskContext.Provider>
  );
};

export const useTasks = (): TaskContextType => {
  const context = useContext(TaskContext);
  if (context === undefined) {
    throw new Error('useTasks must be used within a TaskProvider');
  }
  return context;
};

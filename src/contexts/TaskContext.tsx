import React, { createContext, useContext, useEffect, useReducer, ReactNode } from 'react';
import NotificationService from '../services/NotificationService';

export interface Task {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  createdAt: string;
  completedAt?: string; // New: track when tasks are completed
  dueDate?: string;
  dueTime?: string; // Time for notifications
  notifyAt?: string; // Exact date and time for notification
  hasNotification: boolean;
  priority: 'low' | 'medium' | 'high';
  tags: string[];
  subtasks: SubTask[];
  isPriority: boolean;
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
  | { type: 'TOGGLE_PRIORITY'; payload: string };

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
        tasks: state.tasks.map((task) =>
          task.id === action.payload
            ? { 
                ...task, 
                completed: !task.completed, 
                completedAt: !task.completed ? new Date().toISOString() : undefined 
              }
            : task
        ),
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
    const newTask: Task = {
      ...task,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      hasNotification: task.hasNotification || false,
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
        
        // Try to get custom notification sound from localStorage
        const customSound = localStorage.getItem('customTaskSound') ? 
          'custom-task-sound.mp3' : 'beep.wav';

        await NotificationService.scheduleTaskNotification(
          newTask.id,
          'Task Due',
          `Task "${newTask.title}" is due now!`,
          dueDate,
          customSound
        );
      } catch (error) {
        console.error('Failed to schedule task notification:', error);
      }
    }
  };

  const updateTask = (task: Task) => {
    dispatch({ type: 'UPDATE_TASK', payload: task });
  };

  const deleteTask = (id: string) => {
    dispatch({ type: 'DELETE_TASK', payload: id });
  };

  const toggleComplete = (id: string) => {
    dispatch({ type: 'TOGGLE_COMPLETE', payload: id });
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

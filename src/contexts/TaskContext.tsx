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
  category?: string; // New: task category
  startTime?: string; // New: start time for task
  endTime?: string; // New: end time for task
  duration?: number; // New: duration in minutes
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
  categories: string[]; // New: available categories
  searchTerm: string; // New: search term for filtering
  filterCategory: string | null; // New: filter by category
  filterPriority: string | null; // New: filter by priority
  filterDueDate: string | null; // New: filter by due date
  sortBy: 'priority' | 'dueDate' | 'category' | 'createdAt'; // New: sort option
  sortDirection: 'asc' | 'desc'; // New: sort direction
  currentPage: number; // New: current page for pagination
  tasksPerPage: number; // New: tasks per page
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
  | { type: 'TOGGLE_RECURRENCE_STATE'; payload: string }
  | { type: 'SET_SEARCH_TERM'; payload: string }
  | { type: 'SET_FILTER_CATEGORY'; payload: string | null }
  | { type: 'SET_FILTER_PRIORITY'; payload: string | null }
  | { type: 'SET_FILTER_DUE_DATE'; payload: string | null }
  | { type: 'SET_SORT'; payload: { sortBy: 'priority' | 'dueDate' | 'category' | 'createdAt'; direction: 'asc' | 'desc' } }
  | { type: 'SET_PAGE'; payload: number }
  | { type: 'ADD_CATEGORY'; payload: string }
  | { type: 'UPDATE_CATEGORIES'; payload: string[] };

const initialState: TaskState = {
  tasks: [],
  loading: true,
  error: null,
  categories: ['Personal', 'Work', 'Shopping', 'Health', 'Education'],
  searchTerm: '',
  filterCategory: null,
  filterPriority: null,
  filterDueDate: null,
  sortBy: 'priority',
  sortDirection: 'desc',
  currentPage: 1,
  tasksPerPage: 10
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
    case 'SET_SEARCH_TERM':
      return {
        ...state,
        searchTerm: action.payload,
        currentPage: 1 // Reset to first page when searching
      };
    case 'SET_FILTER_CATEGORY':
      return {
        ...state,
        filterCategory: action.payload,
        currentPage: 1 // Reset to first page when filtering
      };
    case 'SET_FILTER_PRIORITY':
      return {
        ...state,
        filterPriority: action.payload,
        currentPage: 1 // Reset to first page when filtering
      };
    case 'SET_FILTER_DUE_DATE':
      return {
        ...state,
        filterDueDate: action.payload,
        currentPage: 1 // Reset to first page when filtering
      };
    case 'SET_SORT':
      return {
        ...state,
        sortBy: action.payload.sortBy,
        sortDirection: action.payload.direction
      };
    case 'SET_PAGE':
      return {
        ...state,
        currentPage: action.payload
      };
    case 'ADD_CATEGORY':
      if (state.categories.includes(action.payload)) {
        return state;
      }
      return {
        ...state,
        categories: [...state.categories, action.payload]
      };
    case 'UPDATE_CATEGORIES':
      return {
        ...state,
        categories: action.payload
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
  toggleRecurrenceState: (id: string) => void;
  setSearchTerm: (term: string) => void;
  setFilterCategory: (category: string | null) => void;
  setFilterPriority: (priority: string | null) => void;
  setFilterDueDate: (date: string | null) => void;
  setSort: (sortBy: 'priority' | 'dueDate' | 'category' | 'createdAt', direction: 'asc' | 'desc') => void;
  setPage: (page: number) => void;
  addCategory: (category: string) => void;
  getFilteredAndSortedTasks: () => Task[];
  getPaginatedTasks: () => Task[];
  getTotalPages: () => number;
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

  const setSearchTerm = (term: string) => {
    dispatch({ type: 'SET_SEARCH_TERM', payload: term });
  };

  const setFilterCategory = (category: string | null) => {
    dispatch({ type: 'SET_FILTER_CATEGORY', payload: category });
  };

  const setFilterPriority = (priority: string | null) => {
    dispatch({ type: 'SET_FILTER_PRIORITY', payload: priority });
  };

  const setFilterDueDate = (date: string | null) => {
    dispatch({ type: 'SET_FILTER_DUE_DATE', payload: date });
  };

  const setSort = (sortBy: 'priority' | 'dueDate' | 'category' | 'createdAt', direction: 'asc' | 'desc') => {
    dispatch({ type: 'SET_SORT', payload: { sortBy, direction } });
  };

  const setPage = (page: number) => {
    dispatch({ type: 'SET_PAGE', payload: page });
  };

  const addCategory = (category: string) => {
    dispatch({ type: 'ADD_CATEGORY', payload: category });
  };

  const getFilteredAndSortedTasks = (): Task[] => {
    let filteredTasks = [...state.tasks];
    
    // Apply search term filter
    if (state.searchTerm) {
      const searchLower = state.searchTerm.toLowerCase();
      filteredTasks = filteredTasks.filter(task => 
        task.title.toLowerCase().includes(searchLower) || 
        (task.description && task.description.toLowerCase().includes(searchLower))
      );
    }
    
    // Apply category filter
    if (state.filterCategory) {
      filteredTasks = filteredTasks.filter(task => task.category === state.filterCategory);
    }
    
    // Apply priority filter
    if (state.filterPriority) {
      filteredTasks = filteredTasks.filter(task => task.priority === state.filterPriority);
    }
    
    // Apply due date filter
    if (state.filterDueDate) {
      const filterDate = new Date(state.filterDueDate);
      filterDate.setHours(0, 0, 0, 0);
      
      filteredTasks = filteredTasks.filter(task => {
        if (!task.dueDate) return false;
        
        const taskDate = new Date(task.dueDate);
        taskDate.setHours(0, 0, 0, 0);
        
        return taskDate.getTime() === filterDate.getTime();
      });
    }
    
    // Apply sorting
    filteredTasks.sort((a, b) => {
      let comparison = 0;
      
      switch (state.sortBy) {
        case 'priority':
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          comparison = priorityOrder[b.priority] - priorityOrder[a.priority];
          break;
        
        case 'dueDate':
          if (a.dueDate && b.dueDate) {
            comparison = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
          } else if (a.dueDate) {
            comparison = -1;
          } else if (b.dueDate) {
            comparison = 1;
          }
          break;
        
        case 'category':
          if (a.category && b.category) {
            comparison = a.category.localeCompare(b.category);
          } else if (a.category) {
            comparison = -1;
          } else if (b.category) {
            comparison = 1;
          }
          break;
        
        case 'createdAt':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
      }
      
      return state.sortDirection === 'asc' ? comparison : -comparison;
    });
    
    return filteredTasks;
  };
  
  const getPaginatedTasks = (): Task[] => {
    const filteredAndSorted = getFilteredAndSortedTasks();
    const startIndex = (state.currentPage - 1) * state.tasksPerPage;
    return filteredAndSorted.slice(startIndex, startIndex + state.tasksPerPage);
  };
  
  const getTotalPages = (): number => {
    const filteredAndSorted = getFilteredAndSortedTasks();
    return Math.ceil(filteredAndSorted.length / state.tasksPerPage);
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
        setSearchTerm,
        setFilterCategory,
        setFilterPriority,
        setFilterDueDate,
        setSort,
        setPage,
        addCategory,
        getFilteredAndSortedTasks,
        getPaginatedTasks,
        getTotalPages
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

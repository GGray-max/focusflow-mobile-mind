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
  recurrence?: 'none' | 'daily' | 'weekly' | 'monthly'; // Recurrence property
  isMonthlyTask?: boolean; // Flag for monthly task
  isActive?: boolean; // Track if recurring task is active
  lastCompleted?: string; // Track when recurring task was last completed
  category?: string; // Task category
  startTime?: string; // Start time for task
  endTime?: string; // End time for task
  duration?: number; // Duration in minutes
  totalTimeSpent?: number; // Accumulated time spent on this task in milliseconds
  focusSessions?: Array<{ date: string, duration: number }>; // History of focus sessions for this task
  streak?: number; // Track streak count for daily repeating tasks
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
  filterRecurring: string | null; // New: filter by recurring status
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
  | { type: 'SET_FILTER_RECURRING'; payload: string | null }
  | { type: 'SET_SORT'; payload: { sortBy: 'priority' | 'dueDate' | 'category' | 'createdAt'; direction: 'asc' | 'desc' } }
  | { type: 'SET_PAGE'; payload: number }
  | { type: 'ADD_CATEGORY'; payload: string }
  | { type: 'UPDATE_CATEGORIES'; payload: string[] }
  | { type: 'ADD_FOCUS_TIME'; payload: { taskId: string; duration: number } };

const initialState: TaskState = {
  tasks: [],
  loading: true,
  error: null,
  categories: ['Personal', 'Work', 'Shopping', 'Health', 'Education'],
  searchTerm: '',
  filterCategory: null,
  filterPriority: null,
  filterDueDate: null,
  filterRecurring: null,
  sortBy: 'priority',
  sortDirection: 'desc',
  currentPage: 1,
  tasksPerPage: 10
};

// Helper function to calculate next due date based on recurrence
const calculateNextDueDate = (dateString: string | undefined, recurrence: string): Date => {
  if (!dateString) return new Date();
  
  const date = new Date(dateString);
  const nextDate = new Date(date);
  
  switch (recurrence) {
    case 'daily':
      nextDate.setDate(date.getDate() + 1);
      break;
    case 'weekly':
      nextDate.setDate(date.getDate() + 7);
      break;
    case 'monthly':
      nextDate.setMonth(date.getMonth() + 1);
      break;
    default:
      return date;
  }
  
  return nextDate;
};

const taskReducer = (state: TaskState, action: TaskAction): TaskState => {
  switch (action.type) {
    case 'ADD_FOCUS_TIME':
      return {
        ...state,
        tasks: state.tasks.map((task) => {
          if (task.id !== action.payload.taskId) return task;
          
          // Create a new focus session entry
          const newSession = {
            date: new Date().toISOString(),
            duration: action.payload.duration
          };
          
          // Calculate new total time spent
          const currentTotal = task.totalTimeSpent || 0;
          const newTotal = currentTotal + action.payload.duration;
          
          // Update the task with the new session and total
          return {
            ...task,
            totalTimeSpent: newTotal,
            focusSessions: [...(task.focusSessions || []), newSession]
          };
        }),
      };
    case 'ADD_TASK':
      return {
        ...state,
        tasks: [action.payload, ...state.tasks],
      };
    case 'UPDATE_TASK':
      // Check if we're completing a recurring task
      if (action.payload.completed && !state.tasks.find(t => t.id === action.payload.id)?.completed) {
        const task = state.tasks.find(t => t.id === action.payload.id);
        if (task?.recurrence && task.recurrence !== 'none') {
          const nextDueDate = calculateNextDueDate(task.dueDate, task.recurrence);
          
          // Create a new instance of the task for the next recurrence
          const newTask: Task = {
            ...task,
            id: `${task.id}-${Date.now()}`,
            completed: false,
            dueDate: nextDueDate.toISOString().split('T')[0],
            lastCompleted: new Date().toISOString(),
            completedAt: undefined,
            subtasks: task.subtasks.map(st => ({ ...st, completed: false }))
          };
          
          return {
            ...state,
            tasks: [
              ...state.tasks.map(t => 
                t.id === action.payload.id ? { ...action.payload, lastCompleted: new Date().toISOString() } : t
              ),
              newTask
            ],
          };
        }
      }
      
      return {
        ...state,
        tasks: state.tasks.map(task =>
          task.id === action.payload.id ? { ...action.payload } : task
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
            // For recurring tasks that aren't daily, we don't mark as completed but record last completion
            if (task.recurrence !== 'daily') {
              return {
                ...task,
                lastCompleted: now,
              };
            }
            
            // For daily tasks, we need to handle the streak logic
            // This is a simplified version; the full streak logic is in the toggleComplete method
            return {
              ...task,
              completed: newCompletedStatus,
              completedAt: now,
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
      
    case 'SET_FILTER_RECURRING':
      return {
        ...state,
        filterRecurring: action.payload,
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

interface TaskContextType {
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
  setFilterRecurring: (recurring: string | null) => void;
  setSort: (sortBy: 'priority' | 'dueDate' | 'category' | 'createdAt', direction: 'asc' | 'desc') => void;
  setPage: (page: number) => void;
  addCategory: (category: string) => void;
  getFilteredAndSortedTasks: () => Task[];
  getPaginatedTasks: () => Task[];
  getTotalPages: () => number;
  addFocusTime: (taskId: string, duration: number) => void;
  getTask: (taskId: string) => Task | undefined;
  resetTaskTime: (taskId: string) => void;
};

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export const TaskProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(taskReducer, initialState);

  useEffect(() => {
    const loadTasks = () => {
      try {
        // Check if localStorage is available
        if (typeof localStorage === 'undefined') {
          console.info('localStorage not available, using default empty tasks');
          dispatch({ type: 'LOAD_TASKS', payload: [] });
          dispatch({ type: 'SET_ERROR', payload: null });
          return;
        }

        // Try to load tasks from localStorage
        const storedTasks = localStorage.getItem('tasks');
        if (storedTasks) {
          try {
            // Parse tasks with error handling
            const parsedTasks = JSON.parse(storedTasks);
            // Validate that parsed data is an array
            if (Array.isArray(parsedTasks)) {
              dispatch({ type: 'LOAD_TASKS', payload: parsedTasks });
            } else {
              console.error('Stored tasks is not an array, using default empty tasks');
              dispatch({ type: 'LOAD_TASKS', payload: [] });
            }
          } catch (parseError) {
            console.error('Error parsing stored tasks:', parseError);
            dispatch({ type: 'LOAD_TASKS', payload: [] });
          }
        } else {
          // No tasks found in storage
          dispatch({ type: 'LOAD_TASKS', payload: [] });
        }
        dispatch({ type: 'SET_ERROR', payload: null });
      } catch (error) {
        console.error('Error loading tasks:', error);
        dispatch({ type: 'LOAD_TASKS', payload: [] }); // Ensure we always have a valid task array
        dispatch({ type: 'SET_ERROR', payload: 'Failed to load tasks' });
      } finally {
        setTimeout(() => dispatch({ type: 'SET_LOADING', payload: false }), 500);
      }
    };

    loadTasks();
  }, []);

  useEffect(() => {
    // Check for streaks that need to be updated
    const checkAndUpdateStreaks = () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Calculate the date for two days ago
      const twoDaysAgo = new Date(today);
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
      
      // Find all daily recurring tasks
      const dailyTasks = state.tasks.filter(task => task.recurrence === 'daily' && task.streak);
      
      // Check each task to see if streak needs to be reset
      dailyTasks.forEach(task => {
        if (task.lastCompleted) {
          const lastCompletedDate = new Date(task.lastCompleted);
          lastCompletedDate.setHours(0, 0, 0, 0);
          
          // If the task hasn't been completed since 2 days ago, reset streak
          if (lastCompletedDate.getTime() <= twoDaysAgo.getTime()) {
            const updatedTask = {
              ...task,
              streak: 0 // Reset streak to 0
            };
            
            updateTask(updatedTask);
          }
        }
      });
    };
    
    // Only run this if tasks have been loaded
    if (state.tasks.length > 0) {
      checkAndUpdateStreaks();
    }
  }, [state.tasks.length]); // Re-run when tasks length changes (i.e., when tasks are loaded)

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

  const calculateNextOccurrence = (task: Task): string | undefined => {
    if (!task.dueDate || !task.recurrence || task.recurrence === 'none') {
      return undefined;
    }

    const currentDate = new Date(task.dueDate);
    const nextDate = new Date(currentDate);
    
    switch (task.recurrence) {
      case 'daily':
        nextDate.setDate(currentDate.getDate() + 1);
        break;
      case 'weekly':
        nextDate.setDate(currentDate.getDate() + 7);
        break;
      case 'monthly':
        nextDate.setMonth(currentDate.getMonth() + 1);
        // Handle edge case where the next month has fewer days
        if (nextDate.getDate() !== currentDate.getDate()) {
          nextDate.setDate(0); // Last day of the month
        }
        break;
    }
    
    return nextDate.toISOString().split('T')[0];
  };

  const toggleComplete = (id: string) => {
    const task = state.tasks.find(t => t.id === id);
    if (!task) return;
    
    // If completing a recurring task, create a new instance for the next occurrence
    if (!task.completed && task.recurrence && task.recurrence !== 'none') {
      const nextDueDate = calculateNextOccurrence(task);
      
      if (nextDueDate) {
        // Create a new task for the next occurrence
        const newTask: Omit<Task, 'id' | 'createdAt'> = {
          ...task,
          completed: false,
          completedAt: undefined,
          dueDate: nextDueDate,
          isPriority: task.isPriority,
          streak: (task.streak || 0) + 1,
          focusSessions: [],
          lastCompleted: new Date().toISOString(),
          totalTimeSpent: 0
        };
        
        // Add the new task
        addTask(newTask);
        
        // Update the current task to be completed
        const updatedTask = {
          ...task,
          completed: true,
          completedAt: new Date().toISOString(),
          lastCompleted: new Date().toISOString()
        };
        
        // Dispatch the update action
        dispatch({ type: 'UPDATE_TASK', payload: updatedTask });
        return; // Early return since we've handled the update
      }
    }
    
    // For non-recurring tasks or uncompleting tasks
    const updatedTask = {
      ...task,
      completed: !task.completed,
      completedAt: task.completed ? undefined : new Date().toISOString(),
      lastCompleted: !task.completed ? new Date().toISOString() : task.lastCompleted
    };
    
    // If un-completing, revert the streak
    if (task.completed && task.recurrence && task.recurrence !== 'none') {
      updatedTask.streak = Math.max(0, (task.streak || 1) - 1);
    }
    
    // Dispatch the update action
    dispatch({ type: 'UPDATE_TASK', payload: updatedTask });
    
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
  
  const setFilterRecurring = (recurring: string | null) => {
    dispatch({ type: 'SET_FILTER_RECURRING', payload: recurring });
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
    
    // Apply recurring filter
    if (state.filterRecurring) {
      if (state.filterRecurring === 'recurring') {
        filteredTasks = filteredTasks.filter(task => 
          task.recurrence && task.recurrence !== 'none'
        );
      } else if (state.filterRecurring === 'non-recurring') {
        filteredTasks = filteredTasks.filter(task => 
          !task.recurrence || task.recurrence === 'none'
        );
      }
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

  // Add focus time to a specific task
  const addFocusTime = (taskId: string, duration: number) => {
    dispatch({ type: 'ADD_FOCUS_TIME', payload: { taskId, duration } });
  };
  
  // Get a task by its ID
  const getTask = (taskId: string) => {
    return state.tasks.find(task => task.id === taskId);
  };
  
  // Reset a task's accumulated time
  const resetTaskTime = (taskId: string) => {
    const task = getTask(taskId);
    if (task) {
      const updatedTask = {
        ...task,
        totalTimeSpent: 0,
        focusSessions: []
      };
      updateTask(updatedTask);
    }
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
        setFilterRecurring,
        setSort,
        setPage,
        addCategory,
        getFilteredAndSortedTasks,
        getPaginatedTasks,
        getTotalPages,
        addFocusTime,
        getTask,
        resetTaskTime
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

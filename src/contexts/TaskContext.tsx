import React, { createContext, useContext, useReducer, useCallback, useMemo, useEffect } from 'react';
import { toast } from '@/components/ui/use-toast';

export interface FocusSession {
  startTime: string;
  endTime: string;
  duration: number;
}

export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
  createdAt: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  createdAt: string;
  completedAt?: string;
  updatedAt: string;
  dueDate?: string;
  dueTime?: string;
  startTime?: string;
  endTime?: string;
  duration?: number;
  notifyAt?: string;
  hasNotification?: boolean;
  priority: 'low' | 'medium' | 'high';
  category: string;
  tags: string[];
  subtasks: SubTask[];
  isPriority: boolean;
  recurrence?: 'none' | 'daily' | 'weekly' | 'monthly';
  isMonthlyTask?: boolean;
  isActive?: boolean;
  totalTimeSpent: number;
  focusSessions: FocusSession[];
}

interface TaskAction {
  type: 'ADD_TASK' | 'UPDATE_TASK' | 'DELETE_TASK' | 'TOGGLE_TASK' | 'TOGGLE_PRIORITY' | 'ADD_SUBTASK' | 'TOGGLE_SUBTASK' | 'SET_SEARCH_TERM' | 'SET_SORT_BY' | 'SET_FILTERS' | 'SET_PAGE' | 'SET_TASKS_PER_PAGE' | 'ADD_CATEGORY' | 'RESET_TASK_TIME' | 'SET_FILTER_CATEGORY' | 'SET_FILTER_PRIORITY' | 'SET_FILTER_DUE_DATE' | 'SET_FILTER_RECURRING';
  payload: any;
}

interface TaskState {
  tasks: Task[];
  searchTerm: string;
  sortBy: 'createdAt' | 'dueDate' | 'priority' | 'category';
  sortDirection: 'asc' | 'desc';
  showCompleted: boolean;
  showPriority: boolean;
  showRecurring: boolean;
  filterCategory?: string;
  filterPriority?: string;
  filterDueDate?: string;
  filterRecurring: boolean;
  page: number;
  tasksPerPage: number;
  categories: string[];
}

const initialState: TaskState = {
  tasks: [],
  searchTerm: '',
  sortBy: 'createdAt',
  sortDirection: 'desc',
  showCompleted: false,
  showPriority: false,
  showRecurring: false,
  filterRecurring: false,
  page: 1,
  tasksPerPage: 5,
  categories: ['Personal', 'Work', 'Study'],
};

const taskReducer = (state: TaskState, action: TaskAction): TaskState => {
  switch (action.type) {
    case 'ADD_TASK':
      return { ...state, tasks: [{ id: Date.now().toString(), createdAt: new Date().toISOString(), ...action.payload }, ...state.tasks] };
    case 'UPDATE_TASK':
      return {
        ...state,
        tasks: state.tasks.map((task) =>
          task.id === action.payload.id ? { ...task, ...action.payload.updates } : task
        ),
      };
    case 'DELETE_TASK':
      return { ...state, tasks: state.tasks.filter((task) => task.id !== action.payload) };
    case 'TOGGLE_TASK':
      return {
        ...state,
        tasks: state.tasks.map((task) =>
          task.id === action.payload ? { ...task, completed: !task.completed, completedAt: !task.completed ? new Date().toISOString() : undefined } : task
        ),
      };
    case 'TOGGLE_PRIORITY':
      return {
        ...state,
        tasks: state.tasks.map((task) =>
          task.id === action.payload ? { ...task, isPriority: !task.isPriority } : task
        ),
      };
    case 'ADD_SUBTASK':
      return {
        ...state,
        tasks: state.tasks.map((task) =>
          task.id === action.payload.taskId ? { ...task, subtasks: [...task.subtasks, { id: Date.now().toString(), title: action.payload.title, completed: false, createdAt: new Date().toISOString() }] } : task
        ),
      };
    case 'TOGGLE_SUBTASK':
      return {
        ...state,
        tasks: state.tasks.map((task) => {
          if (task.id === action.payload.taskId) {
            return {
              ...task,
              subtasks: task.subtasks.map((subtask) =>
                subtask.id === action.payload.subtaskId ? { ...subtask, completed: !subtask.completed } : subtask
              ),
            };
          }
          return task;
        }),
      };
    case 'SET_SEARCH_TERM':
      return { ...state, searchTerm: action.payload };
    case 'SET_SORT_BY':
      return { ...state, sortBy: action.payload.sortBy, sortDirection: action.payload.direction };
    case 'SET_FILTERS':
      return { ...state, showCompleted: action.payload.showCompleted, showPriority: action.payload.showPriority, showRecurring: action.payload.showRecurring, filterCategory: action.payload.category, filterPriority: action.payload.priority, filterDueDate: action.payload.dueDate };
    case 'SET_PAGE':
      return { ...state, page: action.payload };
    case 'SET_TASKS_PER_PAGE':
      return { ...state, tasksPerPage: action.payload };
    case 'ADD_CATEGORY':
      return { ...state, categories: [...new Set([...state.categories, action.payload])] };
    case 'RESET_TASK_TIME':
      return {
        ...state,
        tasks: state.tasks.map((task) =>
          task.id === action.payload ? { ...task, totalTimeSpent: 0, focusSessions: [] } : task
        ),
      };
    case 'SET_FILTER_CATEGORY':
      return { ...state, filterCategory: action.payload };
    case 'SET_FILTER_PRIORITY':
      return { ...state, filterPriority: action.payload };
    case 'SET_FILTER_DUE_DATE':
      return { ...state, filterDueDate: action.payload };
    case 'SET_FILTER_RECURRING':
      return { ...state, filterRecurring: action.payload };
    default:
      return state;
  }
};

interface TaskContextType {
  state: TaskState;
  addTask: (task: Omit<Task, 'id' | 'createdAt'>) => void;
  updateTask: (taskId: string, updates: Partial<Task>) => void;
  deleteTask: (taskId: string) => void;
  toggleTask: (taskId: string) => void;
  togglePriority: (taskId: string) => void;
  addSubtask: (taskId: string, title: string) => void;
  toggleSubtask: (taskId: string, subtaskId: string) => void;
  setSearchTerm: (term: string) => void;
  setSortBy: (sortBy: 'createdAt' | 'dueDate' | 'priority' | 'category', direction: 'asc' | 'desc') => void;
  setSort: (sortBy: 'createdAt' | 'dueDate' | 'priority' | 'category', direction: 'asc' | 'desc') => void;
  setFilters: (filters: { showCompleted: boolean; showPriority: boolean; showRecurring: boolean; category?: string; priority?: string; dueDate?: string }) => void;
  setPage: (page: number) => void;
  setTasksPerPage: (count: number) => void;
  getFilteredAndSortedTasks: () => Task[];
  getPaginatedTasks: () => Task[];
  getTotalPages: () => number;
  addCategory: (category: string) => void;
  resetTaskTime: (taskId: string) => void;
  setFilterCategory: (category?: string) => void;
  setFilterPriority: (priority?: string) => void;
  setFilterDueDate: (dueDate?: string) => void;
  setFilterRecurring: (recurring: boolean) => void;
  categories: string[];
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export const useTasks = () => {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error('useTasks must be used within a TaskProvider');
  }
  return context;
};

export const TaskProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(taskReducer, initialState);

  useEffect(() => {
    try {
      const storedTasks = localStorage.getItem('tasks');
      if (storedTasks) {
        const parsedTasks = JSON.parse(storedTasks);
        // Basic validation to ensure the stored data matches the Task interface
        if (Array.isArray(parsedTasks)) {
          dispatch({ type: 'SET_FILTERS', payload: { showCompleted: false, showPriority: false, showRecurring: false } });
          parsedTasks.forEach((task: any) => {
            if (
              typeof task.id === 'string' &&
              typeof task.title === 'string' &&
              typeof task.completed === 'boolean' &&
              typeof task.createdAt === 'string' &&
              typeof task.priority === 'string' &&
              typeof task.category === 'string' &&
              Array.isArray(task.tags) &&
              Array.isArray(task.subtasks)
            ) {
              dispatch({ type: 'ADD_TASK', payload: task });
            } else {
              console.warn('Invalid task format in localStorage:', task);
            }
          });
        } else {
          console.warn('Invalid tasks format in localStorage: tasks must be an array.');
          localStorage.removeItem('tasks');
        }
      }
    } catch (error) {
      console.error('Failed to load tasks from localStorage:', error);
      localStorage.removeItem('tasks');
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('tasks', JSON.stringify(state.tasks));
    } catch (error) {
      console.error('Failed to save tasks to localStorage:', error);
    }
  }, [state.tasks]);

  const addTask = useCallback((task: Omit<Task, 'id' | 'createdAt'>) => {
    dispatch({ type: 'ADD_TASK', payload: task });
    toast({
      title: "Task added successfully!",
      description: `You have successfully added ${task.title} to your task list.`,
    })
  }, []);

  const updateTask = useCallback((taskId: string, updates: Partial<Task>) => {
    dispatch({ type: 'UPDATE_TASK', payload: { id: taskId, updates } });
  }, []);

  const deleteTask = useCallback((taskId: string) => {
    dispatch({ type: 'DELETE_TASK', payload: taskId });
  }, []);

  const toggleTask = useCallback((taskId: string) => {
    dispatch({ type: 'TOGGLE_TASK', payload: taskId });
  }, []);

  const togglePriority = useCallback((taskId: string) => {
    dispatch({ type: 'TOGGLE_PRIORITY', payload: taskId });
  }, []);

  const addSubtask = useCallback((taskId: string, title: string) => {
    dispatch({ type: 'ADD_SUBTASK', payload: { taskId, title } });
  }, []);

  const toggleSubtask = useCallback((taskId: string, subtaskId: string) => {
    dispatch({ type: 'TOGGLE_SUBTASK', payload: { taskId, subtaskId } });
  }, []);

  const setSearchTerm = useCallback((term: string) => {
    dispatch({ type: 'SET_SEARCH_TERM', payload: term });
  }, []);

  const setSortBy = useCallback((sortBy: 'createdAt' | 'dueDate' | 'priority' | 'category', direction: 'asc' | 'desc') => {
    dispatch({ type: 'SET_SORT_BY', payload: { sortBy, direction } });
  }, []);

  const setSort = useCallback((sortBy: 'createdAt' | 'dueDate' | 'priority' | 'category', direction: 'asc' | 'desc') => {
    dispatch({ type: 'SET_SORT_BY', payload: { sortBy, direction } });
  }, []);

  const setFilters = useCallback((filters: { showCompleted: boolean; showPriority: boolean; showRecurring: boolean; category?: string; priority?: string; dueDate?: string }) => {
    dispatch({ type: 'SET_FILTERS', payload: filters });
  }, []);

  const setPage = useCallback((page: number) => {
    dispatch({ type: 'SET_PAGE', payload: page });
  }, []);

  const setTasksPerPage = useCallback((count: number) => {
    dispatch({ type: 'SET_TASKS_PER_PAGE', payload: count });
  }, []);

  const addCategory = useCallback((category: string) => {
    dispatch({ type: 'ADD_CATEGORY', payload: category });
  }, []);

  const resetTaskTime = useCallback((taskId: string) => {
    dispatch({ type: 'RESET_TASK_TIME', payload: taskId });
  }, []);

  const setFilterCategory = useCallback((category?: string) => {
    dispatch({ type: 'SET_FILTER_CATEGORY', payload: category });
  }, []);

  const setFilterPriority = useCallback((priority?: string) => {
    dispatch({ type: 'SET_FILTER_PRIORITY', payload: priority });
  }, []);

  const setFilterDueDate = useCallback((dueDate?: string) => {
    dispatch({ type: 'SET_FILTER_DUE_DATE', payload: dueDate });
  }, []);

  const setFilterRecurring = useCallback((recurring: boolean) => {
    dispatch({ type: 'SET_FILTER_RECURRING', payload: recurring });
  }, []);

  const getFilteredAndSortedTasks = useCallback(() => {
    let filteredTasks = [...state.tasks];

    if (state.showCompleted) {
      filteredTasks = filteredTasks.filter(task => !task.completed);
    }

    if (state.showPriority) {
      filteredTasks = filteredTasks.filter(task => task.isPriority);
    }

    if (state.filterCategory) {
      filteredTasks = filteredTasks.filter(task => task.category === state.filterCategory);
    }

    if (state.filterPriority) {
      filteredTasks = filteredTasks.filter(task => task.priority === state.filterPriority);
    }

    if (state.filterDueDate) {
      filteredTasks = filteredTasks.filter(task => task.dueDate === state.filterDueDate);
    }

    if (state.filterRecurring) {
      filteredTasks = filteredTasks.filter(task => task.recurrence !== 'none');
    }

    if (state.searchTerm) {
      const lowerCaseSearchTerm = state.searchTerm.toLowerCase();
      filteredTasks = filteredTasks.filter(task =>
        task.title.toLowerCase().includes(lowerCaseSearchTerm) ||
        (task.description && task.description.toLowerCase().includes(lowerCaseSearchTerm)) ||
        task.category.toLowerCase().includes(lowerCaseSearchTerm) ||
        task.priority.toLowerCase().includes(lowerCaseSearchTerm)
      );
    }

    const sortedTasks = [...filteredTasks].sort((a, b) => {
      let comparison = 0;

      if (state.sortBy === 'dueDate') {
        const dateA = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
        const dateB = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
        comparison = dateA - dateB;
      } else if (state.sortBy === 'priority') {
        const priorityOrder = { high: 1, medium: 2, low: 3 };
        comparison = (priorityOrder[a.priority] || 4) - (priorityOrder[b.priority] || 4);
      } else if (state.sortBy === 'category') {
        comparison = a.category.localeCompare(b.category);
      } else {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        comparison = dateA - dateB;
      }

      return state.sortDirection === 'asc' ? comparison : -comparison;
    });

    return sortedTasks;
  }, [state.tasks, state.searchTerm, state.sortBy, state.sortDirection, state.showCompleted, state.showPriority, state.filterCategory, state.filterPriority, state.filterDueDate, state.filterRecurring]);

  const getPaginatedTasks = useCallback(() => {
    const startIndex = (state.page - 1) * state.tasksPerPage;
    const endIndex = startIndex + state.tasksPerPage;
    return getFilteredAndSortedTasks().slice(startIndex, endIndex);
  }, [state.page, state.tasksPerPage, getFilteredAndSortedTasks]);

  const getTotalPages = useCallback(() => {
    return Math.ceil(getFilteredAndSortedTasks().length / state.tasksPerPage);
  }, [getFilteredAndSortedTasks, state.tasksPerPage]);

  const value = useMemo(() => ({
    state,
    addTask,
    updateTask,
    deleteTask,
    toggleTask,
    togglePriority,
    addSubtask,
    toggleSubtask,
    setSearchTerm,
    setSortBy,
    setSort,
    setFilters,
    setPage,
    setTasksPerPage,
    getFilteredAndSortedTasks,
    getPaginatedTasks,
    getTotalPages,
    addCategory,
    resetTaskTime,
    setFilterCategory,
    setFilterPriority,
    setFilterDueDate,
    setFilterRecurring,
    categories: state.categories,
  }), [state, addTask, updateTask, deleteTask, toggleTask, togglePriority, addSubtask, toggleSubtask, setSearchTerm, setSortBy, setSort, setFilters, setPage, setTasksPerPage, getFilteredAndSortedTasks, getPaginatedTasks, getTotalPages, addCategory, resetTaskTime, setFilterCategory, setFilterPriority, setFilterDueDate, setFilterRecurring, state.categories]);

  return (
    <TaskContext.Provider value={value}>
      {children}
    </TaskContext.Provider>
  );
};

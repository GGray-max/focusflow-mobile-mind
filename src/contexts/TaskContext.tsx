import React, { createContext, useContext, useReducer, useCallback, useMemo, useEffect } from 'react';
import { toast } from '@/components/ui/use-toast';

// Define types for subtasks and tasks
export type SubTask = {
  id: string;
  title: string;
  completed: boolean;
  createdAt: string;
};

export type FocusSession = {
  id: string;
  duration: number; // in seconds
  date: string;
  taskId: string;
};

export type Task = {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  completedAt?: string;
  isPriority: boolean;
  dueDate?: string;
  dueTime?: string;
  startTime?: string;
  endTime?: string;
  duration?: number; // in minutes
  createdAt: string;
  updatedAt: string;
  subtasks: SubTask[];
  tags: string[];
  estimatedTime?: number;
  actualTime?: number;
  totalTimeSpent?: number;
  priority: 'low' | 'medium' | 'high';
  category?: string;
  isMonthlyTask?: boolean;
  recurrence?: 'none' | 'daily' | 'weekly' | 'monthly';
  streak?: number;
  lastCompletedDate?: string;
  recurringTaskId?: string;
  focusSessions?: FocusSession[];
};

type TaskAction = 
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'ADD_TASK'; payload: Task }
  | { type: 'UPDATE_TASK'; payload: Task }
  | { type: 'DELETE_TASK'; payload: string }
  | { type: 'TOGGLE_COMPLETE'; payload: string }
  | { type: 'TOGGLE_SUBTASK'; payload: { taskId: string; subtaskId: string } }
  | { type: 'LOAD_TASKS'; payload: Task[] }
  | { type: 'ADD_SUBTASK'; payload: { taskId: string; subtask: SubTask } }
  | { type: 'DELETE_SUBTASK'; payload: { taskId: string; subtaskId: string } }
  | { type: 'TOGGLE_PRIORITY'; payload: string }
  | { type: 'TOGGLE_RECURRENCE_STATE'; payload: string }
  | { type: 'SET_SEARCH_TERM'; payload: string }
  | { type: 'SET_SORT_BY'; payload: { sortBy: 'createdAt' | 'dueDate' | 'priority'; direction: 'asc' | 'desc' } }
  | { type: 'SET_FILTERS'; payload: { showCompleted: boolean; showPriority: boolean; showRecurring: boolean; category?: string; priority?: string; dueDate?: string } }
  | { type: 'SET_PAGE'; payload: number }
  | { type: 'SET_TASKS_PER_PAGE'; payload: number }
  | { type: 'UPDATE_SUBTASK'; payload: { taskId: string; subtask: SubTask } }
  | { type: 'ADD_FOCUS_TIME'; payload: { taskId: string; timeSpent: number } }
  | { type: 'RESET_TASK_TIME'; payload: string }
  | { type: 'ADD_CATEGORY'; payload: string };

interface TaskState {
  tasks: Task[];
  loading: boolean;
  error: string | null;
  searchTerm: string;
  sortBy: 'createdAt' | 'dueDate' | 'priority';
  sortDirection: 'asc' | 'desc';
  filters: {
    showCompleted: boolean;
    showPriority: boolean;
    showRecurring: boolean;
    category?: string;
    priority?: string;
    dueDate?: string;
  };
  filterCategory?: string;
  filterPriority?: string;
  filterDueDate?: string;
  filterRecurring?: boolean;
  currentPage: number;
  tasksPerPage: number;
  categories: string[];
}

const initialState: TaskState = {
  tasks: [],
  loading: false,
  error: null,
  searchTerm: '',
  sortBy: 'createdAt',
  sortDirection: 'desc',
  filters: {
    showCompleted: false,
    showPriority: false,
    showRecurring: false,
  },
  filterCategory: undefined,
  filterPriority: undefined,
  filterDueDate: undefined,
  filterRecurring: undefined,
  currentPage: 1,
  tasksPerPage: 10,
  categories: ['Personal', 'Work', 'Health', 'Learning', 'Finance', 'Home'],
};

function taskReducer(state: TaskState, action: TaskAction): TaskState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    case 'LOAD_TASKS':
      return { ...state, tasks: action.payload, loading: false, error: null };
    case 'ADD_TASK':
      return { ...state, tasks: [action.payload, ...state.tasks] };
    case 'UPDATE_TASK':
      return {
        ...state,
        tasks: state.tasks.map(task =>
          task.id === action.payload.id ? action.payload : task
        )
      };
    case 'DELETE_TASK':
      return {
        ...state,
        tasks: state.tasks.filter(task => task.id !== action.payload)
      };
    case 'TOGGLE_COMPLETE':
      return {
        ...state,
        tasks: state.tasks.map(task =>
          task.id === action.payload
            ? { 
                ...task, 
                completed: !task.completed, 
                completedAt: !task.completed ? new Date().toISOString() : undefined,
                updatedAt: new Date().toISOString() 
              }
            : task
        )
      };
    case 'TOGGLE_PRIORITY':
      return {
        ...state,
        tasks: state.tasks.map(task =>
          task.id === action.payload
            ? { ...task, isPriority: !task.isPriority, updatedAt: new Date().toISOString() }
            : task
        )
      };
    case 'ADD_SUBTASK':
      return {
        ...state,
        tasks: state.tasks.map(task =>
          task.id === action.payload.taskId
            ? { ...task, subtasks: [...task.subtasks, action.payload.subtask], updatedAt: new Date().toISOString() }
            : task
        )
      };
    case 'UPDATE_SUBTASK':
      return {
        ...state,
        tasks: state.tasks.map(task =>
          task.id === action.payload.taskId
            ? {
                ...task,
                subtasks: task.subtasks.map(st =>
                  st.id === action.payload.subtask.id ? action.payload.subtask : st
                ),
                updatedAt: new Date().toISOString()
              }
            : task
        )
      };
    case 'DELETE_SUBTASK':
      return {
        ...state,
        tasks: state.tasks.map(task =>
          task.id === action.payload.taskId
            ? {
                ...task,
                subtasks: task.subtasks.filter(st => st.id !== action.payload.subtaskId),
                updatedAt: new Date().toISOString()
              }
            : task
        )
      };
    case 'TOGGLE_SUBTASK':
      return {
        ...state,
        tasks: state.tasks.map(task =>
          task.id === action.payload.taskId
            ? {
                ...task,
                subtasks: task.subtasks.map(st =>
                  st.id === action.payload.subtaskId
                    ? { ...st, completed: !st.completed }
                    : st
                ),
                updatedAt: new Date().toISOString()
              }
            : task
        )
      };
    case 'SET_SEARCH_TERM':
      return { ...state, searchTerm: action.payload, currentPage: 1 };
    case 'SET_SORT_BY':
      return {
        ...state,
        sortBy: action.payload.sortBy,
        sortDirection: action.payload.direction,
        currentPage: 1
      };
    case 'SET_FILTERS':
      return { ...state, filters: action.payload, currentPage: 1 };
    case 'SET_PAGE':
      return { ...state, currentPage: action.payload };
    case 'SET_TASKS_PER_PAGE':
      return { ...state, tasksPerPage: action.payload, currentPage: 1 };
    case 'ADD_FOCUS_TIME':
      return {
        ...state,
        tasks: state.tasks.map(task =>
          task.id === action.payload.taskId
            ? {
                ...task,
                totalTimeSpent: (task.totalTimeSpent || 0) + action.payload.timeSpent,
                focusSessions: [
                  ...(task.focusSessions || []),
                  {
                    id: Date.now().toString(),
                    duration: action.payload.timeSpent,
                    date: new Date().toISOString(),
                    taskId: task.id
                  }
                ],
                updatedAt: new Date().toISOString()
              }
            : task
        )
      };
    case 'RESET_TASK_TIME':
      return {
        ...state,
        tasks: state.tasks.map(task =>
          task.id === action.payload
            ? {
                ...task,
                totalTimeSpent: 0,
                focusSessions: [],
                updatedAt: new Date().toISOString()
              }
            : task
        )
      };
    case 'ADD_CATEGORY':
      return {
        ...state,
        categories: [...state.categories, action.payload]
      };
    default:
      return state;
  }
}

interface TaskContextType {
  state: TaskState;
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateTask: (task: Task) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  toggleComplete: (id: string) => void;
  togglePriority: (id: string) => void;
  addSubtask: (taskId: string, title: string) => void;
  updateSubtask: (taskId: string, subtaskId: string, updates: Partial<SubTask>) => void;
  deleteSubtask: (taskId: string, subtaskId: string) => void;
  toggleSubtask: (taskId: string, subtaskId: string) => void;
  setSearchTerm: (term: string) => void;
  setSortBy: (sortBy: 'createdAt' | 'dueDate' | 'priority', direction: 'asc' | 'desc') => void;
  setSort: (sortBy: 'createdAt' | 'dueDate' | 'priority', direction: 'asc' | 'desc') => void;
  setFilters: (filters: { showCompleted: boolean; showPriority: boolean; showRecurring: boolean; category?: string; priority?: string; dueDate?: string }) => void;
  setPage: (page: number) => void;
  setTasksPerPage: (count: number) => void;
  getFilteredAndSortedTasks: () => Task[];
  getPaginatedTasks: () => Task[];
  getTotalPages: () => number;
  addFocusTime: (taskId: string, timeSpent: number) => void;
  resetTaskTime: (taskId: string) => void;
  addCategory: (category: string) => void;
  setFilterCategory: (category?: string) => void;
  setFilterPriority: (priority?: string) => void;
  setFilterDueDate: (dueDate?: string) => void;
  setFilterRecurring: (recurring: boolean) => void;
  categories: string[];
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export const TaskProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(taskReducer, initialState);

  // Load tasks from localStorage on mount
  useEffect(() => {
    const loadTasks = async () => {
      try {
        dispatch({ type: 'SET_LOADING', payload: true });
        const storedTasks = localStorage.getItem('focusflow-tasks');
        if (storedTasks) {
          const tasks = JSON.parse(storedTasks);
          dispatch({ type: 'LOAD_TASKS', payload: tasks });
        } else {
          dispatch({ type: 'LOAD_TASKS', payload: [] });
        }
      } catch (error) {
        console.error('Error loading tasks:', error);
        dispatch({ type: 'SET_ERROR', payload: 'Failed to load tasks' });
      }
    };

    loadTasks();
  }, []);

  // Save tasks to localStorage whenever tasks change
  useEffect(() => {
    if (state.tasks.length > 0 || localStorage.getItem('focusflow-tasks')) {
      localStorage.setItem('focusflow-tasks', JSON.stringify(state.tasks));
    }
  }, [state.tasks]);

  const addTask = useCallback(async (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const newTask: Task = {
        ...taskData,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        subtasks: taskData.subtasks || [],
        tags: taskData.tags || [],
        priority: taskData.priority || 'medium',
        focusSessions: [],
      };

      dispatch({ type: 'ADD_TASK', payload: newTask });
      
      toast({
        title: "Task added",
        description: `"${newTask.title}" has been added to your tasks.`,
      });
    } catch (error) {
      console.error('Error adding task:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to add task' });
    }
  }, []);

  const updateTask = useCallback(async (updatedTask: Task) => {
    try {
      const taskWithUpdatedTime: Task = {
        ...updatedTask,
        updatedAt: new Date().toISOString(),
      };

      dispatch({ type: 'UPDATE_TASK', payload: taskWithUpdatedTime });
      
      toast({
        title: "Task updated",
        description: `"${taskWithUpdatedTime.title}" has been updated.`,
      });
    } catch (error) {
      console.error('Error updating task:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to update task' });
    }
  }, []);

  const deleteTask = useCallback(async (id: string) => {
    try {
      const task = state.tasks.find(t => t.id === id);
      dispatch({ type: 'DELETE_TASK', payload: id });
      
      toast({
        title: "Task deleted",
        description: task ? `"${task.title}" has been deleted.` : "Task has been deleted.",
      });
    } catch (error) {
      console.error('Error deleting task:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to delete task' });
    }
  }, [state.tasks]);

  const toggleComplete = useCallback((id: string) => {
    dispatch({ type: 'TOGGLE_COMPLETE', payload: id });
  }, []);

  const togglePriority = useCallback((id: string) => {
    dispatch({ type: 'TOGGLE_PRIORITY', payload: id });
  }, []);

  const addSubtask = useCallback((taskId: string, title: string) => {
    const newSubtask: SubTask = {
      id: Date.now().toString(),
      title,
      completed: false,
      createdAt: new Date().toISOString(),
    };
    dispatch({ type: 'ADD_SUBTASK', payload: { taskId, subtask: newSubtask } });
  }, []);

  const updateSubtask = useCallback((taskId: string, subtaskId: string, updates: Partial<SubTask>) => {
    const task = state.tasks.find(t => t.id === taskId);
    if (!task) return;

    const existingSubtask = task.subtasks.find(st => st.id === subtaskId);
    if (!existingSubtask) return;

    const updatedSubtask: SubTask = {
      ...existingSubtask,
      ...updates,
    };

    dispatch({ type: 'UPDATE_SUBTASK', payload: { taskId, subtask: updatedSubtask } });
  }, [state.tasks]);

  const deleteSubtask = useCallback((taskId: string, subtaskId: string) => {
    dispatch({ type: 'DELETE_SUBTASK', payload: { taskId, subtaskId } });
  }, []);

  const toggleSubtask = useCallback((taskId: string, subtaskId: string) => {
    dispatch({ type: 'TOGGLE_SUBTASK', payload: { taskId, subtaskId } });
  }, []);

  const setSearchTerm = useCallback((term: string) => {
    dispatch({ type: 'SET_SEARCH_TERM', payload: term });
  }, []);

  const setSortBy = useCallback((sortBy: 'createdAt' | 'dueDate' | 'priority', direction: 'asc' | 'desc') => {
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

  const addFocusTime = useCallback((taskId: string, timeSpent: number) => {
    dispatch({ type: 'ADD_FOCUS_TIME', payload: { taskId, timeSpent } });
  }, []);

  const resetTaskTime = useCallback((taskId: string) => {
    dispatch({ type: 'RESET_TASK_TIME', payload: taskId });
  }, []);

  const addCategory = useCallback((category: string) => {
    if (!state.categories.includes(category)) {
      dispatch({ type: 'ADD_CATEGORY', payload: category });
    }
  }, [state.categories]);

  const setFilterCategory = useCallback((category?: string) => {
    dispatch({ type: 'SET_FILTERS', payload: { ...state.filters, category } });
  }, [state.filters]);

  const setFilterPriority = useCallback((priority?: string) => {
    dispatch({ type: 'SET_FILTERS', payload: { ...state.filters, priority } });
  }, [state.filters]);

  const setFilterDueDate = useCallback((dueDate?: string) => {
    dispatch({ type: 'SET_FILTERS', payload: { ...state.filters, dueDate } });
  }, [state.filters]);

  const setFilterRecurring = useCallback((recurring: boolean) => {
    dispatch({ type: 'SET_FILTERS', payload: { ...state.filters, showRecurring: recurring } });
  }, [state.filters]);

  const getFilteredAndSortedTasks = useCallback(() => {
    let filteredTasks = [...state.tasks];

    // Apply search filter
    if (state.searchTerm) {
      const searchLower = state.searchTerm.toLowerCase();
      filteredTasks = filteredTasks.filter(task =>
        task.title.toLowerCase().includes(searchLower) ||
        (task.description && task.description.toLowerCase().includes(searchLower)) ||
        task.tags.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }

    // Apply filters
    if (!state.filters.showCompleted) {
      filteredTasks = filteredTasks.filter(task => !task.completed);
    }

    if (state.filters.showPriority) {
      filteredTasks = filteredTasks.filter(task => task.isPriority);
    }

    if (state.filters.showRecurring) {
      filteredTasks = filteredTasks.filter(task => task.recurrence && task.recurrence !== 'none');
    }

    if (state.filters.category) {
      filteredTasks = filteredTasks.filter(task => task.category === state.filters.category);
    }

    if (state.filters.priority) {
      filteredTasks = filteredTasks.filter(task => task.priority === state.filters.priority);
    }

    // Apply sorting
    filteredTasks.sort((a, b) => {
      let comparison = 0;

      switch (state.sortBy) {
        case 'createdAt':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'dueDate':
          if (!a.dueDate && !b.dueDate) comparison = 0;
          else if (!a.dueDate) comparison = 1;
          else if (!b.dueDate) comparison = -1;
          else comparison = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
          break;
        case 'priority':
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          comparison = priorityOrder[b.priority] - priorityOrder[a.priority];
          break;
      }

      return state.sortDirection === 'asc' ? comparison : -comparison;
    });

    return filteredTasks;
  }, [state.tasks, state.searchTerm, state.filters, state.sortBy, state.sortDirection]);

  const getPaginatedTasks = useCallback(() => {
    const filteredTasks = getFilteredAndSortedTasks();
    const startIndex = (state.currentPage - 1) * state.tasksPerPage;
    return filteredTasks.slice(startIndex, startIndex + state.tasksPerPage);
  }, [getFilteredAndSortedTasks, state.currentPage, state.tasksPerPage]);

  const getTotalPages = useCallback(() => {
    const filteredTasks = getFilteredAndSortedTasks();
    return Math.ceil(filteredTasks.length / state.tasksPerPage);
  }, [getFilteredAndSortedTasks, state.tasksPerPage]);

  const setSort = useCallback((sortBy: 'createdAt' | 'dueDate' | 'priority', direction: 'asc' | 'desc') => {
    dispatch({ type: 'SET_SORT_BY', payload: { sortBy, direction } });
  }, []);

  const value: TaskContextType = {
    state,
    addTask,
    updateTask,
    deleteTask,
    toggleComplete,
    togglePriority,
    addSubtask,
    updateSubtask,
    deleteSubtask,
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
    addFocusTime,
    resetTaskTime,
    addCategory,
    setFilterCategory,
    setFilterPriority,
    setFilterDueDate,
    setFilterRecurring,
    categories: state.categories,
  };

  return (
    <TaskContext.Provider value={value}>
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

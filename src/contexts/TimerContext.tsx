import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import SoundService from '@/services/SoundService';
import { toast } from '@/components/ui/use-toast';

type TimerMode = 'focus' | 'break' | 'idle';

// New interface for tracking focus sessions
interface FocusSession {
  id: string;
  date: string; // ISO string
  duration: number; // in milliseconds
  task: string | null;
  taskId: string | null; // Add task ID for tracking time by task
  completed: boolean;
}

interface TimerState {
  mode: TimerMode;
  timeLeft: number; // in seconds
  isRunning: boolean;
  focusDuration: number; // in minutes
  breakDuration: number; // in minutes
  sessionsCompleted: number;
  currentTask: string | null;
  currentTaskId: string | null; // Store current task ID
  treeHealth: number; // Tree health
  streakDays: number; // Track consecutive days of completed sessions
  lastActiveDay: string | null; // Track last day user completed a session
  focusSessions: FocusSession[]; // Track focus sessions
  totalFocusTime: number; // Total milliseconds spent focusing
  sessionStartTime: number | null; // Timestamp when session started
  soundEnabled: boolean; // Whether timer completion sound is enabled
  tickEnabled: boolean; // Whether tick sound in last 5 seconds is enabled
}

type TimerAction =
  | { type: 'START_TIMER'; payload?: { task?: string; taskId?: string } }
  | { type: 'PAUSE_TIMER' }
  | { type: 'RESET_TIMER' }
  | { type: 'TICK' }
  | { type: 'COMPLETE_SESSION' }
  | { type: 'SWITCH_TO_BREAK' }
  | { type: 'SWITCH_TO_FOCUS' }
  | { type: 'SET_FOCUS_DURATION'; payload: number }
  | { type: 'SET_BREAK_DURATION'; payload: number }
  | { type: 'UPDATE_TREE_HEALTH'; payload: number }
  | { type: 'RESET_TREE_HEALTH' }
  | { type: 'UPDATE_STREAK' }
  | { type: 'LOG_FOCUS_SESSION'; payload: { duration: number; task: string | null; taskId: string | null; completed: boolean } }
  | { type: 'TOGGLE_SOUND'; payload: boolean }
  | { type: 'TOGGLE_TICK_SOUND'; payload: boolean }
  | { type: 'LOAD_STATE'; payload: TimerState };

const DEFAULT_FOCUS_DURATION = 25; // 25 minutes
const DEFAULT_BREAK_DURATION = 5; // 5 minutes

const initialState: TimerState = {
  mode: 'idle',
  timeLeft: DEFAULT_FOCUS_DURATION * 60,
  isRunning: false,
  focusDuration: DEFAULT_FOCUS_DURATION,
  breakDuration: DEFAULT_BREAK_DURATION,
  sessionsCompleted: 0,
  currentTask: null,
  currentTaskId: null,
  treeHealth: 100,
  streakDays: 0,
  lastActiveDay: null,
  focusSessions: [],
  totalFocusTime: 0,
  sessionStartTime: null,
  soundEnabled: true, // Default to true
  tickEnabled: true, // Default to true
};

const timerReducer = (state: TimerState, action: TimerAction): TimerState => {
  switch (action.type) {
    case 'START_TIMER':
      return {
        ...state,
        isRunning: true,
        mode: state.mode === 'idle' ? 'focus' : state.mode,
        currentTask: action.payload?.task || state.currentTask,
        currentTaskId: action.payload?.taskId || state.currentTaskId,
        sessionStartTime: state.sessionStartTime || Date.now(),
      };
    case 'PAUSE_TIMER':
      // When pausing, log the partial session if we were in focus mode
      if (state.mode === 'focus' && state.sessionStartTime) {
        const sessionDurationMs = (Date.now() - state.sessionStartTime);
        if (sessionDurationMs > 10000) { // Only log if more than 10 seconds
          const newSession: FocusSession = {
            id: `session-${Date.now()}`,
            date: new Date().toISOString(),
            duration: sessionDurationMs,
            task: state.currentTask,
            taskId: state.currentTaskId,
            completed: false
          };

          return {
            ...state,
            isRunning: false,
            focusSessions: [...state.focusSessions, newSession],
            totalFocusTime: state.totalFocusTime + sessionDurationMs,
            sessionStartTime: null
          };
        }
      }
      return {
        ...state,
        isRunning: false,
        sessionStartTime: null
      };
    case 'RESET_TIMER':
      return {
        ...state,
        mode: 'idle',
        isRunning: false,
        timeLeft: state.focusDuration * 60,
        currentTask: null,
        currentTaskId: null,
        sessionStartTime: null
      };
    case 'TICK':
      if (state.timeLeft <= 1 && state.isRunning) {
        // Timer finished - play sound
        if (state.soundEnabled) {
          SoundService.play('timerComplete');
        }

        if (state.mode === 'focus') {
          // Complete focus session
          const today = new Date().toISOString().split('T')[0];
          const isNewStreak = state.lastActiveDay !== today;

          // Log the completed focus session
          const newSession: FocusSession = {
            id: `session-${Date.now()}`,
            date: new Date().toISOString(),
            duration: state.focusDuration * 60 * 1000,
            task: state.currentTask,
            taskId: state.currentTaskId,
            completed: true
          };

          return {
            ...state,
            isRunning: true,
            mode: 'break',
            timeLeft: state.breakDuration * 60,
            sessionsCompleted: state.sessionsCompleted + 1,
            lastActiveDay: today,
            streakDays: isNewStreak ? state.streakDays + 1 : state.streakDays,
            focusSessions: [...state.focusSessions, newSession],
            totalFocusTime: state.totalFocusTime + (state.focusDuration * 60 * 1000),
            sessionStartTime: Date.now() // Start the break timer
          };
        } else if (state.mode === 'break') {
          return {
            ...state,
            isRunning: false,
            mode: 'focus',
            timeLeft: state.focusDuration * 60,
            sessionStartTime: null
          };
        }
      } else if (state.timeLeft <= 5 && state.isRunning) {
        // Add tick sound for the last 5 seconds
        if (state.tickEnabled) {
          SoundService.play('timerTick');
        }
      }
      return {
        ...state,
        timeLeft: state.timeLeft - 1,
      };
    case 'COMPLETE_SESSION':
      if (state.mode === 'focus') {
        // When completing a focus session, log it and reward the user
        const sessionDurationMs = state.focusDuration * 60 * 1000; // in milliseconds
        
        const newSession: FocusSession = {
          id: `session-${Date.now()}`,
          date: new Date().toISOString(),
          duration: sessionDurationMs,
          task: state.currentTask,
          taskId: state.currentTaskId,
          completed: true
        };

        // Update streak
        let streakDays = state.streakDays;
        let lastActiveDay = state.lastActiveDay;
        const today = new Date().toISOString().split('T')[0];
        
        if (lastActiveDay !== today) {
          streakDays += 1;
          lastActiveDay = today;
        }

        return {
          ...state,
          mode: 'break',
          timeLeft: state.breakDuration * 60,
          isRunning: true,
          sessionsCompleted: state.sessionsCompleted + 1,
          focusSessions: [...state.focusSessions, newSession],
          totalFocusTime: state.totalFocusTime + sessionDurationMs,
          streakDays,
          lastActiveDay,
          sessionStartTime: Date.now() // Start the break timer
        };
      } 
    case 'SWITCH_TO_BREAK':
      return {
        ...state,
        mode: 'break',
        isRunning: false,
        timeLeft: state.breakDuration * 60,
        sessionStartTime: null
      };
    case 'SWITCH_TO_FOCUS':
      return {
        ...state,
        mode: 'focus',
        isRunning: false,
        timeLeft: state.focusDuration * 60,
        sessionStartTime: null
      };
    case 'SET_FOCUS_DURATION':
      return {
        ...state,
        focusDuration: action.payload,
        timeLeft: state.mode === 'focus' ? action.payload * 60 : state.timeLeft,
      };
    case 'SET_BREAK_DURATION':
      return {
        ...state,
        breakDuration: action.payload,
        timeLeft: state.mode === 'break' ? action.payload * 60 : state.timeLeft,
      };
    case 'UPDATE_TREE_HEALTH':
      return {
        ...state,
        treeHealth: Math.max(0, Math.min(100, action.payload)),
      };
    case 'RESET_TREE_HEALTH':
      return {
        ...state,
        treeHealth: 100,
      };
    case 'UPDATE_STREAK':
      const today = new Date().toISOString().split('T')[0];
      const isNewDay = state.lastActiveDay !== today;

      return {
        ...state,
        lastActiveDay: today,
        streakDays: isNewDay ? state.streakDays + 1 : state.streakDays,
      };
    case 'LOG_FOCUS_SESSION':
      const newFocusSession: FocusSession = {
        id: `session-${Date.now()}`,
        date: new Date().toISOString(),
        duration: action.payload.duration,
        task: action.payload.task,
        taskId: action.payload.taskId,
        completed: action.payload.completed
      };
      
      return {
        ...state,
        focusSessions: [...state.focusSessions, newFocusSession],
        totalFocusTime: state.totalFocusTime + action.payload.duration
      };
    case 'TOGGLE_SOUND':
      return {
        ...state,
        soundEnabled: action.payload
      };
    case 'TOGGLE_TICK_SOUND':
      return {
        ...state,
        tickEnabled: action.payload
      };
    case 'LOAD_STATE':
      return action.payload;
    default:
      return state;
  }
};

interface TimerContextType {
  state: TimerState;
  startTimer: (durationSeconds?: number, task?: string, taskId?: string) => void;
  pauseTimer: () => void;
  resetTimer: () => void;
  switchToBreak: () => void;
  switchToFocus: () => void;
  setFocusDuration: (minutes: number) => void;
  setBreakDuration: (minutes: number) => void;
  updateTreeHealth: (health: number) => void;
  resetTreeHealth: () => void;
  toggleSound: (enabled: boolean) => void;
  toggleTickSound: (enabled: boolean) => void;
  addEventListener: (event: string, callback: Function) => void;
  removeEventListener: (event: string, callback: Function) => void;
}

const TimerContext = createContext<TimerContextType | undefined>(undefined);

export const TimerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(timerReducer, initialState);

  useEffect(() => {
    // Load timer state from localStorage if available
    const savedState = localStorage.getItem('timerState');
    if (savedState) {
      try {
        const parsedState = JSON.parse(savedState);
        // Calculate how much time has passed since the timer was saved
        if (parsedState.isRunning) {
          // If the timer was running, we need to adjust the timeLeft
          const lastSaved = localStorage.getItem('timerLastSaved');
          if (lastSaved) {
            const timePassed = (Date.now() - parseInt(lastSaved)) / 1000;
            parsedState.timeLeft = Math.max(0, parsedState.timeLeft - Math.floor(timePassed));
          }
        }
        dispatch({ type: 'LOAD_STATE', payload: parsedState });
      } catch (error) {
        console.error('Failed to parse saved timer state', error);
      }
    }
  }, []);

  // Save timer state to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('timerState', JSON.stringify(state));
    if (state.isRunning) {
      localStorage.setItem('timerLastSaved', Date.now().toString());
    }
  }, [state]);

  // Timer tick logic with sound enhancements
  useEffect(() => {
    let interval: number | null = null;

    if (state.isRunning) {
      interval = window.setInterval(() => {
        dispatch({ type: 'TICK' });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [state.isRunning]);

  // Show toast notifications on mode changes
  useEffect(() => {
    if (state.timeLeft === 0) {
      if (state.mode === 'focus') {
        toast({
          title: 'Focus session completed!',
          description: 'Your tree has grown! Take a short break before continuing.',
        });
      } else if (state.mode === 'break') {
        toast({
          title: 'Break time over!',
          description: 'Ready to start another focus session?',
        });
      }
    }
  }, [state.mode, state.timeLeft]);

  // Handle visibility changes for tree health
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && state.isRunning && state.mode === 'focus') {
        // User left during focus time
        localStorage.setItem('timerLeftAt', Date.now().toString());
      } else if (document.visibilityState === 'visible') {
        // User came back
        const leftAt = localStorage.getItem('timerLeftAt');
        if (leftAt && state.isRunning && state.mode === 'focus') {
          const timeAway = (Date.now() - parseInt(leftAt)) / 1000;
          // If away for more than 10 seconds during focus, reduce tree health
          if (timeAway > 10) {
            const reduction = Math.min(Math.floor(timeAway / 10) * 5, state.treeHealth);
            updateTreeHealth(state.treeHealth - reduction);

            if (state.treeHealth - reduction <= 0) {
              toast({
                title: 'Your tree has died!',
                description: 'Stay focused next time to keep your tree alive.',
                variant: 'destructive'
              });
            } else if (state.treeHealth - reduction < 50) {
              toast({
                title: 'Your tree is withering!',
                description: 'Stay in focus mode to keep your tree healthy.',
                variant: 'destructive'
              });
            }
          }
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [state.isRunning, state.mode, state.treeHealth]);

  const startTimer = (durationSeconds?: number, task?: string, taskId?: string) => {
    if (state.mode === 'idle' || state.mode === 'focus') {
      resetTreeHealth();
    }
    
    // If duration provided, set it as focus duration first
    if (durationSeconds) {
      const durationMinutes = Math.round(durationSeconds / 60);
      setFocusDuration(durationMinutes);
    }
    
    dispatch({ type: 'START_TIMER', payload: { task, taskId } });
  };

  const pauseTimer = () => {
    dispatch({ type: 'PAUSE_TIMER' });
  };

  const resetTimer = () => {
    dispatch({ type: 'RESET_TIMER' });
  };

  const switchToBreak = () => {
    dispatch({ type: 'SWITCH_TO_BREAK' });
  };

  const switchToFocus = () => {
    resetTreeHealth();
    dispatch({ type: 'SWITCH_TO_FOCUS' });
  };

  const setFocusDuration = (minutes: number) => {
    dispatch({ type: 'SET_FOCUS_DURATION', payload: minutes });
  };

  const setBreakDuration = (minutes: number) => {
    dispatch({ type: 'SET_BREAK_DURATION', payload: minutes });
  };

  const updateTreeHealth = (health: number) => {
    dispatch({ type: 'UPDATE_TREE_HEALTH', payload: health });
  };

  const resetTreeHealth = () => {
    dispatch({ type: 'RESET_TREE_HEALTH' });
  };

  // Add new methods for sound toggling
  const toggleSound = (enabled: boolean) => {
    dispatch({ type: 'TOGGLE_SOUND', payload: enabled });
  };

  const toggleTickSound = (enabled: boolean) => {
    dispatch({ type: 'TOGGLE_TICK_SOUND', payload: enabled });
  };

  // Add event listener system for timer events
  const [listeners, setListeners] = React.useState<Record<string, Function[]>>({});
  
  const addEventListener = (event: string, callback: Function) => {
    setListeners(prev => {
      const updatedListeners = { ...prev };
      if (!updatedListeners[event]) {
        updatedListeners[event] = [];
      }
      updatedListeners[event] = [...updatedListeners[event], callback];
      return updatedListeners;
    });
  };
  
  const removeEventListener = (event: string, callback: Function) => {
    setListeners(prev => {
      const updatedListeners = { ...prev };
      if (updatedListeners[event]) {
        updatedListeners[event] = updatedListeners[event].filter(cb => cb !== callback);
      }
      return updatedListeners;
    });
  };
  
  // Emit events when timer state changes
  useEffect(() => {
    if (state.mode === 'break' && state.timeLeft === state.breakDuration * 60) {
      // Session completed
      if (listeners['timerFinished']) {
        const sessionData = {
          taskId: state.currentTaskId,
          task: state.currentTask,
          duration: state.focusDuration * 60 * 1000, // Convert to milliseconds
          completed: true
        };
        listeners['timerFinished'].forEach(cb => cb(sessionData));
      }
    }
  }, [state.mode, state.timeLeft, listeners]);

  return (
    <TimerContext.Provider
      value={{
        state,
        startTimer,
        pauseTimer,
        resetTimer,
        switchToBreak,
        switchToFocus,
        setFocusDuration,
        setBreakDuration,
        updateTreeHealth,
        resetTreeHealth,
        toggleSound,
        toggleTickSound,
        addEventListener,
        removeEventListener
      }}
    >
      {children}
    </TimerContext.Provider>
  );
};

export const useTimer = (): TimerContextType => {
  const context = useContext(TimerContext);
  if (context === undefined) {
    throw new Error('useTimer must be used within a TimerProvider');
  }
  return context;
};

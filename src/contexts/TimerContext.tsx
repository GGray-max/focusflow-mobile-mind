
import React, { createContext, useContext, useEffect, useReducer, ReactNode } from 'react';
import { toast } from '@/components/ui/use-toast';

type TimerMode = 'focus' | 'break' | 'idle';

interface TimerState {
  mode: TimerMode;
  timeLeft: number; // in seconds
  isRunning: boolean;
  focusDuration: number; // in minutes
  breakDuration: number; // in minutes
  sessionsCompleted: number;
  currentTask: string | null;
  treeHealth: number; // New: track tree health
  streakDays: number; // New: track consecutive days of completed sessions
  lastActiveDay: string | null; // New: track last day user completed a session
}

type TimerAction =
  | { type: 'START_TIMER'; payload?: { task?: string } }
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
  treeHealth: 100,
  streakDays: 0,
  lastActiveDay: null,
};

const timerReducer = (state: TimerState, action: TimerAction): TimerState => {
  switch (action.type) {
    case 'START_TIMER':
      return {
        ...state,
        isRunning: true,
        mode: state.mode === 'idle' ? 'focus' : state.mode,
        currentTask: action.payload?.task || state.currentTask,
      };
    case 'PAUSE_TIMER':
      return {
        ...state,
        isRunning: false,
      };
    case 'RESET_TIMER':
      return {
        ...state,
        mode: 'idle',
        isRunning: false,
        timeLeft: state.focusDuration * 60,
        currentTask: null,
      };
    case 'TICK':
      if (state.timeLeft <= 1) {
        // Timer finished
        if (state.mode === 'focus') {
          // Complete focus session
          const today = new Date().toISOString().split('T')[0];
          const isNewStreak = state.lastActiveDay !== today;
          
          return {
            ...state,
            isRunning: false,
            mode: 'break',
            timeLeft: state.breakDuration * 60,
            sessionsCompleted: state.sessionsCompleted + 1,
            lastActiveDay: today,
            streakDays: isNewStreak ? state.streakDays + 1 : state.streakDays,
          };
        } else if (state.mode === 'break') {
          return {
            ...state,
            isRunning: false,
            mode: 'focus',
            timeLeft: state.focusDuration * 60,
          };
        }
      }
      return {
        ...state,
        timeLeft: state.timeLeft - 1,
      };
    case 'COMPLETE_SESSION':
      return {
        ...state,
        sessionsCompleted: state.sessionsCompleted + 1,
        isRunning: false,
      };
    case 'SWITCH_TO_BREAK':
      return {
        ...state,
        mode: 'break',
        isRunning: false,
        timeLeft: state.breakDuration * 60,
      };
    case 'SWITCH_TO_FOCUS':
      return {
        ...state,
        mode: 'focus',
        isRunning: false,
        timeLeft: state.focusDuration * 60,
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
    case 'LOAD_STATE':
      return action.payload;
    default:
      return state;
  }
};

interface TimerContextType {
  state: TimerState;
  startTimer: (task?: string) => void;
  pauseTimer: () => void;
  resetTimer: () => void;
  switchToBreak: () => void;
  switchToFocus: () => void;
  setFocusDuration: (minutes: number) => void;
  setBreakDuration: (minutes: number) => void;
  updateTreeHealth: (health: number) => void;
  resetTreeHealth: () => void;
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

  // Timer tick logic
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

  const startTimer = (task?: string) => {
    if (state.mode === 'idle' || state.mode === 'focus') {
      resetTreeHealth();
    }
    dispatch({ type: 'START_TIMER', payload: { task } });
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
        resetTreeHealth
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

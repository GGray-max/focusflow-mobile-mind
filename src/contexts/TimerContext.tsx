
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
          return {
            ...state,
            isRunning: false,
            mode: 'break',
            timeLeft: state.breakDuration * 60,
            sessionsCompleted: state.sessionsCompleted + 1,
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
          description: 'Take a short break before continuing.',
        });
      } else if (state.mode === 'break') {
        toast({
          title: 'Break time over!',
          description: 'Ready to start another focus session?',
        });
      }
    }
  }, [state.mode, state.timeLeft]);

  const startTimer = (task?: string) => {
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
    dispatch({ type: 'SWITCH_TO_FOCUS' });
  };

  const setFocusDuration = (minutes: number) => {
    dispatch({ type: 'SET_FOCUS_DURATION', payload: minutes });
  };

  const setBreakDuration = (minutes: number) => {
    dispatch({ type: 'SET_BREAK_DURATION', payload: minutes });
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


import React, { createContext, useContext, useEffect, useReducer, ReactNode } from 'react';

export interface ProcrastinationEntry {
  id: string;
  timestamp: string;
  taskId?: string;
  taskName?: string;
  reason: string;
  mood?: 'frustrated' | 'bored' | 'anxious' | 'tired' | 'distracted';
  overcome: boolean;
}

interface ProcrastinationState {
  entries: ProcrastinationEntry[];
  loading: boolean;
  error: string | null;
}

type ProcrastinationAction =
  | { type: 'ADD_ENTRY'; payload: ProcrastinationEntry }
  | { type: 'UPDATE_ENTRY'; payload: ProcrastinationEntry }
  | { type: 'DELETE_ENTRY'; payload: string }
  | { type: 'MARK_OVERCOME'; payload: string }
  | { type: 'LOAD_ENTRIES'; payload: ProcrastinationEntry[] }
  | { type: 'SET_ERROR'; payload: string };

const initialState: ProcrastinationState = {
  entries: [],
  loading: true,
  error: null,
};

const procrastinationReducer = (
  state: ProcrastinationState,
  action: ProcrastinationAction
): ProcrastinationState => {
  switch (action.type) {
    case 'ADD_ENTRY':
      return {
        ...state,
        entries: [action.payload, ...state.entries],
      };
    case 'UPDATE_ENTRY':
      return {
        ...state,
        entries: state.entries.map((entry) =>
          entry.id === action.payload.id ? action.payload : entry
        ),
      };
    case 'DELETE_ENTRY':
      return {
        ...state,
        entries: state.entries.filter((entry) => entry.id !== action.payload),
      };
    case 'MARK_OVERCOME':
      return {
        ...state,
        entries: state.entries.map((entry) =>
          entry.id === action.payload ? { ...entry, overcome: true } : entry
        ),
      };
    case 'LOAD_ENTRIES':
      return {
        ...state,
        entries: action.payload,
        loading: false,
      };
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        loading: false,
      };
    default:
      return state;
  }
};

interface ProcrastinationContextType {
  state: ProcrastinationState;
  addEntry: (entry: Omit<ProcrastinationEntry, 'id' | 'timestamp' | 'overcome'>) => void;
  updateEntry: (entry: ProcrastinationEntry) => void;
  deleteEntry: (id: string) => void;
  markOvercome: (id: string) => void;
}

const ProcrastinationContext = createContext<ProcrastinationContextType | undefined>(undefined);

export const ProcrastinationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(procrastinationReducer, initialState);

  useEffect(() => {
    // Load entries from localStorage
    const loadEntries = async () => {
      try {
        const savedEntries = localStorage.getItem('procrastinationEntries');
        if (savedEntries) {
          dispatch({ type: 'LOAD_ENTRIES', payload: JSON.parse(savedEntries) });
        } else {
          dispatch({ type: 'LOAD_ENTRIES', payload: [] });
        }
      } catch (error) {
        console.error('Failed to load procrastination entries:', error);
        dispatch({
          type: 'SET_ERROR',
          payload: 'Failed to load procrastination entries',
        });
      }
    };

    loadEntries();
  }, []);

  // Save entries to localStorage when they change
  useEffect(() => {
    if (!state.loading) {
      localStorage.setItem('procrastinationEntries', JSON.stringify(state.entries));
    }
  }, [state.entries, state.loading]);

  const addEntry = (entry: Omit<ProcrastinationEntry, 'id' | 'timestamp' | 'overcome'>) => {
    const newEntry: ProcrastinationEntry = {
      ...entry,
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      overcome: false,
    };
    dispatch({ type: 'ADD_ENTRY', payload: newEntry });
  };

  const updateEntry = (entry: ProcrastinationEntry) => {
    dispatch({ type: 'UPDATE_ENTRY', payload: entry });
  };

  const deleteEntry = (id: string) => {
    dispatch({ type: 'DELETE_ENTRY', payload: id });
  };

  const markOvercome = (id: string) => {
    dispatch({ type: 'MARK_OVERCOME', payload: id });
  };

  return (
    <ProcrastinationContext.Provider
      value={{
        state,
        addEntry,
        updateEntry,
        deleteEntry,
        markOvercome,
      }}
    >
      {children}
    </ProcrastinationContext.Provider>
  );
};

export const useProcrastination = (): ProcrastinationContextType => {
  const context = useContext(ProcrastinationContext);
  if (context === undefined) {
    throw new Error('useProcrastination must be used within a ProcrastinationProvider');
  }
  return context;
};


import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { get, set } from 'idb-keyval';

// Media Item Type
export interface MediaItem {
  id: string;
  type: 'image' | 'audio' | 'video'; // Type of media
  url: string;  // URL or data URI of the media
  thumbnail?: string; // Optional thumbnail for videos
  mimeType?: string; // MIME type of the media file
  createdAt: string; // Date added
}

// Milestone Type
export interface Milestone {
  id: string;
  title: string; // Title of the milestone
  dueDate: string; // Target date
  completed: boolean; // Whether it's been achieved
  completedAt?: string; // When it was completed
  createdAt?: string; // When it was created
  notes?: string; // Any additional notes
}

// Journal Entry Type
export interface JournalEntry {
  id: string;
  content: string; // The journal content
  createdAt: string; // When it was written
  prompt?: string; // The optional prompt that was used
}

// Vision Board Entry Type
export interface VisionBoardEntry {
  id: string;
  imageUrl?: string;  // Primary image URL (kept for backward compatibility)
  title: string;      // Title of the vision/goal
  description: string; // Longer description or quote
  category?: string;  // Optional category
  linkedTaskIds?: string[]; // Optional linked task IDs
  createdAt: string;  // Date created
  
  // New fields for enhanced features
  milestones?: Milestone[]; // Timeline milestones
  journalEntries?: JournalEntry[]; // Reflection entries
  mediaItems?: MediaItem[]; // Additional media files
  importance?: string; // Why this vision is important
  successCriteria?: string; // What success looks like
  targetDate?: string; // Overall target date
  progressPercentage?: number; // Calculated progress
  completed?: boolean;
  completedAt?: string;
  notes?: string;
}

// Vision Board State
interface VisionBoardState {
  entries: VisionBoardEntry[];
  loading: boolean;
  error: string | null;
}

// Actions
type VisionBoardAction =
  | { type: 'ADD_ENTRY'; payload: VisionBoardEntry }
  | { type: 'UPDATE_ENTRY'; payload: VisionBoardEntry }
  | { type: 'DELETE_ENTRY'; payload: string }
  | { type: 'LOAD_ENTRIES'; payload: VisionBoardEntry[] }
  | { type: 'SET_ERROR'; payload: string };

// Initial State
const initialState: VisionBoardState = {
  entries: [],
  loading: true,
  error: null,
};

// Reducer
const visionBoardReducer = (state: VisionBoardState, action: VisionBoardAction): VisionBoardState => {
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

// Context Type
interface VisionBoardContextType {
  state: VisionBoardState;
  addEntry: (entry: Omit<VisionBoardEntry, 'id' | 'createdAt'>) => void;
  updateEntry: (entry: VisionBoardEntry) => void;
  deleteEntry: (id: string) => void;
  getRandomEntry: () => VisionBoardEntry | null;
  
  // Milestone methods
  addMilestone: (visionId: string, milestone: Omit<Milestone, 'id' | 'completed' | 'completedAt'>) => void;
  updateMilestone: (visionId: string, milestone: Milestone) => void;
  deleteMilestone: (visionId: string, milestoneId: string) => void;
  toggleMilestoneCompletion: (visionId: string, milestoneId: string) => void;
  
  // Journal methods
  addJournalEntry: (visionId: string, entry: Omit<JournalEntry, 'id' | 'createdAt'>) => void;
  updateJournalEntry: (visionId: string, entry: JournalEntry) => void;
  deleteJournalEntry: (visionId: string, entryId: string) => void;
  
  // Media methods
  addMediaItem: (visionId: string, item: Omit<MediaItem, 'id' | 'createdAt'>) => void;
  deleteMediaItem: (visionId: string, itemId: string) => void;
  
  // Task linking methods
  linkTask: (visionId: string, taskId: string) => void;
  unlinkTask: (visionId: string, taskId: string) => void;
  
  // Progress tracking
  updateProgress: (visionId: string, percentage: number) => void;
  calculateTaskProgress: (visionId: string) => number;
  
  // Get specific vision
  getVisionById: (id: string) => VisionBoardEntry | undefined;
}

// Create Context
const VisionBoardContext = createContext<VisionBoardContextType | undefined>(undefined);

// Provider Component
export const VisionBoardProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(visionBoardReducer, initialState);

  // Determine storage method (assuming web for now due to missing mobile storage dependencies)
  const isWeb = true; // Hardcoded to true as mobile storage solution is not currently available

  // Load entries from IndexedDB on initial render with migration from localStorage
  useEffect(() => {
    const loadEntries = async () => {
      try {
        let savedEntries = null;
        if (isWeb) {
          // Check for old localStorage data for migration
          const oldLocalStorageData = localStorage.getItem('visionBoardEntries');
          if (oldLocalStorageData) {
            console.log('Migrating vision board data from localStorage to IndexedDB');
            savedEntries = JSON.parse(oldLocalStorageData);
            // Save to IndexedDB
            await set('visionBoardEntries', savedEntries);
            // Clear old localStorage to free space
            localStorage.removeItem('visionBoardEntries');
          } else {
            savedEntries = await get('visionBoardEntries');
          }
        } else {
          console.warn('Mobile storage solution not implemented. Vision board data may not persist on mobile devices.');
          savedEntries = null;
        }
        if (savedEntries) {
          dispatch({ type: 'LOAD_ENTRIES', payload: savedEntries });
        } else {
          dispatch({ type: 'LOAD_ENTRIES', payload: [] });
        }
      } catch (error) {
        console.error('Error loading vision board entries:', error);
        dispatch({ type: 'SET_ERROR', payload: 'Failed to load vision board data' });
      }
    };

    loadEntries();
  }, [isWeb]);

  // Save entries to storage whenever they change
  useEffect(() => {
    if (!state.loading) {
      const saveEntries = async () => {
        try {
          if (isWeb) {
            await set('visionBoardEntries', state.entries);
          } else {
            console.warn('Mobile storage solution not implemented. Vision board data may not be saved on mobile devices.');
          }
        } catch (error) {
          console.error('Error saving vision board entries:', error);
          dispatch({ type: 'SET_ERROR', payload: 'Failed to save vision board data' });
        }
      };
      saveEntries();
    }
  }, [state.entries, state.loading, isWeb]);

  // Add a new entry
  const addEntry = (entry: Omit<VisionBoardEntry, 'id' | 'createdAt'>) => {
    const now = new Date().toISOString();
    const newEntry: VisionBoardEntry = {
      ...entry,
      id: `vision-${Date.now()}`,
      createdAt: now,
    };
    
    dispatch({ type: 'ADD_ENTRY', payload: newEntry });
  };

  // Update an existing entry
  const updateEntry = (entry: VisionBoardEntry) => {
    dispatch({ type: 'UPDATE_ENTRY', payload: entry });
  };

  // Delete an entry
  const deleteEntry = (id: string) => {
    dispatch({ type: 'DELETE_ENTRY', payload: id });
  };

  // Get a random entry for motivational reminders
  const getRandomEntry = (): VisionBoardEntry | null => {
    if (state.entries.length === 0) return null;
    const randomIndex = Math.floor(Math.random() * state.entries.length);
    return state.entries[randomIndex];
  };
  
  // Get a specific vision entry by ID
  const getVisionById = (id: string): VisionBoardEntry | undefined => {
    return state.entries.find(entry => entry.id === id);
  };
  
  // Milestone methods
  const addMilestone = (visionId: string, milestone: Omit<Milestone, 'id' | 'completed' | 'completedAt'>) => {
    const vision = getVisionById(visionId);
    if (!vision) return;
    
    const newMilestone: Milestone = {
      ...milestone,
      id: `milestone-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      completed: false,
    };
    
    const updatedVision = {
      ...vision,
      milestones: [...(vision.milestones || []), newMilestone],
    };
    
    updateEntry(updatedVision);
  };
  
  const updateMilestone = (visionId: string, milestone: Milestone) => {
    const vision = getVisionById(visionId);
    if (!vision || !vision.milestones) return;
    
    const updatedMilestones = vision.milestones.map(m => 
      m.id === milestone.id ? milestone : m
    );
    
    const updatedVision = {
      ...vision,
      milestones: updatedMilestones,
    };
    
    updateEntry(updatedVision);
  };
  
  const deleteMilestone = (visionId: string, milestoneId: string) => {
    const vision = getVisionById(visionId);
    if (!vision || !vision.milestones) return;
    
    const updatedMilestones = vision.milestones.filter(m => m.id !== milestoneId);
    
    const updatedVision = {
      ...vision,
      milestones: updatedMilestones,
    };
    
    updateEntry(updatedVision);
  };
  
  const toggleMilestoneCompletion = (visionId: string, milestoneId: string) => {
    const vision = getVisionById(visionId);
    if (!vision || !vision.milestones) return;
    
    const updatedMilestones = vision.milestones.map(m => {
      if (m.id !== milestoneId) return m;
      
      const now = new Date().toISOString();
      const completed = !m.completed;
      
      return {
        ...m,
        completed,
        completedAt: completed ? now : undefined,
      };
    });
    
    const updatedVision = {
      ...vision,
      milestones: updatedMilestones,
    };
    
    updateEntry(updatedVision);
  };
  
  // Journal methods
  const addJournalEntry = (visionId: string, entry: Omit<JournalEntry, 'id' | 'createdAt'>) => {
    const vision = getVisionById(visionId);
    if (!vision) return;
    
    const newEntry: JournalEntry = {
      ...entry,
      id: `journal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
    };
    
    const updatedVision = {
      ...vision,
      journalEntries: [...(vision.journalEntries || []), newEntry],
    };
    
    updateEntry(updatedVision);
  };
  
  const updateJournalEntry = (visionId: string, entry: JournalEntry) => {
    const vision = getVisionById(visionId);
    if (!vision || !vision.journalEntries) return;
    
    const updatedEntries = vision.journalEntries.map(e => 
      e.id === entry.id ? entry : e
    );
    
    const updatedVision = {
      ...vision,
      journalEntries: updatedEntries,
    };
    
    updateEntry(updatedVision);
  };
  
  const deleteJournalEntry = (visionId: string, entryId: string) => {
    const vision = getVisionById(visionId);
    if (!vision || !vision.journalEntries) return;
    
    const updatedEntries = vision.journalEntries.filter(e => e.id !== entryId);
    
    const updatedVision = {
      ...vision,
      journalEntries: updatedEntries,
    };
    
    updateEntry(updatedVision);
  };
  
  // Media methods
  const addMediaItem = (visionId: string, item: Omit<MediaItem, 'id' | 'createdAt'>) => {
    const vision = getVisionById(visionId);
    if (!vision) return;
    
    const newItem: MediaItem = {
      ...item,
      id: `media-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
    };
    
    const updatedVision = {
      ...vision,
      mediaItems: [...(vision.mediaItems || []), newItem],
    };
    
    updateEntry(updatedVision);
  };
  
  const deleteMediaItem = (visionId: string, itemId: string) => {
    const vision = getVisionById(visionId);
    if (!vision || !vision.mediaItems) return;
    
    const updatedItems = vision.mediaItems.filter(item => item.id !== itemId);
    
    const updatedVision = {
      ...vision,
      mediaItems: updatedItems,
    };
    
    updateEntry(updatedVision);
  };
  
  // Task linking methods
  const linkTask = (visionId: string, taskId: string) => {
    const vision = getVisionById(visionId);
    if (!vision) return;
    
    // Check if task is already linked
    if (vision.linkedTaskIds?.includes(taskId)) return;
    
    const updatedVision = {
      ...vision,
      linkedTaskIds: [...(vision.linkedTaskIds || []), taskId],
    };
    
    updateEntry(updatedVision);
  };
  
  const unlinkTask = (visionId: string, taskId: string) => {
    const vision = getVisionById(visionId);
    if (!vision || !vision.linkedTaskIds) return;
    
    const updatedTaskIds = vision.linkedTaskIds.filter(id => id !== taskId);
    
    const updatedVision = {
      ...vision,
      linkedTaskIds: updatedTaskIds,
    };
    
    updateEntry(updatedVision);
  };
  
  // Progress tracking
  const updateProgress = (visionId: string, percentage: number) => {
    const vision = getVisionById(visionId);
    if (!vision) return;
    
    const updatedVision = {
      ...vision,
      progressPercentage: percentage,
    };
    
    updateEntry(updatedVision);
  };
  
  const calculateTaskProgress = (visionId: string): number => {
    const vision = getVisionById(visionId);
    if (!vision || !vision.linkedTaskIds || vision.linkedTaskIds.length === 0) return 0;
    
    // This would ideally check task completion status from TaskContext
    // For now, just return the stored progress value or 0
    return vision.progressPercentage || 0;
  };

  return (
    <VisionBoardContext.Provider
      value={{
        state,
        addEntry,
        updateEntry,
        deleteEntry,
        getRandomEntry,
        getVisionById,
        
        // Milestone methods
        addMilestone,
        updateMilestone,
        deleteMilestone,
        toggleMilestoneCompletion,
        
        // Journal methods
        addJournalEntry,
        updateJournalEntry,
        deleteJournalEntry,
        
        // Media methods
        addMediaItem,
        deleteMediaItem,
        
        // Task linking methods
        linkTask,
        unlinkTask,
        
        // Progress tracking
        updateProgress,
        calculateTaskProgress,
      }}
    >
      {children}
    </VisionBoardContext.Provider>
  );
};

// Custom hook to use the vision board context
export const useVisionBoard = (): VisionBoardContextType => {
  const context = useContext(VisionBoardContext);
  if (context === undefined) {
    throw new Error('useVisionBoard must be used within a VisionBoardProvider');
  }
  return context;
};

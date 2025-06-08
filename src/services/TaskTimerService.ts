
import { Task, TaskSession, TaskDuration } from '@/types/TaskTypes';

export class TaskTimerService {
  private static instance: TaskTimerService;
  private activeSession: TaskSession | null = null;
  private sessionTimer: number | null = null;

  static getInstance(): TaskTimerService {
    if (!TaskTimerService.instance) {
      TaskTimerService.instance = new TaskTimerService();
    }
    return TaskTimerService.instance;
  }

  startTaskTimer(taskId: string, estimatedDuration: number): TaskSession {
    // Stop any existing session
    this.stopActiveSession();

    const session: TaskSession = {
      id: `session-${Date.now()}`,
      startTime: new Date().toISOString(),
      duration: estimatedDuration * 60 * 1000, // Convert to milliseconds
      type: 'focus',
      completed: false
    };

    this.activeSession = session;
    this.startSessionTimer(session, taskId);
    
    return session;
  }

  private startSessionTimer(session: TaskSession, taskId: string) {
    const startTime = Date.now();
    
    this.sessionTimer = window.setInterval(() => {
      if (this.activeSession && this.activeSession.id === session.id) {
        const elapsed = Date.now() - startTime;
        const remaining = session.duration - elapsed;
        
        // Emit timer update event
        window.dispatchEvent(new CustomEvent('taskTimerUpdate', {
          detail: {
            taskId,
            sessionId: session.id,
            elapsed,
            remaining: Math.max(0, remaining),
            isActive: true
          }
        }));

        // Auto-complete when timer ends
        if (remaining <= 0) {
          this.completeSession(taskId);
        }
      }
    }, 1000);
  }

  pauseActiveSession(): boolean {
    if (this.activeSession && this.sessionTimer) {
      clearInterval(this.sessionTimer);
      this.sessionTimer = null;
      
      // Update session duration to actual elapsed time
      const elapsed = Date.now() - new Date(this.activeSession.startTime).getTime();
      this.activeSession.duration = elapsed;
      
      return true;
    }
    return false;
  }

  resumeActiveSession(taskId: string): boolean {
    if (this.activeSession && !this.sessionTimer) {
      this.startSessionTimer(this.activeSession, taskId);
      return true;
    }
    return false;
  }

  completeSession(taskId: string): TaskSession | null {
    if (this.activeSession) {
      const session = { ...this.activeSession };
      session.endTime = new Date().toISOString();
      session.completed = true;
      session.duration = Date.now() - new Date(session.startTime).getTime();

      this.stopActiveSession();

      // Emit completion event
      window.dispatchEvent(new CustomEvent('taskSessionComplete', {
        detail: {
          taskId,
          session
        }
      }));

      return session;
    }
    return null;
  }

  private stopActiveSession() {
    if (this.sessionTimer) {
      clearInterval(this.sessionTimer);
      this.sessionTimer = null;
    }
    this.activeSession = null;
  }

  getActiveSession(): TaskSession | null {
    return this.activeSession;
  }

  isTaskActive(taskId: string): boolean {
    return this.activeSession !== null;
  }
}

export default TaskTimerService;

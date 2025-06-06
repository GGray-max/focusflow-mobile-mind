# FocusFlow Android Integration Guide

This guide provides instructions for implementing the new features in your FocusFlow Android application.

## 1. Background Timer Functionality

The background timer functionality ensures your focus timer continues to run even when the app is in the background or the screen is off.

### Key Components:

- **TimerService.java**: A foreground service that runs in the background, keeps a wake lock, and sends regular updates.
- **TimerPlugin.java**: A Capacitor plugin that acts as a bridge between your JavaScript/TypeScript code and the native Android service.
- **TimerService.ts**: A TypeScript service that provides an easy-to-use API for your React components.

### How to Use:

```typescript
import TimerService from '../services/TimerService';

// Start a timer (duration in seconds)
await TimerService.startTimer(1800, 'Deep Work Session');

// Pause the timer
await TimerService.pauseTimer();

// Resume the timer
await TimerService.resumeTimer();

// Stop the timer
await TimerService.stopTimer();

// Get timer status
const status = await TimerService.getTimerStatus();
console.log(`Timer is ${status.isRunning ? 'running' : 'stopped'}`);

// Listen for timer events
TimerService.addEventListener('timerUpdate', (data) => {
  console.log(`Time remaining: ${data.formattedTime}`);
  console.log(`Progress: ${data.percentComplete}%`);
});

TimerService.addEventListener('timerFinished', (session) => {
  console.log(`Completed a ${session.formattedDuration} focus session!`);
});
```

## 2. Smart Notifications for Repeated Tasks

This feature allows you to schedule recurring task notifications (daily, weekly, monthly) that will trigger even when the app is closed.

### Key Components:

- **RecurringTaskReceiver.java**: Handles alarms and displays notifications, also reschedules the next occurrence.
- **RecurringTasksPlugin.java**: A Capacitor plugin that allows your JS code to schedule and manage recurring tasks.
- **RecurringTasksService.ts**: A TypeScript service that provides a clean API for scheduling and managing tasks.

### How to Use:

```typescript
import RecurringTasksService from '../services/RecurringTasksService';

// Schedule a daily task (every day at 9:00 AM)
await RecurringTasksService.scheduleRecurringTask(
  'task_123',
  'Morning Routine',
  'Time for your morning focus session',
  'daily',
  { hour: 9, minute: 0 }
);

// Schedule a weekly task (every Monday at 10:30 AM)
// Note: dayOfWeek is 1 for Sunday, 2 for Monday, etc.
await RecurringTasksService.scheduleRecurringTask(
  'task_weekly',
  'Weekly Planning',
  'Time to plan your week',
  'weekly',
  { hour: 10, minute: 30, dayOfWeek: 2 }
);

// Schedule a monthly task (15th day of each month at 2:00 PM)
await RecurringTasksService.scheduleRecurringTask(
  'task_monthly',
  'Monthly Review',
  'Time for your monthly review',
  'monthly',
  { hour: 14, minute: 0, dayOfMonth: 15 }
);

// Cancel a recurring task
await RecurringTasksService.cancelRecurringTask('task_123');

// Get all scheduled tasks
const { tasks } = await RecurringTasksService.getScheduledTasks();
```

## 3. Enhanced Review Page

The FocusSummary component displays the user's total focus time in hours and minutes, along with other useful statistics.

### Key Component:

- **FocusSummary.tsx**: A React component that displays focus statistics in a formatted way.
- **FocusSummary.css**: Styling for the FocusSummary component.

### How to Use:

```tsx
import React from 'react';
import FocusSummary from '../components/FocusSummary';

const StatsPage: React.FC = () => {
  return (
    <div className="stats-container">
      <h1>Your Focus Statistics</h1>
      
      {/* Display focus summary with default settings */}
      <FocusSummary />
      
      {/* Or customize the history display */}
      <FocusSummary showHistory={true} maxHistoryItems={10} />
    </div>
  );
};

export default StatsPage;
```

## Implementation Checklist

1. **Add the Native Android Components**:
   - Ensure the Java files are in the correct packages
   - Update AndroidManifest.xml with services, receivers, and permissions
   - Register plugins in MainActivity.java

2. **Add the TypeScript Services**:
   - Ensure TimerService.ts is imported in your app
   - Ensure RecurringTasksService.ts is imported where needed
   - Add the FocusSummary component to your stats or review page

3. **Test All Features**:
   - Verify background timer runs when app is in background or screen is off
   - Verify notifications work for recurring tasks
   - Verify focus summary displays time in both hours and minutes format

## Troubleshooting

- If the timer stops in the background, check that the wake lock permission is properly set and that battery optimization is disabled for your app.
- If notifications don't trigger at the right time, check that the SCHEDULE_EXACT_ALARM permission is granted.
- If the FocusSummary component doesn't update in real-time, verify that it's properly listening to the TimerService events.

For more detailed information, refer to the comments in the implementation code.

package com.stanley.focusflow;

import android.app.AlarmManager;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;
import android.util.Log;

import androidx.core.app.NotificationCompat;

import com.stanley.focusflow.R;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.Calendar;
import java.util.TimeZone;

public class RecurringTaskReceiver extends BroadcastReceiver {
    private static final String TAG = "RecurringTaskReceiver";
    private static final String CHANNEL_ID = "recurring_task_channel";
    
    @Override
    public void onReceive(Context context, Intent intent) {
        Log.d(TAG, "Received recurring task alarm: " + intent.getAction());
        
        // Check if it's a recurring task notification
        if (intent.getAction() != null && intent.getAction().equals("com.stanley.focusflow.RECURRING_TASK")) {
            try {
                // Get task details from intent
                String taskId = intent.getStringExtra("TASK_ID");
                String taskJson = intent.getStringExtra("TASK_JSON");
                
                if (taskId == null || taskJson == null) {
                    Log.e(TAG, "Missing task ID or task JSON in intent");
                    return;
                }
                
                JSONObject taskObject = new JSONObject(taskJson);
                String title = taskObject.optString("title", "Focus Task");
                String body = taskObject.optString("body", "Time to focus on your task");
                String recurrence = taskObject.optString("recurrence", "daily");
                
                // Show notification for the task
                showTaskNotification(context, taskId, title, body);
                
                // Reschedule for next occurrence
                if (!recurrence.equals("once")) {
                    scheduleNextOccurrence(context, taskId, taskObject);
                }
                
                // Broadcast to app that notification was shown
                Intent broadcastIntent = new Intent("com.stanley.focusflow.TASK_NOTIFICATION_SHOWN");
                broadcastIntent.putExtra("TASK_ID", taskId);
                broadcastIntent.putExtra("NOTIFICATION_TIME", System.currentTimeMillis());
                context.sendBroadcast(broadcastIntent);
                
            } catch (JSONException e) {
                Log.e(TAG, "Error parsing task JSON", e);
            }
        } else if (intent.getAction() != null && intent.getAction().equals("android.intent.action.BOOT_COMPLETED")) {
            // Device was restarted, restore all scheduled notifications
            restoreScheduledTasks(context);
        }
    }
    
    private void showTaskNotification(Context context, String taskId, String title, String body) {
        // Create notification channel for Android O and above
        createNotificationChannel(context);
        
        // Create intent for when user taps notification
        // Main notification intent that opens the app when tapped
        Intent notificationIntent = new Intent(context, MainActivity.class);
        notificationIntent.putExtra("TASK_ID", taskId);
        notificationIntent.putExtra("OPEN_TASK", true);
        notificationIntent.setFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        
        PendingIntent pendingIntent = PendingIntent.getActivity(
                context, 
                taskId.hashCode(), 
                notificationIntent, 
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
        
        // Create "Start Focus" action
        // Intent for starting a focus session directly
        Intent startFocusIntent = new Intent(context, MainActivity.class);
        startFocusIntent.setAction("START_FOCUS");
        startFocusIntent.putExtra("TASK_ID", taskId);
        
        PendingIntent startFocusPendingIntent = PendingIntent.getActivity(
                context,
                taskId.hashCode() + 1000,
                startFocusIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
        
        // Build notification
        NotificationCompat.Builder builder = new NotificationCompat.Builder(context, CHANNEL_ID)
                .setSmallIcon(R.drawable.ic_stat_focus_brain)
                .setContentTitle(title)
                .setContentText(body)
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .setContentIntent(pendingIntent)
                .setAutoCancel(true)
                .setVibrate(new long[]{0, 500, 1000}) // Add vibration pattern
                .addAction(0, "Start Focus", startFocusPendingIntent);
        
        // Show notification
        NotificationManager notificationManager = 
                (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        
        if (notificationManager != null) {
            int notificationId = taskId.hashCode();
            notificationManager.notify(notificationId, builder.build());
            Log.d(TAG, "Showed notification for task: " + taskId + " with ID: " + notificationId);
        }
    }
    
    private void scheduleNextOccurrence(Context context, String taskId, JSONObject taskObject) throws JSONException {
        String recurrence = taskObject.optString("recurrence", "daily");
        JSONObject time = taskObject.optJSONObject("time");
        
        if (time == null) {
            Log.e(TAG, "Missing time object in task JSON");
            return;
        }
        
        int hour = time.optInt("hour", 9);
        int minute = time.optInt("minute", 0);
        int dayOfWeek = time.optInt("dayOfWeek", -1); // For weekly tasks
        int dayOfMonth = time.optInt("dayOfMonth", -1); // For monthly tasks
        
        // Calculate next occurrence
        Calendar calendar = Calendar.getInstance();
        calendar.setTimeInMillis(System.currentTimeMillis());
        calendar.setTimeZone(TimeZone.getDefault());
        calendar.set(Calendar.HOUR_OF_DAY, hour);
        calendar.set(Calendar.MINUTE, minute);
        calendar.set(Calendar.SECOND, 0);
        calendar.set(Calendar.MILLISECOND, 0);
        
        // Set the specific day of week for weekly tasks
        if (recurrence.equals("weekly") && dayOfWeek != -1) {
            int currentDayOfWeek = calendar.get(Calendar.DAY_OF_WEEK);
            if (dayOfWeek == currentDayOfWeek && calendar.getTimeInMillis() <= System.currentTimeMillis()) {
                // If it's the same day but the time has passed, schedule for next week
                calendar.add(Calendar.WEEK_OF_YEAR, 1);
            } else if (dayOfWeek != currentDayOfWeek) {
                // Move to the specified day this week
                calendar.set(Calendar.DAY_OF_WEEK, dayOfWeek);
                // If the day has already passed this week, move to next week
                if (calendar.getTimeInMillis() <= System.currentTimeMillis()) {
                    calendar.add(Calendar.WEEK_OF_YEAR, 1);
                }
            }
        }
        // Set the specific day of month for monthly tasks
        else if (recurrence.equals("monthly") && dayOfMonth != -1) {
            calendar.set(Calendar.DAY_OF_MONTH, Math.min(dayOfMonth, calendar.getActualMaximum(Calendar.DAY_OF_MONTH)));
            // If the day has already passed this month, move to next month
            if (calendar.getTimeInMillis() <= System.currentTimeMillis()) {
                calendar.add(Calendar.MONTH, 1);
                // Adjust for months with fewer days
                calendar.set(Calendar.DAY_OF_MONTH, Math.min(dayOfMonth, calendar.getActualMaximum(Calendar.DAY_OF_MONTH)));
            }
        }
        // For daily or if time has already passed today
        else if (calendar.getTimeInMillis() <= System.currentTimeMillis()) {
            switch (recurrence) {
                case "daily":
                    calendar.add(Calendar.DAY_OF_YEAR, 1);
                    break;
                case "weekly":
                    calendar.add(Calendar.WEEK_OF_YEAR, 1);
                    break;
                case "monthly":
                    calendar.add(Calendar.MONTH, 1);
                    break;
                default:
                    // One-time notifications don't need to be rescheduled
                    return;
            }
        }
        
        long nextTime = calendar.getTimeInMillis();
        
        // Update nextDueDate in the task object
        taskObject.put("nextDueDate", nextTime);
        
        // Create intent for alarm
        Intent intent = new Intent(context, RecurringTaskReceiver.class);
        intent.setAction("com.stanley.focusflow.RECURRING_TASK");
        intent.putExtra("TASK_ID", taskId);
        intent.putExtra("TASK_JSON", taskObject.toString());
        
        PendingIntent pendingIntent = PendingIntent.getBroadcast(
                context,
                taskId.hashCode(),
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
        
        // Get alarm manager and set exact alarm
        AlarmManager alarmManager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        if (alarmManager != null) {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                alarmManager.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, nextTime, pendingIntent);
            } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT) {
                alarmManager.setExact(AlarmManager.RTC_WAKEUP, nextTime, pendingIntent);
            } else {
                alarmManager.set(AlarmManager.RTC_WAKEUP, nextTime, pendingIntent);
            }
            
            Log.d(TAG, "Scheduled next occurrence of task " + taskId + " at " + calendar.getTime().toString());
            
            // Store this scheduled task in shared preferences
            saveScheduledTask(context, taskId, taskObject.toString(), nextTime);
        }
    }
    
    private void createNotificationChannel(Context context) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                    CHANNEL_ID,
                    "Recurring Tasks",
                    NotificationManager.IMPORTANCE_HIGH
            );
            channel.setDescription("Notifications for recurring focus tasks");
            
            // Enable vibration for this channel
            channel.enableVibration(true);
            channel.setVibrationPattern(new long[]{0, 500, 1000});
            
            NotificationManager notificationManager = context.getSystemService(NotificationManager.class);
            if (notificationManager != null) {
                notificationManager.createNotificationChannel(channel);
            }
        }
    }
    
    private void saveScheduledTask(Context context, String taskId, String taskJson, long scheduledTime) {
        SharedPreferences prefs = context.getSharedPreferences("RecurringTasks", Context.MODE_PRIVATE);
        SharedPreferences.Editor editor = prefs.edit();
        
        try {
            // Get existing scheduled tasks
            String tasksJson = prefs.getString("scheduledTasks", "[]");
            JSONArray tasksArray = new JSONArray(tasksJson);
            
            // Look for existing task with same ID
            boolean found = false;
            for (int i = 0; i < tasksArray.length(); i++) {
                JSONObject task = tasksArray.getJSONObject(i);
                if (task.getString("id").equals(taskId)) {
                    // Update existing task
                    task.put("json", taskJson);
                    task.put("scheduledTime", scheduledTime);
                    tasksArray.put(i, task);
                    found = true;
                    break;
                }
            }
            
            // Add new task if not found
            if (!found) {
                JSONObject newTask = new JSONObject();
                newTask.put("id", taskId);
                newTask.put("json", taskJson);
                newTask.put("scheduledTime", scheduledTime);
                tasksArray.put(newTask);
            }
            
            // Save updated tasks
            editor.putString("scheduledTasks", tasksArray.toString());
            editor.apply();
            
        } catch (JSONException e) {
            Log.e(TAG, "Error saving scheduled task", e);
        }
    }
    
    private void restoreScheduledTasks(Context context) {
        SharedPreferences prefs = context.getSharedPreferences("RecurringTasks", Context.MODE_PRIVATE);
        
        try {
            // Get stored tasks
            String tasksJson = prefs.getString("scheduledTasks", "[]");
            JSONArray tasksArray = new JSONArray(tasksJson);
            
            // Current time
            long now = System.currentTimeMillis();
            
            // Reschedule each task
            for (int i = 0; i < tasksArray.length(); i++) {
                JSONObject storedTask = tasksArray.getJSONObject(i);
                String taskId = storedTask.getString("id");
                String taskJson = storedTask.getString("json");
                long scheduledTime = storedTask.getLong("scheduledTime");
                
                JSONObject taskObject = new JSONObject(taskJson);
                
                // If scheduled time is in the past, calculate next occurrence
                if (scheduledTime <= now) {
                    scheduleNextOccurrence(context, taskId, taskObject);
                } else {
                    // Original time is still in the future, reschedule at the same time
                    Intent intent = new Intent(context, RecurringTaskReceiver.class);
                    intent.setAction("com.stanley.focusflow.RECURRING_TASK");
                    intent.putExtra("TASK_ID", taskId);
                    intent.putExtra("TASK_JSON", taskJson);
                    
                    PendingIntent pendingIntent = PendingIntent.getBroadcast(
                            context,
                            taskId.hashCode(),
                            intent,
                            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
                    );
                    
                    AlarmManager alarmManager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
                    if (alarmManager != null) {
                        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                            alarmManager.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, scheduledTime, pendingIntent);
                        } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT) {
                            alarmManager.setExact(AlarmManager.RTC_WAKEUP, scheduledTime, pendingIntent);
                        } else {
                            alarmManager.set(AlarmManager.RTC_WAKEUP, scheduledTime, pendingIntent);
                        }
                        
                        Log.d(TAG, "Restored task " + taskId + " scheduled for " + new java.util.Date(scheduledTime).toString());
                    }
                }
            }
            
        } catch (JSONException e) {
            Log.e(TAG, "Error restoring scheduled tasks", e);
        }
    }
}

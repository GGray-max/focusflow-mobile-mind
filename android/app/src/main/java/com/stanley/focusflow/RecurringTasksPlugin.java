package com.stanley.focusflow;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.SharedPreferences;
import android.os.Build;
import android.util.Log;

import com.getcapacitor.JSObject;
import com.getcapacitor.JSArray;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.Calendar;
import java.util.TimeZone;

@CapacitorPlugin(name = "RecurringTasks")
public class RecurringTasksPlugin extends Plugin {
    private static final String TAG = "RecurringTasksPlugin";
    private BroadcastReceiver notificationReceiver = null;
    private static final String LAST_COMPLETED_DATE_KEY = "lastCompletedDate";

    @Override
    public void load() {
        registerBroadcastReceiver();
    }

    private void registerBroadcastReceiver() {
        notificationReceiver = new BroadcastReceiver() {
            @Override
            public void onReceive(Context context, Intent intent) {
                if (intent.getAction() != null && 
                    intent.getAction().equals("com.stanley.focusflow.TASK_NOTIFICATION_SHOWN")) {
                    String taskId = intent.getStringExtra("TASK_ID");
                    long notificationTime = intent.getLongExtra("NOTIFICATION_TIME", 0);
                    
                    if (taskId != null) {
                        JSObject data = new JSObject();
                        data.put("taskId", taskId);
                        data.put("timestamp", notificationTime);
                        notifyListeners("taskNotificationShown", data);
                    }
                }
            }
        };

        IntentFilter filter = new IntentFilter("com.stanley.focusflow.TASK_NOTIFICATION_SHOWN");
        getContext().registerReceiver(notificationReceiver, filter);
    }

    @PluginMethod
    public void scheduleRecurringTask(PluginCall call) {
        try {
            String taskId = call.getString("taskId");
            String title = call.getString("title", "Focus Task");
            String body = call.getString("body", "Time to focus on your task");
            String recurrence = call.getString("recurrence", "daily"); // daily, weekly, monthly
            
            JSObject timeObject = call.getObject("time");
            if (timeObject == null) {
                call.reject("Time object is required");
                return;
            }
            
            int hour = timeObject.has("hour") ? timeObject.getInt("hour") : 9;
            int minute = timeObject.has("minute") ? timeObject.getInt("minute") : 0;
            
            // Optional parameters for weekly and monthly recurrence
            int dayOfWeek = timeObject.has("dayOfWeek") ? timeObject.getInt("dayOfWeek") : -1; // 1 = Sunday, 7 = Saturday
            int dayOfMonth = timeObject.has("dayOfMonth") ? timeObject.getInt("dayOfMonth") : -1; // 1-31
            
            // Create a JSON object to store the task details
            JSONObject taskObject = new JSONObject();
            taskObject.put("taskId", taskId);
            taskObject.put("title", title);
            taskObject.put("body", body);
            taskObject.put("recurrence", recurrence);
            
            JSONObject timeJson = new JSONObject();
            timeJson.put("hour", hour);
            timeJson.put("minute", minute);
            
            if (dayOfWeek != -1) {
                timeJson.put("dayOfWeek", dayOfWeek);
            }
            
            if (dayOfMonth != -1) {
                timeJson.put("dayOfMonth", dayOfMonth);
            }
            
            taskObject.put("time", timeJson);
            
            // Calculate first occurrence
            Calendar calendar = Calendar.getInstance();
            calendar.setTimeInMillis(System.currentTimeMillis());
            calendar.setTimeZone(TimeZone.getDefault());
            calendar.set(Calendar.HOUR_OF_DAY, hour);
            calendar.set(Calendar.MINUTE, minute);
            calendar.set(Calendar.SECOND, 0);
            calendar.set(Calendar.MILLISECOND, 0);
            
            // If weekly, set to specific day of week
            if (recurrence.equals("weekly") && dayOfWeek != -1) {
                calendar.set(Calendar.DAY_OF_WEEK, dayOfWeek);
                // If the day has already passed this week, move to next week
                if (calendar.getTimeInMillis() <= System.currentTimeMillis()) {
                    calendar.add(Calendar.WEEK_OF_YEAR, 1);
                }
            } 
            // If monthly, set to specific day of month
            else if (recurrence.equals("monthly") && dayOfMonth != -1) {
                calendar.set(Calendar.DAY_OF_MONTH, dayOfMonth);
                // If the day has already passed this month, move to next month
                if (calendar.getTimeInMillis() <= System.currentTimeMillis()) {
                    calendar.add(Calendar.MONTH, 1);
                }
            }
            // For daily or if time has passed today
            else if (calendar.getTimeInMillis() <= System.currentTimeMillis()) {
                calendar.add(Calendar.DAY_OF_YEAR, 1);
            }
            
            long triggerTime = calendar.getTimeInMillis();
            
            // Create intent for the alarm
            Intent intent = new Intent(getContext(), RecurringTaskReceiver.class);
            intent.setAction("com.stanley.focusflow.RECURRING_TASK");
            intent.putExtra("TASK_ID", taskId);
            intent.putExtra("TASK_JSON", taskObject.toString());
            
            PendingIntent pendingIntent = PendingIntent.getBroadcast(
                    getContext(),
                    taskId.hashCode(),
                    intent,
                    PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
            );
            
            // Schedule the alarm
            AlarmManager alarmManager = (AlarmManager) getContext().getSystemService(Context.ALARM_SERVICE);
            if (alarmManager != null) {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                    alarmManager.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerTime, pendingIntent);
                } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT) {
                    alarmManager.setExact(AlarmManager.RTC_WAKEUP, triggerTime, pendingIntent);
                } else {
                    alarmManager.set(AlarmManager.RTC_WAKEUP, triggerTime, pendingIntent);
                }
                
                // Save this task to preferences for restoration after device reboot
                saveScheduledTask(taskId, taskObject.toString(), triggerTime);
                
                // Return success with next trigger time
                JSObject result = new JSObject();
                result.put("success", true);
                result.put("taskId", taskId);
                result.put("nextTriggerTime", triggerTime);
                call.resolve(result);
                
                Log.d(TAG, "Scheduled recurring task " + taskId + " for " + calendar.getTime().toString());
            } else {
                call.reject("Could not access AlarmManager");
            }
            
        } catch (JSONException e) {
            Log.e(TAG, "Error scheduling recurring task", e);
            call.reject("Error scheduling recurring task: " + e.getMessage());
        }
    }

    @PluginMethod
    public void cancelRecurringTask(PluginCall call) {
        try {
            String taskId = call.getString("taskId");
            if (taskId == null) {
                call.reject("Task ID is required");
                return;
            }
            
            // Cancel the pending intent
            Intent intent = new Intent(getContext(), RecurringTaskReceiver.class);
            intent.setAction("com.stanley.focusflow.RECURRING_TASK");
            
            PendingIntent pendingIntent = PendingIntent.getBroadcast(
                    getContext(),
                    taskId.hashCode(),
                    intent,
                    PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
            );
            
            AlarmManager alarmManager = (AlarmManager) getContext().getSystemService(Context.ALARM_SERVICE);
            if (alarmManager != null) {
                alarmManager.cancel(pendingIntent);
                pendingIntent.cancel();
                
                // Remove from saved tasks
                removeScheduledTask(taskId);
                
                JSObject result = new JSObject();
                result.put("success", true);
                result.put("taskId", taskId);
                call.resolve(result);
                
                Log.d(TAG, "Cancelled recurring task " + taskId);
            } else {
                call.reject("Could not access AlarmManager");
            }
            
        } catch (Exception e) {
            Log.e(TAG, "Error cancelling recurring task", e);
            call.reject("Error cancelling recurring task: " + e.getMessage());
        }
    }

    @PluginMethod
    public void getScheduledTasks(PluginCall call) {
        try {
            SharedPreferences prefs = getContext().getSharedPreferences("RecurringTasks", Context.MODE_PRIVATE);
            String tasksJson = prefs.getString("scheduledTasks", "[]");
            JSONArray tasksArray = new JSONArray(tasksJson);
            
            JSArray result = new JSArray();
            long now = System.currentTimeMillis();
            
            for (int i = 0; i < tasksArray.length(); i++) {
                JSONObject task = tasksArray.getJSONObject(i);
                String taskJson = task.getString("json");
                long scheduledTime = task.getLong("scheduledTime");
                
                // Only include future tasks
                if (scheduledTime >= now) {
                    JSONObject taskObject = new JSONObject(taskJson);
                    
                    JSObject jsTask = new JSObject();
                    jsTask.put("taskId", task.getString("id"));
                    jsTask.put("title", taskObject.optString("title", "Focus Task"));
                    jsTask.put("body", taskObject.optString("body", "Time to focus on your task"));
                    jsTask.put("recurrence", taskObject.optString("recurrence", "daily"));
                    jsTask.put("nextTriggerTime", scheduledTime);
                    
                    result.put(jsTask);
                }
            }
            
            JSObject response = new JSObject();
            response.put("tasks", result);
            call.resolve(response);
            
        } catch (JSONException e) {
            Log.e(TAG, "Error getting scheduled tasks", e);
            call.reject("Error getting scheduled tasks: " + e.getMessage());
        }
    }

    private void saveScheduledTask(String taskId, String taskJson, long scheduledTime) {
        SharedPreferences prefs = getContext().getSharedPreferences("RecurringTasks", Context.MODE_PRIVATE);
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

    private void removeScheduledTask(String taskId) {
        SharedPreferences prefs = getContext().getSharedPreferences("RecurringTasks", Context.MODE_PRIVATE);
        SharedPreferences.Editor editor = prefs.edit();
        
        try {
            // Get existing scheduled tasks
            String tasksJson = prefs.getString("scheduledTasks", "[]");
            JSONArray tasksArray = new JSONArray(tasksJson);
            JSONArray newTasksArray = new JSONArray();
            
            // Filter out the task with the given ID
            for (int i = 0; i < tasksArray.length(); i++) {
                JSONObject task = tasksArray.getJSONObject(i);
                if (!task.getString("id").equals(taskId)) {
                    newTasksArray.put(task);
                }
            }
            
            // Save updated tasks
            editor.putString("scheduledTasks", newTasksArray.toString());
            editor.apply();
            
        } catch (JSONException e) {
            Log.e(TAG, "Error removing scheduled task", e);
        }
    }

    @Override
    protected void handleOnDestroy() {
        if (notificationReceiver != null) {
            try {
                getContext().unregisterReceiver(notificationReceiver);
                notificationReceiver = null;
            } catch (Exception e) {
                Log.e(TAG, "Error unregistering receiver", e);
            }
        }
        super.handleOnDestroy();
    }
    
    /**
     * Mark a task as completed and handle re-scheduling for recurring tasks
     * @param call Plugin call containing task ID
     */
    @PluginMethod
    public void completeTask(PluginCall call) {
        try {
            String taskId = call.getString("taskId");
            if (taskId == null) {
                call.reject("Task ID is required");
                return;
            }
            
            // Get the task details from storage
            SharedPreferences prefs = getContext().getSharedPreferences("RecurringTasks", Context.MODE_PRIVATE);
            String tasksJson = prefs.getString("scheduledTasks", "[]");
            JSONArray tasksArray = new JSONArray(tasksJson);
            
            // Look for the task
            JSONObject taskData = null;
            int taskIndex = -1;
            String taskJsonStr = null;
            
            for (int i = 0; i < tasksArray.length(); i++) {
                JSONObject storedTask = tasksArray.getJSONObject(i);
                if (storedTask.getString("id").equals(taskId)) {
                    taskData = storedTask;
                    taskIndex = i;
                    taskJsonStr = storedTask.getString("json");
                    break;
                }
            }
            
            if (taskData == null || taskJsonStr == null) {
                call.reject("Task not found");
                return;
            }
            
            // Parse the task JSON
            JSONObject taskObject = new JSONObject(taskJsonStr);
            String recurrence = taskObject.optString("recurrence", "once");
            
            // Record completion time
            long completionTime = System.currentTimeMillis();
            taskObject.put(LAST_COMPLETED_DATE_KEY, completionTime);
            
            // For non-recurring tasks, just update the completion status
            if (recurrence.equals("once")) {
                // Cancel the current alarm
                cancelTaskAlarm(taskId);
                
                // Remove from storage
                removeScheduledTask(taskId);
                
                JSObject result = new JSObject();
                result.put("success", true);
                result.put("taskId", taskId);
                result.put("completed", true);
                result.put("recurring", false);
                call.resolve(result);
                return;
            }
            
            // For recurring tasks, reschedule for next occurrence
            JSONObject timeObj = taskObject.optJSONObject("time");
            if (timeObj == null) {
                call.reject("Task has invalid time configuration");
                return;
            }
            
            int hour = timeObj.optInt("hour", 9);
            int minute = timeObj.optInt("minute", 0);
            int dayOfWeek = timeObj.optInt("dayOfWeek", -1);
            int dayOfMonth = timeObj.optInt("dayOfMonth", -1);
            
            // Calculate next occurrence
            Calendar calendar = Calendar.getInstance();
            calendar.setTimeInMillis(System.currentTimeMillis());
            calendar.setTimeZone(TimeZone.getDefault());
            calendar.set(Calendar.HOUR_OF_DAY, hour);
            calendar.set(Calendar.MINUTE, minute);
            calendar.set(Calendar.SECOND, 0);
            calendar.set(Calendar.MILLISECOND, 0);
            
            // Set the appropriate next date based on recurrence type
            switch (recurrence) {
                case "daily":
                    // Move to tomorrow
                    calendar.add(Calendar.DAY_OF_YEAR, 1);
                    break;
                    
                case "weekly":
                    // If dayOfWeek is specified, use it
                    if (dayOfWeek != -1) {
                        // Get current day of week
                        int currentDayOfWeek = calendar.get(Calendar.DAY_OF_WEEK);
                        if (dayOfWeek == currentDayOfWeek) {
                            // Same day of week, move to next week
                            calendar.add(Calendar.WEEK_OF_YEAR, 1);
                        } else {
                            // Move to the specific day this week
                            int daysToAdd = (dayOfWeek - currentDayOfWeek + 7) % 7;
                            if (daysToAdd == 0) daysToAdd = 7; // If already on that day, go to next week
                            calendar.add(Calendar.DAY_OF_YEAR, daysToAdd);
                        }
                    } else {
                        // No specific day, just add a week
                        calendar.add(Calendar.WEEK_OF_YEAR, 1);
                    }
                    break;
                    
                case "monthly":
                    // If dayOfMonth is specified, use it
                    if (dayOfMonth != -1) {
                        calendar.add(Calendar.MONTH, 1);
                        // Adjust for months with fewer days
                        calendar.set(Calendar.DAY_OF_MONTH, 
                            Math.min(dayOfMonth, calendar.getActualMaximum(Calendar.DAY_OF_MONTH)));
                    } else {
                        calendar.add(Calendar.MONTH, 1);
                    }
                    break;
                    
                default:
                    // Should not happen, but just in case
                    call.reject("Unknown recurrence pattern: " + recurrence);
                    return;
            }
            
            long nextTriggerTime = calendar.getTimeInMillis();
            
            // Update the next trigger time
            taskObject.put("nextDueDate", nextTriggerTime);
            
            // Cancel the current alarm
            cancelTaskAlarm(taskId);
            
            // Schedule the new alarm
            Intent intent = new Intent(getContext(), RecurringTaskReceiver.class);
            intent.setAction("com.stanley.focusflow.RECURRING_TASK");
            intent.putExtra("TASK_ID", taskId);
            intent.putExtra("TASK_JSON", taskObject.toString());
            
            PendingIntent pendingIntent = PendingIntent.getBroadcast(
                    getContext(),
                    taskId.hashCode(),
                    intent,
                    PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
            );
            
            AlarmManager alarmManager = (AlarmManager) getContext().getSystemService(Context.ALARM_SERVICE);
            if (alarmManager != null) {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                    alarmManager.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, nextTriggerTime, pendingIntent);
                } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT) {
                    alarmManager.setExact(AlarmManager.RTC_WAKEUP, nextTriggerTime, pendingIntent);
                } else {
                    alarmManager.set(AlarmManager.RTC_WAKEUP, nextTriggerTime, pendingIntent);
                }
                
                // Update in storage
                saveScheduledTask(taskId, taskObject.toString(), nextTriggerTime);
                
                JSObject result = new JSObject();
                result.put("success", true);
                result.put("taskId", taskId);
                result.put("completed", true);
                result.put("recurring", true);
                result.put("nextTriggerTime", nextTriggerTime);
                result.put("recurrence", recurrence);
                call.resolve(result);
                
                Log.d(TAG, "Completed and rescheduled recurring task " + taskId + 
                        " with " + recurrence + " recurrence for " + calendar.getTime().toString());
            } else {
                call.reject("Could not access AlarmManager");
            }
            
        } catch (JSONException e) {
            Log.e(TAG, "Error completing task", e);
            call.reject("Error completing task: " + e.getMessage());
        }
    }
    
    /**
     * Helper method to cancel a task alarm
     * @param taskId ID of the task to cancel
     */
    private void cancelTaskAlarm(String taskId) {
        Intent intent = new Intent(getContext(), RecurringTaskReceiver.class);
        intent.setAction("com.stanley.focusflow.RECURRING_TASK");
        
        PendingIntent pendingIntent = PendingIntent.getBroadcast(
                getContext(),
                taskId.hashCode(),
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
        
        AlarmManager alarmManager = (AlarmManager) getContext().getSystemService(Context.ALARM_SERVICE);
        if (alarmManager != null) {
            alarmManager.cancel(pendingIntent);
            pendingIntent.cancel();
        }
    }
}

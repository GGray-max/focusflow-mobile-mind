package com.stanley.focusflow;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.os.Build;
import android.util.Log;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "TimerPlugin")
public class TimerPlugin extends Plugin {
    private static final String TAG = "TimerPlugin";
    private BroadcastReceiver timerReceiver = null;

    @Override
    public void load() {
        registerBroadcastReceiver();
    }

    private void registerBroadcastReceiver() {
        timerReceiver = new BroadcastReceiver() {
            @Override
            public void onReceive(Context context, Intent intent) {
                JSObject data = new JSObject();
                String action = intent.getAction();

                if (action == null) return;

                switch (action) {
                    case "com.stanley.focusflow.TIMER_UPDATE":
                        long timeRemaining = intent.getLongExtra("TIME_REMAINING", 0);
                        long totalTime = intent.getLongExtra("TOTAL_TIME", 0);
                        
                        data.put("timeRemaining", timeRemaining);
                        data.put("totalTime", totalTime);
                        notifyListeners("timerUpdate", data);
                        break;
                        
                    case "com.stanley.focusflow.TIMER_STARTED":
                        data.put("duration", intent.getLongExtra("TIMER_DURATION", 0));
                        data.put("startTime", intent.getLongExtra("START_TIME", 0));
                        notifyListeners("timerStarted", data);
                        break;
                        
                    case "com.stanley.focusflow.TIMER_PAUSED":
                        data.put("timeRemaining", intent.getLongExtra("TIME_REMAINING", 0));
                        notifyListeners("timerPaused", data);
                        break;
                        
                    case "com.stanley.focusflow.TIMER_STOPPED":
                        notifyListeners("timerStopped", data);
                        break;
                        
                    case "com.stanley.focusflow.TIMER_FINISHED":
                        data.put("duration", intent.getLongExtra("TIMER_DURATION", 0));
                        data.put("endTime", intent.getStringExtra("END_TIME"));
                        
                        // Also pass the JSON data if available
                        String timerData = intent.getStringExtra("TIMER_DATA");
                        if (timerData != null) {
                            data.put("timerData", timerData);
                        }
                        
                        notifyListeners("timerFinished", data);
                        break;
                }
            }
        };

        IntentFilter filter = new IntentFilter();
        filter.addAction("com.stanley.focusflow.TIMER_UPDATE");
        filter.addAction("com.stanley.focusflow.TIMER_STARTED");
        filter.addAction("com.stanley.focusflow.TIMER_PAUSED");
        filter.addAction("com.stanley.focusflow.TIMER_STOPPED");
        filter.addAction("com.stanley.focusflow.TIMER_FINISHED");
        
        getContext().registerReceiver(timerReceiver, filter);
    }

    @PluginMethod
    public void startTimer(PluginCall call) {
        try {
            int durationSeconds = call.getData().has("durationSeconds") ? call.getInt("durationSeconds") : 0;
            if (durationSeconds <= 0) {
                call.reject("Invalid duration provided");
                return;
            }

            String taskName = call.getString("taskName", "Focus Session");
            
            Intent serviceIntent = new Intent(getContext(), TimerService.class);
            serviceIntent.setAction("START_TIMER");
            serviceIntent.putExtra("DURATION_MS", durationSeconds * 1000L);
            serviceIntent.putExtra("TASK_NAME", taskName);
            
            // Start the service on Android O and higher
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                getContext().startForegroundService(serviceIntent);
            } else {
                getContext().startService(serviceIntent);
            }
            
            JSObject ret = new JSObject();
            ret.put("success", true);
            ret.put("durationSeconds", durationSeconds);
            call.resolve(ret);
            
            Log.d(TAG, "Timer started for " + durationSeconds + " seconds");
        } catch (Exception e) {
            Log.e(TAG, "Error starting timer", e);
            call.reject("Failed to start timer: " + e.getMessage());
        }
    }

    @PluginMethod
    public void pauseTimer(PluginCall call) {
        try {
            Intent serviceIntent = new Intent(getContext(), TimerService.class);
            serviceIntent.setAction("PAUSE_TIMER");
            getContext().startService(serviceIntent);
            
            JSObject ret = new JSObject();
            ret.put("success", true);
            call.resolve(ret);
            
            Log.d(TAG, "Timer paused");
        } catch (Exception e) {
            Log.e(TAG, "Error pausing timer", e);
            call.reject("Failed to pause timer: " + e.getMessage());
        }
    }

    @PluginMethod
    public void resumeTimer(PluginCall call) {
        try {
            Intent serviceIntent = new Intent(getContext(), TimerService.class);
            serviceIntent.setAction("RESUME_TIMER");
            
            // Start the service on Android O and higher
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                getContext().startForegroundService(serviceIntent);
            } else {
                getContext().startService(serviceIntent);
            }
            
            JSObject ret = new JSObject();
            ret.put("success", true);
            call.resolve(ret);
            
            Log.d(TAG, "Timer resumed");
        } catch (Exception e) {
            Log.e(TAG, "Error resuming timer", e);
            call.reject("Failed to resume timer: " + e.getMessage());
        }
    }

    @PluginMethod
    public void stopTimer(PluginCall call) {
        try {
            Intent serviceIntent = new Intent(getContext(), TimerService.class);
            serviceIntent.setAction("STOP_TIMER");
            getContext().startService(serviceIntent);
            
            JSObject ret = new JSObject();
            ret.put("success", true);
            call.resolve(ret);
            
            Log.d(TAG, "Timer stopped");
        } catch (Exception e) {
            Log.e(TAG, "Error stopping timer", e);
            call.reject("Failed to stop timer: " + e.getMessage());
        }
    }

    @PluginMethod
    public void getTimerStatus(PluginCall call) {
        // For now, we'll implement a simple check to see if the service is running
        // A more comprehensive implementation would require a bindService approach
        // to get the exact timer state
        
        // This is a simplified implementation
        JSObject ret = new JSObject();
        boolean isServiceRunning = TimerStatusHelper.isServiceRunning(getContext(), TimerService.class);
        ret.put("isRunning", isServiceRunning);
        call.resolve(ret);
    }

    @Override
    protected void handleOnDestroy() {
        if (timerReceiver != null) {
            try {
                getContext().unregisterReceiver(timerReceiver);
                timerReceiver = null;
            } catch (Exception e) {
                Log.e(TAG, "Error unregistering receiver", e);
            }
        }
        super.handleOnDestroy();
    }
}

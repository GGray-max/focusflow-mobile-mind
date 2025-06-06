package com.stanley.focusflow;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.os.Binder;
import android.os.Build;
import android.os.CountDownTimer;
import android.os.IBinder;
import android.os.PowerManager;
import android.util.Log;

import androidx.annotation.Nullable;
import androidx.core.app.NotificationCompat;

import com.stanley.focusflow.R;

import org.json.JSONException;
import org.json.JSONObject;

import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;
import java.util.TimeZone;

public class TimerService extends Service {
    private static final String TAG = "TimerService";
    private static final String CHANNEL_ID = "focus_timer_channel";
    private static final int NOTIFICATION_ID = 102;

    private final IBinder binder = new LocalBinder();
    private CountDownTimer countDownTimer;
    private long timerDurationMs = 0;
    private long timeRemainingMs = 0;
    private long startTimeMs = 0;
    private long pausedTimeMs = 0;
    private boolean isTimerRunning = false;
    private boolean isTimerPaused = false;
    private PowerManager.WakeLock wakeLock;
    private String currentTaskName = "";

    public class LocalBinder extends Binder {
        TimerService getService() {
            return TimerService.this;
        }
    }

    @Override
    public void onCreate() {
        super.onCreate();
        Log.d(TAG, "TimerService created");

        // Create notification channel for API 26+
        createNotificationChannel();

        // Acquire wake lock to keep CPU running when screen is off
        PowerManager powerManager = (PowerManager) getSystemService(POWER_SERVICE);
        wakeLock = powerManager.newWakeLock(
                PowerManager.PARTIAL_WAKE_LOCK,
                "FocusFlow::TimerWakeLock"
        );
        wakeLock.setReferenceCounted(false);
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent == null) {
            return START_NOT_STICKY;
        }

        String action = intent.getAction();
        if (action == null) {
            return START_NOT_STICKY;
        }

        switch (action) {
            case "START_TIMER":
                timerDurationMs = intent.getLongExtra("DURATION_MS", 0);
                currentTaskName = intent.getStringExtra("TASK_NAME");
                if (currentTaskName == null) {
                    currentTaskName = "Focus Session";
                }
                startTimer(timerDurationMs);
                break;
            case "PAUSE_TIMER":
                pauseTimer();
                break;
            case "RESUME_TIMER":
                resumeTimer();
                break;
            case "STOP_TIMER":
                stopTimer();
                break;
        }

        // Return START_STICKY to ensure service restarts if killed
        return START_STICKY;
    }

    public void startTimer(long durationMs) {
        if (isTimerRunning && !isTimerPaused) {
            stopTimer();
        }

        timerDurationMs = durationMs;
        timeRemainingMs = durationMs;
        startTimeMs = System.currentTimeMillis();
        isTimerRunning = true;
        isTimerPaused = false;

        // Acquire wake lock to keep the CPU running
        if (!wakeLock.isHeld()) {
            wakeLock.acquire();
        }

        // Start the service in foreground with notification
        startForeground(NOTIFICATION_ID, buildNotification(timeRemainingMs));

        countDownTimer = new CountDownTimer(timeRemainingMs, 1000) {
            @Override
            public void onTick(long millisUntilFinished) {
                timeRemainingMs = millisUntilFinished;
                // Update notification every 5 seconds to reduce system overhead
                if (millisUntilFinished % 5000 < 1000) {
                    updateNotification(millisUntilFinished);
                }
                broadcastTimerUpdate(millisUntilFinished);
            }

            @Override
            public void onFinish() {
                timeRemainingMs = 0;
                isTimerRunning = false;
                broadcastTimerFinished();
                showTimerCompletedNotification();
                stopForeground(false); // Keep notification visible after timer ends
                stopSelf();
            }
        };

        countDownTimer.start();
        broadcastTimerStarted(durationMs);
        Log.d(TAG, "Timer started for " + (durationMs / 1000) + " seconds");
    }

    public void pauseTimer() {
        if (isTimerRunning && !isTimerPaused && countDownTimer != null) {
            countDownTimer.cancel();
            isTimerPaused = true;
            pausedTimeMs = timeRemainingMs;
            
            updateNotification(timeRemainingMs);
            broadcastTimerPaused();
            
            Log.d(TAG, "Timer paused with " + (timeRemainingMs / 1000) + " seconds remaining");
        }
    }

    public void resumeTimer() {
        if (isTimerRunning && isTimerPaused) {
            isTimerPaused = false;
            startTimer(pausedTimeMs);
            Log.d(TAG, "Timer resumed with " + (pausedTimeMs / 1000) + " seconds remaining");
        }
    }

    public void stopTimer() {
        if (countDownTimer != null) {
            countDownTimer.cancel();
        }
        
        isTimerRunning = false;
        isTimerPaused = false;
        timeRemainingMs = 0;
        
        // Release wake lock if held
        if (wakeLock.isHeld()) {
            try {
                wakeLock.release();
            } catch (Exception e) {
                Log.e(TAG, "Error releasing wakelock", e);
            }
        }
        
        broadcastTimerStopped();
        stopForeground(true);
        stopSelf();
        
        Log.d(TAG, "Timer stopped");
    }

    private void updateNotification(long millisUntilFinished) {
        NotificationManager notificationManager = 
                (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        if (notificationManager != null) {
            notificationManager.notify(NOTIFICATION_ID, buildNotification(millisUntilFinished));
        }
    }

    private Notification buildNotification(long millisUntilFinished) {
        // Use fully qualified class name for clarity
        Intent notificationIntent = new Intent(this, MainActivity.class);
        notificationIntent.setAction(Intent.ACTION_MAIN);
        notificationIntent.addCategory(Intent.CATEGORY_LAUNCHER);
        notificationIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        
        PendingIntent pendingIntent = PendingIntent.getActivity(
                this, 0, notificationIntent, PendingIntent.FLAG_IMMUTABLE);

        // Create action buttons for the notification
        Intent stopIntent = new Intent(this, TimerService.class);
        stopIntent.setAction("STOP_TIMER");
        PendingIntent stopPendingIntent = PendingIntent.getService(
                this, 1, stopIntent, PendingIntent.FLAG_IMMUTABLE);

        Intent pauseResumeIntent = new Intent(this, TimerService.class);
        pauseResumeIntent.setAction(isTimerPaused ? "RESUME_TIMER" : "PAUSE_TIMER");
        PendingIntent pauseResumePendingIntent = PendingIntent.getService(
                this, 2, pauseResumeIntent, PendingIntent.FLAG_IMMUTABLE);

        // Format time remaining
        String timeString = formatTime(millisUntilFinished);
        
        // Build the notification
        NotificationCompat.Builder builder = new NotificationCompat.Builder(this, CHANNEL_ID)
                .setSmallIcon(R.drawable.ic_stat_focus_brain)
                .setContentTitle(currentTaskName)
                .setContentText(timeString + " remaining")
                .setContentIntent(pendingIntent)
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .setOngoing(true)
                .setOnlyAlertOnce(true)
                .addAction(0, isTimerPaused ? "Resume" : "Pause", pauseResumePendingIntent)
                .addAction(0, "Stop", stopPendingIntent);

        // Set progress bar in notification
        if (timerDurationMs > 0) {
            int progress = (int) (100 - ((millisUntilFinished * 100) / timerDurationMs));
            builder.setProgress(100, progress, false);
        }

        return builder.build();
    }

    private void showTimerCompletedNotification() {
        Intent notificationIntent = new Intent(this, MainActivity.class);
        PendingIntent pendingIntent = PendingIntent.getActivity(
                this, 0, notificationIntent, PendingIntent.FLAG_IMMUTABLE);

        NotificationCompat.Builder builder = new NotificationCompat.Builder(this, CHANNEL_ID)
                .setSmallIcon(R.drawable.ic_stat_focus_brain)
                .setContentTitle("Focus Timer Completed")
                .setContentText("Great job! Your focus session is complete.")
                .setContentIntent(pendingIntent)
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .setAutoCancel(true);

        NotificationManager notificationManager = 
                (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        if (notificationManager != null) {
            notificationManager.notify(NOTIFICATION_ID + 1, builder.build());
        }
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                    CHANNEL_ID,
                    "Focus Timer Channel",
                    NotificationManager.IMPORTANCE_DEFAULT);
            
            channel.setDescription("Used for focus timer notifications");
            channel.setSound(null, null); // No sound for timer updates
            channel.enableVibration(false);
            channel.setShowBadge(true);
            
            NotificationManager manager = getSystemService(NotificationManager.class);
            manager.createNotificationChannel(channel);
        }
    }

    private String formatTime(long millisUntilFinished) {
        long seconds = (millisUntilFinished / 1000) % 60;
        long minutes = (millisUntilFinished / (1000 * 60)) % 60;
        long hours = millisUntilFinished / (1000 * 60 * 60);

        if (hours > 0) {
            return String.format(Locale.getDefault(), "%d:%02d:%02d", hours, minutes, seconds);
        } else {
            return String.format(Locale.getDefault(), "%02d:%02d", minutes, seconds);
        }
    }

    // Broadcast methods to communicate with the app
    private void broadcastTimerUpdate(long millisUntilFinished) {
        Intent intent = new Intent("com.stanley.focusflow.TIMER_UPDATE");
        intent.putExtra("TIME_REMAINING", millisUntilFinished);
        intent.putExtra("TOTAL_TIME", timerDurationMs);
        sendBroadcast(intent);
    }

    private void broadcastTimerStarted(long durationMs) {
        Intent intent = new Intent("com.stanley.focusflow.TIMER_STARTED");
        intent.putExtra("TIMER_DURATION", durationMs);
        intent.putExtra("START_TIME", startTimeMs);
        sendBroadcast(intent);
    }

    private void broadcastTimerPaused() {
        Intent intent = new Intent("com.stanley.focusflow.TIMER_PAUSED");
        intent.putExtra("TIME_REMAINING", timeRemainingMs);
        sendBroadcast(intent);
    }

    private void broadcastTimerStopped() {
        Intent intent = new Intent("com.stanley.focusflow.TIMER_STOPPED");
        sendBroadcast(intent);
    }

    private void broadcastTimerFinished() {
        Intent intent = new Intent("com.stanley.focusflow.TIMER_FINISHED");
        intent.putExtra("TIMER_DURATION", timerDurationMs);
        // Include ISO 8601 formatted end time for task history
        SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss'Z'", Locale.US);
        sdf.setTimeZone(TimeZone.getTimeZone("UTC"));
        intent.putExtra("END_TIME", sdf.format(new Date()));
        sendBroadcast(intent);

        // Include JSON data for apps that handle it that way
        try {
            JSONObject data = new JSONObject();
            data.put("duration", timerDurationMs);
            data.put("completedAt", System.currentTimeMillis());
            data.put("taskName", currentTaskName);
            intent.putExtra("TIMER_DATA", data.toString());
        } catch (JSONException e) {
            Log.e(TAG, "Error creating timer JSON data", e);
        }
    }

    @Nullable
    @Override
    public IBinder onBind(Intent intent) {
        return binder;
    }

    @Override
    public void onDestroy() {
        if (countDownTimer != null) {
            countDownTimer.cancel();
        }
        
        if (wakeLock.isHeld()) {
            try {
                wakeLock.release();
            } catch (Exception e) {
                Log.e(TAG, "Error releasing wakelock on destroy", e);
            }
        }
        
        super.onDestroy();
        Log.d(TAG, "TimerService destroyed");
    }
}

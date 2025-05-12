
package com.focustask.app;

import android.accessibilityservice.AccessibilityService;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Intent;
import android.os.Build;
import android.view.accessibility.AccessibilityEvent;
import android.view.accessibility.AccessibilityNodeInfo;
import android.util.Log;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.Set;

import androidx.core.app.NotificationCompat;

public class AppBlockerService extends AccessibilityService {
    private static final String TAG = "AppBlockerService";
    private static final String CHANNEL_ID = "app_blocker_channel";
    private static final int NOTIFICATION_ID = 101;
    
    private Set<String> blockedApps = new HashSet<>();
    private boolean isBlockingActive = false;
    private String lastForegroundApp = "";

    @Override
    public void onCreate() {
        super.onCreate();
        createNotificationChannel();
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent != null) {
            String command = intent.getStringExtra("COMMAND");
            
            if (command != null) {
                if (command.equals("START_BLOCKING")) {
                    ArrayList<String> apps = intent.getStringArrayListExtra("BLOCKED_APPS");
                    if (apps != null) {
                        blockedApps.clear();
                        blockedApps.addAll(apps);
                    }
                    isBlockingActive = true;
                    startForeground();
                } else if (command.equals("STOP_BLOCKING")) {
                    isBlockingActive = false;
                    stopForeground(true);
                }
            }
            
            ArrayList<String> apps = intent.getStringArrayListExtra("BLOCKED_APPS");
            if (apps != null) {
                blockedApps.clear();
                blockedApps.addAll(apps);
                Log.d(TAG, "Updated blocked apps: " + blockedApps);
            }
        }
        
        return START_STICKY;
    }

    @Override
    public void onAccessibilityEvent(AccessibilityEvent event) {
        if (!isBlockingActive || event == null || event.getPackageName() == null) {
            return;
        }

        String packageName = event.getPackageName().toString();
        
        // Only proceed if this is a new app (avoids repeated blocks)
        if (packageName.equals(lastForegroundApp)) {
            return;
        }
        
        lastForegroundApp = packageName;
        
        // Check if the current app is in our blocked list
        if (blockedApps.contains(packageName)) {
            Log.d(TAG, "Blocked app detected: " + packageName);
            
            // Launch our blocker activity instead
            Intent intent = new Intent(this, BlockerActivity.class);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            intent.putExtra("BLOCKED_APP", packageName);
            startActivity(intent);
            
            // Try to go back to home screen as a fallback
            Intent homeIntent = new Intent(Intent.ACTION_MAIN);
            homeIntent.addCategory(Intent.CATEGORY_HOME);
            homeIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            startActivity(homeIntent);
        }
    }

    @Override
    public void onInterrupt() {
        Log.d(TAG, "AppBlockerService interrupted");
    }

    private void startForeground() {
        Intent notificationIntent = new Intent(this, MainActivity.class);
        PendingIntent pendingIntent = PendingIntent.getActivity(this, 0, notificationIntent, PendingIntent.FLAG_IMMUTABLE);

        NotificationCompat.Builder builder = new NotificationCompat.Builder(this, CHANNEL_ID)
                .setSmallIcon(R.drawable.ic_stat_focus_brain)
                .setContentTitle("Focus Mode Active")
                .setContentText("Blocking distractions to help you stay focused")
                .setPriority(NotificationCompat.PRIORITY_DEFAULT)
                .setContentIntent(pendingIntent);

        startForeground(NOTIFICATION_ID, builder.build());
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                    CHANNEL_ID,
                    "App Blocker Channel",
                    NotificationManager.IMPORTANCE_DEFAULT);
            channel.setDescription("Used while blocking distracting apps");
            NotificationManager manager = getSystemService(NotificationManager.class);
            manager.createNotificationChannel(channel);
        }
    }
}

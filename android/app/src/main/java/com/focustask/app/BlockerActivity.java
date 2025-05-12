
package com.focustask.app;

import android.content.Intent;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.view.View;
import android.widget.Button;
import android.widget.TextView;

import androidx.appcompat.app.AppCompatActivity;

public class BlockerActivity extends AppCompatActivity {
    
    private String blockedApp;
    private TextView countdownText;
    private int remainingSeconds = 10;
    private Handler handler;
    
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_blocker);
        
        countdownText = findViewById(R.id.countdown_text);
        Button returnButton = findViewById(R.id.return_button);
        
        // Get the package name of the blocked app
        Intent intent = getIntent();
        if (intent != null) {
            blockedApp = intent.getStringExtra("BLOCKED_APP");
            
            // Try to get the app name
            TextView blockedAppText = findViewById(R.id.blocked_app_name);
            if (blockedAppText != null && blockedApp != null) {
                try {
                    String appName = getPackageManager().getApplicationLabel(
                            getPackageManager().getApplicationInfo(blockedApp, 0)).toString();
                    blockedAppText.setText(appName);
                } catch (Exception e) {
                    blockedAppText.setText(blockedApp);
                }
            }
        }
        
        // Set up return button
        returnButton.setOnClickListener(v -> {
            // Go back to our main app
            Intent mainIntent = new Intent(BlockerActivity.this, MainActivity.class);
            mainIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            startActivity(mainIntent);
            finish();
        });
        
        // Start countdown
        handler = new Handler(Looper.getMainLooper());
        startCountdown();
    }
    
    private void startCountdown() {
        handler.postDelayed(new Runnable() {
            @Override
            public void run() {
                remainingSeconds--;
                
                if (remainingSeconds > 0) {
                    countdownText.setText(String.format("Wait %d seconds...", remainingSeconds));
                    handler.postDelayed(this, 1000);
                } else {
                    countdownText.setText("You can go back now");
                    Button returnButton = findViewById(R.id.return_button);
                    returnButton.setEnabled(true);
                    returnButton.setVisibility(View.VISIBLE);
                }
            }
        }, 1000);
    }
    
    @Override
    protected void onDestroy() {
        super.onDestroy();
        if (handler != null) {
            handler.removeCallbacksAndMessages(null);
        }
    }
    
    @Override
    public void onBackPressed() {
        // Prevent back button from working during countdown
        if (remainingSeconds <= 0) {
            super.onBackPressed();
        }
    }
}

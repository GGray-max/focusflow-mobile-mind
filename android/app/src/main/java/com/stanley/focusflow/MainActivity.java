package com.stanley.focusflow;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // Register plugins
        // Focus Timer Plugin - for background timer functionality
        registerPlugin(TimerPlugin.class);
        
        // Recurring Tasks Plugin - for scheduling recurring notifications
        registerPlugin(RecurringTasksPlugin.class);
    }
}

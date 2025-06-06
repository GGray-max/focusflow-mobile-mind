
package com.focustask.app;

import android.accessibilityservice.AccessibilityServiceInfo;
import android.app.AlertDialog;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.provider.Settings;
import android.util.Log;
import android.view.accessibility.AccessibilityManager;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@CapacitorPlugin(name = "AppBlocker")
public class AppBlockerPlugin extends Plugin {
    private static final String TAG = "AppBlockerPlugin";
    private static final String APP_BLOCKER_SERVICE = "com.focustask.app.AppBlockerService";
    private Set<String> blockedApps = new HashSet<>();

    @PluginMethod
    public void isServiceEnabled(PluginCall call) {
        JSObject ret = new JSObject();
        boolean isEnabled = isAccessibilityServiceEnabled(getContext(), APP_BLOCKER_SERVICE);
        ret.put("enabled", isEnabled);
        call.resolve(ret);
    }

    @PluginMethod
    public void requestBlockingPermission(PluginCall call) {
        // Save the call to use it after the user returns from the settings
        bridge.saveCall(call);

        Intent intent = new Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS);
        getActivity().startActivityForResult(intent, 1);
        
        // Note: We can't know immediately if the user enabled the service
        // They need to manually enable it and return to the app
        // We'll check the status when they return to the app
    }

    @PluginMethod
    public void setBlockedApps(PluginCall call) {
        try {
            JSArray apps = call.getArray("apps");
            blockedApps.clear();
            
            for (int i = 0; i < apps.length(); i++) {
                String packageName = apps.getString(i);
                blockedApps.add(packageName);
            }
            
            // Update the service with new blocked apps
            Intent intent = new Intent(getContext(), AppBlockerService.class);
            intent.putExtra("BLOCKED_APPS", new ArrayList<>(blockedApps));
            getContext().startService(intent);
            
            call.resolve();
        } catch (JSONException e) {
            call.reject("Error parsing blocked apps: " + e.getMessage());
        }
    }

    @PluginMethod
    public void getInstalledApps(PluginCall call) {
        try {
            final PackageManager pm = getContext().getPackageManager();
            List<ApplicationInfo> packages = pm.getInstalledApplications(PackageManager.GET_META_DATA);
            
            JSONArray appsArray = new JSONArray();
            String ourPackageName = getContext().getPackageName();
            
            for (ApplicationInfo applicationInfo : packages) {
                // Skip system apps and our own app
                if ((applicationInfo.flags & ApplicationInfo.FLAG_SYSTEM) == 0 && 
                    !applicationInfo.packageName.equals(ourPackageName)) {
                    
                    String appName = pm.getApplicationLabel(applicationInfo).toString();
                    
                    JSONObject appData = new JSONObject();
                    appData.put("packageName", applicationInfo.packageName);
                    appData.put("appName", appName);
                    
                    appsArray.put(appData);
                }
            }
            
            JSObject result = new JSObject();
            result.put("apps", JSArray.from(appsArray.toString()));
            call.resolve(result);
            
        } catch (Exception e) {
            Log.e(TAG, "Error getting installed apps", e);
            call.reject("Error getting installed apps: " + e.getMessage());
        }
    }

    @PluginMethod
    public void startBlockingService(PluginCall call) {
        if (!isAccessibilityServiceEnabled(getContext(), APP_BLOCKER_SERVICE)) {
            call.reject("Accessibility service is not enabled");
            return;
        }
        
        // Start the blocking service
        Intent intent = new Intent(getContext(), AppBlockerService.class);
        intent.putExtra("COMMAND", "START_BLOCKING");
        intent.putExtra("BLOCKED_APPS", new ArrayList<>(blockedApps));
        getContext().startService(intent);
        call.resolve();
    }

    @PluginMethod
    public void stopBlockingService(PluginCall call) {
        // Stop the blocking service
        Intent intent = new Intent(getContext(), AppBlockerService.class);
        intent.putExtra("COMMAND", "STOP_BLOCKING");
        getContext().startService(intent);
        call.resolve();
    }
    
    @Override
    protected void handleOnActivityResult(int requestCode, int resultCode, Intent data) {
        super.handleOnActivityResult(requestCode, resultCode, data);
        
        if (requestCode == 1) {
            PluginCall savedCall = bridge.getSavedCall("app_blocker_permission_request");
            
            if (savedCall == null) {
                return;
            }
            
            boolean isEnabled = isAccessibilityServiceEnabled(getContext(), APP_BLOCKER_SERVICE);
            JSObject ret = new JSObject();
            ret.put("granted", isEnabled);
            savedCall.resolve(ret);
            
            bridge.saveCall(null);
        }
    }
    
    private boolean isAccessibilityServiceEnabled(Context context, String accessibilityServiceName) {
        AccessibilityManager am = (AccessibilityManager) context.getSystemService(Context.ACCESSIBILITY_SERVICE);
        List<AccessibilityServiceInfo> enabledServices = am.getEnabledAccessibilityServiceList(
                AccessibilityServiceInfo.FEEDBACK_GENERIC);
        
        for (AccessibilityServiceInfo service : enabledServices) {
            if (service.getResolveInfo().serviceInfo.name.equals(accessibilityServiceName)) {
                return true;
            }
        }
        
        return false;
    }
}

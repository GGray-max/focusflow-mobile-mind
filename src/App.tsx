
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import React, { useEffect } from 'react';
import NotificationService from './services/NotificationService'; 
import { Capacitor } from '@capacitor/core';

import { TaskProvider } from "./contexts/TaskContext";
import { TimerProvider } from "./contexts/TimerContext";
import { ProcrastinationProvider } from "./contexts/ProcrastinationContext";

import Index from "./pages/Index";
import TasksPage from "./pages/TasksPage";
import TimerPage from "./pages/TimerPage";
import InsightsPage from "./pages/InsightsPage";
import SettingsPage from "./pages/SettingsPage";
import ReviewPage from "./pages/ReviewPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  useEffect(() => {
    // Initialize notifications
    const initializeNotifications = async () => {
      try {
        if (Capacitor.isNativePlatform()) {
          console.log('Requesting notification permissions...');
          const hasPermission = await NotificationService.requestPermissions();
          console.log('Notification permissions:', hasPermission ? 'granted' : 'denied');
        } else {
          console.info('Not a native platform - notifications will use web notifications');
        }
      } catch (error) {
        console.error('Error initializing notifications:', error);
      }
    };

    // Set up dark mode from preferences
    const setupDarkMode = () => {
      const isDarkMode = localStorage.getItem('darkMode') === 'true' || 
                        (!('darkMode' in localStorage) && 
                         window.matchMedia('(prefers-color-scheme: dark)').matches);
      
      if (isDarkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    };

    setupDarkMode();
    initializeNotifications();
    
    // Watch for system theme changes if no preference is saved
    if (!('darkMode' in localStorage)) {
      const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = (e: MediaQueryListEvent) => {
        if (e.matches) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      };
      
      darkModeMediaQuery.addEventListener('change', handleChange);
      return () => darkModeMediaQuery.removeEventListener('change', handleChange);
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <TaskProvider>
          <TimerProvider>
            <ProcrastinationProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/tasks" element={<TasksPage />} />
                  <Route path="/timer" element={<TimerPage />} />
                  <Route path="/insights" element={<InsightsPage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                  <Route path="/review" element={<ReviewPage />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>
            </ProcrastinationProvider>
          </TimerProvider>
        </TaskProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;

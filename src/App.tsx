
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import ErrorBoundary from "./components/common/ErrorBoundary";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import React, { useEffect, useState } from 'react';
import NotificationService from './services/NotificationService'; 
import { Capacitor } from '@capacitor/core';
import AppLoader from './components/ui/app-loader';

import { TaskProvider } from "./contexts/TaskContext";
import { TimerProvider } from "./contexts/TimerContext";
import { ProcrastinationProvider } from "./contexts/ProcrastinationContext";
import { VisionBoardProvider } from "./contexts/VisionBoardContext";

import Index from "./pages/Index";
import TasksPage from "./pages/TasksPage";
import TimerPage from "./pages/TimerPage";
import InsightsPage from "./pages/InsightsPage";
import SettingsPage from "./pages/SettingsPage";
import ReviewPage from "./pages/ReviewPage";
import CalendarPage from "./pages/CalendarPage";
import VisionBoardPage from "./pages/VisionBoardPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  const [showLoader, setShowLoader] = useState(true);
  useEffect(() => {
    // Initialize notifications with defensive programming
    const initializeNotifications = async () => {
      try {
        // Check if Capacitor is available
        if (typeof Capacitor !== 'undefined' && Capacitor.isPluginAvailable('LocalNotifications')) {
          console.log('Requesting notification permissions...');
          const hasPermission = await NotificationService.requestPermissions();
          console.log('Notification permissions:', hasPermission ? 'granted' : 'denied');
        } else {
          console.info('Notifications plugin not available or not a native platform');
        }
      } catch (error) {
        console.error('Error initializing notifications:', error);
        // Continue execution despite notification errors
      }
    };

    // Set up dark mode from preferences with defensive programming
    const setupDarkMode = () => {
      try {
        // Default to light mode if localStorage is not available
        let isDarkMode = false;
        
        // Only access localStorage if it's available
        if (typeof localStorage !== 'undefined') {
          isDarkMode = localStorage.getItem('darkMode') === 'true' || 
                      (!('darkMode' in localStorage) && 
                      window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
        } else {
          console.info('localStorage not available, defaulting to light mode');
        }
        
        if (isDarkMode) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      } catch (error) {
        console.error('Error setting up dark mode:', error);
        // Continue execution despite dark mode errors
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
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <TaskProvider>
            <TimerProvider>
              <ProcrastinationProvider>
                <VisionBoardProvider>
                  {showLoader && <AppLoader onFinished={() => setShowLoader(false)} />}
                  <Toaster />
                  <Sonner />
                  <BrowserRouter>
                    <Routes>
                      <Route path="/" element={
                        <ErrorBoundary>
                          <Index />
                        </ErrorBoundary>
                      } />
                      <Route path="/tasks" element={
                        <ErrorBoundary>
                          <TasksPage />
                        </ErrorBoundary>
                      } />
                      <Route path="/timer" element={
                        <ErrorBoundary>
                          <TimerPage />
                        </ErrorBoundary>
                      } />
                      <Route path="/insights" element={
                        <ErrorBoundary>
                          <InsightsPage />
                        </ErrorBoundary>
                      } />
                      <Route path="/settings" element={
                        <ErrorBoundary>
                          <SettingsPage />
                        </ErrorBoundary>
                      } />
                      <Route path="/review" element={
                        <ErrorBoundary>
                          <ReviewPage />
                        </ErrorBoundary>
                      } />
                      <Route path="/calendar" element={
                        <ErrorBoundary>
                          <CalendarPage />
                        </ErrorBoundary>
                      } />
                      <Route path="/vision-board" element={
                        <ErrorBoundary>
                          <VisionBoardPage />
                        </ErrorBoundary>
                      } />
                      <Route path="*" element={
                        <ErrorBoundary>
                          <NotFound />
                        </ErrorBoundary>
                      } />
                    </Routes>
                  </BrowserRouter>
                </VisionBoardProvider>
              </ProcrastinationProvider>
            </TimerProvider>
          </TaskProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;

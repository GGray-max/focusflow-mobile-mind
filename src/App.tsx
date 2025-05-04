import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import React, { useEffect } from 'react';
import NotificationService from './services/NotificationService'; // Added import

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
  // Request notification permissions when the app starts
  useEffect(() => {
    const initNotifications = async () => {
      try {
        await NotificationService.requestPermissions();
        console.log('Notification permissions requested');
      } catch (error) {
        console.error('Error requesting notification permissions:', error);
      }
    };
    
    initNotifications();
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

import React, { useMemo } from 'react';
import { useTasks } from '@/contexts/TaskContext';
import { useTimer } from '@/contexts/TimerContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { Clock, CheckCircle, Target, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';

const AnalyticsDashboard: React.FC = () => {
  const { state: { tasks } } = useTasks();
  const { state: timerState } = useTimer();

  const analytics = useMemo(() => {
    const completedTasks = tasks.filter(task => task.completed);
    const totalTimeSpent = tasks.reduce((total, task) => total + (task.totalTimeSpent || 0), 0);
    const totalSessions = timerState.focusSessions.length;

    // Daily productivity data for the last 7 days
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return date.toISOString().split('T')[0];
    });

    const dailyData = last7Days.map(date => {
      const dayTasks = completedTasks.filter(task => 
        task.completedAt && task.completedAt.startsWith(date)
      );
      const dayTime = dayTasks.reduce((total, task) => total + (task.totalTimeSpent || 0), 0);
      
      return {
        date: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
        tasks: dayTasks.length,
        time: Math.round(dayTime / (1000 * 60)), // Convert to minutes
      };
    });

    // Category breakdown
    const categoryData = tasks.reduce((acc, task) => {
      const category = task.category || 'Uncategorized';
      if (!acc[category]) {
        acc[category] = { name: category, completed: 0, total: 0, time: 0 };
      }
      acc[category].total++;
      if (task.completed) acc[category].completed++;
      acc[category].time += task.totalTimeSpent || 0;
      return acc;
    }, {} as Record<string, any>);

    const categoryStats = Object.values(categoryData).map((cat: any) => ({
      ...cat,
      time: Math.round(cat.time / (1000 * 60)), // Convert to minutes
      completion: cat.total > 0 ? Math.round((cat.completed / cat.total) * 100) : 0
    }));

    // Priority breakdown
    const priorityData = ['high', 'medium', 'low'].map(priority => {
      const priorityTasks = tasks.filter(task => task.priority === priority);
      const completed = priorityTasks.filter(task => task.completed).length;
      return {
        name: priority.charAt(0).toUpperCase() + priority.slice(1),
        total: priorityTasks.length,
        completed,
        completion: priorityTasks.length > 0 ? Math.round((completed / priorityTasks.length) * 100) : 0
      };
    });

    return {
      totalTasks: tasks.length,
      completedTasks: completedTasks.length,
      totalTimeSpent: Math.round(totalTimeSpent / (1000 * 60)), // Convert to minutes
      totalSessions,
      completionRate: tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0,
      averageSessionTime: totalSessions > 0 ? Math.round(totalTimeSpent / (totalSessions * 1000 * 60)) : 0,
      dailyData,
      categoryStats,
      priorityData,
      streakDays: timerState.streakDays
    };
  }, [tasks, timerState]);

  const COLORS = ['#8B5CF6', '#06B6D4', '#10B981', '#F59E0B', '#EF4444'];

  return (
    <div className="space-y-6 p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="text-2xl font-bold text-foreground mb-6">Analytics Dashboard</h2>
        
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-8 w-8 text-green-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Completed Tasks</p>
                  <p className="text-2xl font-bold text-foreground">{analytics.completedTasks}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Clock className="h-8 w-8 text-blue-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Time Focused</p>
                  <p className="text-2xl font-bold text-foreground">{analytics.totalTimeSpent}m</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Target className="h-8 w-8 text-purple-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Completion Rate</p>
                  <p className="text-2xl font-bold text-foreground">{analytics.completionRate}%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-8 w-8 text-orange-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Streak Days</p>
                  <p className="text-2xl font-bold text-foreground">{analytics.streakDays}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Daily Productivity */}
          <Card>
            <CardHeader>
              <CardTitle>Daily Productivity (Last 7 Days)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics.dailyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="tasks" fill="#8B5CF6" name="Tasks Completed" />
                  <Bar dataKey="time" fill="#06B6D4" name="Minutes Focused" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Category Performance */}
          <Card>
            <CardHeader>
              <CardTitle>Category Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={analytics.categoryStats}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, completion }) => `${name} (${completion}%)`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="completed"
                  >
                    {analytics.categoryStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Priority Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Priority Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics.priorityData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="total" fill="#E5E7EB" name="Total Tasks" />
                  <Bar dataKey="completed" fill="#10B981" name="Completed Tasks" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Weekly Trend */}
          <Card>
            <CardHeader>
              <CardTitle>Productivity Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analytics.dailyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="time" stroke="#8B5CF6" strokeWidth={2} name="Focus Time (min)" />
                  <Line type="monotone" dataKey="tasks" stroke="#06B6D4" strokeWidth={2} name="Tasks Completed" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </div>
  );
};

export default AnalyticsDashboard;

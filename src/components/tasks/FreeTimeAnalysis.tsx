import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useTasks } from '@/contexts/TaskContext';
import { Calendar } from '@/components/ui/calendar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format, startOfDay, parse, isWithinInterval, addMinutes, isBefore } from 'date-fns';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';

interface FreeTimeAnalysisProps {
  isOpen: boolean;
  onClose: () => void;
}

const FreeTimeAnalysis: React.FC<FreeTimeAnalysisProps> = ({ isOpen, onClose }) => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const { state } = useTasks();
  const { tasks } = state;

  // Get tasks for selected date
  const tasksForDate = useMemo(() => {
    return tasks.filter(task => 
      task.dueDate && 
      startOfDay(new Date(task.dueDate)).getTime() === startOfDay(selectedDate).getTime() &&
      task.startTime && 
      task.endTime
    ).sort((a, b) => {
      const aStartTime = a.startTime ? a.startTime : "00:00";
      const bStartTime = b.startTime ? b.startTime : "00:00";
      return aStartTime.localeCompare(bStartTime);
    });
  }, [tasks, selectedDate]);

  // Calculate free time slots
  const freeTimeSlots = useMemo(() => {
    if (tasksForDate.length === 0) {
      return [{ 
        start: "09:00", 
        end: "21:00", 
        duration: 12 * 60 
      }];
    }

    const timeSlots = [];
    const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');
    const workdayStart = "09:00";
    const workdayEnd = "21:00";

    // Convert task times to Date objects
    const scheduledTimes = tasksForDate
      .filter(task => task.startTime && task.endTime)
      .map(task => {
        const startDateTime = parse(`${selectedDateStr} ${task.startTime}`, 'yyyy-MM-dd HH:mm', new Date());
        const endDateTime = parse(`${selectedDateStr} ${task.endTime}`, 'yyyy-MM-dd HH:mm', new Date());
        return { startDateTime, endDateTime, title: task.title };
      })
      .sort((a, b) => a.startDateTime.getTime() - b.startDateTime.getTime());

    // Start with workday start
    let currentTime = parse(`${selectedDateStr} ${workdayStart}`, 'yyyy-MM-dd HH:mm', new Date());
    const workdayEndTime = parse(`${selectedDateStr} ${workdayEnd}`, 'yyyy-MM-dd HH:mm', new Date());

    // Add free time before first task if any
    if (scheduledTimes.length > 0 && isBefore(currentTime, scheduledTimes[0].startDateTime)) {
      const minutesDiff = Math.floor((scheduledTimes[0].startDateTime.getTime() - currentTime.getTime()) / (1000 * 60));
      if (minutesDiff >= 30) {
        timeSlots.push({
          start: format(currentTime, 'HH:mm'),
          end: format(scheduledTimes[0].startDateTime, 'HH:mm'),
          duration: minutesDiff
        });
      }
      currentTime = scheduledTimes[0].endDateTime;
    }

    // Find gaps between tasks
    for (let i = 0; i < scheduledTimes.length - 1; i++) {
      const currentEnd = scheduledTimes[i].endDateTime;
      const nextStart = scheduledTimes[i + 1].startDateTime;
      
      if (isBefore(currentEnd, nextStart)) {
        const minutesDiff = Math.floor((nextStart.getTime() - currentEnd.getTime()) / (1000 * 60));
        if (minutesDiff >= 30) {
          timeSlots.push({
            start: format(currentEnd, 'HH:mm'),
            end: format(nextStart, 'HH:mm'),
            duration: minutesDiff
          });
        }
      }
      
      currentTime = scheduledTimes[i + 1].endDateTime;
    }

    // Add free time after last task if within workday
    if (
      scheduledTimes.length > 0 && 
      isBefore(scheduledTimes[scheduledTimes.length - 1].endDateTime, workdayEndTime)
    ) {
      const lastTaskEnd = scheduledTimes[scheduledTimes.length - 1].endDateTime;
      const minutesDiff = Math.floor((workdayEndTime.getTime() - lastTaskEnd.getTime()) / (1000 * 60));
      if (minutesDiff >= 30) {
        timeSlots.push({
          start: format(lastTaskEnd, 'HH:mm'),
          end: format(workdayEndTime, 'HH:mm'),
          duration: minutesDiff
        });
      }
    }

    return timeSlots;
  }, [tasksForDate, selectedDate]);

  // Format duration minutes to hours and minutes
  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours > 0) {
      return `${hours}h ${mins > 0 ? `${mins}m` : ''}`;
    }
    return `${mins}m`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] md:max-w-[600px] max-h-[80vh] overflow-y-auto bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 flex flex-col">
        <DialogTitle>Free Time Analysis</DialogTitle>
        <div className="space-y-4 mt-2">
          <div>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              className="rounded-md pointer-events-auto mx-auto"
            />
          </div>

          <Card className="bg-white dark:bg-gray-800 shadow-sm">
            <ScrollArea className="h-[250px] rounded-md">
              <div className="p-4">
                <h3 className="font-semibold mb-3">
                  Available Time Slots for {format(selectedDate, 'MMMM d, yyyy')}
                </h3>
                
                {freeTimeSlots.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground">
                    No free time available on this date
                  </div>
                ) : (
                  <div className="space-y-2">
                    {freeTimeSlots.map((slot, index) => (
                      <div 
                        key={index}
                        className="bg-focus-50 dark:bg-focus-950 border border-focus-100 dark:border-focus-800 p-3 rounded-md"
                      >
                        <div className="font-medium text-focus-700 dark:text-focus-300 flex justify-between">
                          <span>{slot.start} - {slot.end}</span>
                          <span>{formatDuration(slot.duration)}</span>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {slot.duration >= 120 
                            ? "Perfect for deep work or major tasks" 
                            : slot.duration >= 60 
                            ? "Good for focused work sessions" 
                            : "Quick task or break time"}
                        </div>
                      </div>
                    ))}
                    
                    <div className="mt-4 text-sm text-gray-500 bg-gray-50 dark:bg-gray-900 p-2 rounded">
                      Total free time: {formatDuration(freeTimeSlots.reduce((acc, slot) => acc + slot.duration, 0))}
                    </div>
                  </div>
                )}
                
                <div className="mt-4">
                  <h4 className="font-medium mb-2">Scheduled Tasks</h4>
                  {tasksForDate.length === 0 ? (
                    <div className="text-center py-2 text-muted-foreground">
                      No scheduled tasks with time blocks
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {tasksForDate.map((task) => (
                        <div 
                          key={task.id}
                          className={cn(
                            "px-3 py-2 text-sm rounded-md",
                            task.priority === 'high' 
                              ? "bg-red-50 text-red-800 border-l-4 border-red-500" 
                              : task.priority === 'medium'
                              ? "bg-orange-50 text-orange-800 border-l-4 border-orange-500"
                              : "bg-blue-50 text-blue-800 border-l-4 border-blue-500"
                          )}
                        >
                          <div className="font-medium">{task.title}</div>
                          <div className="text-xs">
                            {task.startTime} - {task.endTime}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </ScrollArea>
          </Card>
        </div>
        
        <DialogFooter>
          <Button 
            onClick={onClose}
            className="bg-focus-400 hover:bg-focus-500"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default FreeTimeAnalysis;

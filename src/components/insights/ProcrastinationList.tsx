
import React from 'react';
import { useProcrastination, ProcrastinationEntry } from '@/contexts/ProcrastinationContext';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { Frown, CheckCircle, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const ProcrastinationList: React.FC = () => {
  const { state: { entries }, markOvercome, deleteEntry } = useProcrastination();
  
  if (entries.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="bg-gray-100 dark:bg-gray-800 rounded-full p-4 inline-block mb-4">
          <Frown size={32} className="text-gray-400" />
        </div>
        <h3 className="text-lg font-medium">No procrastination entries yet</h3>
        <p className="text-gray-500 mt-1">
          When you feel like procrastinating, log it here to understand your patterns
        </p>
      </div>
    );
  }
  
  const groupedByDate: {[key: string]: ProcrastinationEntry[]} = {};
  
  entries.forEach(entry => {
    const date = format(new Date(entry.timestamp), 'yyyy-MM-dd');
    if (!groupedByDate[date]) {
      groupedByDate[date] = [];
    }
    groupedByDate[date].push(entry);
  });
  
  return (
    <div className="space-y-6">
      {Object.entries(groupedByDate).map(([date, dayEntries]) => (
        <div key={date} className="space-y-2">
          <h3 className="text-sm font-medium text-gray-500">
            {format(new Date(date), 'PPPP')}
          </h3>
          
          {dayEntries.map(entry => (
            <div 
              key={entry.id} 
              className={cn(
                "bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-100 dark:border-gray-700",
                entry.overcome && "bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800"
              )}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      {format(new Date(entry.timestamp), 'h:mm a')}
                    </span>
                    
                    {entry.mood && (
                      <span 
                        className={cn(
                          "px-2 py-0.5 text-xs rounded-full",
                          entry.mood === 'frustrated' && "bg-red-100 text-red-700",
                          entry.mood === 'bored' && "bg-yellow-100 text-yellow-700",
                          entry.mood === 'anxious' && "bg-purple-100 text-purple-700",
                          entry.mood === 'tired' && "bg-blue-100 text-blue-700",
                          entry.mood === 'distracted' && "bg-green-100 text-green-700"
                        )}
                      >
                        {entry.mood}
                      </span>
                    )}
                    
                    {entry.overcome && (
                      <span className="bg-green-100 text-green-700 px-2 py-0.5 text-xs rounded-full flex items-center gap-1">
                        <CheckCircle size={12} />
                        Overcome
                      </span>
                    )}
                  </div>
                  
                  {entry.taskName && (
                    <div className="text-xs text-gray-500 mt-1">
                      Task: {entry.taskName}
                    </div>
                  )}
                  
                  <p className="text-sm mt-2">
                    {entry.reason}
                  </p>
                </div>
                
                {!entry.overcome && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => markOvercome(entry.id)}
                    className="text-focus-400 hover:text-focus-500 hover:bg-focus-100"
                  >
                    I beat it! <ChevronRight size={16} className="ml-1" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

export default ProcrastinationList;

import React, { useEffect, useState } from 'react';
import './FocusSummary.css';
import { IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonGrid, IonRow, IonCol, IonText, IonIcon, IonLabel, IonList, IonItem, IonChip } from '@ionic/react';
import { timeOutline, calendarOutline, checkmarkCircleOutline, trendingUpOutline } from 'ionicons/icons';
import TimerService from '../services/TimerService';

interface CompletedSession {
  id: string;
  duration: number;
  endTime: string;
  taskName: string;
}

interface FocusSummaryProps {
  showHistory?: boolean;
  maxHistoryItems?: number;
}

const FocusSummary: React.FC<FocusSummaryProps> = ({ 
  showHistory = true, 
  maxHistoryItems = 5 
}) => {
  const [totalFocusTime, setTotalFocusTime] = useState({ hours: 0, minutes: 0, formatted: '' });
  const [completedSessions, setCompletedSessions] = useState<CompletedSession[]>([]);
  const [sessionCount, setSessionCount] = useState(0);
  const [longestSession, setLongestSession] = useState({ duration: 0, formatted: '0 minutes' });

  useEffect(() => {
    // Load data
    refreshStats();

    // Subscribe to timer finished events to refresh stats
    const handleTimerFinished = () => {
      refreshStats();
    };

    TimerService.addEventListener('timerFinished', handleTimerFinished);

    return () => {
      TimerService.removeEventListener('timerFinished', handleTimerFinished);
    };
  }, []);

  const refreshStats = () => {
    // Get total focus time with hours and minutes
    const totalTime = TimerService.getTotalFocusTime();
    setTotalFocusTime(totalTime);

    // Get completed sessions
    const sessions = TimerService.getCompletedSessions();
    setCompletedSessions(sessions);
    setSessionCount(sessions.length);

    // Calculate longest session
    if (sessions.length > 0) {
      const longest = sessions.reduce((prev, current) => 
        (prev.duration > current.duration) ? prev : current);
      
      setLongestSession({
        duration: longest.duration,
        formatted: formatDuration(longest.duration)
      });
    }
  };

  // Format duration helper
  const formatDuration = (milliseconds: number): string => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);

    // Always return format like "2 hours 30 minutes" even if hours or minutes are 0
    if (hours > 0) {
      return `${hours} ${hours === 1 ? 'hour' : 'hours'} ${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`;
    } else {
      return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`;
    }
  };

  // Format date helper
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <IonCard className="focus-summary-card">
      <IonCardHeader>
        <IonCardTitle className="ion-text-center">Focus Summary</IonCardTitle>
      </IonCardHeader>
      
      <IonCardContent>
        {/* Stats Grid */}
        <IonGrid>
          <IonRow>
            <IonCol size="12" className="ion-text-center">
              <div className="stat-container total-time-stat">
                <IonIcon icon={timeOutline} color="primary" />
                <h2>Total Focus Time</h2>
                <IonText color="dark">
                  <h1 className="stat-value">
                    {totalFocusTime.hours} {totalFocusTime.hours === 1 ? 'hour' : 'hours'} {totalFocusTime.minutes} {totalFocusTime.minutes === 1 ? 'minute' : 'minutes'}
                  </h1>
                </IonText>
              </div>
            </IonCol>
          </IonRow>
          
          <IonRow>
            <IonCol size="6">
              <div className="stat-container">
                <IonIcon icon={checkmarkCircleOutline} color="success" />
                <h3>Completed Sessions</h3>
                <IonText color="dark">
                  <p className="stat-value">{sessionCount}</p>
                </IonText>
              </div>
            </IonCol>
            <IonCol size="6">
              <div className="stat-container">
                <IonIcon icon={trendingUpOutline} color="tertiary" />
                <h3>Longest Session</h3>
                <IonText color="dark">
                  <p className="stat-value">{longestSession.formatted}</p>
                </IonText>
              </div>
            </IonCol>
          </IonRow>
        </IonGrid>
        
        {/* Recent Sessions History */}
        {showHistory && completedSessions.length > 0 && (
          <div className="recent-history">
            <h3 className="ion-padding-top">Recent Focus Sessions</h3>
            <IonList>
              {completedSessions
                .slice(-maxHistoryItems)
                .reverse()
                .map(session => (
                  <IonItem key={session.id}>
                    <IonLabel>
                      <h2>{session.taskName}</h2>
                      <p>
                        <IonIcon icon={timeOutline} /> {formatDuration(session.duration)}
                        <span className="session-date">
                          <IonIcon icon={calendarOutline} /> {formatDate(session.endTime)}
                        </span>
                      </p>
                    </IonLabel>
                    <IonChip color="primary" slot="end">
                      {Math.floor(session.duration / 60000)} min
                    </IonChip>
                  </IonItem>
                ))}
            </IonList>
          </div>
        )}
      </IonCardContent>
    </IonCard>
  );
};

export default FocusSummary;

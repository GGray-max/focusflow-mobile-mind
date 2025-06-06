/**
 * Utility functions for formatting values in the application
 */

/**
 * Converts decimal hours to a human-readable format of "X hours Y minutes"
 * @param hours Number of hours in decimal format (e.g., 1.5 for 1 hour 30 minutes)
 * @returns Formatted string in "X hours Y minutes" format
 */
export const formatHoursToHoursMinutes = (hours: number): string => {
  if (hours === 0) return '0 minutes';
  
  const totalMinutes = Math.round(hours * 60);
  const hoursDisplay = Math.floor(totalMinutes / 60);
  const minutesDisplay = totalMinutes % 60;
  
  if (hoursDisplay === 0) {
    return `${minutesDisplay} ${minutesDisplay === 1 ? 'minute' : 'minutes'}`;
  } else if (minutesDisplay === 0) {
    return `${hoursDisplay} ${hoursDisplay === 1 ? 'hour' : 'hours'}`;
  } else {
    return `${hoursDisplay} ${hoursDisplay === 1 ? 'hour' : 'hours'} ${minutesDisplay} ${minutesDisplay === 1 ? 'minute' : 'minutes'}`;
  }
};

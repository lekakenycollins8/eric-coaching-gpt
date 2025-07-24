/**
 * Utility functions for time-related operations in follow-up processing
 */

/**
 * Calculate the time elapsed since a given date
 * @param createdAt The reference date
 * @returns A string representing the time elapsed in a human-readable format
 */
export function calculateTimeElapsed(createdAt: Date | string | undefined): string {
  if (!createdAt) return 'Unknown';
  
  const now = new Date();
  const createdAtDate = typeof createdAt === 'string' ? new Date(createdAt) : createdAt;
  const diffInMs = now.getTime() - createdAtDate.getTime();
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
  
  // Format the time elapsed in a human-readable way
  if (diffInDays < 1) return 'Less than a day';
  if (diffInDays === 1) return '1 day';
  if (diffInDays < 7) return `${diffInDays} days`;
  if (diffInDays < 14) return '1 week';
  if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks`;
  if (diffInDays < 60) return '1 month';
  if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} months`;
  if (diffInDays < 730) return '1 year';
  return `${Math.floor(diffInDays / 365)} years`;
}

/**
 * Calculate the recommended follow-up interval based on progress
 * @param progressLevel A number from 1-5 indicating progress level (1=low, 5=high)
 * @returns Recommended follow-up interval in days
 */
export function calculateRecommendedFollowupInterval(progressLevel: number): number {
  // Default to 30 days if progress level is invalid
  if (progressLevel < 1 || progressLevel > 5) return 30;
  
  // Map progress levels to recommended intervals
  const intervalMap: Record<number, number> = {
    1: 7,    // Low progress: check back in a week
    2: 14,   // Below average progress: check back in two weeks
    3: 30,   // Average progress: check back in a month
    4: 45,   // Above average progress: check back in a month and a half
    5: 60    // High progress: check back in two months
  };
  
  return intervalMap[progressLevel];
}

/**
 * Format a date for display in the follow-up context
 * @param date The date to format
 * @returns Formatted date string (e.g., "July 24, 2025")
 */
export function formatDate(date: Date | string | undefined): string {
  if (!date) return 'Unknown date';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  return dateObj.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/**
 * Calculate the next recommended follow-up date
 * @param progressLevel A number from 1-5 indicating progress level
 * @returns Date object for the next recommended follow-up
 */
export function calculateNextFollowupDate(progressLevel: number): Date {
  const intervalDays = calculateRecommendedFollowupInterval(progressLevel);
  const nextDate = new Date();
  nextDate.setDate(nextDate.getDate() + intervalDays);
  return nextDate;
}

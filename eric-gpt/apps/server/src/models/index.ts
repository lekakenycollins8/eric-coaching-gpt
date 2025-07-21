import { Collections } from '@/db/config';

// Import models
import User from './User';
// Organization model removed as it's not needed
import Worksheet from './Worksheet';
import Submission from './Submission';
import Subscription from './Subscription';
import WebhookEvent from './WebhookEvent';
import ProcessedEvent from './ProcessedEvent';
import Tracker from './Tracker';
import TrackerEntry from './TrackerEntry';
import TrackerReflection from './TrackerReflection';

// Export collection names for reference
export const ModelCollections = {
  User: Collections.USERS,
  // Organization collection removed as it's not needed
  Worksheet: Collections.WORKSHEETS,
  Submission: Collections.WORKSHEET_SUBMISSIONS,
  Subscription: Collections.SUBSCRIPTIONS,
  WebhookEvent: Collections.WEBHOOK_EVENTS,
  Tracker: 'trackers',
  TrackerEntry: 'tracker_entries',
  TrackerReflection: 'tracker_reflections',
} as const;

// Export models
export {
  User,
  // Organization removed as it's not needed
  Worksheet,
  Submission,
  Subscription,
  WebhookEvent,
  ProcessedEvent,
  Tracker,
  TrackerEntry,
  TrackerReflection,
};

import { Collections } from '@/db/config';

// Import models
import User from './User.js';
import Organization from './Organization.js';
import Worksheet from './Worksheet.js';
import Submission from './Submission.js';
import Subscription from './Subscription.js';
import WebhookEvent from './WebhookEvent.js';
import ProcessedEvent from './ProcessedEvent.js';

// Export collection names for reference
export const ModelCollections = {
  User: Collections.USERS,
  Organization: 'organizations',
  Worksheet: Collections.WORKSHEETS,
  Submission: Collections.WORKSHEET_SUBMISSIONS,
  Subscription: Collections.SUBSCRIPTIONS,
  WebhookEvent: Collections.WEBHOOK_EVENTS,
} as const;

// Export models
export {
  User,
  Organization,
  Worksheet,
  Submission,
  Subscription,
  WebhookEvent,
  ProcessedEvent,
};

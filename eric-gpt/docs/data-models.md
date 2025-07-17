# Data Models – Eric GPT Coaching Platform

This document outlines the full data schema for all models used across the platform, including users, organizations, worksheets, submissions, and trackers.

---

## 1. User

```typescript
interface User {
    id: string;                     // MongoDB ObjectId
    email: string;
    name?: string;
    createdAt: Date;

    // Authentication
    authProvider: "email";

    // Stripe & Subscription
    stripeCustomerId: string;
    subscription: {
        planId: string;               // e.g. "solo_monthly"
        status: "active"|"past_due"|"canceled";
        currentPeriodStart: Date;
        currentPeriodEnd: Date;
        submissionsThisPeriod: number;
    };

    // Organization (Pro plan)
    orgId?: string;                 // reference to Org.id
}
```

## 2. Organization

```typescript
interface Org {
    id: string;                     // MongoDB ObjectId
    ownerId: string;                // User.id
    memberIds: string[];            // User.id[] (max 5)
    stripeSubscriptionId: string;
}
```

## 3. Worksheet & Field Metadata

Used to render forms for coaching submissions and construct GPT prompts.

### Field

```typescript
interface Field {
    name: string;                   // e.g. "limiting_belief_1"
    label: string;                  // Prompt text
    type: "text" | "textarea" | "checkbox" | "multiselect" | "rating" | "table";
    options?: string[];             // For checkbox/multiselect
    required: boolean;
}
```

### Worksheet

```typescript
interface Worksheet {
    id: string;                     // e.g. "pillar1_mindset_shift"
    title: string;
    description?: string;
    systemPromptKey: string;        // key into prompts.json
    fields: Field[];
}
```

## 4. Submission

Represents a single completed worksheet by a user and the AI feedback it generated.

```typescript
interface Submission {
    id: string;                     // MongoDB ObjectId
    userId: string;
    orgId?: string;
    worksheetId: string;
    answers: Record<string, string | boolean | string[]>;
    aiFeedback: string;
    tokensUsed: {
        promptTokens: number;
        completionTokens: number;
        totalTokens: number;
    };
    createdAt: Date;
}
```

## 5. Trackers (5-Day Daily Reflection Tools)

### Tracker

```typescript
interface ITracker extends Document {
    userId: Schema.Types.ObjectId;
    title: string;
    description: string;
    status: "active" | "completed" | "abandoned";
    startDate: Date;
    endDate: Date;
    submissionId?: Schema.Types.ObjectId; // Optional link to a worksheet submission
    createdAt: Date;
    updatedAt: Date;
}
```

### TrackerEntry

```typescript
interface ITrackerEntry extends Document {
    trackerId: Schema.Types.ObjectId;
    userId: Schema.Types.ObjectId;
    day: number; // 1-5 for the 5-day tracker
    completed: boolean;
    notes: string;
    createdAt: Date;
    updatedAt: Date;
}
```

### TrackerReflection

```typescript
interface ITrackerReflection extends Document {
    trackerId: Schema.Types.ObjectId;
    userId: Schema.Types.ObjectId;
    content: string;
    createdAt: Date;
    updatedAt: Date;
}
```

## Notes

- All IDs are MongoDB ObjectIds.
- Trackers are implemented with a simpler model than originally planned:
  - Each tracker has a fixed 5-day duration with a start and end date
  - Entries are linked directly to the tracker (not to a period)
  - Each day (1-5) has a completion status and optional notes
  - A single reflection is stored per tracker
- Subscription enforcement is implemented on both frontend and backend for all tracker operations
- PDF export is available for completed trackers
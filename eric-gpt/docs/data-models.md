# Data Models – Eric GPT Coaching Platform

This document outlines the full data schema for all models used across the platform, including users, organizations, worksheets, submissions, and trackers.

---

## 1. User

```typescript
interface User {
    id: string;                     // UUID
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
    id: string;                     // UUID
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
    id: string;                     // UUID
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
interface Tracker {
    id: string;                     // e.g. "pillar1_daily_mindset"
    title: string;
    promptFields: Field[];          // Daily entry fields
    reflectionFields: Field[];      // End-of-period fields
    periodLength: number;           // e.g. 5 days
}
```

### TrackerPeriod

```typescript
interface TrackerPeriod {
    id: string;
    trackerId: string;
    userId: string;
    startDate: Date;
    status: "in_progress" | "complete";
}
```

### TrackerEntry

```typescript
interface TrackerEntry {
    id: string;
    periodId: string;
    date: Date;
    answers: Record<string, string | boolean | string[]>;
}
```

### TrackerReflection

```typescript
interface TrackerReflection {
    id: string;
    periodId: string;
    answers: Record<string, string | boolean | string[]>;
    submittedAt: Date;
}
```

## Notes

- All IDs are expected to be UUIDs.
- Tracker flows are designed to allow one active period per tracker per user at a time.
- Submissions are counted and quota-enforced based on worksheetId and user.subscription
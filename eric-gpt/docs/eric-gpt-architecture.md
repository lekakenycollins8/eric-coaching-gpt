**Eric GPT Coaching Platform — Final Architecture & API Blueprint**


**Date:** April 30, 2025

---

## 1. Final Data Model Schemas

### 1.1 User

```ts
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

### 1.2 Organization

```ts
interface Org {
  id: string;                     // UUID
  ownerId: string;                // User.id
  memberIds: string[];            // User.id[] (max 5)
  stripeSubscriptionId: string;
}
```

### 1.3 Worksheet & Field Metadata

```ts
interface Field {
  name: string;                   // e.g. "limiting_belief_1"
  label: string;                  // Prompt text
  type: "text"|"textarea"|"checkbox"|"multiselect"|"rating"|"table";
  options?: string[];             // for checkbox/multiselect
  required: boolean;
}

interface Worksheet {
  id: string;                     // e.g. "pillar1_mindset_shift"
  title: string;
  description?: string;
  systemPromptKey: string;        // key into prompts.json
  fields: Field[];
}
```

### 1.4 Submission

```ts
interface Submission {
  id: string;                     // UUID
  userId: string;
  orgId?: string;
  worksheetId: string;
  answers: Record<string, string|boolean|string[]>;
  aiFeedback: string;
  tokensUsed: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  createdAt: Date;
}
```

### 1.5 Trackers (5-Day Tools)

```ts
interface Tracker {
  id: string;                     // e.g. "pillar1_daily_mindset"
  title: string;
  promptFields: Field[];          // daily entry fields
  reflectionFields: Field[];      // end-of-period fields
  periodLength: number;           // 5 days
}

interface TrackerPeriod {
  id: string;
  trackerId: string;
  userId: string;
  startDate: Date;
  status: "in_progress"|"complete";
}

interface TrackerEntry {
  id: string;
  periodId: string;
  date: Date;
  answers: Record<string, string|boolean|string[]>;
}

interface TrackerReflection {
  id: string;
  periodId: string;
  answers: Record<string, string|boolean|string[]>;
  submittedAt: Date;
}
```

---

## 2. API Endpoint Specifications

### 2.1 Internal Endpoints

#### Authentication & Session

| Method | Endpoint                 | Auth | Request     | Response                 |
| ------ | ------------------------ | ---- | ----------- | ------------------------ |
| GET    | `/api/auth/session`      | No   | —           | `{ user, subscription }` |
| POST   | `/api/auth/signin/email` | No   | `{ email }` | `{ ok: true }`           |

#### Worksheet Metadata

| Method | Endpoint              | Auth | Request | Response                      |
| ------ | --------------------- | ---- | ------- | ----------------------------- |
| GET    | `/api/worksheets`     | No   | —       | `{ worksheets: Worksheet[] }` |
| GET    | `/api/worksheets/:id` | No   | —       | `Worksheet`                   |

#### Submissions & Feedback

| Method | Endpoint                   | Auth     | Request                    | Response                      |
| ------ | -------------------------- | -------- | -------------------------- | ----------------------------- |
| POST   | `/api/submissions`         | Required | `{ worksheetId, answers }` | `{ submissionId, feedback }`  |
| GET    | `/api/submissions`         | Required | (optional `worksheetId`)   | `Submission[]` (meta for VIP) |
| GET    | `/api/submissions/:id`     | Required | —                          | `Submission`                  |
| GET    | `/api/submissions/:id/pdf` | Required | —                          | `application/pdf`             |

#### Usage & Quota

| Method | Endpoint     | Auth     | Request | Response                                       |
| ------ | ------------ | -------- | ------- | ---------------------------------------------- |
| GET    | `/api/usage` | Required | —       | `{ planId, submissionsThisPeriod, periodEnd }` |

#### Trackers & Reflection

| Method | Endpoint                                     | Auth     | Request             | Response                                    |
| ------ | -------------------------------------------- | -------- | ------------------- | ------------------------------------------- |
| GET    | `/api/trackers`                              | Required | —                   | `Tracker[]`                                 |
| POST   | `/api/trackers/:trackerId/start`             | Required | —                   | `{ periodId, startDate }`                   |
| GET    | `/api/trackers/periods/:periodId`            | Required | —                   | `{ TrackerPeriod, entries[], reflection? }` |
| POST   | `/api/trackers/periods/:periodId/entries`    | Required | `{ date, answers }` | `{ entryId }`                               |
| POST   | `/api/trackers/periods/:periodId/reflection` | Required | `{ answers }`       | `{ reflectionId }`                          |
| GET    | `/api/trackers/periods/:periodId/export`     | Required | —                   | `application/pdf`                           |

#### Stripe Billing

| Method | Endpoint                              | Auth     | Request                              | Response        |
| ------ | ------------------------------------- | -------- | ------------------------------------ | --------------- |
| POST   | `/api/stripe/create-checkout-session` | Required | `{ priceId, successUrl, cancelUrl }` | `{ sessionId }` |
| POST   | `/api/stripe/webhook`                 | No       | Raw Stripe event payload             | `200 OK`        |

---

### 2.2 3rd-Party Integrations

#### OpenAI GPT-4

* **Endpoint:** `POST https://api.openai.com/v1/chat/completions`
* **Auth:** `Authorization: Bearer <OPENAI_API_KEY>`
* **Payload:**

  ```json
  {
    "model": "gpt-4",
    "messages": [ ... ],
    "temperature": 0.7,
    "max_tokens": 800
  }
  ```
* **Response:** Contains `choices[0].message.content` and `usage` metrics.

#### Stripe

* **SDK:** `stripe` Node.js
* **Auth:** Secret key in env
* **Checkout Session:** create subscription sessions
* **Webhooks:** listen to subscription events

#### Puppeteer (PDF)

* Render hidden route `/pdf-template/:submissionId` with React+CSS
* Launch Puppeteer in serverless mode to generate PDF buffer
* Return PDF stream or buffer to user

---

## 3. System Architecture Diagram (ASCII)

```
+---------------------+     HTTPS    +----------------------+      +-------------+
|   Client Browser    | <==========> |   Next.js Frontend   | <--> | Stripe API  |
| (React, Tailwind)   |              | (Pages, Components)  |      +-------------+
+---------------------+              +----------+-----------+
                                              |
                                              | Fetch/Submit
                                              v
                                 +-------------------------------+
                                 |  Next.js API Routes (Backend)  |
                                 | - Auth (NextAuth.js)           |
                                 | - Worksheets & Tracking CRUD   |
                                 | - Submissions & Quota Logic    |
                                 | - Stripe Checkout & Webhooks   |
                                 | - PDF Generation (Puppeteer)   |
                                 +--------------+----------------+
                                                |
                             +------------------+------------------+
                             |                                     |
                             v                                     v
                  +----------------------+               +------------------+
                  |   MongoDB Atlas      |               |   OpenAI GPT-4   |
                  | - Users, Orgs        |               |   Chat Completion|
                  | - Submissions       |               +------------------+
                  | - Trackers Data     |
                  +----------------------+
```

---

## Data Flow Summary
User logs in → NextAuth session cookie.

User browses /worksheets → frontend fetches metadata.

User fills form & hits Submit → frontend POST /api/submissions.

Backend checks quota, builds prompt, calls OpenAI, stores result.

Backend responds with feedback → frontend renders on screen.

User optionally clicks “Download PDF” 

*This blueprint finalizes the data contracts, API surface, and system components. We’re now ready to implement against these specifications.*
# Project Overview (Confirmed)

## Objective

To build a web-based AI coaching platform powered by GPT-4, enabling users to complete interactive leadership worksheets (from the Jackier Method) and receive immediate, personalized coaching feedback styled in Eric Jackier's voice.

## MVP Launch Includes

* Online worksheet forms
* GPT-based feedback (text and downloadable PDF)
* 3 subscription tiers (Solo, Pro, VIP)
* Pro team access (shared usage)
* VIP dashboard (submission history)
* Stripe billing integration
* User authentication with usage quotas

## Tech Stack

* Frontend: Next.js (React), Tailwind CSS
* Backend: Next.js API routes, MongoDB Atlas
* AI Integration: OpenAI GPT-4 API
* Billing: Stripe
* PDF Rendering: Puppeteer or a PDF service
* Deployment: Vercel

## Agreed Features and Functionality

### 1. Authentication & Access

* Users register/login with email (NextAuth.js)
* Subscription plan stored in DB, synced with Stripe
* All users must be logged in to access coaching tools

### 2. Worksheet Completion

* Interactive online forms mirroring the 12 leadership pillars
* Forms hand-coded based on PDFs (starting with 3 for MVP)
* Form submissions sent to GPT with worksheet-specific system prompts

### 3. AI Feedback Delivery

* Feedback displayed immediately on screen
* Option to download response as branded PDF

### 4. Subscription Tiers

| Plan | Limit | Features |
| --- | --- | --- |
| Solo Leader | 10/month | All worksheets, AI feedback |
| Pro Builder | 40/month/team | Up to 5 users, shared usage pool |
| Executive VIP | Unlimited | Submission history, PDF archive |

### 5. Stripe Integration

* Monthly & annual pricing
* Founding member discount support (20%)
* Manage subscriptions via Stripe portal

### 6. Pro Plan Team Access

* Pro users can invite teammates (up to 4 others)
* Usage quota shared across team members

### 7. VIP Dashboard

* View submission history (date, worksheet title)
* Download PDF for each response

## Pending Before Implementation

* What's Ready
	+ All project requirements defined
	+ Client has approved an 8-week timeline
	+ Design and UI/UX documentation prepared
	+ Client-facing project plan complete
	+ Pricing tiers, features, and tech choices agreed
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

* Frontend: Next.js (React), Tailwind CSS, Shadcn UI components
* Backend: Next.js API routes, MongoDB Atlas
* AI Integration: OpenAI GPT-4 API
* Billing: Stripe Checkout and Customer Portal
* PDF Rendering: Puppeteer with @sparticuz/chromium-min for serverless
* Deployment: Vercel

## Agreed Features and Functionality

### 1. Authentication & Access

* Users register/login with email magic links (NextAuth.js)
* Subscription plan stored in DB, synced with Stripe via webhooks
* All users must be logged in to access coaching tools
* Modern dashboard UI with responsive sidebar navigation

### 2. Worksheet Completion

* Interactive online forms mirroring the 12 leadership pillars
* Worksheets defined in JSON files loaded by the server
* Form submissions sent to GPT with worksheet-specific system prompts
* Consistent error handling and subscription enforcement

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

### 7. Dashboard Features

* Modern UI with responsive sidebar navigation
* Worksheet browsing and submission history
* Subscription management and usage tracking
* 5-day tracker functionality for commitment tracking
* PDF downloads for both worksheets and trackers

## Implementation Status

* Completed Features
	+ User authentication and session management
	+ Worksheet submission and AI feedback generation
	+ Subscription management with Stripe integration
	+ PDF generation for worksheets and trackers
	+ 5-day tracker functionality with daily entries and reflection
	+ Modern dashboard UI with responsive design
	+ Robust error handling and subscription enforcement
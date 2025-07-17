# Epics

## User Authentication & Subscription

### Sign Up / Sign In

As a new user, I want to register or log in via email/magic-link so that I can securely access my coaching dashboard and worksheets.

### View Subscription Plan

As a logged-in user, I want to see my current plan (Solo, Pro, VIP) and billing cycle (monthly/annual) so that I understand my entitlements and next renewal date.

### Manage Subscription

As a subscribed user, I want to click "Manage Subscription" and be redirected to Stripe's Customer Portal so that I can upgrade, downgrade, or cancel my plan.

## Worksheet Discovery & Selection

### Browse Available Worksheets

As any authenticated user, I want to see a grid/list of all available worksheets (12 pillars) with titles and descriptions so that I can quickly choose the exercise I need.

### Load Worksheet Form

As a user, I want to click a worksheet card and have its form dynamically render all fields so that I can fill in my answers directly online.

## Form Completion & Validation

### Complete Worksheet Fields

As a user, I want to enter text, select checkboxes or multi-select options, and see inline validation so that I'm guided to provide all required information correctly.

### Autosave Progress

As a user, I want to have my partially filled form auto-saved so that I don't lose work if I accidentally navigate away.

### Submit Worksheet

As a user, I want to press "Submit" so that my answers are processed by the AI and I receive feedback.

## AI Feedback Generation

### Dynamic Prompting

As the system, I want to inject the correct system prompt (per worksheet) and user answers into the GPT-4 API call so that feedback is tailored to the specific tool and Jackier voice.

### Display On-Screen Feedback

As a user, I want to see the AI-generated feedback instantly below my form so that I can read coaching tips without leaving the page.

### Download Feedback PDF

As a user, I want to click "Download PDF" and receive a branded PDF version of the feedback so that I can archive or share the coaching guidance.

## Quota Enforcement & Usage Tracking

### Show Usage Counter

As a user, I want to see "Submissions used X of Y this month" on my dashboard or form page so that I know how many AI calls I have left.

### Block on Quota Exceeded

As a Solo or Pro user, I want to get a clear error ("You've reached your 10/40 submissions this month") if I exceed my limit so that I understand why I cannot submit more.

### Prompt Upgrade Path

As a user who hit their quota, I want to see an "Upgrade Plan" button so that I can easily move to the next tier and restore access.

## Pro Team (Org) Management

### Create Organization

As a Pro-Builder account owner, I want to have an Org automatically created under my account on signup so that I can start inviting team members.

### Invite Team Member

As an Org owner, I want to invite up to 4 colleagues by email so that they can join my Org and share our 40-submission pool.

### Join Organization

As an invited team member, I want to click the email invite, sign up or sign in, and be added to the Org so that I can access worksheets under my team's subscription.

## My Submissions

### View Submission History

As a user, I want to see a paginated table of all my past submissions with date, worksheet name, and PDF download link so that I can revisit or export my coaching history.

### Unlimited Access for Executive VIP

As an Executive VIP, I want to never be blocked on submission quota so that I can get coaching whenever I need it.

## Trackers & Reflection Tools

### Create New Tracker

As a user, I want to create a new 5-day tracker with a title, description, and start date so that I can track my progress on a specific commitment.

### Log Daily Entries

As a user, I want to mark each day's completion status and add optional notes for my 5-day tracker so that I can record my progress consistently.

### Submit Final Reflection

As a user, I want to add a final reflection after completing my 5-day tracker so that I can document my overall experience and learnings.

### View Tracker History

As a user, I want to see a list of all my active and completed trackers so that I can review my progress over time.

### Download Tracker PDF

As a user, I want to generate and download a PDF summary of my tracker with all entries and reflection so that I can save or share my progress.

## Jackier Method Workbook Integration

### Complete Initial Assessment

As a new user, I want to complete the Jackier Method Workbook so that I can receive a personalized diagnosis of my leadership challenges and get tailored worksheet recommendations.

### Receive AI Diagnosis

As a user, I want to receive an AI-generated diagnosis of my leadership pillars after completing the workbook so that I understand which areas to focus on for improvement.

### Schedule Human Coaching

As a user who has received an AI diagnosis, I want to be prompted to schedule a call with Eric so that I can discuss my results and get personalized human coaching.

### Track Progress with Follow-ups

As an ongoing user, I want to complete follow-up assessments so that I can track my progress and receive updated recommendations based on my development.

### Receive Clarifying Questions

As a user working through worksheets, I want the system to ask me clarifying questions when needed so that my coaching experience becomes more personalized and effective.

## Security & Compliance (Internal/Technical)

### Secure Data & Sessions

As the system architect, I want all API routes served over HTTPS, session cookies set HttpOnly and Secure, and environment secrets never exposed so that user data remains confidential and secure.

### Input Validation

As the backend, I want to validate all incoming fields (types, lengths) so that invalid or malicious data is rejected.

### Rate-Limit API

As the platform, I want to throttle submissions to one per second per user so that we mitigate accidental floods or abuse.

### Email Integration

As the system, I want to automatically send workbook responses and AI analysis to help@jackiercoaching.com so that the human coaching team has all necessary information before client calls.
**Eric GPT Coaching Platform — UI/UX Specification Document**

**Status: Implemented**

---

## 1. Overview

This document defines the UI/UX specifications for the Eric GPT Coaching Platform MVP, focusing on usability, clear coaching workflows, intuitive navigation, and consistent branding.

---

## 2. Key User Flows

### 2.1 Account Signup & Login

* **Flow**: Visit site → Click “Sign Up” or “Log In” → Enter email → Receive magic link → Authenticated session established
* **UI Feedback**: Confirmation message on email submission and clear instructions to check inbox

### 2.2 Plan Selection & Checkout

* **Flow**: Visit Pricing page → Toggle Monthly/Yearly plans → Choose plan → Checkout via Stripe → Redirect back to dashboard
* **UI Feedback**: Plan badge visible on profile page; usage meter appears

### 2.3 Worksheet Completion & Feedback

* **Flow**: Select worksheet → Fill form → Submit → Receive AI-generated coaching feedback
* **UI Feedback**: Loading spinner during API call, success confirmation, and feedback displayed inline with PDF download option

### 2.4 Pro Team Invite

* **Flow**: Org owner visits Team Settings → Sends invites → Teammates register via emailed link → Auto-join org plan

### 2.5 My Submissions

* **Flow**: Navigate to “My Submissions” → View list of past submissions → Download PDFs

---

## 3. Page Layouts

### 3.1 Landing Page

* Hero section with tagline and CTA (Sign Up / Explore Worksheets)
* Section for pricing tiers
* Testimonials / trust indicators

### 3.2 Pricing Page

* Toggle: Monthly / Annual
* 3 Plans (Solo, Pro, VIP) in horizontal cards with benefits breakdown
* CTA buttons: "Start Trial" / "Subscribe Now"

### 3.3 Dashboard (Authenticated)

* Welcome message + plan badge
* Usage meter (e.g. 3 of 10 submissions used)
* Quick access tiles to:

  * Worksheets
  * My Submissions
  * Profile / Team Settings (Pro)

### 3.4 Worksheet Form Page

* Title and description of the worksheet
* Dynamically rendered form fields
* Submit button
* On submit: feedback shown inline below form
* Option to download PDF

### 3.5 Profile Page

* View current plan, usage, next billing date
* Button to open Stripe Customer Portal (manage plan)

### 3.6 Team Settings (Pro Builder only)

* Invite teammates (enter email)
* See list of added users
* Remove access (owner only)

### 3.7 My Submissions

* Table view: Date, Worksheet Title, View/Download PDF buttons
* Pagination controls for navigating through submission history
* Empty state with call-to-action when no submissions exist

### 3.8 Tracker Pages

* **Tracker List**: Grid of tracker cards with title, dates, and status indicators
* **Tracker Detail**: 
  * 5-day view with completion status and notes for each day
  * Final reflection section that appears after the tracking period
  * PDF export button for completed trackers
* **Create Tracker**: Form with title, description, and start date fields

---

## 4. Interactive Elements

* Buttons: Submit, Upgrade Plan, Download PDF, Invite
* Toggles: Pricing (monthly/yearly), Plan comparison
* Forms: Auth, Worksheet answers, Invite emails
* Modals: Success messages, confirmation alerts
* Tooltips: Plan limits, usage explanations

---

## 5. Navigation Structure

* **Sidebar Navigation (when logged in)**:

  * Dashboard
  * Worksheets
  * Trackers
  * My Submissions
  * Profile
  * Subscription
  * Settings
  * Logout

* **Top Nav (guest)**:

  * Home
  * Worksheets
  * Pricing
  * Sign Up / Log In

* **Bottom Nav or Footer**:

  * Privacy Policy
  * Terms of Service
  * Contact
  * LinkedIn / Social links

---

## 6. Branding Guidelines

* **Color Palette**: Trust-building blues and vibrant accents
* **Fonts**: Clean, professional sans-serif (e.g. Inter, Lato)
* **Tone**: Action-oriented, encouraging, growth-focused
* **Logo Use**: Jackier Method logo displayed on feedback PDFs and landing page
* **Feedback Style**: Maintain Eric Jackier’s voice in AI outputs (positive, structured, practical)

---

## 7. Accessibility Considerations

* High contrast UI
* Labels on all form fields
* Keyboard-navigable forms and modals
* Aria attributes where appropriate

---

## 8. Mobile Responsiveness

* Forms, pricing cards, and dashboard widgets collapse into vertical stacks
* Burger menu for navigation
* Minimized padding and font adjustments for small screens

## Summary
## User Flows
1. Onboard → Subscribe → Dashboard
2. Pick Worksheet → Fill → Submit → View Feedback
3. Start Tracker → Daily Entries → Final Reflection → Export
4. Team Invite & Manage

## Page Layouts
- **Navbar**: Home, Worksheets, Trackers, Dashboard, Profile
- **Dashboard**: usage meter, quick links
- **Worksheet Form**: title, form fields, submit, feedback
- **Tracker Page**: calendar/list view, entry rows, reflection
- **Profile**: plan details, usage, manage subscription

## Branding
- Colors: Gold (#FFD700), Green (#008000), Silver (#C0C0C0)
- Fonts: Inter (headings), Lato (body)
- Buttons: rounded corners, shadows, consistent padding
---
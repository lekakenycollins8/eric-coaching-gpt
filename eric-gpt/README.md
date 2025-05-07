# Eric GPT Coaching Platform

AI-powered leadership coaching platform using the Jackier Method, built with Next.js, MongoDB, and OpenAI GPT-4.

## Project Overview

The Eric GPT Coaching Platform enables users to complete interactive leadership worksheets and receive immediate, personalized coaching feedback styled in Eric Jackier's voice. The platform offers three subscription tiers (Solo, Pro, VIP) with varying usage limits and features.

## Tech Stack

- **Frontend**: Next.js (React), Tailwind CSS
- **Backend**: Next.js API routes, MongoDB Atlas
- **AI Integration**: OpenAI GPT-4 API
- **Authentication**: NextAuth.js with Email Provider
- **Billing**: Stripe
- **PDF Rendering**: Puppeteer
- **Deployment**: Vercel

## Project Structure

This is a monorepo managed with Turborepo, containing the following applications:

- `apps/web`: Frontend application (Next.js)
- `apps/server`: Backend API server (Next.js API routes)

### Web Application Structure

- `/src/app`: Next.js App Router pages
- `/src/components`: UI components
- `/src/lib`: Utility functions
- `/src/types`: TypeScript type definitions
- `/src/utils`: Helper functions

### Server Application Structure

- `/src/app`: API routes
- `/src/db`: MongoDB connection and utilities
- `/src/models`: Mongoose models
- `/src/config`: Configuration files
- `/src/lib`: Utility functions

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- MongoDB instance (local or Atlas)
- Stripe account for billing integration
- OpenAI API key

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/eric-coaching-gpt.git
   cd eric-coaching-gpt
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   - Copy `.env.example` to `.env` in both `apps/web` and `apps/server` directories
   - Fill in the required environment variables

4. Start the development servers:
   ```bash
   npm run dev
   ```

5. Open your browser and navigate to:
   - Web app: http://localhost:3001
   - Server: http://localhost:3000

## Development Workflow

- `npm run dev`: Start all applications in development mode
- `npm run dev:web`: Start only the web application
- `npm run dev:server`: Start only the server application
- `npm run build`: Build all applications for production
- `npm run check-types`: Run TypeScript type checking

## License

This project is proprietary and confidential.

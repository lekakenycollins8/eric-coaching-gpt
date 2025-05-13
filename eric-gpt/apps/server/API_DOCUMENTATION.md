# Eric GPT Coaching Platform API Documentation

This document provides an overview of the API documentation setup for the Eric GPT Coaching Platform.

## Swagger Documentation

The API documentation is implemented using Swagger (OpenAPI 3.0.0) and can be accessed at the following URL when the server is running:

```
http://localhost:3000/api-docs
```

## API Endpoints

The API is organized into the following categories:

### Stripe Integration

- `POST /api/stripe/create-checkout-session` - Create a Stripe checkout session for subscription
- `POST /api/stripe/customer-portal` - Create a Stripe customer portal session for managing subscriptions
- `POST /api/stripe/webhook` - Handle Stripe webhook events for subscription lifecycle management

### User Management

- `GET /api/user/subscription` - Get the current user's subscription details

### Worksheets

- `GET /api/worksheets` - Get a list of available worksheets with their metadata and form fields

## Authentication

Most API endpoints require authentication using a Bearer token. Include the user's ID as the token in the Authorization header:

```
Authorization: Bearer {userId}
```

## Models

The API uses the following data models:

- **User** - User account information including subscription details
- **Subscription** - Details about a user's subscription plan and status
- **SubscriptionPlan** - Information about available subscription plans
- **Worksheet** - Metadata about a coaching worksheet
- **WorksheetField** - Form field definition for worksheets

## Development

### Adding New API Routes

When adding new API routes, follow these steps to ensure they are properly documented:

1. Add JSDoc comments with Swagger annotations above the route handler
2. Include appropriate tags, request body schemas, and response schemas
3. Reference common models from the swagger-schemas.ts file

Example:

```typescript
/**
 * @swagger
 * /api/example:
 *   get:
 *     summary: Example endpoint
 *     description: Detailed description of the endpoint
 *     tags:
 *       - Example
 *     responses:
 *       200:
 *         description: Success response
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 */
export async function GET() {
  // Implementation
}
```

### Updating Schema Definitions

To add or update schema definitions:

1. Edit the `/src/lib/swagger-schemas.ts` file
2. Add or modify the schema definitions as needed

### Testing the Documentation

To test the API documentation:

1. Start the server with `npm run dev`
2. Navigate to `http://localhost:3000/api-docs` in your browser
3. Verify that all endpoints and schemas are correctly displayed

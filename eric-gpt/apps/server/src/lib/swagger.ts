import { createSwaggerSpec } from 'next-swagger-doc';
import { swaggerSchemas } from './swagger-schemas';

export const getApiDocs = () => {
  const spec = createSwaggerSpec({
    apiFolder: 'src/app/api', // Define the API folder path
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'Eric GPT Coaching Platform API',
        version: '1.0.0',
        description: 'API documentation for the Eric GPT Coaching Platform',
        contact: {
          name: 'API Support',
          email: 'support@ericgptcoaching.com',
        },
      },
      servers: [
        {
          url: '/api',
          description: 'API server',
        },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
        schemas: swaggerSchemas,
      },
      security: [
        {
          bearerAuth: [],
        },
      ],
      tags: [
        {
          name: 'Stripe',
          description: 'Stripe integration endpoints for subscription management',
        },
        {
          name: 'User',
          description: 'User management and profile endpoints',
        },
        {
          name: 'Worksheets',
          description: 'Worksheet management and submission endpoints',
        },
        {
          name: 'Submissions',
          description: 'Worksheet submission and AI feedback endpoints',
        },
        {
          name: 'Trackers',
          description: 'Commitment tracking and reflection endpoints',
        },
      ],
    },
  });
  return spec;
};

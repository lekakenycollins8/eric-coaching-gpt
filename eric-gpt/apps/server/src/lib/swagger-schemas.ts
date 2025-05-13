/**
 * Swagger schema definitions for common models used in the API
 * These schemas are referenced in the API documentation
 */

export const swaggerSchemas = {
  User: {
    type: 'object',
    properties: {
      _id: {
        type: 'string',
        description: 'Unique identifier for the user'
      },
      email: {
        type: 'string',
        format: 'email',
        description: 'User email address'
      },
      name: {
        type: 'string',
        description: 'User full name'
      },
      stripeCustomerId: {
        type: 'string',
        description: 'Stripe customer ID for the user'
      },
      subscription: {
        $ref: '#/components/schemas/Subscription',
        description: 'User subscription details'
      },
      createdAt: {
        type: 'string',
        format: 'date-time',
        description: 'Date when the user was created'
      },
      updatedAt: {
        type: 'string',
        format: 'date-time',
        description: 'Date when the user was last updated'
      }
    }
  },
  Subscription: {
    type: 'object',
    properties: {
      planId: {
        type: 'string',
        description: 'ID of the subscription plan'
      },
      status: {
        type: 'string',
        enum: ['active', 'past_due', 'canceled'],
        description: 'Current status of the subscription'
      },
      currentPeriodStart: {
        type: 'string',
        format: 'date-time',
        description: 'Start date of the current billing period'
      },
      currentPeriodEnd: {
        type: 'string',
        format: 'date-time',
        description: 'End date of the current billing period'
      },
      submissionsThisPeriod: {
        type: 'integer',
        description: 'Number of submissions used in the current period'
      }
    }
  },
  SubscriptionPlan: {
    type: 'object',
    properties: {
      id: {
        type: 'string',
        description: 'Unique identifier for the plan'
      },
      name: {
        type: 'string',
        description: 'Name of the plan'
      },
      description: {
        type: 'string',
        description: 'Description of the plan'
      },
      priceId: {
        type: 'string',
        description: 'Stripe price ID for the plan'
      },
      price: {
        type: 'number',
        description: 'Price of the plan in USD'
      },
      interval: {
        type: 'string',
        enum: ['month', 'year'],
        description: 'Billing interval for the plan'
      },
      features: {
        type: 'array',
        items: {
          type: 'string'
        },
        description: 'List of features included in the plan'
      },
      submissionsLimit: {
        type: 'integer',
        description: 'Maximum number of submissions allowed per billing period'
      }
    }
  },
  Worksheet: {
    type: 'object',
    properties: {
      id: {
        type: 'string',
        description: 'Unique identifier for the worksheet'
      },
      title: {
        type: 'string',
        description: 'Title of the worksheet'
      },
      description: {
        type: 'string',
        description: 'Brief description of the worksheet'
      },
      systemPromptKey: {
        type: 'string',
        description: 'Key for the system prompt used for this worksheet'
      },
      fields: {
        type: 'array',
        items: {
          $ref: '#/components/schemas/WorksheetField'
        },
        description: 'Form fields for the worksheet'
      }
    }
  },
  WorksheetField: {
    type: 'object',
    properties: {
      name: {
        type: 'string',
        description: 'Field name/identifier'
      },
      label: {
        type: 'string',
        description: 'Display label for the field'
      },
      type: {
        type: 'string',
        enum: ['text', 'textarea', 'select', 'multiselect', 'checkbox'],
        description: 'Type of form field'
      },
      required: {
        type: 'boolean',
        description: 'Whether the field is required'
      },
      options: {
        type: 'array',
        items: {
          type: 'string'
        },
        description: 'Options for select/multiselect fields'
      }
    }
  }
};

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
  },
  Submission: {
    type: 'object',
    properties: {
      _id: {
        type: 'string',
        description: 'Unique identifier for the submission'
      },
      userId: {
        type: 'string',
        description: 'ID of the user who created the submission'
      },
      worksheetId: {
        type: 'string',
        description: 'ID of the worksheet that was submitted'
      },
      worksheetTitle: {
        type: 'string',
        description: 'Title of the worksheet that was submitted'
      },
      answers: {
        type: 'object',
        description: 'User answers to worksheet questions'
      },
      aiFeedback: {
        type: 'string',
        description: 'AI-generated coaching feedback'
      },
      createdAt: {
        type: 'string',
        format: 'date-time',
        description: 'Date when the submission was created'
      }
    }
  },
  Tracker: {
    type: 'object',
    properties: {
      _id: {
        type: 'string',
        description: 'Unique identifier for the tracker'
      },
      userId: {
        type: 'string',
        description: 'ID of the user who created the tracker'
      },
      title: {
        type: 'string',
        description: 'Title of the tracker'
      },
      description: {
        type: 'string',
        description: 'Description of what is being tracked'
      },
      startDate: {
        type: 'string',
        format: 'date-time',
        description: 'Start date of the tracker'
      },
      endDate: {
        type: 'string',
        format: 'date-time',
        description: 'End date of the tracker (5 days after start date)'
      },
      status: {
        type: 'string',
        enum: ['active', 'completed', 'abandoned'],
        description: 'Current status of the tracker'
      },
      submissionId: {
        type: 'string',
        description: 'Optional ID of a worksheet submission this tracker is linked to'
      },
      createdAt: {
        type: 'string',
        format: 'date-time',
        description: 'Date when the tracker was created'
      }
    }
  },
  TrackerEntry: {
    type: 'object',
    properties: {
      _id: {
        type: 'string',
        description: 'Unique identifier for the tracker entry'
      },
      trackerId: {
        type: 'string',
        description: 'ID of the tracker this entry belongs to'
      },
      userId: {
        type: 'string',
        description: 'ID of the user who created the entry'
      },
      day: {
        type: 'integer',
        minimum: 1,
        maximum: 5,
        description: 'Day number (1-5) for this entry'
      },
      completed: {
        type: 'boolean',
        description: 'Whether the tracked activity was completed on this day'
      },
      notes: {
        type: 'string',
        description: 'Optional notes for this day\'s entry'
      },
      createdAt: {
        type: 'string',
        format: 'date-time',
        description: 'Date when the entry was created'
      },
      updatedAt: {
        type: 'string',
        format: 'date-time',
        description: 'Date when the entry was last updated'
      }
    }
  },
  TrackerReflection: {
    type: 'object',
    properties: {
      _id: {
        type: 'string',
        description: 'Unique identifier for the reflection'
      },
      trackerId: {
        type: 'string',
        description: 'ID of the tracker this reflection belongs to'
      },
      userId: {
        type: 'string',
        description: 'ID of the user who created the reflection'
      },
      content: {
        type: 'string',
        description: 'Reflection content written by the user'
      },
      createdAt: {
        type: 'string',
        format: 'date-time',
        description: 'Date when the reflection was created'
      },
      updatedAt: {
        type: 'string',
        format: 'date-time',
        description: 'Date when the reflection was last updated'
      }
    }
  }
};

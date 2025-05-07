{{ ... }}
/**
 * Type definitions for the Eric GPT Coaching Platform
 */

export interface User {
  id: string;
  email: string;
  name?: string;
  createdAt: Date;
  authProvider: "email";
  stripeCustomerId?: string;
  subscription?: {
    planId: string;
    status: "active" | "past_due" | "canceled";
    currentPeriodStart: Date;
    currentPeriodEnd: Date;
    submissionsThisPeriod: number;
  };
  orgId?: string;
}

export interface Worksheet {
  id: string;
  title: string;
  description?: string;
  systemPromptKey: string;
  fields: Field[];
}

export interface Field {
  name: string;
  label: string;
  type: "text" | "textarea" | "checkbox" | "multiselect" | "rating" | "table";
  options?: string[];
  required: boolean;
}
{{ ... }}

'use client';

import React from 'react';
import { 
  ChatBubbleLeftRightIcon, 
  DocumentTextIcon, 
  ArrowTrendingUpIcon, 
  ChartBarIcon,
  ClockIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';

const features = [
  {
    name: 'Leadership Worksheets',
    description: 'Access structured worksheets based on the 12 Pillars of Crystal Clear Leadership to develop your skills.',
    icon: DocumentTextIcon,
  },
  {
    name: 'AI Coaching Feedback',
    description: 'Receive personalized insights and actionable advice based on your worksheet responses.',
    icon: ChatBubbleLeftRightIcon,
  },
  {
    name: 'Daily Commitment Tracking',
    description: 'Track your leadership commitments with our 5-day tracker system to ensure consistent growth.',
    icon: ClockIcon,
  },
  {
    name: 'Satisfaction Insights',
    description: 'Get AI-generated satisfaction insights to understand your leadership strengths and areas for improvement.',
    icon: ChartBarIcon,
  },
  {
    name: 'Progress Monitoring',
    description: 'Visualize your leadership journey with progress metrics and growth indicators.',
    icon: ArrowTrendingUpIcon,
  },
  {
    name: 'Individual & Group Options',
    description: 'Choose between individual coaching or upgrade to small group coaching for your team.',
    icon: UserGroupIcon,
  },
];

export default function CoreFeatures() {
  return (
    <div className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="lg:text-center">
          <h2 className="text-base text-green-600 font-semibold tracking-wide uppercase">Features</h2>
          <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
            Everything You Need to Grow as a Leader
          </p>
          <p className="mt-4 max-w-2xl text-xl text-gray-500 lg:mx-auto">
            Eric GPT combines AI technology with proven leadership methodologies to help you master time management, decision-making, and communication.
          </p>
        </div>

        <div className="mt-10">
          <div className="space-y-10 md:space-y-0 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-x-8 md:gap-y-10">
            {features.map((feature) => (
              <div key={feature.name} className="relative">
                <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-green-500 text-white">
                  <feature.icon className="h-6 w-6" aria-hidden="true" />
                </div>
                <p className="ml-16 text-lg leading-6 font-medium text-gray-900">{feature.name}</p>
                <p className="mt-2 ml-16 text-base text-gray-500">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

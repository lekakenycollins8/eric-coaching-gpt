'use client';

import React from 'react';
import {
  ClipboardDocumentCheckIcon,
  DocumentTextIcon,
  ClipboardDocumentListIcon,
  ArrowPathIcon,
  AcademicCapIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';

type GuideStep = {
  id: number;
  title: string;
  description: string;
  icon: React.ReactNode;
  link: string;
  linkText: string;
};

export default function PlatformGuide() {
  const steps: GuideStep[] = [
    {
      id: 1,
      title: 'Complete Leadership Worksheets',
      description: 'Access our collection of leadership worksheets organized by pillars. Each worksheet is designed to help you reflect on and develop specific leadership skills.',
      icon: <DocumentTextIcon className="h-8 w-8 text-green-500" />,
      link: '/dashboard/worksheets',
      linkText: 'Browse Worksheets'
    },
    {
      id: 2,
      title: 'Receive AI Coaching Feedback',
      description: 'After completing a worksheet, you\'ll receive personalized AI coaching feedback to help you gain deeper insights and actionable steps.',
      icon: <AcademicCapIcon className="h-8 w-8 text-green-500" />,
      link: '/dashboard/worksheets',
      linkText: 'Try a Worksheet'
    },
    {
      id: 3,
      title: 'Review Past Submissions',
      description: 'Visit your submissions page to view and download PDFs of your completed worksheets with AI feedback for future reference.',
      icon: <ClipboardDocumentListIcon className="h-8 w-8 text-green-500" />,
      link: '/dashboard/submissions',
      linkText: 'View Submissions'
    },
    {
      id: 4,
      title: 'Track Your Progress',
      description: 'Use our 5-day trackers to monitor your progress on specific leadership commitments and reflect on your growth over time.',
      icon: <ArrowPathIcon className="h-8 w-8 text-green-500" />,
      link: '/dashboard/trackers',
      linkText: 'Start Tracking'
    }
  ];

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="px-4 py-5 sm:px-6">
        <h3 className="text-lg font-medium leading-6 text-gray-900">How to Use Eric GPT Coaching Platform</h3>
        <p className="mt-1 max-w-2xl text-sm text-gray-500">
          Follow these steps to get the most out of your leadership coaching experience
        </p>
      </div>
      <div className="border-t border-gray-200">
        <ul role="list" className="divide-y divide-gray-200">
          {steps.map((step) => (
            <li key={step.id} className="px-4 py-5 sm:px-6">
              <div className="flex items-start">
                <div className="flex-shrink-0 mt-1">{step.icon}</div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-900">{step.title}</p>
                  <p className="mt-1 text-sm text-gray-500">{step.description}</p>
                  <div className="mt-3">
                    <Link
                      href={step.link}
                      className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                    >
                      {step.linkText}
                    </Link>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

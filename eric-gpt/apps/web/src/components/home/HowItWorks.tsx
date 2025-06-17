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

export default function HowItWorks() {
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
    <div id="how-it-works" className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="lg:text-center mb-12">
          <h2 className="text-base text-green-600 font-semibold tracking-wide uppercase">The Process</h2>
          <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
            How Eric GPT Works
          </p>
          <p className="mt-4 max-w-2xl text-xl text-gray-500 lg:mx-auto">
            Follow these steps to transform your leadership skills with our AI-powered coaching platform
          </p>
        </div>

        <div className="mt-10">
          <div className="space-y-10 md:space-y-0 md:grid md:grid-cols-2 md:gap-x-8 md:gap-y-10">
            {steps.map((step) => (
              <div key={step.id} className="relative bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                <div className="flex items-start">
                  <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-md bg-green-100 text-green-600">
                    {step.icon}
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">{step.title}</h3>
                    <p className="mt-2 text-base text-gray-500">{step.description}</p>
                    <div className="mt-4">
                      <Link
                        href={step.link}
                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                      >
                        {step.linkText}
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

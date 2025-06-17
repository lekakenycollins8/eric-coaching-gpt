'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRightIcon } from '@heroicons/react/24/outline';

type FeaturedItem = {
  id: string;
  title: string;
  description: string;
  pillar: string;
  pillarColor: string;
  link: string;
};

export default function FeaturedContent() {
  // These would ideally be fetched from an API based on user progress
  const featuredWorksheets: FeaturedItem[] = [
    {
      id: 'pillar1_leadership_mindset',
      title: 'Leadership Mindset',
      description: 'Evaluate your current leadership style and identify areas for growth.',
      pillar: 'Leadership Mindset',
      pillarColor: 'bg-blue-100 text-blue-800',
      link: '/dashboard/worksheets/pillar1_leadership_mindset'
    },
    {
      id: 'pillar2_goal_setting',
      title: 'Goal Setting',
      description: 'Learn to set Specific, Measurable, Achievable, Relevant, and Time-bound goals.',
      pillar: 'Goal Setting',
      pillarColor: 'bg-green-100 text-green-800',
      link: '/dashboard/worksheets/pillar2_goal_setting'
    },
    {
      id: 'pillar3_communication_mastery',
      title: 'Communication Mastery',
      description: 'Develop strategies for clear and impactful communication with your team.',
      pillar: 'Communication Mastery',
      pillarColor: 'bg-purple-100 text-purple-800',
      link: '/dashboard/worksheets/pillar3_communication_mastery'
    }
  ];

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="px-4 py-5 sm:px-6">
        <h3 className="text-lg font-medium leading-6 text-gray-900">Recommended Worksheets</h3>
        <p className="mt-1 max-w-2xl text-sm text-gray-500">
          Start with these worksheets to build your leadership skills
        </p>
      </div>
      <div className="border-t border-gray-200">
        <ul role="list" className="divide-y divide-gray-200">
          {featuredWorksheets.map((worksheet) => (
            <li key={worksheet.id}>
              <Link href={worksheet.link} className="block hover:bg-gray-50">
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="truncate">
                      <div className="flex text-sm">
                        <p className="font-medium text-green-600 truncate">{worksheet.title}</p>
                      </div>
                      <div className="mt-2 flex">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${worksheet.pillarColor}`}>
                          {worksheet.pillar}
                        </span>
                      </div>
                    </div>
                    <div className="ml-2 flex-shrink-0 flex">
                      <ArrowRightIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                    </div>
                  </div>
                  <div className="mt-2 sm:flex sm:justify-between">
                    <div className="sm:flex">
                      <p className="flex items-center text-sm text-gray-500">
                        {worksheet.description}
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
      <div className="bg-gray-50 px-4 py-4 sm:px-6 border-t border-gray-200">
        <div className="flex justify-center">
          <Link
            href="/dashboard/worksheets"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            View All Worksheets
          </Link>
        </div>
      </div>
    </div>
  );
}

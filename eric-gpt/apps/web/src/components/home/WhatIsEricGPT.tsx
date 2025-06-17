'use client';

import React from 'react';
import { LightBulbIcon, SparklesIcon, ClockIcon } from '@heroicons/react/24/outline';

export default function WhatIsEricGPT() {
  return (
    <div className="py-16 bg-gray-50 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="lg:text-center">
          <h2 className="text-base text-green-600 font-semibold tracking-wide uppercase">Leadership Assistant</h2>
          <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
            What is Eric GPT?
          </p>
          <p className="mt-4 max-w-2xl text-xl text-gray-500 lg:mx-auto">
            Eric GPT is your AI-powered leadership coach, delivering personalized guidance based on the proven Jackier Method and the 12 Pillars of Crystal Clear Leadership.
          </p>
        </div>

        <div className="mt-10">
          <dl className="space-y-10 md:space-y-0 md:grid md:grid-cols-3 md:gap-x-8 md:gap-y-10">
            <div className="relative">
              <dt>
                <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-green-500 text-white">
                  <SparklesIcon className="h-6 w-6" aria-hidden="true" />
                </div>
                <p className="ml-16 text-lg leading-6 font-medium text-gray-900">Personalized Insights</p>
              </dt>
              <dd className="mt-2 ml-16 text-base text-gray-500">
                Receive tailored leadership advice that adapts to your unique challenges, strengths, and growth areas.
              </dd>
            </div>

            <div className="relative">
              <dt>
                <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-green-500 text-white">
                  <LightBulbIcon className="h-6 w-6" aria-hidden="true" />
                </div>
                <p className="ml-16 text-lg leading-6 font-medium text-gray-900">Proven Methodology</p>
              </dt>
              <dd className="mt-2 ml-16 text-base text-gray-500">
                Built on the Jackier Method and 12 Pillars framework, trusted by emerging leaders across industries.
              </dd>
            </div>

            <div className="relative">
              <dt>
                <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-green-500 text-white">
                  <ClockIcon className="h-6 w-6" aria-hidden="true" />
                </div>
                <p className="ml-16 text-lg leading-6 font-medium text-gray-900">Daily Progress</p>
              </dt>
              <dd className="mt-2 ml-16 text-base text-gray-500">
                Track your commitments and leadership growth with practical tools designed for busy professionals.
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}

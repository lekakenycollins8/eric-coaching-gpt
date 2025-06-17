'use client';

import React, { useState } from 'react';
import { CheckIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { STRIPE_PLANS, formatPrice } from '@/lib/stripe/plans';

export default function PricingPlans() {
  const [annual, setAnnual] = useState(false);

  // Using the actual plans from the application
  const plans = [
    {
      id: 'foundation_monthly',
      name: 'Foundation Builder',
      description: 'For early-stage leaders who want tools, structure, and momentum',
      price: STRIPE_PLANS.foundation_monthly.price,
      features: [
        'Access to all 12 Pillars worksheets',
        `${STRIPE_PLANS.foundation_monthly.submissionLimit} worksheet submissions per month`,
        'AI coaching feedback',
        'PDF export of submissions',
        'Basic commitment tracking'
      ],
      cta: 'Subscribe Now',
      mostPopular: false,
    },
    {
      id: 'momentum_monthly',
      name: 'Momentum Maker',
      description: 'For emerging leaders ready to go beyond tools and into transformation',
      price: STRIPE_PLANS.momentum_monthly.price,
      features: [
        'Everything in Foundation Builder',
        `${STRIPE_PLANS.momentum_monthly.submissionLimit} worksheet submissions per month`,
        'Advanced commitment tracking',
        'Priority AI coaching feedback',
        'Deeper leadership insights'
      ],
      cta: 'Subscribe Now',
      mostPopular: true,
    },
    {
      id: 'legacy_monthly',
      name: 'Legacy Leader',
      description: 'For leaders who want coaching, connection, and a path to lasting impact',
      price: STRIPE_PLANS.legacy_monthly.price,
      features: [
        'Everything in Momentum Maker',
        `${STRIPE_PLANS.legacy_monthly.submissionLimit} worksheet submissions per month`,
        'Premium AI coaching insights',
        'Comprehensive progress analytics',
        'Exclusive leadership resources'
      ],
      cta: 'Subscribe Now',
      mostPopular: false,
    }
  ];

  return (
    <div className="bg-white py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="sm:flex sm:flex-col sm:align-center">
          <h2 className="text-base font-semibold text-green-600 tracking-wide uppercase text-center">Pricing</h2>
          <p className="mt-2 text-3xl font-extrabold text-gray-900 tracking-tight sm:text-4xl text-center">
            Choose the Right Plan for Your Leadership Journey
          </p>
          <p className="mt-5 text-xl text-gray-500 max-w-3xl mx-auto text-center">
            All plans include a 7-day free trial, access to the Eric GPT coaching platform, worksheets based on the 12 Pillars of Crystal Clear Leadership, and AI-powered feedback.
          </p>
        </div>

        <div className="mt-12 space-y-4 sm:mt-16 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-6 lg:max-w-4xl lg:mx-auto xl:max-w-none xl:mx-0 xl:grid-cols-3">
          {plans.map((plan) => (
            <div key={plan.id} className={`rounded-lg shadow-sm divide-y divide-gray-200 ${plan.mostPopular ? 'border-2 border-green-500' : 'border border-gray-200'}`}>
              <div className="p-6">
                {plan.mostPopular && (
                  <div className="absolute top-0 right-0 -mt-3 mr-8">
                    <span className="inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium bg-green-100 text-green-800">
                      Most Popular
                    </span>
                  </div>
                )}
                <h2 className="text-lg leading-6 font-medium text-gray-900">{plan.name}</h2>
                <p className="mt-4 text-sm text-gray-500">{plan.description}</p>
                <p className="mt-8">
                  <span className="text-4xl font-extrabold text-gray-900">${plan.price}</span>
                  <span className="text-base font-medium text-gray-500">/mo</span>
                </p>
                <p className="mt-2 text-sm text-green-600 font-medium">7-day free trial</p>
                <Link
                  href="/auth/signin"
                  className={`mt-4 block w-full bg-${plan.mostPopular ? 'green-600 hover:bg-green-700' : 'gray-800 hover:bg-gray-900'} border border-transparent rounded-md py-2 text-sm font-semibold text-white text-center`}
                >
                  {plan.cta} with 7-Day Trial
                </Link>
              </div>
              <div className="pt-6 pb-8 px-6">
                <h3 className="text-xs font-medium text-gray-900 tracking-wide uppercase">What's included</h3>
                <ul role="list" className="mt-6 space-y-4">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex space-x-3">
                      <CheckIcon className="flex-shrink-0 h-5 w-5 text-green-500" aria-hidden="true" />
                      <span className="text-sm text-gray-500">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 text-center">
          <p className="text-lg text-gray-500">
            Looking for the Executive Accelerator plan with unlimited submissions?
          </p>
          <Link
            href="https://www.jackiercoaching.com/contact"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700"
          >
            Contact Us for Executive Options
          </Link>
        </div>
      </div>
    </div>
  );
}

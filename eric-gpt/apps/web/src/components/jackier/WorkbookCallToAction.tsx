'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useWorkbookStatus } from '@/hooks/useWorkbookStatus';
import { useSubscription } from '@/hooks/useSubscription';
import { hasFeatureAccess } from '@/lib/subscription-utils';

interface WorkbookCallToActionProps {
  className?: string;
}

/**
 * A component that displays a call to action for the Jackier Workbook
 * based on the user's current workbook status and subscription
 */
export function WorkbookCallToAction({ className = '' }: WorkbookCallToActionProps) {
  // Get workbook status to check if user has completed it
  const { status: workbookStatus, isLoading: workbookStatusLoading } = useWorkbookStatus();
  
  // Check subscription status
  const { subscription, loading: subscriptionLoading } = useSubscription();
  const hasAccess = hasFeatureAccess(subscription, 'worksheetSubmit', { 
    isLoading: subscriptionLoading 
  });

  if (!hasAccess || workbookStatusLoading) {
    return null;
  }

  return (
    <div className={className}>
      {(!workbookStatus || workbookStatus.status === 'not_started') && (
        <Card className="border-2 border-green-500 shadow-lg">
          <CardHeader className="bg-green-50">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl text-green-700">Start Your Leadership Journey</CardTitle>
                <CardDescription className="text-green-600 font-medium">
                  Complete the Jackier Method Workbook to get personalized AI recommendations
                </CardDescription>
              </div>
              <div className="hidden md:block bg-green-100 p-2 rounded-full">
                <AlertCircle className="h-8 w-8 text-green-600" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <p>
                <strong>The Jackier Method Workbook is your essential first step</strong> in our coaching process. 
                By completing this assessment, our AI can understand your specific leadership challenges and strengths.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">1. Complete Assessment</h4>
                  <p className="text-sm text-gray-600">Answer questions about your leadership style and challenges</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">2. Receive AI Diagnosis</h4>
                  <p className="text-sm text-gray-600">Get personalized insights about your leadership profile</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">3. Targeted Recommendations</h4>
                  <p className="text-sm text-gray-600">Access pillar worksheets specifically chosen for your needs</p>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="bg-gray-50">
            <Button asChild size="lg" className="w-full md:w-auto">
              <Link href="/dashboard/jackier">
                Start the Jackier Workbook <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardFooter>
        </Card>
      )}
      
      {workbookStatus && workbookStatus.status === 'in_progress' && (
        <Card className="border-2 border-amber-500 shadow-lg">
          <CardHeader className="bg-amber-50">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl text-amber-700">Continue Your Assessment</CardTitle>
                <CardDescription className="text-amber-600 font-medium">
                  You've started the Jackier Method Workbook - complete it to get your diagnosis
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <p>
                You've made progress on your assessment, but it's not complete yet. 
                Finish the workbook to receive your personalized leadership diagnosis and recommendations.
              </p>
              <div className="bg-amber-50 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span>Your progress:</span>
                  <span className="font-medium">{Math.round(workbookStatus.progress * 100)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="bg-amber-500 h-2.5 rounded-full" 
                    style={{ width: `${Math.round(workbookStatus.progress * 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="bg-gray-50">
            <Button asChild size="lg" className="w-full md:w-auto">
              <Link href="/dashboard/jackier/workbook">
                Continue Workbook <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardFooter>
        </Card>
      )}
      
      {workbookStatus && workbookStatus.status === 'completed' && (
        <Card className="border-2 border-blue-500 shadow-lg">
          <CardHeader className="bg-blue-50">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl text-blue-700">View Your Leadership Diagnosis</CardTitle>
                <CardDescription className="text-blue-600 font-medium">
                  Your Jackier Method Workbook is complete - explore your personalized recommendations
                </CardDescription>
              </div>
              <div className="hidden md:block bg-blue-100 p-2 rounded-full">
                <CheckCircle2 className="h-8 w-8 text-blue-600" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <p>
              Thank you for completing the Jackier Method Workbook! Your personalized leadership diagnosis 
              is ready, along with targeted pillar worksheets selected specifically for your development needs.
            </p>
          </CardContent>
          <CardFooter className="bg-gray-50">
            <Button asChild size="lg" className="w-full md:w-auto">
              <Link href="/dashboard/jackier/diagnosis">
                View Diagnosis & Recommendations <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}

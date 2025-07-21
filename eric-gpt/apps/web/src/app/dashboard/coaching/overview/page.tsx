'use client';

import React from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CalendarIcon, ClipboardCheckIcon, ArrowRightIcon, CheckCircleIcon, BookOpenIcon } from 'lucide-react';

export default function CoachingOverview() {
  const { data: session } = useSession();
  const userName = session?.user?.name || 'there';
  
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-2">Coaching Overview</h1>
      <p className="text-gray-600 mb-8">
        Learn about the coaching options available to you and how they can enhance your leadership journey.
      </p>
      
      <Tabs defaultValue="about" className="w-full mb-8">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="about">About Coaching</TabsTrigger>
          <TabsTrigger value="process">The Process</TabsTrigger>
          <TabsTrigger value="benefits">Benefits</TabsTrigger>
        </TabsList>
        
        <TabsContent value="about" className="p-4 border rounded-md mt-2">
          <h2 className="text-xl font-semibold mb-4">Leadership Coaching with Eric Jackier</h2>
          <p className="mb-4">
            Leadership coaching is a personalized development process designed to help you enhance your
            leadership skills, overcome challenges, and achieve your professional goals.
          </p>
          <p className="mb-4">
            Through one-on-one sessions with Eric Jackier, you'll receive guidance tailored to your
            specific situation, building on insights from your worksheet submissions and leadership assessments.
          </p>
          <div className="bg-green-50 p-4 rounded-md border border-green-100 mb-4">
            <h3 className="font-medium text-green-800 mb-1">Why Coaching Works</h3>
            <p className="text-sm text-green-700">
              Coaching provides accountability, personalized feedback, and expert guidance that helps
              you implement the insights from your worksheets in real-world situations.
            </p>
          </div>
          <Button asChild>
            <Link href="/dashboard/coaching/schedule">
              <CalendarIcon className="mr-2 h-4 w-4" />
              Schedule Your First Session
            </Link>
          </Button>
        </TabsContent>
        
        <TabsContent value="process" className="p-4 border rounded-md mt-2">
          <h2 className="text-xl font-semibold mb-4">The Coaching Process</h2>
          <ol className="space-y-4 mb-6">
            <li className="flex items-start">
              <div className="bg-blue-100 rounded-full p-1 mr-3 mt-0.5">
                <span className="flex items-center justify-center h-5 w-5 text-blue-700 font-medium">1</span>
              </div>
              <div>
                <h3 className="font-medium">Complete Follow-up Worksheets</h3>
                <p className="text-sm text-gray-600">
                  Your worksheet submissions provide valuable insights into your leadership style and challenges.
                </p>
              </div>
            </li>
            <li className="flex items-start">
              <div className="bg-blue-100 rounded-full p-1 mr-3 mt-0.5">
                <span className="flex items-center justify-center h-5 w-5 text-blue-700 font-medium">2</span>
              </div>
              <div>
                <h3 className="font-medium">Schedule a Coaching Session</h3>
                <p className="text-sm text-gray-600">
                  Choose a convenient time for a 45-minute video call with Eric to discuss your specific challenges.
                </p>
              </div>
            </li>
            <li className="flex items-start">
              <div className="bg-blue-100 rounded-full p-1 mr-3 mt-0.5">
                <span className="flex items-center justify-center h-5 w-5 text-blue-700 font-medium">3</span>
              </div>
              <div>
                <h3 className="font-medium">Receive Personalized Guidance</h3>
                <p className="text-sm text-gray-600">
                  Eric will provide actionable strategies tailored to your specific leadership situation.
                </p>
              </div>
            </li>
            <li className="flex items-start">
              <div className="bg-blue-100 rounded-full p-1 mr-3 mt-0.5">
                <span className="flex items-center justify-center h-5 w-5 text-blue-700 font-medium">4</span>
              </div>
              <div>
                <h3 className="font-medium">Implement and Follow Up</h3>
                <p className="text-sm text-gray-600">
                  Apply the strategies in your work, track your progress, and follow up with additional sessions as needed.
                </p>
              </div>
            </li>
          </ol>
          <Button variant="outline" asChild>
            <Link href="/dashboard/coaching">
              <ArrowRightIcon className="mr-2 h-4 w-4" />
              Go to Coaching Dashboard
            </Link>
          </Button>
        </TabsContent>
        
        <TabsContent value="benefits" className="p-4 border rounded-md mt-2">
          <h2 className="text-xl font-semibold mb-4">Benefits of Coaching</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="flex items-start">
              <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
              <div>
                <h3 className="font-medium">Personalized Guidance</h3>
                <p className="text-sm text-gray-600">
                  Receive advice tailored to your specific leadership challenges and goals.
                </p>
              </div>
            </div>
            <div className="flex items-start">
              <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
              <div>
                <h3 className="font-medium">Accountability</h3>
                <p className="text-sm text-gray-600">
                  Stay committed to your leadership development with regular check-ins.
                </p>
              </div>
            </div>
            <div className="flex items-start">
              <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
              <div>
                <h3 className="font-medium">Expert Perspective</h3>
                <p className="text-sm text-gray-600">
                  Gain insights from Eric's extensive experience in leadership development.
                </p>
              </div>
            </div>
            <div className="flex items-start">
              <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
              <div>
                <h3 className="font-medium">Accelerated Growth</h3>
                <p className="text-sm text-gray-600">
                  Progress faster by avoiding common pitfalls and focusing on effective strategies.
                </p>
              </div>
            </div>
            <div className="flex items-start">
              <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
              <div>
                <h3 className="font-medium">Confidence Building</h3>
                <p className="text-sm text-gray-600">
                  Develop greater confidence in your leadership decisions and actions.
                </p>
              </div>
            </div>
            <div className="flex items-start">
              <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
              <div>
                <h3 className="font-medium">Practical Application</h3>
                <p className="text-sm text-gray-600">
                  Learn how to apply worksheet insights to real-world leadership situations.
                </p>
              </div>
            </div>
          </div>
          <Button asChild>
            <Link href="/dashboard/coaching/schedule">
              <CalendarIcon className="mr-2 h-4 w-4" />
              Schedule a Session
            </Link>
          </Button>
        </TabsContent>
      </Tabs>
      
      <Card>
        <CardHeader>
          <CardTitle>Recommended Resources</CardTitle>
          <CardDescription>
            Additional materials to support your leadership development
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start">
              <BookOpenIcon className="h-5 w-5 text-blue-500 mr-3 mt-0.5" />
              <div>
                <h3 className="font-medium">Leadership Fundamentals Guide</h3>
                <p className="text-sm text-gray-600 mb-1">
                  A comprehensive overview of core leadership principles covered in coaching sessions.
                </p>
                <Button variant="link" className="h-auto p-0 text-blue-600">
                  Download PDF
                </Button>
              </div>
            </div>
            <div className="flex items-start">
              <BookOpenIcon className="h-5 w-5 text-blue-500 mr-3 mt-0.5" />
              <div>
                <h3 className="font-medium">Coaching Preparation Worksheet</h3>
                <p className="text-sm text-gray-600 mb-1">
                  Complete this worksheet before your coaching session to maximize its effectiveness.
                </p>
                <Button variant="link" className="h-auto p-0 text-blue-600">
                  Download PDF
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button variant="outline" asChild className="w-full">
            <Link href="/dashboard/worksheets">
              View All Worksheets
              <ArrowRightIcon className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

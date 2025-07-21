'use client';

import React from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CalendarIcon, ClipboardCheckIcon, ArrowRightIcon, UserIcon, BookOpenIcon, CheckCircleIcon } from 'lucide-react';

export default function CoachingDashboard() {
  const { data: session } = useSession();
  const userName = session?.user?.name || 'there';
  
  return (
    <div className="container mx-auto py-8">
      <div className="flex flex-col md:flex-row justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Coaching Dashboard</h1>
          <p className="text-gray-600">
            Access personalized coaching sessions and track your progress.
          </p>
        </div>
        <div className="mt-4 md:mt-0">
          <Button variant="outline" asChild>
            <Link href="/dashboard/coaching/overview">
              <BookOpenIcon className="mr-2 h-4 w-4" />
              Learn About Coaching
            </Link>
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-xl">Schedule a Coaching Session</CardTitle>
            <CardDescription>
              Book a one-on-one coaching session with Eric Jackier to discuss your leadership challenges.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <ul className="space-y-2">
              <li className="flex items-start">
                <ClipboardCheckIcon className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                <span>Personalized guidance on your specific leadership challenges</span>
              </li>
              <li className="flex items-start">
                <ClipboardCheckIcon className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                <span>Actionable strategies for implementing worksheet insights</span>
              </li>
              <li className="flex items-start">
                <ClipboardCheckIcon className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                <span>Follow-up resources to support your growth</span>
              </li>
            </ul>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full">
              <Link href="/dashboard/coaching/schedule">
                <CalendarIcon className="mr-2 h-4 w-4" />
                Schedule Session
              </Link>
            </Button>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-xl">Your Coaching Journey</CardTitle>
            <CardDescription>
              Track your progress and access resources from previous coaching sessions.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-sm text-gray-600 mb-4">
              Your coaching journey is personalized based on your worksheet submissions and previous coaching sessions.
              Continue completing follow-up worksheets to unlock more insights and coaching opportunities.
            </p>
            <div className="bg-blue-50 p-4 rounded-md border border-blue-100">
              <h3 className="font-medium text-blue-800 mb-1">Tip from Eric</h3>
              <p className="text-sm text-blue-700">
                Regular follow-up worksheet completion helps identify patterns in your leadership style and areas
                where coaching can have the greatest impact.
              </p>
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="outline" asChild className="w-full">
              <Link href="/dashboard/worksheets">
                View Worksheets
                <ArrowRightIcon className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
      
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Follow-up Worksheets & Coaching</CardTitle>
          <CardDescription>
            Complete follow-up worksheets to maximize your coaching experience
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Follow-up worksheets are a key part of your leadership development journey. They help you reflect on your progress,
              identify challenges, and prepare for coaching sessions.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start">
                <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                <div>
                  <h3 className="font-medium">Track Your Progress</h3>
                  <p className="text-sm text-gray-600">
                    Regular follow-ups help identify patterns in your leadership development.
                  </p>
                </div>
              </div>
              <div className="flex items-start">
                <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                <div>
                  <h3 className="font-medium">Prepare for Coaching</h3>
                  <p className="text-sm text-gray-600">
                    Your responses inform the focus of your coaching sessions.
                  </p>
                </div>
              </div>
              <div className="flex items-start">
                <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                <div>
                  <h3 className="font-medium">Identify Challenges</h3>
                  <p className="text-sm text-gray-600">
                    Uncover obstacles that may be hindering your leadership effectiveness.
                  </p>
                </div>
              </div>
              <div className="flex items-start">
                <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                <div>
                  <h3 className="font-medium">Measure Growth</h3>
                  <p className="text-sm text-gray-600">
                    See how your responses evolve over time as you implement coaching advice.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button asChild className="w-full">
            <Link href="/dashboard/worksheets">
              Complete Follow-up Worksheets
              <ArrowRightIcon className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </CardFooter>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>About Your Coach</CardTitle>
          <CardDescription>
            Meet Eric Jackier, your leadership development coach
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col md:flex-row gap-6">
          <div className="md:w-1/4 flex justify-center">
            <div className="h-32 w-32 rounded-full bg-gray-200 flex items-center justify-center">
              <UserIcon className="h-16 w-16 text-gray-400" />
            </div>
          </div>
          <div className="md:w-3/4">
            <h3 className="text-lg font-medium mb-2">Eric Jackier</h3>
            <p className="text-gray-600 mb-4">
              Eric is an experienced leadership coach with over 15 years of experience helping professionals
              develop their leadership skills and overcome workplace challenges. His coaching approach combines
              practical strategies with personalized guidance to help you achieve your leadership goals.
            </p>
            <p className="text-gray-600">
              Through the Eric GPT Coaching Platform, Eric provides a unique blend of AI-powered insights
              and human coaching expertise to deliver a comprehensive leadership development experience.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

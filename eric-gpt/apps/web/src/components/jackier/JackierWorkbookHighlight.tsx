'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, ArrowRight, BookOpen, BarChart3, LightbulbIcon, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface JackierWorkbookHighlightProps {
  className?: string;
}

/**
 * An enhanced component that highlights the importance of the Jackier Workbook
 * as the first step in the leadership journey with detailed explanations and visual elements.
 * This component always renders regardless of user state or workbook completion status.
 */
export function JackierWorkbookHighlight({ className = '' }: JackierWorkbookHighlightProps) {
  // Benefits of completing the workbook - always shown
  const benefits = [
    {
      title: "Personalized Leadership Profile",
      description: "Discover your unique leadership style and strengths",
      icon: <BookOpen className="h-5 w-5 text-green-600" />
    },
    {
      title: "Targeted Development Areas",
      description: "Identify specific leadership pillars that need focus",
      icon: <BarChart3 className="h-5 w-5 text-green-600" />
    },
    {
      title: "AI-Powered Recommendations",
      description: "Get customized worksheets based on your profile",
      icon: <LightbulbIcon className="h-5 w-5 text-green-600" />
    }
  ];

  return (
    <div className={cn("relative", className)}>
      {/* Decorative elements */}
      <div className="absolute -top-6 -right-6 w-32 h-32 bg-green-100 rounded-full opacity-50 blur-xl"></div>
      <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-blue-100 rounded-full opacity-50 blur-xl"></div>
      
      <Card className="border-2 border-green-500 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-green-50 rounded-full transform translate-x-1/3 -translate-y-1/3 z-0"></div>
        
        <CardHeader className="bg-gradient-to-r from-green-50 to-green-100 relative z-10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <Badge className="bg-green-600 text-white mb-2">ESSENTIAL FIRST STEP</Badge>
              <CardTitle className="text-2xl font-bold text-green-800">The Jackier Leadership Workbook</CardTitle>
              <p className="text-green-700 mt-2 text-lg">
                The foundation of your personalized leadership development path
              </p>
            </div>
            <div className="bg-white p-3 rounded-full shadow-md">
              <AlertCircle className="h-10 w-10 text-green-600" />
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="pt-6 relative z-10">
          <div className="space-y-6">
            <div className="bg-white p-4 rounded-lg border border-green-200 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Why the Jackier Workbook Is Critical:</h3>
              <p className="text-gray-700">
                The Jackier Method Workbook is the <strong>essential diagnostic tool</strong> that powers your entire 
                leadership development journey. This comprehensive assessment enables the platform to:
              </p>
              <ul className="mt-3 space-y-2">
                <li className="flex items-start">
                  <ChevronRight className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Create your personalized leadership profile</span>
                </li>
                <li className="flex items-start">
                  <ChevronRight className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Identify your specific development needs</span>
                </li>
                <li className="flex items-start">
                  <ChevronRight className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Generate targeted recommendations for your growth</span>
                </li>
              </ul>
            </div>
            
            <div className="grid md:grid-cols-3 gap-4">
              {benefits.map((benefit, index) => (
                <div key={index} className="bg-white p-4 rounded-lg border border-green-100 shadow-sm">
                  <div className="flex items-center mb-2">
                    {benefit.icon}
                    <h4 className="font-semibold ml-2 text-gray-800">{benefit.title}</h4>
                  </div>
                  <p className="text-gray-600 text-sm">{benefit.description}</p>
                </div>
              ))}
            </div>
            
            <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
              <div className="flex items-center">
                <div className="mr-4 bg-amber-100 p-2 rounded-full">
                  <span className="text-amber-700 font-bold">!</span>
                </div>
                <p className="text-amber-700">
                  <span className="font-medium">Estimated time:</span> 20-30 minutes to complete the entire workbook
                </p>
              </div>
            </div>
          </div>
        </CardContent>
        
        <CardFooter className="bg-gradient-to-r from-amber-50 to-amber-100 border-t border-amber-200">
          <Button asChild size="lg" className="w-full md:w-auto bg-amber-600 hover:bg-amber-700 text-white">
            <Link href="/dashboard/jackier/workbook">
              Access Jackier Workbook <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

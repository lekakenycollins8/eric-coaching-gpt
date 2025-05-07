import { NextResponse } from 'next/server';

// This is a placeholder for the worksheets API
// It will be fully implemented in Sprint 2
export async function GET() {
  try {
    // In Sprint 2, this will fetch worksheet metadata from the database
    // For now, return placeholder data
    const placeholderWorksheets = [
      {
        id: 'pillar1_mindset_shift',
        title: 'Pillar 1: Mindset Shift',
        description: 'Transform your leadership mindset from reactive to proactive.',
        systemPromptKey: 'pillar1_prompt',
        fields: [
          {
            name: 'current_challenge',
            label: 'What is your current leadership challenge?',
            type: 'textarea',
            required: true
          },
          {
            name: 'desired_outcome',
            label: 'What outcome would you like to achieve?',
            type: 'textarea',
            required: true
          }
        ]
      },
      {
        id: 'pillar2_communication',
        title: 'Pillar 2: Effective Communication',
        description: 'Enhance your communication skills for better team alignment.',
        systemPromptKey: 'pillar2_prompt',
        fields: [
          {
            name: 'communication_style',
            label: 'Describe your current communication style:',
            type: 'textarea',
            required: true
          },
          {
            name: 'improvement_areas',
            label: 'Which areas would you like to improve?',
            type: 'multiselect',
            options: ['Clarity', 'Active Listening', 'Feedback', 'Difficult Conversations'],
            required: true
          }
        ]
      }
    ];

    return NextResponse.json(
      { worksheets: placeholderWorksheets },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching worksheets:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

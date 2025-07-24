# New Follow-up System Implementation Plan

## Current Understanding & Corrections

### What We've Misunderstood

Our current implementation has several critical misunderstandings that need to be corrected:

1. **Follow-up Types Distinction**: We've been treating all follow-ups as a single type, when in fact there are two distinct types:
   - **Pillar Follow-ups**: Specific to each of the 12 pillars of Crystal Clear Leadership
   - **Workbook Follow-ups**: Related to the overall implementation workbook

2. **Context Loading**: We're not properly loading the right context based on follow-up type:
   - For pillar follow-ups, we need the original pillar-specific submission
   - For workbook follow-ups, we need the original workbook submission

3. **AI Prompts**: We're using a generic prompt for all follow-ups instead of specialized prompts:
   - Pillar follow-ups need prompts focused on progress in specific leadership areas
   - Workbook follow-ups need prompts focused on overall implementation progress

4. **Email Notifications**: Our email notifications don't distinguish between follow-up types:
   - Different formatting and content is needed based on follow-up type
   - Different analysis fields should be highlighted based on type

### What We've Done Correctly

Despite these misunderstandings, we've made good progress in several areas:

1. **Basic Infrastructure**: We've set up the core routes, models, and services needed
2. **Trigger Logic**: We've implemented solid logic for determining when follow-ups should be triggered
3. **Recommendations API**: We've created an API that returns prioritized follow-up recommendations
4. **Email Service**: We've established the basic email notification system

## Implementation Status & Frontend Integration Plan

### Completed Backend Implementation

We have successfully refactored the backend to properly handle both pillar and workbook follow-up types. Here's what we've accomplished:

#### 1. Modular Utility Functions

- **`contextBuilder.ts`**: Created a utility to build appropriate context for diagnosis generation based on follow-up type
  ```typescript
  buildFollowupContext(
    followupType: FollowupCategoryType,
    originalSubmission: any,
    followupAnswers: Record<string, any>,
    pillarId?: string,
    timeElapsed?: string
  ): FollowupContextData
  ```

- **`diagnosisConverter.ts`**: Implemented a utility to convert AI responses to database format
  ```typescript
  convertToDatabaseFormat(
    diagnosisResponse: FollowupDiagnosisResponse,
    followupType: FollowupCategoryType
  ): IDiagnosisResult
  ```

- **`answerFormatter.ts`**: Created utilities for formatting and parsing follow-up answers
  ```typescript
  formatAnswers(answers: Record<string, any>): string
  parseFormattedAnswers(formattedAnswers: string): Record<string, any>
  ```

- **`timeUtils.ts`**: Added utility for calculating time elapsed since original submission
  ```typescript
  calculateTimeElapsed(originalDate: Date): string
  ```

- **`emailNotifier.ts`**: Created a modular email notification utility
  ```typescript
  sendFollowupCompletionEmail(
    user: IUser & Document,
    originalSubmission: IWorkbookSubmission & Document,
    followupAssessment: IFollowupAssessment & Document,
    needsHelp: boolean,
    followupType: FollowupCategoryType
  ): Promise<boolean>
  ```

- **`followupUtils.ts`**: Enhanced with type detection and context loading functions
  ```typescript
  getFollowupType(followupId: string): FollowupCategoryType
  extractPillarId(followupId: string): string | null
  ```

#### 2. API Route Refactoring

- **`/api/followup/submit/route.ts`**: Completely refactored to:
  - Determine follow-up type using `getFollowupType`
  - Extract pillar ID for pillar-specific follow-ups
  - Format answers consistently using `formatAnswers` and `parseFormattedAnswers`
  - Build appropriate context using `buildFollowupContext`
  - Generate diagnosis with type-specific prompts via `generateFollowupDiagnosis`
  - Convert diagnosis to database format with `convertToDatabaseFormat`
  - Store follow-up type and metadata in the assessment document
  - Send type-specific email notifications using `sendFollowupCompletionEmail`
  - Return enhanced response with follow-up type information

#### 3. Data Model Enhancements

- **`FollowupAssessment.ts`**: Refactored to explicitly support dual follow-up types:
  - Added `followupType` field to distinguish between 'pillar' and 'workbook' follow-ups
  - Added properly typed `diagnosis` field using `IDiagnosisResult` interface
  - Added structured `metadata` field with:
    - `pillarId`: For pillar-specific follow-ups
    - `timeElapsed`: Time since original submission
    - `originalTitle`: Title of the original worksheet
    - `followupTitle`: Title of the follow-up worksheet
    - `improvementScore`: Calculated score showing user progress
  - Added compound indexes on `followupType` and `userId` for improved query performance

- **`WorkbookSubmission.ts`**: Enhanced interfaces for better typing:
  - Extended `ISituationAnalysis` with optional `progressLevel` field
  - Extended `IFollowupRecommendation` with optional `implementationProgress` field

#### 4. Improvement Score Calculator

- **`improvementScoreCalculator.ts`**: Created utility to compute numeric improvement scores:
  - Analyzes AI diagnosis data to generate a score from 0-100
  - Uses different scoring logic based on follow-up type:
    - For pillar follow-ups: Considers pillar-specific recommendations
    - For workbook follow-ups: Considers implementation progress
  - Factors in strengths, challenges, and situation analysis
  - Parses textual progress levels into numeric scores
  - Provides a consistent metric for tracking user improvement

#### 5. Email Notification Enhancement

- **Email Service Integration**: Updated to handle different follow-up types
  - Integrated with existing `emailService.sendFollowupSubmissionNotification`
  - Added follow-up type parameter to ensure appropriate templates
  - Enhanced error handling and logging
  - Now includes improvement score in notifications for better progress tracking

### Frontend Integration Plan

With the backend refactoring complete, we now need to update the frontend to leverage the enhanced follow-up system. Here's our plan:

#### 1. Data Fetching Hooks with React Query

- **`useFollowupSubmission` Hook**:
  ```typescript
  // apps/web/src/hooks/useFollowupSubmission.ts
  export function useFollowupSubmission() {
    const mutation = useMutation({
      mutationFn: async ({ 
        followupId, 
        originalSubmissionId, 
        answers, 
        needsHelp 
      }: FollowupSubmissionData) => {
        const response = await fetch('/api/followup/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            followupId, 
            originalSubmissionId, 
            answers, 
            needsHelp 
          })
        });
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Failed to submit follow-up');
        }
        
        return response.json();
      },
      onSuccess: (data) => {
        // Handle success based on follow-up type
        const { followupType, metadata } = data;
        // Different success handling for pillar vs workbook
        // Use metadata.improvementScore for progress indicators
      }
    });
    
    return mutation;
  }
  ```

- **`useFollowupRecommendations` Hook**:
  ```typescript
  // apps/web/src/hooks/useFollowupRecommendations.ts
  export function useFollowupRecommendations(followupType?: FollowupCategoryType) {
    return useQuery({
      queryKey: ['followupRecommendations', followupType],
      queryFn: async () => {
        const url = followupType 
          ? `/api/followup/recommendations?type=${followupType}` 
          : '/api/followup/recommendations';
          
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error('Failed to fetch follow-up recommendations');
        }
        
        return response.json();
      }
    });
  }
  ```

- **`useFollowupContext` Hook**:
  ```typescript
  // apps/web/src/hooks/useFollowupContext.ts
  export function useFollowupContext(followupId: string, originalSubmissionId: string) {
    // Extract follow-up type from ID
    const followupType = followupId.includes('pillar') ? 'pillar' : 'workbook';
    
    return useQuery({
      queryKey: ['followupContext', followupId, originalSubmissionId],
      queryFn: async () => {
        const response = await fetch(
          `/api/followup/context?followupId=${followupId}&originalSubmissionId=${originalSubmissionId}`
        );
        
        if (!response.ok) {
          throw new Error('Failed to fetch follow-up context');
        }
        
        return response.json();
      },
      select: (data) => ({
        ...data,
        followupType
      })
    });
  }
  ```

- **`useFollowupAssessments` Hook**:
  ```typescript
  // apps/web/src/hooks/useFollowupAssessments.ts
  export function useFollowupAssessments(userId: string, followupType?: 'pillar' | 'workbook') {
    return useQuery({
      queryKey: ['followupAssessments', userId, followupType],
      queryFn: async () => {
        const params = new URLSearchParams();
        if (followupType) params.append('type', followupType);
        
        const response = await fetch(`/api/followup/assessments/${userId}?${params}`);
        if (!response.ok) {
          throw new Error('Failed to fetch follow-up assessments');
        }
        return response.json();
      },
      enabled: !!userId
    });
  }
  ```

#### 2. Specialized UI Components

- **Type-Specific Progress Indicators**:
  ```tsx
  // apps/web/src/components/followup/ProgressIndicator.tsx
  export function ProgressIndicator({ 
    followupType, 
    improvementScore 
  }: { 
    followupType: 'pillar' | 'workbook', 
    improvementScore: number 
  }) {
    // Different visualizations based on follow-up type
    if (followupType === 'pillar') {
      return <PillarProgressChart score={improvementScore} />;
    } else {
      return <WorkbookImplementationProgress score={improvementScore} />;
    }
  }
  ```

- **Follow-up Type Badge**:
  ```tsx
  // apps/web/src/components/followup/FollowupTypeBadge.tsx
  export function FollowupTypeBadge({ type }: { type: 'pillar' | 'workbook' }) {
    return (
      <Badge
        variant="outline"
        className={cn(
          "rounded-md px-2 py-1 text-xs font-medium",
          type === 'pillar' 
            ? "bg-blue-50 text-blue-700 border-blue-200" 
            : "bg-purple-50 text-purple-700 border-purple-200"
        )}
      >
        {type === 'pillar' ? 'Pillar Follow-up' : 'Workbook Follow-up'}
      </Badge>
    );
  }
  ```

#### 3. Enhanced Diagnosis Display

- **Type-Specific Diagnosis Cards**:
  ```tsx
  // apps/web/src/components/followup/DiagnosisDisplay.tsx
  export function DiagnosisDisplay({ 
    diagnosis, 
    followupType,
    metadata 
  }: { 
    diagnosis: IDiagnosisResult,
    followupType: 'pillar' | 'workbook',
    metadata: IFollowupMetadata
  }) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">AI Diagnosis</h2>
          <div className="flex items-center gap-2">
            <FollowupTypeBadge type={followupType} />
            <ImprovementScoreBadge score={metadata.improvementScore} />
          </div>
        </div>
        
        {/* Common sections for both types */}
        <SituationAnalysisCard analysis={diagnosis.situationAnalysis} />
        <StrengthsCard strengths={diagnosis.strengthsAnalysis} />
        <ChallengesCard challenges={diagnosis.growthAreasAnalysis} />
        
        {/* Type-specific sections */}
        {followupType === 'pillar' ? (
          <PillarRecommendationsCard recommendations={diagnosis.pillarRecommendations} />
        ) : (
          <ImplementationProgressCard recommendation={diagnosis.followupRecommendation} />
        )}
        
        <ActionableRecommendationsCard recommendations={diagnosis.actionableRecommendations} />
      </div>
    );
  }
  ```

#### 4. Follow-up History & Analytics

- **Follow-up History Dashboard**:
  ```tsx
  // apps/web/src/components/dashboard/FollowupHistory.tsx
  export function FollowupHistory({ userId }: { userId: string }) {
    const [activeType, setActiveType] = useState<'all' | 'pillar' | 'workbook'>('all');
    const { data, isLoading } = useFollowupAssessments(
      userId, 
      activeType === 'all' ? undefined : activeType
    );
    
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Follow-up History</h2>
          <div className="flex items-center gap-2">
            <TabGroup value={activeType} onValueChange={setActiveType as any}>
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="pillar">Pillar</TabsTrigger>
                <TabsTrigger value="workbook">Workbook</TabsTrigger>
              </TabsList>
            </TabGroup>
          </div>
        </div>
        
        {isLoading ? (
          <FollowupHistorySkeleton />
        ) : (
          <div className="space-y-4">
            {data?.assessments.map((assessment) => (
              <FollowupHistoryCard 
                key={assessment._id}
                assessment={assessment}
                followupType={assessment.followupType}
                metadata={assessment.metadata}
              />
            ))}
          </div>
        )}
      </div>
    );
  }
  ```

#### 5. Progress Tracking

- **Improvement Score Visualization**:
  ```tsx
  // apps/web/src/components/dashboard/ImprovementTracker.tsx
  export function ImprovementTracker({ userId }: { userId: string }) {
    const { data: pillarData } = useFollowupAssessments(userId, 'pillar');
    const { data: workbookData } = useFollowupAssessments(userId, 'workbook');
    
    // Process data to extract improvement scores over time
    const pillarScores = pillarData?.assessments.map(a => ({
      date: new Date(a.completedAt),
      score: a.metadata.improvementScore,
      pillarId: a.metadata.pillarId
    })) || [];
    
    const workbookScores = workbookData?.assessments.map(a => ({
      date: new Date(a.completedAt),
      score: a.metadata.improvementScore
    })) || [];
    
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-semibold">Progress Tracking</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Pillar Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <PillarProgressChart data={pillarScores} />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Implementation Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <WorkbookProgressChart data={workbookScores} />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }
  ```

### Next Steps

1. **API Endpoints**:
   - Create `/api/followup/assessments/:userId` endpoint with type filtering
   - Add analytics endpoints for progress tracking

2. **Frontend Components**:
   - Implement specialized UI components for each follow-up type
   - Create progress visualization components
   - Build follow-up history dashboard

3. **Email Templates**:
   - Update email templates to include type-specific sections
   - Add improvement score visualization in emails

4. **Testing**:
   - Write unit tests for new components and hooks
   - Test end-to-end flow for both follow-up types
   - Validate improvement score calculation with various inputs

#### 6. Web Proxy Configuration

- **Next.js API Routes for Proxying**:
  ```typescript
  // apps/web/src/app/api/followup/submit/route.ts
  import { NextResponse } from 'next/server';
  
  export async function POST(request: Request) {
    try {
      const body = await request.json();
      
      const serverResponse = await fetch(`${process.env.SERVER_URL}/api/followup/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Forward authentication headers
          ...(request.headers.get('authorization') 
            ? { 'authorization': request.headers.get('authorization')! } 
            : {})
        },
        body: JSON.stringify(body)
      });
      
      const data = await serverResponse.json();
      
      return NextResponse.json(data, {
        status: serverResponse.status
      });
    } catch (error) {
      console.error('Error proxying follow-up submission:', error);
      return NextResponse.json(
        { error: 'Failed to submit follow-up' },
        { status: 500 }
      );
    }
  }
  ```

- **Similar proxy routes for other follow-up endpoints**:
  - `/api/followup/recommendations`
  - `/api/followup/context`

#### 3. UI Components

- **Type-Specific Follow-up Form**:
  ```tsx
  // apps/web/src/components/followup/FollowupForm.tsx
  export function FollowupForm({
    followupId,
    originalSubmissionId
  }: FollowupFormProps) {
    const { data: context, isLoading: isLoadingContext } = useFollowupContext(
      followupId,
      originalSubmissionId
    );
    
    const followupSubmission = useFollowupSubmission();
    
    // Determine which form component to render based on follow-up type
    if (isLoadingContext) {
      return <FollowupFormSkeleton />;
    }
    
    if (context?.followupType === 'pillar') {
      return (
        <PillarFollowupForm
          context={context}
          onSubmit={(answers, needsHelp) => {
            followupSubmission.mutate({
              followupId,
              originalSubmissionId,
              answers,
              needsHelp
            });
          }}
        />
      );
    }
    
    return (
      <WorkbookFollowupForm
        context={context}
        onSubmit={(answers, needsHelp) => {
          followupSubmission.mutate({
            followupId,
            originalSubmissionId,
            answers,
            needsHelp
          });
        }}
      />
    );
  }
  ```

- **Pillar-Specific Follow-up Form**:
  ```tsx
  // apps/web/src/components/followup/PillarFollowupForm.tsx
  export function PillarFollowupForm({
    context,
    onSubmit
  }: PillarFollowupFormProps) {
    // Form implementation with pillar-specific UI elements
    // Show original pillar answers and diagnosis
    // Include pillar-specific progress indicators
    // ...
  }
  ```

- **Workbook Follow-up Form**:
  ```tsx
  // apps/web/src/components/followup/WorkbookFollowupForm.tsx
  export function WorkbookFollowupForm({
    context,
    onSubmit
  }: WorkbookFollowupFormProps) {
    // Form implementation with workbook-specific UI elements
    // Show overall implementation progress
    // Include comprehensive progress indicators
    // ...
  }
  ```

- **Follow-up Results Display**:
  ```tsx
  // apps/web/src/components/followup/FollowupResults.tsx
  export function FollowupResults({
    followupId,
    followupType
  }: FollowupResultsProps) {
    // Fetch and display results based on follow-up type
    // Different visualizations for pillar vs workbook
    // ...
  }
  ```

#### 4. Pages and Routing

- **Follow-up Form Page**:
  ```tsx
  // apps/web/src/app/followup/[followupId]/[originalSubmissionId]/page.tsx
  export default function FollowupPage({
    params
  }: {
    params: { followupId: string; originalSubmissionId: string }
  }) {
    return (
      <div className="container mx-auto py-8">
        <h1 className="text-2xl font-bold mb-6">
          {params.followupId.includes('pillar') ? 'Pillar Follow-up' : 'Implementation Follow-up'}
        </h1>
        
        <FollowupForm
          followupId={params.followupId}
          originalSubmissionId={params.originalSubmissionId}
        />
      </div>
    );
  }
  ```

- **Follow-up Results Page**:
  ```tsx
  // apps/web/src/app/followup/results/[followupId]/page.tsx
  export default function FollowupResultsPage({
    params
  }: {
    params: { followupId: string }
  }) {
    // Determine follow-up type from ID
    const followupType = params.followupId.includes('pillar') ? 'pillar' : 'workbook';
    
    return (
      <div className="container mx-auto py-8">
        <h1 className="text-2xl font-bold mb-6">
          {followupType === 'pillar' ? 'Pillar Follow-up Results' : 'Implementation Follow-up Results'}
        </h1>
        
        <FollowupResults
          followupId={params.followupId}
          followupType={followupType}
        />
      </div>
    );
  }
  ```

## Testing Strategy

### 1. Unit Tests

- **Backend Utilities**:
  - Test `getFollowupType` with various IDs
  - Test `buildFollowupContext` with different submission types
  - Test `convertToDatabaseFormat` with various diagnosis responses

- **Frontend Hooks**:
  - Test `useFollowupSubmission` with mock responses
  - Test `useFollowupRecommendations` filtering
  - Test `useFollowupContext` type detection

### 2. Integration Tests

- **API Routes**:
  - Test submission flow for pillar follow-ups
  - Test submission flow for workbook follow-ups
  - Test recommendations filtering by type

- **Component Integration**:
  - Test form submission with mock API
  - Test results display with different follow-up types

### 3. End-to-End Tests

- **Complete User Journeys**:
  - Pillar follow-up submission and results viewing
  - Workbook follow-up submission and results viewing
  - Email notification receipt and link following

## Implementation Timeline

### Phase 1: Frontend Data Layer (1 Week)
- Implement React Query hooks for data fetching
- Set up API proxy routes in Next.js
- Create TypeScript interfaces for follow-up types

### Phase 2: UI Components (1 Week)
- Implement type-specific follow-up forms
- Create progress indicators for each follow-up type
- Build results display components

### Phase 3: Testing & Refinement (1 Week)
- Write unit and integration tests
- Conduct end-to-end testing
- Refine UI based on feedback
- Optimize performance

## Conclusion

We have successfully refactored the backend to properly handle both pillar and workbook follow-up types. The modular approach we've taken ensures clean separation of concerns, type safety, and maintainability. The frontend integration plan outlined above will complete the implementation by providing type-specific UI components and data fetching hooks.

This implementation will ensure users receive appropriate context, prompts, and UI elements for each follow-up type, providing a cohesive and effective follow-up experience in the Eric GPT Coaching Platform.

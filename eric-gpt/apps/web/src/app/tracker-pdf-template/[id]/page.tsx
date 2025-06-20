import React from 'react';
import { notFound } from 'next/navigation';

interface TrackerPDFTemplateProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ userId?: string }>;
}

interface TrackerData {
  tracker: {
    _id: string;
    title: string;
    description: string;
    status: string;
    startDate: string;
    endDate: string;
    submissionId?: string;
    createdAt: string;
    updatedAt: string;
  };
  entries: Array<{
    _id: string;
    trackerId: string;
    userId: string;
    day: number;
    completed: boolean;
    notes: string;
    createdAt: string;
    updatedAt: string;
  }>;
  reflection?: {
    _id: string;
    trackerId: string;
    userId: string;
    content: string;
    createdAt: string;
    updatedAt: string;
  };
}

export default async function TrackerPDFTemplate({ params, searchParams }: TrackerPDFTemplateProps) {
  // In Next.js 15, params and searchParams must be awaited
  const { id } = await params;
  const { userId } = await searchParams;

  if (!id) {
    return notFound();
  }

  try {
    // Fetch tracker data from the server API
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    const queryParams = userId ? `?userId=${userId}` : '';
    const response = await fetch(`${apiUrl}/api/trackers/${id}${queryParams}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch tracker: ${response.statusText}`);
    }

    const data: TrackerData = await response.json();
    const { tracker, entries, reflection } = data;

    // Format dates
    const startDate = new Date(tracker.startDate).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    
    const endDate = new Date(tracker.endDate).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    // Sort entries by day
    const sortedEntries = [...entries].sort((a, b) => a.day - b.day);

    return (
      <div className="pdf-container" style={{ fontFamily: 'Arial, sans-serif', maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h1 style={{ color: '#2563eb', fontSize: '28px', marginBottom: '5px' }}>Eric GPT Coaching Platform</h1>
          <h2 style={{ fontSize: '24px', marginBottom: '10px' }}>5-Day Tracker Report</h2>
          <p style={{ color: '#4b5563', fontSize: '16px' }}>
            Generated on {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {/* Tracker Info */}
        <div style={{ marginBottom: '30px', padding: '20px', backgroundColor: '#f3f4f6', borderRadius: '8px' }}>
          <h3 style={{ fontSize: '20px', marginBottom: '15px', color: '#1e40af' }}>{tracker.title}</h3>
          <p style={{ marginBottom: '15px', fontSize: '16px' }}>{tracker.description}</p>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: '#4b5563' }}>
            <p>Status: <span style={{ fontWeight: 'bold', textTransform: 'capitalize' }}>{tracker.status}</span></p>
            <p>Period: {startDate} - {endDate}</p>
          </div>
        </div>

        {/* Daily Entries */}
        <div style={{ marginBottom: '30px' }}>
          <h3 style={{ fontSize: '20px', marginBottom: '15px', color: '#1e40af' }}>Daily Progress</h3>
          
          {sortedEntries.map((entry) => (
            <div key={entry._id} style={{ marginBottom: '20px', padding: '15px', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <h4 style={{ fontSize: '18px', margin: '0', color: '#1e40af' }}>Day {entry.day}</h4>
                <div style={{ 
                  padding: '5px 10px', 
                  borderRadius: '20px', 
                  fontSize: '14px',
                  backgroundColor: entry.completed ? '#dcfce7' : '#fee2e2',
                  color: entry.completed ? '#166534' : '#991b1b'
                }}>
                  {entry.completed ? 'Completed' : 'Not Completed'}
                </div>
              </div>
              <p style={{ whiteSpace: 'pre-wrap', fontSize: '16px' }}>{entry.notes || 'No notes for this day.'}</p>
            </div>
          ))}

          {sortedEntries.length === 0 && (
            <p style={{ padding: '15px', backgroundColor: '#f3f4f6', borderRadius: '8px', fontSize: '16px' }}>
              No daily entries recorded for this tracker.
            </p>
          )}
        </div>

        {/* Final Reflection */}
        <div style={{ marginBottom: '30px' }}>
          <h3 style={{ fontSize: '20px', marginBottom: '15px', color: '#1e40af' }}>Final Reflection</h3>
          
          {reflection ? (
            <div style={{ padding: '20px', backgroundColor: '#f0f9ff', borderRadius: '8px', border: '1px solid #bae6fd' }}>
              <p style={{ whiteSpace: 'pre-wrap', fontSize: '16px' }}>{reflection.content}</p>
            </div>
          ) : (
            <p style={{ padding: '15px', backgroundColor: '#f3f4f6', borderRadius: '8px', fontSize: '16px' }}>
              No reflection has been added for this tracker yet.
            </p>
          )}
        </div>

        {/* Footer */}
        <div style={{ marginTop: '40px', borderTop: '1px solid #e5e7eb', paddingTop: '20px', textAlign: 'center', color: '#6b7280', fontSize: '14px' }}>
          <p>© {new Date().getFullYear()} Eric GPT Coaching Platform</p>
          <p>This document was automatically generated from your tracker data.</p>
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error fetching tracker data:', error);
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h1>Error Loading Tracker</h1>
        <p>Failed to load tracker data for PDF generation.</p>
      </div>
    );
  }
}

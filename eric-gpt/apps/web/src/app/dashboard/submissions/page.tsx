'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { format } from 'date-fns';
import { 
  ArrowPathIcon, 
  DocumentTextIcon, 
  DocumentArrowDownIcon,
  EyeIcon
} from '@heroicons/react/24/outline';

// Define the submission type
interface Submission {
  _id: string;
  worksheetId: string;
  worksheetTitle: string;
  createdAt: string;
}

export default function SubmissionsPage() {
  const { data: session } = useSession();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 10;

  useEffect(() => {
    if (session?.user?.id) {
      fetchSubmissions();
    }
  }, [session, page]);

  const fetchSubmissions = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/submissions?page=${page}&limit=${limit}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch submissions');
      }

      const data = await response.json();
      setSubmissions(data.submissions);
      setTotalPages(Math.ceil(data.total / limit));
    } catch (err) {
      setError('Error loading submissions. Please try again.');
      console.error('Error fetching submissions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePreviousPage = () => {
    if (page > 1) {
      setPage(page - 1);
    }
  };

  const handleNextPage = () => {
    if (page < totalPages) {
      setPage(page + 1);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy');
    } catch (error) {
      return 'Invalid date';
    }
  };

  if (loading && submissions.length === 0) {
    return (
      <div className="py-10">
        <h1 className="text-2xl font-semibold text-gray-900 mb-6">My Submissions</h1>
        <div className="flex justify-center items-center py-20">
          <ArrowPathIcon className="h-8 w-8 text-green-600 animate-spin" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-10">
        <h1 className="text-2xl font-semibold text-gray-900 mb-6">My Submissions</h1>
        <div className="bg-red-50 border border-red-200 rounded-md p-4 text-red-700">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="py-10">
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">My Submissions</h1>
      
      {submissions.length === 0 ? (
        <div className="bg-white shadow rounded-lg p-6 text-center">
          <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No submissions yet</h3>
          <p className="mt-1 text-gray-500">
            Complete a worksheet to get personalized coaching feedback.
          </p>
          <div className="mt-6">
            <Link
              href="/dashboard/worksheets"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              Browse Worksheets
            </Link>
          </div>
        </div>
      ) : (
        <>
          <div className="bg-white shadow overflow-hidden sm:rounded-md">
            <ul role="list" className="divide-y divide-gray-200">
              {submissions.map((submission) => (
                <li key={submission._id}>
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <DocumentTextIcon className="h-5 w-5 text-gray-400 mr-3" />
                        <p className="text-sm font-medium text-green-600 truncate">
                          {submission.worksheetTitle || `Worksheet ${submission.worksheetId}`}
                        </p>
                      </div>
                      <div className="flex items-center space-x-4">
                        <Link 
                          href={`/api/submissions/${submission._id}/pdf`}
                          className="text-gray-400 hover:text-gray-500 flex items-center"
                          target="_blank"
                        >
                          <EyeIcon className="h-5 w-5 mr-1" aria-hidden="true" />
                          <span className="text-sm">View</span>
                        </Link>
                        <Link 
                          href={`/api/submissions/${submission._id}/pdf`}
                          className="text-gray-400 hover:text-gray-500 flex items-center"
                          download
                        >
                          <DocumentArrowDownIcon className="h-5 w-5 mr-1" aria-hidden="true" />
                          <span className="text-sm">Download</span>
                        </Link>
                      </div>
                    </div>
                    <div className="mt-2 sm:flex sm:justify-between">
                      <div className="sm:flex">
                        <p className="flex items-center text-sm text-gray-500">
                          Submitted on {formatDate(submission.createdAt)}
                        </p>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 mt-4 rounded-md shadow">
              <div className="flex flex-1 justify-between sm:hidden">
                <button
                  onClick={handlePreviousPage}
                  disabled={page === 1}
                  className={`relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium ${
                    page === 1 ? 'text-gray-300' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Previous
                </button>
                <button
                  onClick={handleNextPage}
                  disabled={page === totalPages}
                  className={`relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium ${
                    page === totalPages ? 'text-gray-300' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing <span className="font-medium">{(page - 1) * limit + 1}</span> to{' '}
                    <span className="font-medium">
                      {Math.min(page * limit, submissions.length + (page - 1) * limit)}
                    </span>{' '}
                    of <span className="font-medium">{totalPages * limit}</span> results
                  </p>
                </div>
                <div>
                  <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                    <button
                      onClick={handlePreviousPage}
                      disabled={page === 1}
                      className={`relative inline-flex items-center rounded-l-md px-2 py-2 ${
                        page === 1
                          ? 'text-gray-300'
                          : 'text-gray-400 hover:bg-gray-50 focus:z-20 focus:outline-offset-0'
                      }`}
                    >
                      <span className="sr-only">Previous</span>
                      <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path
                          fillRule="evenodd"
                          d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                    {/* Page numbers would go here if we want to show them */}
                    <button
                      onClick={handleNextPage}
                      disabled={page === totalPages}
                      className={`relative inline-flex items-center rounded-r-md px-2 py-2 ${
                        page === totalPages
                          ? 'text-gray-300'
                          : 'text-gray-400 hover:bg-gray-50 focus:z-20 focus:outline-offset-0'
                      }`}
                    >
                      <span className="sr-only">Next</span>
                      <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path
                          fillRule="evenodd"
                          d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

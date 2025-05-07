import React from 'react';
import Link from 'next/link';

interface WorksheetCardProps {
  id: string;
  title: string;
  description: string;
}

// This is a placeholder worksheet card component
// It will be expanded in later sprints
export default function WorksheetCard({ id, title, description }: WorksheetCardProps) {
  return (
    <div className="overflow-hidden rounded-lg bg-white shadow">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg font-medium leading-6 text-gray-900">{title}</h3>
        <div className="mt-2 max-w-xl text-sm text-gray-500">
          <p>{description}</p>
        </div>
        <div className="mt-5">
          <Link
            href={`/worksheets/${id}`}
            className="inline-flex items-center rounded-md border border-transparent bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
          >
            Start Worksheet
          </Link>
        </div>
      </div>
    </div>
  );
}

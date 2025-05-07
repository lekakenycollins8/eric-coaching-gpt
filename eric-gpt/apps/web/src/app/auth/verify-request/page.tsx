import React from 'react';

// This is a placeholder for the verify request page
// It will be fully implemented in Sprint 1
export default function VerifyRequest() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center py-12">
      <div className="w-full max-w-md space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
            Check your email
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            A sign in link has been sent to your email address.
          </p>
        </div>
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            If you don't see it, check your spam folder. If you still don't see it, try signing in again.
          </p>
        </div>
      </div>
    </div>
  );
}

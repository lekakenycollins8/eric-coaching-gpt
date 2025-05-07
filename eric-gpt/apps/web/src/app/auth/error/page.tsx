import React from 'react';

// This is a placeholder for the authentication error page
// It will be fully implemented in Sprint 1
export default function AuthError() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center py-12">
      <div className="w-full max-w-md space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
            Authentication Error
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            There was a problem signing you in.
          </p>
        </div>
        <div className="mt-8 text-center">
          <a
            href="/auth/signin"
            className="text-sm font-medium text-green-600 hover:text-green-500"
          >
            Try again
          </a>
        </div>
      </div>
    </div>
  );
}

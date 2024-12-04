'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

// Create a separate client component for the error content
function ErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  const getErrorMessage = (error: string | null) => {
    switch (error) {
      case 'AccessDenied':
        return {
          title: 'Setting Up Your Account',
          message: 'Your account is being set up. Please try these steps:',
          steps: [
            'Sign out completely',
            'Clear your browser cache',
            'Sign in again',
            'Wait a few seconds for account creation'
          ]
        };
      case 'Configuration':
        return {
          title: 'System Configuration Error',
          message: 'There is a problem with the system configuration. Please contact support.',
          steps: []
        };
      case 'Verification':
        return {
          title: 'Verification Required',
          message: 'The verification link may have expired or has already been used.',
          steps: [
            'Try signing in again',
            'Request a new verification link if needed'
          ]
        };
      default:
        return {
          title: 'Authentication Error',
          message: 'An error occurred during the sign-in process. Please try again.',
          steps: [
            'Sign out if already signed in',
            'Clear your browser cache',
            'Try signing in again',
            'Contact support if the issue persists'
          ]
        };
    }
  };

  const errorDetails = getErrorMessage(error);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {errorDetails.title}
          </h2>
          <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-yellow-400"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  {errorDetails.message}
                </p>
                {errorDetails.steps.length > 0 && (
                  <ul className="mt-2 text-sm text-yellow-700 list-disc list-inside">
                    {errorDetails.steps.map((step, index) => (
                      <li key={index}>{step}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="mt-8 space-y-6">
          <div className="text-center space-y-4">
            <Link
              href="/auth/signin"
              className="inline-block px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Try signing in again
            </Link>
            <div>
              <Link
                href="/"
                className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
              >
                Return to home page
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Main page component with Suspense boundary
export default function ErrorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold">Loading...</h2>
        </div>
      </div>
    }>
      <ErrorContent />
    </Suspense>
  );
}

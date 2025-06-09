'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function OfflinePage() {
  const [isOnline, setIsOnline] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      // Redirect to home when back online
      setTimeout(() => {
        router.push('/')
      }, 2000)
    }

    const handleOffline = () => {
      setIsOnline(false)
    }

    // Check initial status
    setIsOnline(navigator.onLine)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [router])

  return (
    <div className="min-h-screen bg-[#fff5ef] flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="bg-white rounded-lg shadow-lg p-8">
          {isOnline ? (
            <>
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Back Online!
              </h1>
              <p className="text-gray-600 mb-4">
                Your connection has been restored. Redirecting you back to the app...
              </p>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-[#fc5d01] h-2 rounded-full animate-pulse w-full"></div>
              </div>
            </>
          ) : (
            <>
              <div className="w-16 h-16 bg-[#fedac2] rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-[#fc5d01]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M18.364 5.636l-12.728 12.728m0-12.728l12.728 12.728"
                  />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                You&apos;re Offline
              </h1>
              <p className="text-gray-600 mb-6">
                No internet connection detected. Some features may not be available, but you can still browse cached content.
              </p>
              
              <div className="space-y-3">
                <button
                  onClick={() => router.push('/')}
                  className="w-full bg-[#fc5d01] hover:bg-[#fd7f33] text-white py-2 px-4 rounded-lg transition-colors duration-200"
                >
                  Browse Cached Content
                </button>
                
                <button
                  onClick={() => window.location.reload()}
                  className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-lg transition-colors duration-200"
                >
                  Try Again
                </button>
              </div>

              <div className="mt-6 p-4 bg-[#fff5ef] rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">Available Offline:</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• View cached student data</li>
                  <li>• Browse saved tasks</li>
                  <li>• Access project information</li>
                  <li>• View analytics (cached)</li>
                </ul>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

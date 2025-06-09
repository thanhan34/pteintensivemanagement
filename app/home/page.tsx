"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";

export default function HomePage() {
  const { data: session, status } = useSession();

  return (
    <div className="min-h-screen bg-[#fff5ef]">
      <main className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
            <span className="block">PTE Intensive Management</span>
            <span className="block text-[#fc5d01]">Attendance System</span>
          </h1>
          <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
            Manage trainer attendance records efficiently with role-based access
            control.
          </p>

          <div className="mt-10">
            {status === "loading" ? (
              <div className="text-center">Loading...</div>
            ) : session ? (
              <div className="space-y-4">
                <p className="text-lg text-gray-700 text-center">
                  Welcome back, {session.user?.name}!
                </p>
                <div className="flex flex-col gap-4 items-center">
                  <Link
                    href="/attendance"
                    className="inline-block w-full max-w-xs px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-[#fc5d01] hover:bg-[#fedac2] hover:text-[#fc5d01] text-center"
                  >
                    Go to Attendance Management
                  </Link>
                  {session?.user?.role === "admin" && (
                    <>
                      <Link
                        href="/students"
                        className="inline-block w-full max-w-xs px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-[#fc5d01] hover:bg-[#fedac2] hover:text-[#fc5d01] text-center"
                      >
                        Student List
                      </Link>
                      <Link
                        href="/accounting"
                        className="inline-block w-full max-w-xs px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-[#fc5d01] hover:bg-[#fedac2] hover:text-[#fc5d01] text-center"
                      >
                        Accounting
                      </Link>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/auth/signin"
                  className="inline-block px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-[#fc5d01] hover:bg-[#fedac2] hover:text-[#fc5d01]"
                >
                  Sign In to Get Started
                </Link>
                
              </div>
            )}
          </div>

          {session?.user?.role === "admin" && (
            <div className="mt-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Admin Features
              </h2>
              <div className="space-y-2">
                <p className="text-gray-600">As an admin, you can:</p>
                <ul className="list-disc list-inside text-gray-700">
                  <li>View all trainer attendance records</li>
                  <li>Approve or reject attendance submissions</li>
                  <li>Monitor total hours worked by each trainer</li>
                </ul>
              </div>
            </div>
          )}

          {session?.user?.role === "trainer" && (
            <div className="mt-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Trainer Features
              </h2>
              <div className="space-y-2">
                <p className="text-gray-600">As a trainer, you can:</p>
                <ul className="list-disc list-inside text-gray-700">
                  <li>Submit your attendance records</li>
                  <li>View your attendance history</li>
                  <li>Track your total hours</li>
                </ul>
              </div>
            </div>
          )}
          {session?.user?.role === "administrative_assistant" && (
            <div className="mt-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Administrative Assistant
              </h2>
              <div className="space-y-2">
                <p className="text-gray-600">
                  As a Administrative Assistant, you can:
                </p>
                <ul className="list-disc list-inside text-gray-700">
                  <li>Add new students</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

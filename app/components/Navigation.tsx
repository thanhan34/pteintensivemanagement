'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useState } from 'react';
import UserProfile from './UserProfile';

// Updated: Removed Projects and Labels from navigation - v2

export default function Navigation() {
  const { data: session, status } = useSession();
  const userRole = session?.user?.role;
  const isAuthenticated = status === 'authenticated';
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const getNavigationLinks = () => {
    switch (userRole) {
      case 'admin':
        return (
          <>
            <Link
              href="/students"
              className="text-gray-700 hover:text-[#fc5d01] px-3 py-2 rounded-md text-sm font-medium"
            >
              Students
            </Link>
            <Link
              href="/tasks"
              className="text-gray-700 hover:text-[#fc5d01] px-3 py-2 rounded-md text-sm font-medium"
            >
              Tasks
            </Link>
            <Link
              href="/attendance"
              className="text-gray-700 hover:text-[#fc5d01] px-3 py-2 rounded-md text-sm font-medium"
            >
              Attendance
            </Link>
            <Link
              href="/accounting"
              className="text-gray-700 hover:text-[#fc5d01] px-3 py-2 rounded-md text-sm font-medium"
            >
              Accounting
            </Link>
            <Link
              href="/analytics"
              className="text-gray-700 hover:text-[#fc5d01] px-3 py-2 rounded-md text-sm font-medium"
            >
              Analytics
            </Link>
            <Link
              href="/users"
              className="text-gray-700 hover:text-[#fc5d01] px-3 py-2 rounded-md text-sm font-medium"
            >
              Users
            </Link>
            <Link
              href="/settings"
              className="text-gray-700 hover:text-[#fc5d01] px-3 py-2 rounded-md text-sm font-medium"
            >
              Settings
            </Link>
            <Link
              href="/useful-links"
              className="text-gray-700 hover:text-[#fc5d01] px-3 py-2 rounded-md text-sm font-medium"
            >
              Useful Links
            </Link>
          </>
        );
      case 'trainer':
        return (
          <>
            <Link
              href="/tasks"
              className="text-gray-700 hover:text-[#fc5d01] px-3 py-2 rounded-md text-sm font-medium"
            >
              Tasks
            </Link>
            <Link
              href="/attendance"
              className="text-gray-700 hover:text-[#fc5d01] px-3 py-2 rounded-md text-sm font-medium"
            >
              Attendance
            </Link>
          </>
        );
      case 'administrative_assistant':
        return (
          <>
            <Link
              href="/students"
              className="text-gray-700 hover:text-[#fc5d01] px-3 py-2 rounded-md text-sm font-medium"
            >
              Students
            </Link>
            <Link
              href="/tasks"
              className="text-gray-700 hover:text-[#fc5d01] px-3 py-2 rounded-md text-sm font-medium"
            >
              Tasks
            </Link>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Link href="/" className="text-xl font-bold text-[#fc5d01]">
                PTE Management
              </Link>
            </div>
            {isAuthenticated && (
              <div className="hidden md:block">
                <div className="ml-10 flex items-baseline space-x-4">
                  {getNavigationLinks()}
                </div>
              </div>
            )}
          </div>
          <div className="flex items-center">
            <UserProfile />
            {isAuthenticated && (
              <div className="md:hidden ml-2">
                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-[#fc5d01] hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-[#fc5d01]"
                  aria-expanded="false"
                >
                  <span className="sr-only">Open main menu</span>
                  {!isMobileMenuOpen ? (
                    <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  ) : (
                    <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Mobile menu */}
      {isAuthenticated && isMobileMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-t border-gray-200">
            {userRole === 'admin' && (
              <>
                <Link
                  href="/students"
                  className="text-gray-700 hover:text-[#fc5d01] hover:bg-[#fedac2] block px-3 py-2 rounded-md text-base font-medium"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Students
                </Link>
                <Link
                  href="/tasks"
                  className="text-gray-700 hover:text-[#fc5d01] hover:bg-[#fedac2] block px-3 py-2 rounded-md text-base font-medium"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Tasks
                </Link>
                <Link
                  href="/attendance"
                  className="text-gray-700 hover:text-[#fc5d01] hover:bg-[#fedac2] block px-3 py-2 rounded-md text-base font-medium"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Attendance
                </Link>
                <Link
                  href="/accounting"
                  className="text-gray-700 hover:text-[#fc5d01] hover:bg-[#fedac2] block px-3 py-2 rounded-md text-base font-medium"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Accounting
                </Link>
                <Link
                  href="/analytics"
                  className="text-gray-700 hover:text-[#fc5d01] hover:bg-[#fedac2] block px-3 py-2 rounded-md text-base font-medium"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Analytics
                </Link>
                <Link
                  href="/users"
                  className="text-gray-700 hover:text-[#fc5d01] hover:bg-[#fedac2] block px-3 py-2 rounded-md text-base font-medium"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Users
                </Link>
                <Link
                  href="/settings"
                  className="text-gray-700 hover:text-[#fc5d01] hover:bg-[#fedac2] block px-3 py-2 rounded-md text-base font-medium"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Settings
                </Link>
                <Link
                  href="/useful-links"
                  className="text-gray-700 hover:text-[#fc5d01] hover:bg-[#fedac2] block px-3 py-2 rounded-md text-base font-medium"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Useful Links
                </Link>
              </>
            )}
            {userRole === 'trainer' && (
              <>
                <Link
                  href="/tasks"
                  className="text-gray-700 hover:text-[#fc5d01] hover:bg-[#fedac2] block px-3 py-2 rounded-md text-base font-medium"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Tasks
                </Link>
                <Link
                  href="/attendance"
                  className="text-gray-700 hover:text-[#fc5d01] hover:bg-[#fedac2] block px-3 py-2 rounded-md text-base font-medium"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Attendance
                </Link>
              </>
            )}
            {userRole === 'administrative_assistant' && (
              <>
                <Link
                  href="/students"
                  className="text-gray-700 hover:text-[#fc5d01] hover:bg-[#fedac2] block px-3 py-2 rounded-md text-base font-medium"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Students
                </Link>
                <Link
                  href="/tasks"
                  className="text-gray-700 hover:text-[#fc5d01] hover:bg-[#fedac2] block px-3 py-2 rounded-md text-base font-medium"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Tasks
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}

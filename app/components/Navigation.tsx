'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import UserProfile from './UserProfile';

export default function Navigation() {
  const { data: session } = useSession();
  const userRole = session?.user?.role;

  const getNavigationLinks = () => {
    switch (userRole) {
      case 'admin':
        return (
          <>
            <Link
              href="/studentinformation"
              className="text-gray-700 hover:text-[#fc5d01] px-3 py-2 rounded-md text-sm font-medium"
            >
              Students
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
          </>
        );
      case 'trainer':
        return (
          <Link
            href="/attendance"
            className="text-gray-700 hover:text-[#fc5d01] px-3 py-2 rounded-md text-sm font-medium"
          >
            Attendance
          </Link>
        );
      case 'administrative_assistant':
        return (
          <Link
            href="/studentinformation"
            className="text-gray-700 hover:text-[#fc5d01] px-3 py-2 rounded-md text-sm font-medium"
          >
            Students
          </Link>
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
            <div className="hidden md:ml-6 md:flex md:space-x-8">
              {getNavigationLinks()}
            </div>
          </div>
          <div className="flex items-center">
            <UserProfile />
          </div>
        </div>
      </div>
    </nav>
  );
}

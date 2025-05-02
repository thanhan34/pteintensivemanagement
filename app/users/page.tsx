'use client';

import { useSession } from 'next-auth/react';
import { useEffect } from 'react';
import { redirect } from 'next/navigation';
import UserRoleManager from '../components/UserRoleManager';

export default function UsersPage() {
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session || session.user?.role !== 'admin') {
      redirect('/');
    }
  }, [session, status]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-[#fff5ef] py-6 flex flex-col justify-center sm:py-12">
        <div className="relative py-3 sm:max-w-xl sm:mx-auto">
          <div className="text-center">
            Loading...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fff5ef]">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-8">
            <h1 className="text-3xl font-bold leading-tight text-gray-900">User Management</h1>
            <p className="mt-2 text-sm text-gray-600">
              Manage user roles and permissions for the PTE Management system.
            </p>
          </div>
          <UserRoleManager />
        </div>
      </div>
    </div>
  );
}

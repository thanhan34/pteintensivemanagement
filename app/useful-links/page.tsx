'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { redirect } from 'next/navigation';
import UsefulLinksManager from '../components/UsefulLinksManager';

export default function UsefulLinksPage() {
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session || session.user?.role !== 'admin') {
      redirect('/');
    }
    
    setLoading(false);
  }, [session, status]);

  if (loading) {
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
            <h1 className="text-3xl font-bold leading-tight text-gray-900">Useful Links</h1>
            <p className="mt-2 text-sm text-gray-600">
              Manage useful links for admin reference. Add, edit, or delete links as needed.
            </p>
          </div>
          <UsefulLinksManager />
        </div>
      </div>
    </div>
  );
}

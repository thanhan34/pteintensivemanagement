'use client';

import { useState } from 'react';
import { useSession, signOut } from 'next-auth/react';

export default function UserProfile() {
  const { data: session } = useSession();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  if (!session?.user) return null;

  const handleSignOut = () => {
    signOut({ callbackUrl: '/auth/signin' });
  };

  const getRoleDisplay = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Administrator';
      case 'administrative_assistant':
        return 'Administrative Assistant';
      case 'trainer':
        return 'Trainer';
      case 'accountance':
        return 'Accountance';
      case 'saler':
        return 'Saler';
      default:
        return role;
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="flex items-center space-x-2 text-gray-700 hover:text-gray-900 focus:outline-none"
      >
        <div className="w-8 h-8 rounded-full bg-[#fc5d01] flex items-center justify-center text-white">
          {session.user.name?.[0]?.toUpperCase() || 'U'}
        </div>
        <span className="hidden md:inline-block">{session.user.name}</span>
      </button>

      {isDropdownOpen && (
        <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
          <div className="py-1" role="menu">
            <div className="px-4 py-2 text-sm text-gray-700 border-b">
              <div className="font-medium">{session.user.name}</div>
              <div className="text-sm text-gray-500">{session.user.email}</div>
              <div className="text-xs text-[#fc5d01] mt-1">
                {getRoleDisplay(session.user.role)}
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              role="menuitem"
            >
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import { createContext, useContext, ReactNode } from 'react';
import { signIn, signOut, useSession } from 'next-auth/react';

interface AuthContextType {
  user: any;
  login: () => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const { data: session, status } = useSession();

  const login = () => {
    signIn('google');
  };

  const logout = async () => {
    await signOut({ callbackUrl: '/home' });
  };

  return (
    <AuthContext.Provider value={{ user: session?.user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

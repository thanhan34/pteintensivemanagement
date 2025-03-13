import { ReactNode } from 'react';

export const metadata = {
  title: 'Student Registration - PTE Intensive Management',
  description: 'Register as a student for PTE Intensive',
};

export default function RegisterLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#fff5ef]">
      {children}
    </div>
  );
}

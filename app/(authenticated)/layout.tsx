import React from 'react';
import { redirect } from 'next/navigation';
import { Sidebar } from '../components/Sidebar';
import { Header } from '../components/Header';
import { getCurrentUser } from '@/lib/auth';

export default async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Belt-and-braces alongside middleware.ts (which already redirects unauthenticated requests) —
  // this also gives Sidebar/Header the real session user instead of a Context-stored mock.
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  return (
    <div className="min-h-screen bg-[#fbf9fb] text-[#1b1b1d] font-sans">
      <Sidebar user={user} />
      <div className="pl-[260px] min-h-screen flex flex-col">
        {/* We use a static header, but children can inject custom search/filtering if needed */}
        <Header user={user} />
        <main className="flex-1 pt-16">
          {children}
        </main>
      </div>
    </div>
  );
}

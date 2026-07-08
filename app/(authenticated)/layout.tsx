'use client';

import React from 'react';
import { Sidebar } from '../components/Sidebar';
import { Header } from '../components/Header';

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#fbf9fb] text-[#1b1b1d] font-sans">
      <Sidebar />
      <div className="pl-[260px] min-h-screen flex flex-col">
        {/* We use a static header, but children can inject custom search/filtering if needed */}
        <Header />
        <main className="flex-1 pt-16">
          {children}
        </main>
      </div>
    </div>
  );
}

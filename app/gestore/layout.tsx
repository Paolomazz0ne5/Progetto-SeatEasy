import React from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import GestoreSidebar from '@/components/GestoreSidebar';

export const dynamic = 'force-dynamic';

export default async function GestoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const sessionValid = cookieStore.has('seateasy_session');

  // If there's no auth cookie, bump the user out to the public login page
  if (!sessionValid) {
    redirect('/auth/login');
  }

  // If authenticated, render the globally authenticated dashboard layout
  // We use a flex container: Sidebar on the left, Main Content on the right.
  return (
    <div className="flex min-h-screen bg-[#FFFDFB] font-sans overflow-hidden">
      {/* Persistent Left Navbar */}
      <GestoreSidebar />
      
      {/* Right Content Area - Scrolling individually ensures sidebar sticks */}
      <main className="flex-1 overflow-y-auto relative h-screen">
         {children}
      </main>
    </div>
  );
}

/**
 * DESCRIZIONE PRELIMINARE:
 * Il `GestoreLayout` è la "impalcatura" protetta per l'area amministrativa.
 * Agisce come un guardiano (guardrail) per l'accesso: prima di mostrare
 * qualsiasi contenuto (come i ristoranti o le recensioni), verifica tramite
 * i cookie se l'utente è autenticato. Se non lo è, lo blocca e lo rimanda
 * al login pubblico. Se è autenticato, organizza la vista con la barra laterale
 * fissa a sinistra e l'area dei contenuti scorrevole a destra.
 */

import React from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import GestoreSidebar from '@/components/GestoreSidebar';

// Configura il layout affinché si aggiorni in tempo reale.
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
    redirect('/auth');
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

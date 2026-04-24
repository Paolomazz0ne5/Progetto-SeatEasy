import React from 'react';
import Database from 'better-sqlite3';
import path from 'path';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import GestoreProfileClient from '@/components/GestoreProfileClient';

export const dynamic = 'force-dynamic';

export default async function ProfiloPage() {
  const cookieStore = await cookies();
  const session = cookieStore.get('seateasy_session');
  
  if (!session) {
    redirect('/auth/login');
  }

  const userId = Number(session.value);

  const dbPath = path.resolve(process.cwd(), 'database.db');
  const db = new Database(dbPath);

  const user = db.prepare('SELECT nome, cognome, email FROM Account WHERE idAccount = ?').get(userId) as any;
  
  db.close();

  if (!user) {
    redirect('/auth/login');
  }

  return (
    <>
      {/* Decorative Background Elements */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[10%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-[#F5CBA7]/10 blur-3xl opacity-50 mix-blend-multiply"></div>
      </div>

      <div className="flex flex-col py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full relative z-10 min-h-full">
        
        {/* Header Setup */}
        <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between border-b-2 border-[#F5CBA7] pb-6 gap-4">
          <div>
            <h1 className="text-4xl font-extrabold text-[#781D2D] tracking-tight">
              Impostazioni Profilo
            </h1>
            <p className="text-[#D35400] font-medium mt-2">
              Gestisci l'accesso e la sicurezza del tuo account aziendale.
            </p>
          </div>
        </div>

        {/* Client Interactive Area */}
        <GestoreProfileClient initialData={user} />
        
      </div>
    </>
  );
}

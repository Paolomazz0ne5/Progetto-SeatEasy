import React from 'react';
import Database from 'better-sqlite3';
import path from 'path';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import GestoreProfileClient from '@/components/GestoreProfileClient';

/**
 * Disabilita la cache statica per questa rotta.
 * Assicura che i dati del profilo vengano letti dal database in tempo reale
 * ad ogni ricaricamento della pagina, fondamentale per dati sensibili.
 */
export const dynamic = 'force-dynamic';

export default async function ProfiloPage() {
  // --- 1. VERIFICA AUTENTICAZIONE ---
  const cookieStore = await cookies();
  const session = cookieStore.get('seateasy_session');

  // Se non c'è una sessione attiva, l'utente viene sbattuto fuori (alla pagina di Login)
  if (!session) {
    redirect('/auth');
  }

  // Estraiamo l'ID utente dal valore del cookie
  const userId = Number(session.value);

  // --- 2. CONNESSIONE AL DATABASE ---
  const dbPath = path.resolve(process.cwd(), 'database.db');
  const db = new Database(dbPath);

  // --- 3. RECUPERO DATI PROFILO ---
  // Estraiamo ESATTAMENTE i tre campi che servono al Client Component.
  const user = db
    .prepare('SELECT nome, cognome, email FROM Account WHERE idAccount = ?')
    .get(userId) as any;

  db.close();

  // --- 4. VERIFICA INTEGRITÀ ACCOUNT ---
  // Se l'ID c'era nel cookie, ma l'utente non esiste più nel DB 
  // (es. ha appena cancellato l'account dalla Danger Zone), lo reindirizziamo.
  if (!user) {
    redirect('/auth');
  }

  return (
    <>
      {/* =========================================================================
          SEZIONE 1: SFONDO DECORATIVO (Layer non interattivo)
          ========================================================================= */}
      {/* pointer-events-none assicura che il layer sfocato non blocchi i click dell'utente */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[10%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-[#F5CBA7]/10 blur-3xl opacity-50 mix-blend-multiply"></div>
      </div>

      {/* Contenitore principale posizionato sopra lo sfondo (z-10) */}
      <div className="flex flex-col py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full relative z-10 min-h-full">

        {/* =========================================================================
            SEZIONE 2: HEADER DELLA PAGINA
            ========================================================================= */}
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

        {/* =========================================================================
            SEZIONE 3: INIEZIONE DEL CLIENT COMPONENT
            ========================================================================= */}
        {/* Passiamo l'oggetto 'user' estratto dal DB al componente interattivo
            come prop chiamata 'initialData'. Questo idrata il form all'avvio. */}
        <GestoreProfileClient initialData={user} />

      </div>
    </>
  );
}
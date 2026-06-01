import Database from 'better-sqlite3';
import path from 'path';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import GestoreOrariClient from '@/components/GestoreOrariClient';
import { ensureNomeOrarioColumn } from '@/app/actions/orari';
import { redirect } from 'next/navigation';

/**
 * Disabilita la cache statica.
 * Garantisce che la pagina legga il database in tempo reale ad ogni caricamento.
 */
export const dynamic = 'force-dynamic';

interface GestoreOrariPageProps {
  searchParams: Promise<{ ristorante?: string }>;
}

export default async function GestoreOrariPage({ searchParams }: GestoreOrariPageProps) {
  // --- 1. VALIDAZIONE PARAMETRI URL ---
  const params = await searchParams;
  const ristoranteId = params.ristorante ? parseInt(params.ristorante, 10) : NaN;

  if (isNaN(ristoranteId)) {
    redirect('/gestore/ristoranti');
  }

  // --- 2. PATCH DEL DATABASE (Migrazione On-The-Fly) ---
  // Si assicura che la colonna 'nome' esista nella tabella Orario prima di fare query
  await ensureNomeOrarioColumn();

  // --- 3. CONNESSIONE AL DATABASE ---
  const dbPath = path.resolve(process.cwd(), 'database.db');
  const db = new Database(dbPath);

  // --- 4. DATA FETCHING RELAZIONALE (1-a-Molti) ---
  // Estrae tutte le fasce orarie del ristorante ordinate cronologicamente
  const orari = db
    .prepare('SELECT * FROM Orario WHERE idRistorante = ? ORDER BY oraInizio ASC')
    .all(ristoranteId) as any[];

  // Per ogni fascia oraria, recupera i relativi "turni" associati e li "appende" all'oggetto
  for (const o of orari) {
    const turni = db
      .prepare('SELECT * FROM Turno WHERE idOrario = ? ORDER BY idTurno ASC')
      .all(o.idOrario);
    o.turni = turni;
  }

  // Chiusura connessione
  db.close();

  return (
    <>
      {/* =========================================================================
          SEZIONE 1: SFONDO DECORATIVO (Non interattivo)
          ========================================================================= */}
      {/* pointer-events-none è fondamentale qui per evitare che lo sfondo blocchi i click */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[20%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-[#F5CBA7]/20 blur-3xl opacity-60 mix-blend-multiply"></div>
      </div>

      {/* Contenitore principale: z-10 lo porta "sopra" lo sfondo decorativo */}
      <div className="flex flex-col py-10 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full relative z-10 min-h-full">

        {/* =========================================================================
            SEZIONE 2: HEADER DELLA PAGINA E NAVIGAZIONE
            ========================================================================= */}
        <div className="mb-10 border-b-2 border-[#F5CBA7] pb-6">
          <div className="flex items-center gap-4 mb-2">

            {/* Navigazione ottimizzata verso la Dashboard del gestore */}
            <Link
              href="/gestore/dashboard"
              className="p-2 bg-gray-100 hover:bg-[#FDF1E9] text-gray-500 hover:text-[#D35400] rounded-xl transition-colors"
            >
              <ArrowLeft size={20} />
            </Link>

            <h1 className="text-4xl font-extrabold text-[#781D2D] tracking-tight">
              Orari e Turni
            </h1>
          </div>
          <p className="text-[#D35400] font-medium mt-2 pl-14">
            Configura i servizi e monitora affluenza e tempi di servizio.
          </p>
        </div>

        {/* =========================================================================
            SEZIONE 3: INIEZIONE DEL CLIENT COMPONENT
            ========================================================================= */}
        {/* Passiamo i dati elaborati dal Server (gli array di orari e turni) 
            direttamente al componente interattivo che vive nel browser dell'utente */}
        <GestoreOrariClient
          initialOrari={orari}
          idRistorante={ristoranteId}
        />

      </div>
    </>
  );
}
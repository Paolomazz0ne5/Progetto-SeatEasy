import Database from 'better-sqlite3';
import path from 'path';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import GestoreOrariClient from '@/components/GestoreOrariClient';
import AffluenzaChart from '@/components/AffluenzaChart';
import { ensureNomeOrarioColumn } from '@/app/actions/orari';

import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function GestoreOrariPage({
  searchParams,
}: {
  searchParams: Promise<{ ristorante?: string }>;
}) {
  const params = await searchParams;
  const ristoranteId = params.ristorante ? parseInt(params.ristorante, 10) : NaN;

  if (isNaN(ristoranteId)) redirect('/gestore/ristoranti');

  // Ensure the DB column is patched
  await ensureNomeOrarioColumn();

  const dbPath = path.resolve(process.cwd(), 'database.db');
  const db = new Database(dbPath);

  // Fetch all Orari
  const orari = db.prepare('SELECT * FROM Orario WHERE idRistorante = ? ORDER BY oraInizio ASC').all(ristoranteId) as any[];

  // Attach turni
  for (const o of orari) {
    const turni = db.prepare('SELECT * FROM Turno WHERE idOrario = ? ORDER BY nomeTurno ASC').all(o.idOrario);
    o.turni = turni;
  }

  db.close();

  return (
    <>
      {/* Decorative Background Elements */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[20%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-[#F5CBA7]/20 blur-3xl opacity-60 mix-blend-multiply"></div>
      </div>

      <div className="flex flex-col py-10 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full relative z-10 min-h-full">
        
        {/* Header */}
        <div className="mb-10 border-b-2 border-[#F5CBA7] pb-6">
          <div className="flex items-center gap-4 mb-2">
            <Link href="/gestore/dashboard" className="p-2 bg-gray-100 hover:bg-[#FDF1E9] text-gray-500 hover:text-[#D35400] rounded-xl transition-colors">
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

        {/* Affluenza & Service Duration Chart */}
        <div className="mb-8">
          <AffluenzaChart />
        </div>

        {/* Client Interactive Area */}
        <GestoreOrariClient initialOrari={orari} idRistorante={ristoranteId} />
        
      </div>
    </>
  );
}

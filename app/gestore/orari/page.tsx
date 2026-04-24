import Database from 'better-sqlite3';
import path from 'path';
import Link from 'next/link';
import { ArrowLeft, Clock } from 'lucide-react';
import GestoreOrariClient from '@/components/GestoreOrariClient';
import { ensureNomeOrarioColumn } from '@/app/actions/orari';

export const dynamic = 'force-dynamic';

export default async function GestoreOrariPage() {
  // Ensure the DB column is patched
  await ensureNomeOrarioColumn();

  const dbPath = path.resolve(process.cwd(), 'database.db');
  const db = new Database(dbPath);

  // Fetch all Orari
  const orari = db.prepare('SELECT * FROM Orario WHERE idRistorante = 1 ORDER BY oraInizio ASC').all() as any[];
  
  let totalDurata = 0;

  // Attach turni
  for (const o of orari) {
    const turni = db.prepare('SELECT * FROM Turno WHERE idOrario = ? ORDER BY nomeTurno ASC').all(o.idOrario);
    o.turni = turni;
    totalDurata += (o.durataMediaServizio || 0);
  }

  db.close();

  // Top Widget Calculation
  // Calculate average duration across all Fasce (or 0 if none exist)
  const averageServiceDuration = orari.length > 0 ? Math.round(totalDurata / orari.length) : 0;

  return (
    <>
      {/* Decorative Background Elements */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[20%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-[#F5CBA7]/20 blur-3xl opacity-60 mix-blend-multiply"></div>
      </div>

      <div className="flex flex-col py-10 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full relative z-10 min-h-full">
        
        {/* Header Setup & Dash Widget */}
        <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between border-b-2 border-[#F5CBA7] pb-6 gap-6">
          <div>
            <div className="flex items-center gap-4 mb-2">
              <Link href="/gestore/dashboard" className="p-2 bg-gray-100 hover:bg-[#FDF1E9] text-gray-500 hover:text-[#D35400] rounded-xl transition-colors">
                 <ArrowLeft size={20} />
              </Link>
              <h1 className="text-4xl font-extrabold text-[#781D2D] tracking-tight">
                Orari e Turni
              </h1>
            </div>
            <p className="text-[#D35400] font-medium mt-2 pl-14">
              Configura i servizi e definisci i limiti di prenotazione.
            </p>
          </div>

          {/* Top Summary Widget */}
          <div className="flex bg-white/60 rounded-2xl p-4 border border-[#F5CBA7]/60 shadow-[0_4px_20px_rgb(0,0,0,0.03)] backdrop-blur-md items-center gap-4 hidden md:flex">
             <div className="w-14 h-14 bg-gradient-to-br from-[#D35400] to-[#E74C3C] text-white rounded-2xl flex items-center justify-center shadow-inner">
               <Clock size={28} />
             </div>
             <div>
               <span className="block text-sm uppercase tracking-wider text-gray-500 font-bold mb-1">Durata Media Servizio</span>
               <div className="flex items-baseline gap-1.5">
                 <span className="text-3xl font-black text-[#781D2D]">{averageServiceDuration}</span>
                 <span className="text-gray-400 font-medium">minuti / tavolo</span>
               </div>
             </div>
          </div>
        </div>

        {/* Mobile Widget Version */}
        <div className="md:hidden flex bg-white/60 rounded-2xl p-4 border border-[#F5CBA7]/60 shadow-sm backdrop-blur-md items-center gap-4 mb-8">
             <div className="w-12 h-12 bg-gradient-to-br from-[#D35400] to-[#E74C3C] text-white rounded-xl flex items-center justify-center">
               <Clock size={24} />
             </div>
             <div>
               <span className="block text-xs uppercase tracking-wider text-gray-500 font-bold">Durata Media Servizio</span>
               <div className="flex items-baseline gap-1">
                 <span className="text-2xl font-black text-[#781D2D]">{averageServiceDuration}</span>
                 <span className="text-gray-400 font-medium text-sm">min</span>
               </div>
             </div>
        </div>

        {/* Client Interactive Area */}
        <GestoreOrariClient initialOrari={orari} />
        
      </div>
    </>
  );
}

import Database from 'better-sqlite3';
import path from 'path';
import GestoreDashboardClient, { ReservationData } from '@/components/GestoreDashboardClient';
import Link from 'next/link';

// Enable dynamic rendering
export const dynamic = 'force-dynamic';

export default async function GestoreDashboard() {
  const dbPath = path.resolve(process.cwd(), 'database.db');
  const db = new Database(dbPath);

  // Fetch only future or today's active reservations + 'noShow'
  // Or just all reservations for the demo
  const rawReservations = db.prepare(`
    SELECT 
      P.idPrenotazione,
      P.idCliente,
      A.nome as clienteNome,
      A.cognome as clienteCognome,
      A.telefono,
      P.dataPrenotazione,
      P.numeroPersone,
      P.stato,
      P.noteCliente,
      P.caparraPagata,
      (
        SELECT COUNT(*) 
        FROM Prenotazione P2 
        WHERE P2.idCliente = P.idCliente AND P2.stato = 'noShow'
      ) as noShowCount
    FROM Prenotazione P
    JOIN Cliente C ON P.idCliente = C.idAccount
    JOIN Account A ON C.idAccount = A.idAccount
    ORDER BY P.dataPrenotazione ASC
  `).all() as ReservationData[];

  // Close sync wrapper
  db.close();

  return (
    <>
      {/* Decorative Background Elements */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-10%] right-[-5%] w-[40vw] h-[40vw] rounded-full bg-[#F5CBA7]/30 blur-3xl opacity-50 mix-blend-multiply"></div>
        <div className="absolute bottom-[-10%] left-[-5%] w-[30vw] h-[30vw] rounded-full bg-[#FDF1E9] blur-3xl opacity-60"></div>
      </div>

      <div className="flex flex-col py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full relative z-10 min-h-full">
        {/* Header Dashboard Planner */}
        <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between border-b-2 border-[#F5CBA7] pb-6 gap-4">
          <div>
            <h1 className="text-4xl font-extrabold text-[#781D2D] tracking-tight">
              Dashboard Gestore
            </h1>
            <p className="text-[#D35400] font-medium mt-2">
              Panoramica operativa e gestione intelligente delle prenotazioni.
            </p>
          </div>
          <div className="flex bg-[#F5CBA7]/20 rounded-2xl p-4 border border-[#F5CBA7]/50 shadow-sm backdrop-blur-md">
            <div className="text-center px-4 border-r border-[#781D2D]/10">
              <span className="block text-2xl font-black text-[#781D2D]">{rawReservations.filter(r => r.stato !== 'noShow' && r.stato !== 'Annullata').length}</span>
              <span className="block text-xs uppercase tracking-wider text-gray-500 font-semibold mt-1">Attive</span>
            </div>
            <div className="text-center px-4">
              <span className="block text-2xl font-black text-[#E74C3C]">{rawReservations.filter(r => r.stato === 'noShow').length}</span>
              <span className="block text-xs uppercase tracking-wider text-gray-500 font-semibold mt-1">No-Show</span>
            </div>
          </div>
        </div>

        {/* Client Component / Data Table */}
        <GestoreDashboardClient reservations={rawReservations} />
      </div>
    </>
  );
}

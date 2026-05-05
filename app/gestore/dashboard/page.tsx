import Database from 'better-sqlite3';
import path from 'path';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import GestoreDashboardClient, { ReservationData } from '@/components/GestoreDashboardClient';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

// Enable dynamic rendering
export const dynamic = 'force-dynamic';

export default async function GestoreDashboard({
  searchParams,
}: {
  searchParams: Promise<{ ristorante?: string }>;
}) {
  // 1. Auth check
  const cookieStore = await cookies();
  const sessionId = cookieStore.get('seateasy_session')?.value;
  if (!sessionId) redirect('/auth');

  // 2. Resolve searchParams (Next.js 15 async)
  const params = await searchParams;
  const ristoranteId = params.ristorante ? parseInt(params.ristorante, 10) : NaN;

  if (isNaN(ristoranteId)) redirect('/gestore/ristoranti');

  const dbPath = path.resolve(process.cwd(), 'database.db');
  const db = new Database(dbPath);

  // 3. Verify this restaurant belongs to the logged-in gestore
  const ownership = db
    .prepare(
      'SELECT idRistorante, nome FROM Ristorante WHERE idRistorante = ? AND idGestoreRistorante = ?'
    )
    .get(ristoranteId, Number(sessionId)) as { idRistorante: number; nome: string } | undefined;

  if (!ownership) {
    db.close();
    redirect('/gestore/ristoranti');
  }

  const ristoranteNome = ownership.nome;

  // 4. Fetch reservations filtered by this restaurant
  //    Chain: Prenotazione → Turno → Orario → Ristorante
  const rawReservations = db
    .prepare(
      `SELECT 
        P.idPrenotazione,
        P.idCliente,
        A.nome   AS clienteNome,
        A.cognome AS clienteCognome,
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
        ) AS noShowCount
      FROM Prenotazione P
      JOIN Cliente    C ON P.idCliente  = C.idAccount
      JOIN Account    A ON C.idAccount  = A.idAccount
      JOIN Turno      T ON P.idTurno    = T.idTurno
      JOIN Orario     O ON T.idOrario   = O.idOrario
      WHERE O.idRistorante = ?
      ORDER BY P.dataPrenotazione ASC`
    )
    .all(ristoranteId) as ReservationData[];

  db.close();

  const attive = rawReservations.filter(r => r.stato !== 'noShow' && r.stato !== 'Annullata').length;
  const noShows = rawReservations.filter(r => r.stato === 'noShow').length;

  return (
    <>
      {/* Decorative Background Elements */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[10%] left-[-5%] w-[40vw] h-[40vw] rounded-full bg-[#e2b793]/20 blur-3xl opacity-50 mix-blend-multiply"></div>
      </div>

      <div className="flex flex-col py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full relative z-10 min-h-full">

        {/* Header Setup */}
        <div className="mb-10 border-b-2 border-[#F5CBA7] pb-6">
          <div className="flex items-center gap-4 mb-2">
            <Link href="/gestore/ristoranti" className="p-2 bg-gray-100 hover:bg-[#FDF1E9] text-gray-500 hover:text-[#D35400] rounded-xl transition-colors">
              <ArrowLeft size={20} />
            </Link>
            <h1 className="text-4xl font-extrabold text-[#781D2D] tracking-tight">
              {ristoranteNome}
            </h1>
          </div>
          <p className="text-[#D35400] font-medium mt-2 pl-14">
            Panoramica operativa e gestione delle prenotazioni.
          </p>
        </div>

        {/* Data Table */}
        <GestoreDashboardClient
          reservations={rawReservations}
          stats={{ attive, noShows }}
        />
      </div>
    </>
  );
}

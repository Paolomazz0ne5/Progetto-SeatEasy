import Database from 'better-sqlite3';
import path from 'path';
import Link from 'next/link';
import { ArrowLeft, MessageSquareHeart } from 'lucide-react';
import GestoreRelazioniClient, { Review } from '@/components/GestoreRelazioniClient';
import { ensureCRMDatabase } from '@/app/actions/relazioni';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function GestoreRelazioniPage({
  searchParams,
}: {
  searchParams: Promise<{ ristorante?: string }>;
}) {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get('seateasy_session')?.value;
  if (!sessionId) redirect('/auth');

  const params = await searchParams;
  const ristoranteId = params.ristorante ? parseInt(params.ristorante, 10) : NaN;
  if (isNaN(ristoranteId)) redirect('/gestore/ristoranti');

  await ensureCRMDatabase();

  const dbPath = path.resolve(process.cwd(), 'database.db');
  const db = new Database(dbPath);

  // Controllo di ownership
  const ownership = db.prepare('SELECT idRistorante FROM Ristorante WHERE idRistorante = ? AND idGestoreRistorante = ?').get(ristoranteId, Number(sessionId));
  if (!ownership) {
    db.close();
    redirect('/gestore/ristoranti');
  }

  // FETCH REVIEWS
  const reviews = db.prepare(`
    SELECT 
      R.idRecensione, 
      R.punteggio, 
      R.testo, 
      R.dataCreazione,
      A.nome as clienteNome,
      A.cognome as clienteCognome
    FROM Recensione R
    JOIN Cliente C ON R.idCliente = C.idAccount
    JOIN Account A ON C.idAccount = A.idAccount
    WHERE R.idRistorante = ?
    ORDER BY R.dataCreazione DESC
  `).all(ristoranteId) as Review[];

  db.close();

  return (
    <>
      {/* Decorative Background Elements */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[10%] left-[-10%] w-[60vw] h-[60vw] rounded-full bg-[#F5CBA7]/10 blur-3xl opacity-50 mix-blend-multiply"></div>
      </div>

      <div className="flex flex-col py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full relative z-10 min-h-full">
        
        {/* Header Dashboard Planner */}
        <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between border-b-2 border-[#F5CBA7] pb-6 gap-4">
          <div>
            <div className="flex items-center gap-4 mb-2">
              <Link href="/gestore/dashboard" className="p-2 bg-gray-100 hover:bg-[#FDF1E9] text-gray-500 hover:text-[#D35400] rounded-xl transition-colors">
                 <ArrowLeft size={20} />
              </Link>
              <h1 className="text-4xl font-extrabold text-[#781D2D] tracking-tight">
                Relazioni con il Cliente
              </h1>
            </div>
            <p className="text-[#D35400] font-medium mt-2 pl-14">
              Gestisci il feedback dei clienti e configura le comunicazioni automatiche via Email e SMS.
            </p>
          </div>

          <div className="flex bg-white/60 rounded-2xl p-4 border border-[#F5CBA7]/60 shadow-[0_4px_20px_rgb(0,0,0,0.03)] backdrop-blur-md items-center gap-4 hidden md:flex">
             <div className="w-14 h-14 bg-gradient-to-br from-[#781D2D] to-[#E74C3C] text-white rounded-2xl flex items-center justify-center shadow-inner">
               <MessageSquareHeart size={28} />
             </div>
             <div>
               <span className="block text-sm uppercase tracking-wider text-gray-500 font-bold mb-1">Reputation Score</span>
               <div className="flex items-baseline gap-1.5">
                 <span className="text-2xl font-black text-[#781D2D]">Eccellente</span>
               </div>
             </div>
          </div>
        </div>

        {/* Client Interface */}
        <GestoreRelazioniClient reviews={reviews} />
        
      </div>
    </>
  );
}

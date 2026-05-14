import Database from 'better-sqlite3';
import path from 'path';
import nextDynamic from 'next/dynamic';
const GestoreLayoutClient = nextDynamic(() => import('@/components/GestoreLayoutClient'));
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function GestoreLayoutPage({
  searchParams,
}: {
  searchParams: Promise<{ ristorante?: string }>;
}) {
  const params = await searchParams;
  const ristoranteId = params.ristorante ? parseInt(params.ristorante, 10) : NaN;

  if (isNaN(ristoranteId)) redirect('/gestore/ristoranti');

  const dbPath = path.resolve(process.cwd(), 'database.db');
  const db = new Database(dbPath);

  // Fetch all Sale for the ristorante
  const sale = db.prepare('SELECT * FROM Sala WHERE idRistorante = ? ORDER BY idSala ASC').all(ristoranteId) as any[];
  
  // Attach tavoli to each Sala
  for (const s of sale) {
    const tavoli = db.prepare('SELECT * FROM Tavolo WHERE idSala = ? ORDER BY numero ASC').all(s.idSala);
    s.tavoli = tavoli;
  }

  db.close();

  return (
    <>
      {/* Decorative Background Elements */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[10%] left-[-5%] w-[40vw] h-[40vw] rounded-full bg-[#e2b793]/20 blur-3xl opacity-50 mix-blend-multiply"></div>
      </div>

      <div className="flex flex-col py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full relative z-10 min-h-full">
        
        {/* Header Setup */}
        <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between border-b-2 border-[#F5CBA7] pb-6 gap-4">
          <div>
            <div className="flex items-center gap-4 mb-2">
              <Link href="/gestore/dashboard" className="p-2 bg-gray-100 hover:bg-[#FDF1E9] text-gray-500 hover:text-[#D35400] rounded-xl transition-colors">
                 <ArrowLeft size={20} />
              </Link>
              <h1 className="text-4xl font-extrabold text-[#781D2D] tracking-tight">
                Gestione Layout
              </h1>
            </div>
            <p className="text-[#D35400] font-medium mt-2 pl-14">
              Configura e modella la disposizione dei tavoli nelle tue sale.
            </p>
          </div>
        </div>

        {/* Client Interactive Area */}
        <GestoreLayoutClient initialSale={sale} idRistorante={ristoranteId} />
        
      </div>
    </>
  );
}

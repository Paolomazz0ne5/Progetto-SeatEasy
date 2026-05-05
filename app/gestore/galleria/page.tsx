import Database from 'better-sqlite3';
import path from 'path';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Image as ImageIcon } from 'lucide-react';
import GestoreGalleriaClient from '@/components/GestoreGalleriaClient';
import { GalleriaItem } from '@/app/actions/ristoranti';

export const dynamic = 'force-dynamic';

export default async function GestoreGalleriaPage({
  searchParams,
}: {
  searchParams: Promise<{ ristorante?: string }>;
}) {
  // 1. Auth check
  const cookieStore = await cookies();
  const sessionId = cookieStore.get('seateasy_session')?.value;
  if (!sessionId) redirect('/auth');

  // 2. Resolve searchParams
  const params = await searchParams;
  const ristoranteId = params.ristorante ? parseInt(params.ristorante, 10) : NaN;

  if (isNaN(ristoranteId)) redirect('/gestore/ristoranti');

  const dbPath = path.resolve(process.cwd(), 'database.db');
  const db = new Database(dbPath);

  // 3. Verify ownership
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

  // 4. Fetch gallery items
  const galleryItems = db
    .prepare('SELECT * FROM GalleriaRistorante WHERE idRistorante = ? ORDER BY idImmagine DESC')
    .all(ristoranteId) as GalleriaItem[];

  db.close();

  return (
    <>
      {/* Decorative Background Elements */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[10%] left-[-5%] w-[40vw] h-[40vw] rounded-full bg-[#e2b793]/20 blur-3xl opacity-50 mix-blend-multiply"></div>
      </div>

      <div className="flex flex-col py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full relative z-10 min-h-full">
        
        {/* Header Section */}
        <div className="mb-10 border-b-2 border-[#F5CBA7] pb-6">
          <div className="flex items-center gap-4 mb-2">
            <Link 
              href={`/gestore/dashboard?ristorante=${ristoranteId}`} 
              className="p-2 bg-gray-100 hover:bg-[#FDF1E9] text-gray-500 hover:text-[#D35400] rounded-xl transition-colors"
            >
              <ArrowLeft size={20} />
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#781D2D] flex items-center justify-center text-[#F5CBA7] shadow-lg">
                <ImageIcon size={22} />
              </div>
              <h1 className="text-4xl font-extrabold text-[#781D2D] tracking-tight">
                Galleria Immagini
              </h1>
            </div>
          </div>
          <p className="text-[#D35400] font-medium mt-2 pl-14">
            Gestisci il menù visivo di <span className="font-bold text-[#781D2D]">{ristoranteNome}</span>.
          </p>
        </div>

        {/* Client Component */}
        <GestoreGalleriaClient 
          idRistorante={ristoranteId}
          items={galleryItems}
        />
      </div>
    </>
  );
}

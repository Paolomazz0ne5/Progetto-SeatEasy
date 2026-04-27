import Database from 'better-sqlite3';
import path from 'path';
import Link from 'next/link';
import { cookies } from 'next/headers';
import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';

const dbPath = path.resolve(process.cwd(), 'database.db');
const db = new Database(dbPath);

export default async function Home() {
  const cookieStore = await cookies();
  const isLoggedIn = cookieStore.has('seateasy_session');
  
  const ristoranti = db.prepare('SELECT * FROM Ristorante').all();

  return (
    <div className="min-h-screen bg-[#FFFDFB] font-sans">
      <Navbar isLoggedIn={isLoggedIn} />

      <main>
        <Hero />
        
        {/* Ristoranti in Evidenza */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold tracking-tight text-[#781D2D] sm:text-4xl">
              Ristoranti in Evidenza
            </h2>
            <p className="mt-4 max-w-2xl text-lg text-[#781D2D]/70 mx-auto">
              Scegli tra i nostri partner esclusivi e prenota un tavolo in anteprima.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {ristoranti.map((risto: any) => (
              <div 
                key={risto.idRistorante} 
                className="bg-white rounded-2xl shadow-sm border border-[#F5CBA7]/40 overflow-hidden hover:shadow-xl transition-shadow duration-300 group flex flex-col"
              >
                <div className="h-48 bg-[#FDF1E9] relative flex items-center justify-center overflow-hidden">
                  <img 
                    src={`https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80`}
                    alt={risto.nome}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-[#E74C3C] shadow-sm">
                    Nuovo
                  </div>
                </div>
                <div className="p-6 flex-1 flex flex-col">
                  <h3 className="text-xl font-bold text-[#781D2D] mb-2">{risto.nome}</h3>
                  <div className="flex items-start space-x-2 text-gray-500 mb-6 flex-1">
                    <svg className="w-5 h-5 text-[#D35400] flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <p className="text-sm font-medium leading-relaxed">{risto.indirizzo}</p>
                  </div>
                  <Link href={`/ristorante/${risto.idRistorante}`} className="inline-flex justify-center items-center w-full py-2.5 px-4 border-2 border-[#781D2D]/20 text-[#781D2D] rounded-xl font-bold hover:bg-[#781D2D] hover:border-[#781D2D] hover:text-white transition-all">
                    Prenota Ora
                  </Link>
                </div>
              </div>
            ))}
            
            {/* Fallback if no restaurants exist */}
            {ristoranti.length === 0 && (
              <div className="col-span-full text-center py-12 text-[#781D2D]/60 bg-[#FDF1E9]/50 rounded-2xl border border-dashed border-[#F5CBA7]">
                 Nessun ristorante disponibile al momento.
              </div>
            )}
          </div>
        </section>
      </main>
      
      {/* Footer */}
      <footer className="bg-[#781D2D] text-[#F5CBA7] py-8 border-t-4 border-[#D35400]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center flex flex-col items-center">
           <div className="mb-4">
             <span className="text-2xl font-extrabold tracking-tight text-white leading-none">SeatEasy</span>
           </div>
          <p className="text-[#F5CBA7]/80 font-medium text-sm">
            &copy; {new Date().getFullYear()} SeatEasy - Restaurant Management System. Tutti i diritti riservati.
          </p>
        </div>
      </footer>
    </div>
  );
}

import Database from 'better-sqlite3';
import path from 'path';
import Link from 'next/link';
import { cookies } from 'next/headers';
import Navbar from '@/components/Navbar';
import TableMap from '@/components/TableMap';

export default async function RistoranteDettaglio({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cookieStore = await cookies();
  const isLoggedIn = cookieStore.has('seateasy_session');
  
  const dbPath = path.resolve(process.cwd(), 'database.db');
  const db = new Database(dbPath);
  
  const ristorante = db.prepare('SELECT * FROM Ristorante WHERE idRistorante = ?').get(id) as any;

  if (!ristorante) {
    return (
      <div className="min-h-screen bg-[#FFFDFB] font-sans flex flex-col pt-20">
        <Navbar isLoggedIn={isLoggedIn} />

        <div className="flex-1 flex items-center justify-center">
          <h1 className="text-2xl font-bold text-[#781D2D]">Ristorante non trovato</h1>
        </div>
      </div>
    );
  }

  // Recupera i turni per il ristorante
  const turni = db.prepare(`
    SELECT T.idTurno, T.nomeTurno, O.oraInizio
    FROM Turno T
    JOIN Orario O ON T.idOrario = O.idOrario
    WHERE O.idRistorante = ?
  `).all(id) as any[];

  // Recupera i tavoli (base)
  const tavoliBase = db.prepare('SELECT T.* FROM Tavolo T JOIN Sala S ON T.idSala = S.idSala WHERE S.idRistorante = ?').all(id) as any[];

  // Mock Reviews
  const recensioni = [
    { id: 1, username: 'MarcoP', rating: 5, date: '2 giorni fa', comment: 'Cibo eccezionale e servizio impeccabile. Assolutamente consigliato!' },
    { id: 2, username: 'Giulia_89', rating: 4, date: '1 settimana fa', comment: 'Ottima atmosfera, molto romantica. Personale super preparato.' },
    { id: 3, username: 'Lollo Foodie', rating: 5, date: '2 settimane fa', comment: 'Attenzione al cliente incredibile, ci siamo sentiti a casa. Torneremo.' }
  ];

  return (
    <div className="min-h-screen bg-[#FFFDFB] font-sans flex flex-col">
      <Navbar isLoggedIn={isLoggedIn} />
      
      <main className="flex-1 pt-24 pb-20">
        {/* Banner/Header Ristorante */}
        <div className="relative w-full h-80 bg-[#FDF1E9] overflow-hidden">
          <img 
            src={`https://images.unsplash.com/photo-1544148103-0773bf10d330?auto=format&fit=crop&w=1600&q=80`}
            alt={ristorante.nome}
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
          <div className="absolute bottom-0 left-0 p-8 w-full">
            <div className="max-w-5xl mx-auto">
              <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight drop-shadow-md mb-2">
                {ristorante.nome}
              </h1>
              <div className="flex items-center text-white/90 space-x-2 font-medium">
                <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>{ristorante.indirizzo}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 space-y-16">
          
          {/* Sezione Politiche */}
          <section>
            <h2 className="text-2xl font-bold text-[#781D2D] mb-6 flex items-center border-b-2 border-[#F5CBA7] pb-2 inline-block">
              Politica del Ristorante
            </h2>
            
            <div className="bg-[#FDF1E9]/70 border border-[#e2b793]/40 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row gap-6">
              {/* Caparra */}
              <div className="flex-1 bg-white p-5 rounded-xl border-l-4 border-[#D35400] shadow-sm">
                <div className="flex items-center mb-3">
                  <div className="p-2 bg-[#FDF1E9] rounded-lg mr-3">
                     <svg className="w-6 h-6 text-[#D35400]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                     </svg>
                  </div>
                  <h3 className="font-bold text-[#781D2D] text-lg">Caparra / Acconto</h3>
                </div>
                <p className="text-[#781D2D]/80 leading-relaxed font-medium">
                  {ristorante.caparraRichiesta && ristorante.caparraRichiesta > 0 
                    ? `È richiesto un acconto di €${Number(ristorante.caparraRichiesta).toFixed(2)} al momento della prenotazione per confermare il tavolo.` 
                    : 'Nessun acconto richiesto per prenotare in questa struttura.'}
                </p>
              </div>

              {/* Penale No-Show */}
              <div className="flex-1 bg-white p-5 rounded-xl border-l-4 border-[#E74C3C] shadow-sm">
                <div className="flex items-center mb-3">
                  <div className="p-2 bg-[#fbe7e5] rounded-lg mr-3">
                     <svg className="w-6 h-6 text-[#E74C3C]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                     </svg>
                  </div>
                  <h3 className="font-bold text-[#781D2D] text-lg">Penale e Annullamento</h3>
                </div>
                <p className="text-[#781D2D]/80 leading-relaxed font-medium">
                  {ristorante.politicaNoShow || 'Nessuna politica specifica fornita. Contatta il ristorante per i dettagli sulle mancate presentazioni.'}
                </p>
              </div>
            </div>
          </section>

          {/* Interactive Table Map Section */}
          <section id="prenota" className="scroll-mt-32">
             <TableMap 
               initialTavoli={tavoliBase} 
               idRistorante={Number(id)} 
               turni={turni} 
             />
          </section>

          {/* Sezione Recensioni */}
          <section>
            <h2 className="text-2xl font-bold text-[#781D2D] mb-6 flex items-center border-b-2 border-[#F5CBA7] pb-2 inline-block">
              Recensioni dei Clienti
            </h2>
            
            <div className="space-y-4">
              {recensioni.map((rec) => (
                <div key={rec.id} className="bg-white border border-[#F5CBA7]/40 rounded-xl p-5 shadow-sm">
                   <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-[#E74C3C] text-white flex justify-center items-center font-bold">
                          {rec.username.substring(0,2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-[#781D2D]">{rec.username}</p>
                          <p className="text-xs text-gray-400">{rec.date}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1">
                        {[...Array(5)].map((_, i) => (
                          <svg key={i} className={`w-5 h-5 ${i < rec.rating ? 'text-[#D35400]' : 'text-gray-200'}`} fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                   </div>
                   <p className="text-[#781D2D]/80 leading-relaxed">{rec.comment}</p>
                </div>
              ))}
            </div>
          </section>

        </div>
      </main>
      
      {/* Footer */}
      <footer className="bg-[#781D2D] text-[#F5CBA7] py-8 mt-auto border-t-4 border-[#D35400]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center flex flex-col items-center">
          <p className="text-[#F5CBA7]/80 font-medium text-sm">
            &copy; {new Date().getFullYear()} SeatEasy - Restaurant Management System. Tutti i diritti riservati.
          </p>
        </div>
      </footer>
    </div>
  );
}


import Database from 'better-sqlite3';
import path from 'path';
import { cookies } from 'next/headers';
import Navbar from '@/components/Navbar';
import TableMap from '@/components/TableMap';
import RestaurantGallery from '@/components/RestaurantGallery';
import { ensureGalleriaTable } from '@/app/actions/ristoranti';
import { getClientProfile } from '@/app/actions/cliente';

export const dynamic = 'force-dynamic';
// Componente principale asincrono. Riceve nelle props due Promise: 'params' (ID nell'URL) e 'searchParams' (query string dell'URL)
export default async function RistoranteDettaglio({ params, searchParams }: { params: Promise<{ id: string }>, searchParams: Promise<{ pax?: string; data?: string }> }) {

  const { id } = await params;
  const sParams = await searchParams;
  const pax = parseInt(sParams?.pax || '1', 10);
  const data = sParams?.data || new Date().toISOString().split('T')[0];

  const cookieStore = await cookies();
  const isLoggedIn = cookieStore.has('seateasy_session');
  // Operatore ternario: se l'utente è loggato recupera il suo profilo dal database tramite l'azione, altrimenti imposta null
  const profile = isLoggedIn ? await getClientProfile() : null;

  // Risolve il percorso assoluto del file del database partendo dalla cartella principale del progetto (process.cwd())
  const dbPath = path.resolve(process.cwd(), 'database.db');

  const db = new Database(dbPath);

  // Esegue un'azione di controllo preventiva sul server per assicurarsi che la tabella delle immagini ("galleria") sia creata
  await ensureGalleriaTable();

  // Prepara ed esegue una query SQL per recuperare i dati del ristorante singolo usando l'id passato come parametro sicuro
  const ristorante = db.prepare('SELECT * FROM Ristorante WHERE idRistorante = ?').get(id) as any;

  // Controllo di sicurezza: se la query non restituisce alcun ristorante (id errato), interrompe il flusso e renderizza la pagina di errore
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

  // Esegue una query SQL con una INNER JOIN tra le tabelle "Turno" e "Orario" per estrarre tutti i turni di servizio associati al ristorante
  const turni = db.prepare(`
    SELECT T.idTurno, O.nome AS nomeTurno, O.oraInizio, O.oraFine
    FROM Turno T
    JOIN Orario O ON T.idOrario = O.idOrario
    WHERE O.idRistorante = ?
  `).all(id) as any[];

  // Esegue una query SQL con INNER JOIN per estrarre l'elenco dei tavoli mappati all'interno delle sale appartenenti a questo ristorante
  const tavoliBase = db.prepare('SELECT T.* FROM Tavolo T JOIN Sala S ON T.idSala = S.idSala WHERE S.idRistorante = ?').all(id) as any[];

  // Recupera l'elenco delle recensioni dei clienti per questo ristorante ordinandole dalle più recenti (DESC) unendo i dati dell'account autore
  const recensioni = db.prepare(`
    SELECT R.*, A.nome as username
    FROM Recensione R
    JOIN Account A ON R.idCliente = A.idAccount
    WHERE R.idRistorante = ?
    ORDER BY R.dataCreazione DESC
  `).all(id) as any[];

  // Recupera le immagini inserite nella galleria di questo ristorante ordinate in modo decrescente per ID
  const galleria = db.prepare('SELECT * FROM GalleriaRistorante WHERE idRistorante = ? ORDER BY idImmagine DESC').all(id) as any[];

  // Chiude in modo esplicito la connessione al database SQLite 
  db.close();

  // Ritorna l'interfaccia grafica (JSX) della pagina iniettando tutti i dati estratti dal database
  return (
    <div className="min-h-screen bg-[#FFFDFB] font-sans flex flex-col">
      <Navbar isLoggedIn={isLoggedIn} />

      <main className="flex-1 pt-24 pb-20">
        {/* Banner/Header Ristorante con immagine di copertina e sfumatura scura */}
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

        {/* Componente carosello che riceve l'array delle immagini della galleria estratte dal DB */}
        <RestaurantGallery items={galleria} />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 space-y-16">

          {/* Sezione Politiche Aziendali */}
          <section>
            <h2 className="text-2xl font-bold text-[#781D2D] mb-6 flex items-center border-b-2 border-[#F5CBA7] pb-2 inline-block">
              Politica del Ristorante
            </h2>

            <div className="bg-[#FDF1E9]/70 border border-[#e2b793]/40 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row gap-6">
              {/* Box Caparra: operatore ternario per decidere la frase in base al valore numerico nel DB */}
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

              {/* Box Penale No-Show: gestisce la visualizzazione della penale di mancata presentazione */}
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
                  {ristorante.penaleNoShow && ristorante.penaleNoShow > 0
                    ? `In caso di mancata presentazione, è prevista una penale di €${Number(ristorante.penaleNoShow).toFixed(2)}. ${ristorante.messaggioPenale || ''}`
                    : ristorante.messaggioPenale || 'Nessuna penale specifica prevista per questa struttura.'}
                </p>
              </div>
            </div>
          </section>

          {/* Componente interattivo della mappa dei tavoli che riceve le variabili estratte dal DB */}
          <section id="prenota" className="scroll-mt-32">
            <TableMap
              initialTavoli={tavoliBase}
              idRistorante={Number(id)}
              turni={turni}
              pax={pax}
              initialDate={data}
              caparraRichiesta={Number(ristorante.caparraRichiesta || 0)}
              metodoPagamentoPredefinito={profile?.metodoPagamentoPredefinito}
            />
          </section>

          {/* Sezione commenti e recensioni reali estratte ed elaborate via SQL */}
          <section>
            <h2 className="text-2xl font-bold text-[#781D2D] mb-6 flex items-center border-b-2 border-[#F5CBA7] pb-2 inline-block">
              Recensioni dei Clienti
            </h2>

            <div className="space-y-4">
              {recensioni.length === 0 ? (
                <p className="text-gray-400 italic text-sm py-4">Nessuna recensione ancora. Sii il primo a scriverne una!</p>
              ) : (
                // Cicla l'array delle recensioni estratte dal database per mostrare ogni singola card
                recensioni.map((rec) => (
                  <div key={rec.idRecensione} className="bg-white border border-[#F5CBA7]/40 rounded-xl p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        {/* Genera un immagine profilocircolare estraendo le prime due lettere dello username dell'autore */}
                        <div className="w-10 h-10 rounded-full bg-[#E74C3C] text-white flex justify-center items-center font-bold">
                          {rec.username.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-[#781D2D]">{rec.username}</p>
                          <p className="text-xs text-gray-400">{new Date(rec.dataCreazione).toLocaleDateString()}</p>
                        </div>
                      </div>
                      {/* Ciclo finto di 5 elementi per stampare le stelline piene o vuote a seconda del punteggio numerico */}
                      <div className="flex items-center space-x-1">
                        {[...Array(5)].map((_, i) => (
                          <svg key={i} className={`w-5 h-5 ${i < rec.punteggio ? 'text-[#D35400]' : 'text-gray-200'}`} fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                    </div>
                    <p className="text-[#781D2D]/80 leading-relaxed">{rec.testo}</p>
                  </div>
                ))
              )}
            </div>
          </section>

        </div>
      </main>

      {/* Footer del sistema di gestione */}
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
// Importa la barra di navigazione superiore dell'applicazione
import Navbar from '@/components/Navbar';
// Importa l'azione lato server che recupera le prenotazioni dell'utente corrente dal database
import { getMyReservations } from '@/app/actions/cliente';
// Importa l'utility di Next.js per leggere i cookie di sessione salvati sul server
import { cookies } from 'next/headers';
// Importa il componente nativo di Next.js per gestire la navigazione tra le pagine in modo ottimizzato senza ricaricare il browser
import Link from 'next/link';
// Importa l'icona del calendario dalla libreria lucide-react per la grafica dello stato vuoto
import { Calendar } from 'lucide-react';
// Importa il Client Component interattivo che si occuperà di mostrare la lista delle prenotazioni e gestire i moduli di recensione
import PrenotazioniClient from './PrenotazioniClient';
// Importa il modulo di Node.js per mappare in modo corretto e sicuro i percorsi dei file sul sistema operativo
import path from 'path';
// Importa il driver sincrono ad alte prestazioni per interagire con il database SQLite locale
import Database from 'better-sqlite3';

// Funzione di utilità interna per inizializzare e configurare la connessione al database SQLite
function getDb() {
  // Calcola il percorso assoluto del database a partire dalla cartella radice del progetto
  const dbPath = path.resolve(process.cwd(), 'database.db');
  // Istanzia e ritorna l'oggetto di connessione attiva al file del database
  return new Database(dbPath);
}

// Funzione asincrona interna che esegue una query SQL per recuperare tutte le recensioni scritte da uno specifico cliente
async function getUserReviews(idCliente: string) {
  // Apre la connessione al database chiamando la funzione di utilità dichiarata sopra
  const db = getDb();
  try {
    // Prepara ed esegue un prepared statement sicuro per estrarre le recensioni filtrando per l'ID dell'account cliente
    return db.prepare('SELECT * FROM Recensione WHERE idCliente = ?').all(idCliente) as any[];
  } finally {
    // Il blocco 'finally' garantisce al 100% che la connessione al database venga chiusa, evitando Memory Leak anche in caso di errori SQL
    db.close();
  }
}

// Componente Server principale asincrono che rappresenta l'intera schermata delle prenotazioni personali
export default async function MiePrenotazioni() {
  // Recupera lo store asincrono dei cookie inviati dal client HTTP
  const cookieStore = await cookies();
  // Estrae il valore testuale contenuto nel cookie di sessione (corrispondente all'ID account registrato a sistema)
  const idCliente = cookieStore.get('seateasy_session')?.value;
  // Converte la presenza del token in un valore booleano (true se loggato, false se anonimo) usando l'operatore di doppia negazione
  const isLoggedIn = !!idCliente;

  // Chiama la Server Action esterna per recuperare tutte le prenotazioni associate all'utente autenticato
  const allPrenotazioni = await getMyReservations();
  // Operatore ternario: se l'ID cliente esiste esegue la query delle recensioni, altrimenti assegna un array vuoto di base
  const userReviews = idCliente ? await getUserReviews(idCliente) : [];

  return (
    <div className="min-h-screen bg-[#FFFDFB] font-sans">
      {/* Inietta la Navbar fornendole lo stato booleano di autenticazione corrente */}
      <Navbar isLoggedIn={isLoggedIn} />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20">
        {/* Intestazione principale della pagina con lo styling grafico del brand */}
        <div className="mb-12">
          <h1 className="text-4xl font-black text-[#781D2D] tracking-tight">
            Le Mie Prenotazioni
          </h1>
          <p className="text-[#D35400] font-medium mt-2">
            Gestisci i tuoi tavoli e le tue experiences culinarie.
          </p>
        </div>

        {/* Rendering condizionale logico: controlla la lunghezza dell'array delle prenotazioni restituito dal DB */}
        {allPrenotazioni.length === 0 ? (
          /* SCHERMATA DI STATO VUOTO (Empty State): Mostrata se l'utente non ha mai effettuato prenotazioni a sistema */
          <div className="bg-white border-2 border-dashed border-[#F5CBA7] rounded-[2rem] p-20 text-center">
            <div className="w-20 h-20 bg-[#FDF1E9] rounded-full flex items-center justify-center mx-auto mb-6">
              <Calendar className="text-[#D35400] w-10 h-10" />
            </div>
            <h3 className="text-xl font-bold text-[#781D2D] mb-2">Ancora nessuna prenotazione</h3>
            <p className="text-gray-500 mb-8">Inizia subito a scoprire i migliori ristoranti della città.</p>
            {/* Pulsante di reindirizzamento rapido che rimanda alla bacheca principale dei ristoranti */}
            <Link
              href="/cliente"
              className="inline-flex items-center px-8 py-3 bg-gradient-to-r from-[#D35400] to-[#E74C3C] text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all"
            >
              Esplora Ristoranti
            </Link>
          </div>
        ) : (
          /* SCHERMATA INTERATTIVA: Se l'array contiene dati, monta il Client Component passando i due array estratti */
          <PrenotazioniClient reservations={allPrenotazioni} userReviews={userReviews} />
        )}
      </main>
    </div>
  );
}
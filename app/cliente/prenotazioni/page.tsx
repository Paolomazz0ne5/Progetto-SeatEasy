
import Navbar from '@/components/Navbar';
import { getMyReservations } from '@/app/actions/cliente';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { Calendar } from 'lucide-react';
import PrenotazioniClient from './PrenotazioniClient';
import path from 'path';
import Database from 'better-sqlite3';


function getDb() {
  // Calcola il percorso assoluto del database a partire dalla cartella radice del progetto
  const dbPath = path.resolve(process.cwd(), 'database.db');
  return new Database(dbPath);
}

// Funzione asincrona interna che esegue una query SQL per recuperare tutte le recensioni scritte da uno specifico cliente
async function getUserReviews(idCliente: string) {
  const db = getDb();
  try {
    return db.prepare('SELECT * FROM Recensione WHERE idCliente = ?').all(idCliente) as any[];
  } finally {
    db.close();
  }
}

// Componente Server principale asincrono che rappresenta l'intera schermata delle prenotazioni personali
export default async function MiePrenotazioni() {

  const cookieStore = await cookies();
  const idCliente = cookieStore.get('seateasy_session')?.value;
  // Converte la presenza del token in un valore booleano (true se loggato, false se anonimo) usando l'operatore di doppia negazione
  const isLoggedIn = !!idCliente;


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
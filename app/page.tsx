import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Database from 'better-sqlite3';
import path from 'path';

/**
 * DESCRIZIONE PRELIMINARE:
 * `RootPage` è la pagina di ingresso (landing page) dell'intera applicazione.
 * In quanto pagina radice, ha il compito di "smistare" l'utente appena entra.
 * La sua logica non è visiva, ma funzionale: controlla se l'utente ha una sessione
 * attiva (tramite cookie) e lo indirizza automaticamente o verso il pannello
 * di gestione (gestore) o verso la vetrina pubblica (cliente), sfruttando una
 * query al database per capire il ruolo dell'account loggato.
 */
export default async function RootPage() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get('seateasy_session')?.value;

  if (!sessionId) {
    redirect('/auth');
  }

  const dbPath = path.resolve(process.cwd(), 'database.db');
  const db = new Database(dbPath);

  try {
    const gestore = db.prepare('SELECT idAccount FROM GestoreRistorante WHERE idAccount = ?').get(sessionId);
    if (gestore) {
      redirect('/gestore/ristoranti');
    } else {
      redirect('/cliente');
    }
  } finally {
    db.close();
  }
}

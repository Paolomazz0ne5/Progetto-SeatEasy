// Importa il componente della barra di navigazione globale
import Navbar from '@/components/Navbar';
// Importa l'utility di Next.js per accedere ai cookie di richiesta lato server
import { cookies } from 'next/headers';
// Importa il driver sincrono nativo per interagire con il database SQLite locale
import Database from 'better-sqlite3';
// Importa il modulo Node.js per mappare i percorsi dei file in modo cross-platform
import path from 'path';
// Importa il Client Component interattivo che conterrà il modulo di input vero e proprio
import ModificaPrenotazioneClient from './ModificaPrenotazioneClient';

// Definizione del Server Component asincrono principale
// Riceve come proprietà (props) l'oggetto 'params', che in Next.js 15/2026 è una Promise contenente i parametri dinamici dell'URL
export default async function ModificaPrenotazionePage({ params }: { params: Promise<{ id: string }> }) {

  // Risolve la Promise dei parametri per estrarre l'ID della prenotazione passato nell'indirizzo URL
  const { id } = await params;

  // Recupera l'interfaccia di lettura dei cookie
  const cookieStore = await cookies();
  // Verifica l'esistenza del cookie di sessione. Restituisce un booleano puro (true/false) senza estrarne il valore testuale
  const isLoggedIn = cookieStore.has('seateasy_session');

  // Calcola il percorso fisico assoluto per raggiungere il file del database SQLite
  const dbPath = path.resolve(process.cwd(), 'database.db');
  // Apre una connessione attiva verso il file di database
  const db = new Database(dbPath);

  // 1. QUERY DI COMPOSIZIONE: Recupera i dettagli completi della specifica prenotazione
  // Sfrutta una catena di JOIN per risalire dalla prenotazione fino all'ID e al Nome del Ristorante passando per i tavoli e le sale
  const pre = db.prepare(`
    SELECT P.*, T.numero as numeroTavolo, T.posti as postiMassimi, R.nome as ristoranteNome, R.idRistorante
    FROM Prenotazione P
    JOIN OccupazioneTavolo OT ON P.idPrenotazione = OT.idPrenotazione
    JOIN Tavolo T ON OT.idTavolo = T.idTavolo
    JOIN Sala S ON T.idSala = S.idSala
    JOIN Ristorante R ON S.idRistorante = R.idRistorante
    WHERE P.idPrenotazione = ?
  `).get(id) as any; // '.get(id)' esegue la query e restituisce un singolo oggetto (o undefined se non trova nulla)

  // Controllo di integrità: se l'ID passato nell'URL non corrisponde a nessuna prenotazione nel database, interrompe il flusso
  if (!pre) {
    db.close(); // Buona pratica: chiude la connessione prima di uscire con il blocco di errore
    return <div>Prenotazione non trovata.</div>;
  }

  // 2. QUERY DI CONTESTO: Recupera l'elenco di tutti i turni orari configurati per quel determinato ristorante
  // Serve per popolare la tendina di selezione (Select) permettendo all'utente di cambiare l'orario della cena/pranzo
  const turni = db.prepare(`
    SELECT T.idTurno, O.nome AS nomeTurno, O.oraInizio, O.oraFine
    FROM Turno T
    JOIN Orario O ON T.idOrario = O.idOrario
    WHERE O.idRistorante = ?
  `).all(pre.idRistorante) as any[]; // '.all()' esegue la query e restituisce un array completo di record

  // Chiude fisicamente la connessione con il database SQLite liberando le risorse del sistema operativo
  db.close();

  return (
    <div className="min-h-screen bg-[#FFFDFB] font-sans">
      {/* Inietta la barra di navigazione fornendo lo stato booleano di autenticazione */}
      <Navbar isLoggedIn={isLoggedIn} />

      {/* Contenitore principale centrato e responsive */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20">
        {/* Monta il Client Component e gli trasferisce i dati estratti dal DB tramite proprietà (Props) */}
        <ModificaPrenotazioneClient
          reservation={pre}
          turni={turni}
        />
      </main>
    </div>
  );
}
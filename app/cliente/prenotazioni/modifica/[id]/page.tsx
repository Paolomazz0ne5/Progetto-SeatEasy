import Navbar from '@/components/Navbar';
import { cookies } from 'next/headers';
import Database from 'better-sqlite3';
import path from 'path';
import ModificaPrenotazioneClient from './ModificaPrenotazioneClient';

export default async function ModificaPrenotazionePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cookieStore = await cookies();
  const isLoggedIn = cookieStore.has('seateasy_session');
  
  const dbPath = path.resolve(process.cwd(), 'database.db');
  const db = new Database(dbPath);
  
  // Get reservation details
  const pre = db.prepare(`
    SELECT P.*, T.numero as numeroTavolo, T.posti as postiMassimi, R.nome as ristoranteNome, R.idRistorante
    FROM Prenotazione P
    JOIN OccupazioneTavolo OT ON P.idPrenotazione = OT.idPrenotazione
    JOIN Tavolo T ON OT.idTavolo = T.idTavolo
    JOIN Sala S ON T.idSala = S.idSala
    JOIN Ristorante R ON S.idRistorante = R.idRistorante
    WHERE P.idPrenotazione = ?
  `).get(id) as any;

  if (!pre) {
    return <div>Prenotazione non trovata.</div>;
  }

  // Get available turns for this restaurant
  const turni = db.prepare(`
    SELECT T.idTurno, T.nomeTurno, O.oraInizio
    FROM Turno T
    JOIN Orario O ON T.idOrario = O.idOrario
    WHERE O.idRistorante = ?
  `).all(pre.idRistorante) as any[];

  db.close();

  return (
    <div className="min-h-screen bg-[#FFFDFB] font-sans">
      <Navbar isLoggedIn={isLoggedIn} />
      
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20">
        <ModificaPrenotazioneClient 
            reservation={pre} 
            turni={turni} 
        />
      </main>
    </div>
  );
}

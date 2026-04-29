'use server';

import Database from 'better-sqlite3';
import path from 'path';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

function getDb() {
  const dbPath = path.resolve(process.cwd(), 'database.db');
  return new Database(dbPath);
}

export async function getRestaurants() {
  const db = getDb();
  try {
    return db.prepare('SELECT * FROM Ristorante').all() as any[];
  } finally {
    db.close();
  }
}

export async function getAvailableTables(idRistorante: number, date: string, idTurno: number) {
  const db = getDb();
  try {
    // Get all tables for the restaurant
    const allTables = db.prepare(`
      SELECT T.* 
      FROM Tavolo T 
      JOIN Sala S ON T.idSala = S.idSala 
      WHERE S.idRistorante = ?
    `).all(idRistorante) as any[];

    // Get occupied tables for that specific date and turno
    const occupiedTables = db.prepare(`
      SELECT OT.idTavolo
      FROM OccupazioneTavolo OT
      JOIN Prenotazione P ON OT.idPrenotazione = P.idPrenotazione
      WHERE P.dataPrenotazione = ? AND P.idTurno = ? AND P.stato != 'Annullata'
    `).all(date, idTurno) as { idTavolo: number }[];

    const occupiedIds = new Set(occupiedTables.map(t => t.idTavolo));

    // Map the status
    return allTables.map(t => ({
      ...t,
      stato: occupiedIds.has(t.idTavolo) ? 'Occupato' : (t.stato === 'Non Disponibile' ? 'Non Disponibile' : 'Libero')
    }));
  } finally {
    db.close();
  }
}

export async function createReservation(data: {
  idRistorante: number,
  idTurno: number,
  dataPrenotazione: string,
  numeroPersone: number,
  idTavolo: number,
  noteCliente?: string
}) {
  const cookieStore = await cookies();
  const idCliente = cookieStore.get('seateasy_session')?.value;

  if (!idCliente) return { success: false, error: 'Devi effettuare il login per prenotare.' };

  const db = getDb();
  try {
    const transaction = db.transaction(() => {
      // 1. Create the reservation
      const res = db.prepare(`
        INSERT INTO Prenotazione (idCliente, idTurno, dataPrenotazione, numeroPersone, stato, noteCliente)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(idCliente, data.idTurno, data.dataPrenotazione, data.numeroPersone, 'Confermata', data.noteCliente || null);

      const idPrenotazione = res.lastInsertRowid;

      // 2. Link the table
      db.prepare(`
        INSERT INTO OccupazioneTavolo (idTavolo, idPrenotazione)
        VALUES (?, ?)
      `).run(data.idTavolo, idPrenotazione);

      return idPrenotazione;
    });

    transaction();
    revalidatePath(`/cliente/ristorante/${data.idRistorante}`);
    return { success: true };
  } catch (error: any) {
    console.error('createReservation error:', error);
    return { success: false, error: 'Errore durante la prenotazione: ' + error.message };
  } finally {
    db.close();
  }
}

export async function getMyReservations() {
  const cookieStore = await cookies();
  const idCliente = cookieStore.get('seateasy_session')?.value;

  if (!idCliente) return [];

  const db = getDb();
  try {
    return db.prepare(`
      SELECT P.*, R.nome as ristoranteNome, R.indirizzo as ristoranteIndirizzo, 
             R.politicaNoShow, R.caparraRichiesta,
             T.numero as numeroTavolo, O.oraInizio
      FROM Prenotazione P
      JOIN Turno TU ON P.idTurno = TU.idTurno
      JOIN Orario O ON TU.idOrario = O.idOrario
      JOIN Ristorante R ON O.idRistorante = R.idRistorante
      JOIN OccupazioneTavolo OT ON P.idPrenotazione = OT.idPrenotazione
      JOIN Tavolo T ON OT.idTavolo = T.idTavolo
      WHERE P.idCliente = ?
      ORDER BY P.dataPrenotazione DESC, O.oraInizio DESC
    `).all(idCliente) as any[];
  } finally {
    db.close();
  }
}

export async function updateReservation(idPrenotazione: number, data: {
  numeroPersone: number,
  noteCliente?: string,
  idTurno?: number,
  dataPrenotazione?: string
}) {
  const db = getDb();
  try {
    db.prepare(`
      UPDATE Prenotazione
      SET numeroPersone = ?, noteCliente = ?, idTurno = COALESCE(?, idTurno), dataPrenotazione = COALESCE(?, dataPrenotazione)
      WHERE idPrenotazione = ?
    `).run(data.numeroPersone, data.noteCliente || null, data.idTurno || null, data.dataPrenotazione || null, idPrenotazione);

    revalidatePath('/cliente/prenotazioni');
    return { success: true };
  } catch (error) {
    return { success: false, error: 'Errore durante la modifica.' };
  } finally {
    db.close();
  }
}

export async function cancelReservation(idPrenotazione: number) {
  const db = getDb();
  try {
    // We update the state to 'Annullata' instead of deleting to keep the history
    db.prepare(`
      UPDATE Prenotazione
      SET stato = 'Annullata'
      WHERE idPrenotazione = ?
    `).run(idPrenotazione);

    revalidatePath('/cliente/prenotazioni');
    return { success: true };
  } catch (error) {
    console.error('cancelReservation error:', error);
    return { success: false, error: 'Impossibile annullare la prenotazione.' };
  } finally {
    db.close();
  }
}

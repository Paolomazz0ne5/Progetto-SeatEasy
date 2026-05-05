'use server';

import Database from 'better-sqlite3';
import path from 'path';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

function getDb() {
  const dbPath = path.resolve(process.cwd(), 'database.db');
  return new Database(dbPath);
}

export async function getRestaurants(pax: number = 1) {
  const db = getDb();
  try {
    const ristoranti = db.prepare('SELECT * FROM Ristorante').all() as any[];
    // Per ogni ristorante, verifichiamo se c'è disponibilità (somma totale posti >= pax)
    for (const r of ristoranti) {
      const capacita = db.prepare(`
        SELECT SUM(t.posti) as totale 
        FROM Tavolo t
        JOIN Sala s ON t.idSala = s.idSala
        WHERE s.idRistorante = ?
      `).get(r.idRistorante) as { totale: number | null };
      
      const totalePosti = capacita.totale || 0;
      r.isDisponibile = totalePosti >= pax;
    }
    return ristoranti;
  } finally {
    db.close();
  }
}

export async function getAvailableTables(idRistorante: number, date: string, idTurno: number, selectedTime?: string) {
  const db = getDb();
  try {
    // 1. Get Turno info (especially durataMedia)
    const turno = db.prepare('SELECT durataMedia FROM Turno WHERE idTurno = ?').get(idTurno) as { durataMedia: number } | undefined;
    const durataMedia = turno?.durataMedia || 90;

    // 2. Get all tables for the restaurant
    const allTables = db.prepare(`
      SELECT T.* 
      FROM Tavolo T 
      JOIN Sala S ON T.idSala = S.idSala 
      WHERE S.idRistorante = ?
    `).all(idRistorante) as any[];

    // 3. Get all reservations for that day and shift
    const reservations = db.prepare(`
      SELECT OT.idTavolo, P.dataPrenotazione
      FROM OccupazioneTavolo OT
      JOIN Prenotazione P ON OT.idPrenotazione = P.idPrenotazione
      WHERE P.idTurno = ? AND P.dataPrenotazione LIKE ? AND P.stato != 'Annullata'
    `).all(idTurno, `${date}%`) as { idTavolo: number, dataPrenotazione: string }[];

    const occupiedIds = new Set<number>();

    if (selectedTime) {
      // Helper to convert "HH:MM" to minutes
      const toMinutes = (timeStr: string) => {
        if (!timeStr || !timeStr.includes(':')) return 0;
        const [h, m] = timeStr.split(':').map(Number);
        return h * 60 + m;
      };

      const reqStart = toMinutes(selectedTime);
      const reqEnd = reqStart + durataMedia;

      for (const res of reservations) {
        // dataPrenotazione can be "YYYY-MM-DD HH:MM" or just "YYYY-MM-DD"
        const resTimeStr = res.dataPrenotazione.includes(' ') ? res.dataPrenotazione.split(' ')[1] : null;
        
        if (!resTimeStr) {
          // Legacy reservation or whole-shift booking: occupies the table
          occupiedIds.add(res.idTavolo);
          continue;
        }

        const resStart = toMinutes(resTimeStr);
        const resEnd = resStart + durataMedia;

        // Turnover logic: ReqStart < ResEnd AND ReqEnd > ResStart
        if (reqStart < resEnd && reqEnd > resStart) {
          occupiedIds.add(res.idTavolo);
        }
      }
    } else {
      // If no specific time is selected, we consider the whole day/shift
      // (Original logic for safety when time is not yet chosen)
      for (const res of reservations) {
        occupiedIds.add(res.idTavolo);
      }
    }

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
  idTavoli: number[],
  noteCliente?: string,
  caparraPagata?: boolean
}) {
  const cookieStore = await cookies();
  const idCliente = cookieStore.get('seateasy_session')?.value;

  if (!idCliente) return { success: false, error: 'Devi effettuare il login per prenotare.' };

  const db = getDb();
  try {
    const transaction = db.transaction(() => {
      // 1. Create the reservation
      const res = db.prepare(`
        INSERT INTO Prenotazione (idCliente, idTurno, dataPrenotazione, numeroPersone, stato, noteCliente, caparraPagata)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(idCliente, data.idTurno, data.dataPrenotazione, data.numeroPersone, 'Confermata', data.noteCliente || null, data.caparraPagata ? 1 : 0);

      const idPrenotazione = res.lastInsertRowid;

      // 2. Link the tables
      const insertTavolo = db.prepare(`
        INSERT INTO OccupazioneTavolo (idTavolo, idPrenotazione)
        VALUES (?, ?)
      `);
      for (const idTavolo of data.idTavoli) {
        insertTavolo.run(idTavolo, idPrenotazione);
      }

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
      SELECT P.*, R.idRistorante, R.nome as ristoranteNome, R.indirizzo as ristoranteIndirizzo, 
             R.politicaNoShow, R.caparraRichiesta,
             GROUP_CONCAT(T.numero ORDER BY T.numero ASC) as numeroTavolo,
             O.oraInizio
      FROM Prenotazione P
      JOIN Turno TU ON P.idTurno = TU.idTurno
      JOIN Orario O ON TU.idOrario = O.idOrario
      JOIN Ristorante R ON O.idRistorante = R.idRistorante
      JOIN OccupazioneTavolo OT ON P.idPrenotazione = OT.idPrenotazione
      JOIN Tavolo T ON OT.idTavolo = T.idTavolo
      WHERE P.idCliente = ?
      GROUP BY P.idPrenotazione
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

export async function getClientProfile() {
  const cookieStore = await cookies();
  const idCliente = cookieStore.get('seateasy_session')?.value;

  if (!idCliente) return null;

  const db = getDb();
  try {
    return db.prepare(`
      SELECT A.*, C.richiesteSpeciali
      FROM Account A
      JOIN Cliente C ON A.idAccount = C.idAccount
      WHERE A.idAccount = ?
    `).get(idCliente) as any;
  } finally {
    db.close();
  }
}

export async function updateClientProfile(data: {
  nome: string,
  cognome: string,
  email: string,
  telefono: string,
  richiesteSpeciali?: string
}) {
  const cookieStore = await cookies();
  const idCliente = cookieStore.get('seateasy_session')?.value;

  if (!idCliente) return { success: false, error: 'Sessione non valida.' };

  const db = getDb();
  try {
    const transaction = db.transaction(() => {
      db.prepare(`
        UPDATE Account
        SET nome = ?, cognome = ?, email = ?, telefono = ?
        WHERE idAccount = ?
      `).run(data.nome, data.cognome, data.email, data.telefono, idCliente);

      db.prepare(`
        UPDATE Cliente
        SET richiesteSpeciali = ?
        WHERE idAccount = ?
      `).run(data.richiesteSpeciali || null, idCliente);
    });

    transaction();
    revalidatePath('/cliente/profilo');
    return { success: true };
  } catch (error: any) {
    console.error('updateClientProfile error:', error);
    if (error.message.includes('UNIQUE constraint failed: Account.email')) {
      return { success: false, error: 'Questa email è già in uso.' };
    }
    return { success: false, error: 'Errore durante l\'aggiornamento del profilo.' };
  } finally {
    db.close();
  }
}

export async function deleteClientAccount() {
  const cookieStore = await cookies();
  const idCliente = cookieStore.get('seateasy_session')?.value;

  if (!idCliente) return { success: false, error: 'Sessione non valida.' };

  const db = getDb();
  try {
    const transaction = db.transaction(() => {
      // 1. Get reservation IDs
      const reservations = db.prepare('SELECT idPrenotazione FROM Prenotazione WHERE idCliente = ?').all(idCliente) as { idPrenotazione: number }[];

      for (const res of reservations) {
        db.prepare('DELETE FROM OccupazioneTavolo WHERE idPrenotazione = ?').run(res.idPrenotazione);
        db.prepare('DELETE FROM Pagamento WHERE idPrenotazione = ?').run(res.idPrenotazione);
        db.prepare('DELETE FROM Notifica WHERE idPrenotazione = ?').run(res.idPrenotazione);
        db.prepare('DELETE FROM Prenotazione WHERE idPrenotazione = ?').run(res.idPrenotazione);
      }

      // 2. Delete Cliente and Account
      db.prepare('DELETE FROM Account WHERE idAccount = ?').run(idCliente);
    });

    transaction();

    // Logout
    cookieStore.delete('seateasy_session');

    return { success: true };
  } catch (error: any) {
    console.error('deleteClientAccount error:', error);
    return { success: false, error: 'Errore durante l\'eliminazione dell\'account.' };
  } finally {
    db.close();
  }
}

// ─── Reviews Actions ─────────────────────────────────────────────────────────

export async function getRestaurantReviews(idRistorante: number) {
  const db = getDb();
  try {
    return db.prepare(`
      SELECT R.*, A.nome as clientName
      FROM Recensione R
      JOIN Account A ON R.idCliente = A.idAccount
      WHERE R.idRistorante = ?
      ORDER BY R.dataCreazione DESC
    `).all(idRistorante) as any[];
  } finally {
    db.close();
  }
}

export async function getUserReview(idRistorante: number) {
  const cookieStore = await cookies();
  const idCliente = cookieStore.get('seateasy_session')?.value;
  if (!idCliente) return null;

  const db = getDb();
  try {
    return db.prepare('SELECT * FROM Recensione WHERE idCliente = ? AND idRistorante = ?')
             .get(idCliente, idRistorante) as any || null;
  } finally {
    db.close();
  }
}

export async function addReview(idRistorante: number, punteggio: number, commento: string) {
  const cookieStore = await cookies();
  const idCliente = cookieStore.get('seateasy_session')?.value;
  if (!idCliente) return { success: false, error: 'Devi effettuare il login.' };

  const db = getDb();
  try {
    db.prepare(`
      INSERT INTO Recensione (idCliente, idRistorante, punteggio, testo)
      VALUES (?, ?, ?, ?)
    `).run(idCliente, idRistorante, punteggio, commento);
    
    revalidatePath(`/cliente/ristorante/${idRistorante}`);
    revalidatePath('/cliente/prenotazioni');
    return { success: true };
  } catch (error: any) {
    if (error.message.includes('UNIQUE')) {
      return { success: false, error: 'Hai già recensito questo ristorante.' };
    }
    return { success: false, error: error.message };
  } finally {
    db.close();
  }
}

export async function updateReview(idRecensione: number, idRistorante: number, punteggio: number, commento: string) {
  const cookieStore = await cookies();
  const idCliente = cookieStore.get('seateasy_session')?.value;
  if (!idCliente) return { success: false, error: 'Devi effettuare il login.' };

  const db = getDb();
  try {
    const result = db.prepare(`
      UPDATE Recensione 
      SET punteggio = ?, testo = ?, dataCreazione = CURRENT_TIMESTAMP
      WHERE idRecensione = ? AND idCliente = ?
    `).run(punteggio, commento, idRecensione, idCliente);

    if (result.changes === 0) return { success: false, error: 'Recensione non trovata o non autorizzato.' };
    
    revalidatePath(`/cliente/ristorante/${idRistorante}`);
    revalidatePath('/cliente/prenotazioni');
    return { success: true };
  } finally {
    db.close();
  }
}

export async function deleteReview(idRecensione: number, idRistorante: number) {
  const cookieStore = await cookies();
  const idCliente = cookieStore.get('seateasy_session')?.value;
  if (!idCliente) return { success: false, error: 'Devi effettuare il login.' };

  const db = getDb();
  try {
    const result = db.prepare('DELETE FROM Recensione WHERE idRecensione = ? AND idCliente = ?')
                     .run(idRecensione, idCliente);

    if (result.changes === 0) return { success: false, error: 'Recensione non trovata.' };
    
    revalidatePath(`/cliente/ristorante/${idRistorante}`);
    revalidatePath('/cliente/prenotazioni');
    return { success: true };
  } finally {
    db.close();
  }
}

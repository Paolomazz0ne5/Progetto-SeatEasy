/**
 * BACKEND ACTIONS: Gestore Prenotazioni
 * Questo file contiene le logiche di manipolazione dati eseguite sul server.
 * Le Server Actions garantiscono che le query SQL non siano mai esposte al client.
 */
'use server';

import Database from 'better-sqlite3';
import path from 'path';
import { revalidatePath } from 'next/cache';

// Helper per isolare la logica di connessione al DB SQLite.
function getDb() {
  const dbPath = path.resolve(process.cwd(), 'database.db');
  return new Database(dbPath);
}

/**
 * Elimina una prenotazione dal database tramite ID.
 */
export async function deleteReservation(idPrenotazione: number) {
  const db = getDb();
  try {
    db.prepare('DELETE FROM Prenotazione WHERE idPrenotazione = ?').run(idPrenotazione);
    // Forza il ricaricamento dei dati della dashboard per riflettere la cancellazione.
    revalidatePath('/gestore/dashboard');
    return { success: true };
  } catch (error: any) {
    console.error('Failed to delete reservation:', error.message);
    return { success: false, error: 'Errore durante l\'eliminazione della prenotazione' };
  } finally {
    db.close();
  }
}

/**
 * Aggiorna dinamicamente solo i campi passati nell'oggetto 'data'.
 * Utilizziamo un array 'updates' per costruire la query SQL in modo dinamico.
 */
export async function updateReservation(
  idPrenotazione: number,
  data: { numeroPersone?: number, stato?: string, dataPrenotazione?: string }
) {
  const db = getDb();
  try {
    const updates = [];
    const params = [];

    // Costruzione dinamica della query: aggiungiamo solo i campi presenti
    if (data.numeroPersone !== undefined) {
      updates.push('numeroPersone = ?');
      params.push(data.numeroPersone);
    }
    if (data.stato !== undefined) {
      updates.push('stato = ?');
      params.push(data.stato);
    }
    if (data.dataPrenotazione !== undefined) {
      updates.push('dataPrenotazione = ?');
      params.push(data.dataPrenotazione);
    }

    // Se non ci sono campi da aggiornare, evitiamo la query inutile
    if (updates.length === 0) return { success: true };

    params.push(idPrenotazione);
    db.prepare(`UPDATE Prenotazione SET ${updates.join(', ')} WHERE idPrenotazione = ?`).run(...params);

    revalidatePath('/gestore/dashboard');
    return { success: true };
  } catch (error: any) {
    console.error('Failed to update reservation:', error.message);
    return { success: false, error: 'Errore durante la modifica della prenotazione' };
  } finally {
    db.close();
  }
}

/**
 * Gestisce la segnalazione di un No-Show.
 * Usa una transazione per garantire che l'aggiornamento dello stato e 
 * l'eventuale registrazione del pagamento siano operazioni atomiche.
 */
export async function markNoShow(idPrenotazione: number, applyPenalty: boolean) {
  const db = getDb();
  try {
    // Recupero info per la simulazione dell'invio email
    const resInfo = db.prepare(`
      SELECT R.penaleNoShow, R.messaggioPenale, R.nome as ristoranteNome, A.email as clienteEmail
      FROM Prenotazione P
      JOIN Turno T ON P.idTurno = T.idTurno
      JOIN Orario O ON T.idOrario = O.idOrario
      JOIN Ristorante R ON O.idRistorante = R.idRistorante
      JOIN Account A ON P.idCliente = A.idAccount
      WHERE P.idPrenotazione = ?
    `).get(idPrenotazione) as any;

    // Transazione: se uno dei due UPDATE fallisce, annulla tutto (Rollback)
    const transaction = db.transaction(() => {
      db.prepare("UPDATE Prenotazione SET stato = 'noShow' WHERE idPrenotazione = ?").run(idPrenotazione);

      if (applyPenalty) {
        db.prepare("UPDATE Prenotazione SET noteCliente = noteCliente || ' [PENALE APPLICATA]' WHERE idPrenotazione = ?").run(idPrenotazione);

        // Registra il pagamento forzato dalla caparra esistente
        db.prepare(`
          INSERT INTO Pagamento (idPrenotazione, importo, dataPagamento, metodoPagamento)
          VALUES (?, (SELECT caparraPagata FROM Prenotazione WHERE idPrenotazione = ?), date('now'), 'Sistema')
        `).run(idPrenotazione, idPrenotazione);
      }
    });

    transaction();

    // Simulazione invio email (placeholder per logica esterna)
    if (resInfo) {
      console.log(`[SIMULATION] Email sent to ${resInfo.clienteEmail}...`);
    }

    revalidatePath('/gestore/dashboard');
    return { success: true };
  } catch (error: any) {
    console.error('Failed to mark NoShow:', error.message);
    return { success: false, error: 'Errore durante la segnalazione del No-Show' };
  } finally {
    db.close();
  }
}

/**
 * Recupera i tavoli liberi per una specifica data e ora, utile per l'inserimento manuale.
 * Calcola l'idTurno corretto e verifica l'OccupazioneTavolo.
 */
export async function getAvailableTablesForManual(idRistorante: number, date: string, time: string, pax: number, excludeIdPrenotazione?: number) {
  const db = getDb();
  try {
    // Convertiamo "HH:MM" in minuti per trovare il turno corretto
    const [h, m] = time.split(':').map(Number);
    const reqMinutes = h * 60 + m;

    // 1. Troviamo il turno di questo ristorante che comprende quest'ora
    const orari = db.prepare('SELECT idOrario, oraInizio, oraFine FROM Orario WHERE idRistorante = ?').all(idRistorante) as any[];
    
    let idOrario = null;
    for (const o of orari) {
      const [hI, mI] = o.oraInizio.split(':').map(Number);
      const [hF, mF] = o.oraFine.split(':').map(Number);
      const startMin = hI * 60 + mI;
      const endMin = hF * 60 + mF;
      // Se l'orario di fine è oltre la mezzanotte, aggiungiamo 24h
      const adjustedEnd = endMin < startMin ? endMin + 24 * 60 : endMin;
      const adjustedReq = (reqMinutes < startMin && endMin < startMin) ? reqMinutes + 24 * 60 : reqMinutes;

      if (adjustedReq >= startMin && adjustedReq <= adjustedEnd) {
        idOrario = o.idOrario;
        break;
      }
    }
    
    // Fallback: se non trova l'orario esatto, prende il primo orario del ristorante
    if (!idOrario && orari.length > 0) {
      idOrario = orari[0].idOrario;
    }
    
    if (!idOrario) return { success: false, error: 'Nessun orario configurato per questo ristorante.' };

    const turno = db.prepare('SELECT idTurno, durataMedia FROM Turno WHERE idOrario = ?').get(idOrario) as { idTurno: number, durataMedia: number } | undefined;
    if (!turno) return { success: false, error: 'Nessun turno configurato per questo orario.' };

    const idTurno = turno.idTurno;
    const durataMedia = turno.durataMedia || 90;

    // 2. Preleviamo tutti i tavoli (che hanno almeno i posti richiesti, e non più di pax + 2 per evitare sprechi) e le loro sale
    const allTables = db.prepare(`
      SELECT T.idTavolo, T.numero, T.posti, S.nome as nomeSala
      FROM Tavolo T
      JOIN Sala S ON T.idSala = S.idSala
      WHERE S.idRistorante = ? 
        AND T.posti >= ? 
        AND T.posti <= ?
        AND T.stato != 'Non Disponibile'
      ORDER BY T.posti ASC
    `).all(idRistorante, pax, pax + 2) as any[];

    // 3. Preleviamo le prenotazioni per quel giorno, escludendo (se fornito) l'id della prenotazione corrente
    let queryStr = `
      SELECT OT.idTavolo, P.dataPrenotazione
      FROM OccupazioneTavolo OT
      JOIN Prenotazione P ON OT.idPrenotazione = P.idPrenotazione
      WHERE P.idTurno = ? AND P.dataPrenotazione LIKE ? AND P.stato != 'Annullata'
    `;
    let queryParams: any[] = [idTurno, `${date}%`];

    if (excludeIdPrenotazione) {
      queryStr += ` AND P.idPrenotazione != ?`;
      queryParams.push(excludeIdPrenotazione);
    }

    const reservations = db.prepare(queryStr).all(...queryParams) as { idTavolo: number, dataPrenotazione: string }[];

    const occupiedIds = new Set<number>();
    const reqStart = reqMinutes;
    const reqEnd = reqStart + durataMedia;

    for (const res of reservations) {
      const resTimeStr = res.dataPrenotazione.includes(' ') ? res.dataPrenotazione.split(' ')[1] : null;
      if (!resTimeStr) {
        occupiedIds.add(res.idTavolo);
        continue;
      }
      const [hR, mR] = resTimeStr.split(':').map(Number);
      let resStart = hR * 60 + mR;
      // Adattamento notturno
      if (resStart < 12 * 60 && reqStart > 18 * 60) resStart += 24 * 60; 
      
      const resEnd = resStart + durataMedia;
      if (reqStart < resEnd && reqEnd > resStart) {
        occupiedIds.add(res.idTavolo);
      }
    }

    const freeTables = allTables.filter(t => !occupiedIds.has(t.idTavolo));

    return { success: true, idTurno, freeTables };
  } catch (error: any) {
    console.error('getAvailableTablesForManual error:', error);
    return { success: false, error: 'Errore durante la ricerca dei tavoli.' };
  } finally {
    db.close();
  }
}

/**
 * Inserisce una nuova prenotazione manuale.
 * Genera un account "dummy" per il cliente se non esiste, in modo da poter associare la prenotazione a un nome e un telefono.
 */
export async function createManualReservation(data: {
  idRistorante: number,
  idTurno: number,
  dataPrenotazione: string, // YYYY-MM-DD HH:MM
  numeroPersone: number,
  idTavolo: number,
  nomeCliente: string,
  telefono?: string,
}) {
  const db = getDb();
  try {
    const transaction = db.transaction(() => {
      // 1. Creiamo un account "fittizio" univoco per questo cliente manuale.
      // Generiamo una email random per superare il vincolo UNIQUE NOT NULL.
      const fakeEmail = `manual_${Date.now()}_${Math.floor(Math.random() * 1000)}@seateasy.local`;
      
      // [Nuova Logica]: Cifriamo anche la password dummy generata automaticamente
      const bcrypt = require('bcryptjs');
      const hashedManualPassword = bcrypt.hashSync('manual_password', 10);
      
      const insertAccount = db.prepare('INSERT INTO Account (email, password, nome, cognome, telefono) VALUES (?, ?, ?, ?, ?)');
      const resAccount = insertAccount.run(fakeEmail, hashedManualPassword, data.nomeCliente, '(Manuale)', data.telefono || null);
      const idCliente = resAccount.lastInsertRowid;

      const insertCliente = db.prepare('INSERT INTO Cliente (idAccount) VALUES (?)');
      insertCliente.run(idCliente);

      // 2. Inseriamo la prenotazione
      const insertPrenotazione = db.prepare(`
        INSERT INTO Prenotazione (idCliente, idTurno, dataPrenotazione, numeroPersone, stato, noteCliente, caparraPagata)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      const note = 'Prenotazione inserita manualmente dal gestore.';
      const resPrenotazione = insertPrenotazione.run(
        idCliente, 
        data.idTurno, 
        data.dataPrenotazione, 
        data.numeroPersone, 
        'Confermata', 
        note, 
        0
      );
      const idPrenotazione = resPrenotazione.lastInsertRowid;

      // 3. Associamo il tavolo scelto (OccupazioneTavolo)
      const insertTavolo = db.prepare(`
        INSERT INTO OccupazioneTavolo (idTavolo, idPrenotazione)
        VALUES (?, ?)
      `);
      insertTavolo.run(data.idTavolo, idPrenotazione);

      return idPrenotazione;
    });

    transaction();
    revalidatePath('/gestore/dashboard');
    return { success: true };
  } catch (error: any) {
    console.error('createManualReservation error:', error);
    return { success: false, error: 'Errore durante la creazione della prenotazione manuale: ' + error.message };
  } finally {
    db.close();
  }
}
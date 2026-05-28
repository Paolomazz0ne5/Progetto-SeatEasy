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
'use server';

import Database from 'better-sqlite3';
import path from 'path';
import { revalidatePath } from 'next/cache';

function getDb() {
  const dbPath = path.resolve(process.cwd(), 'database.db');
  return new Database(dbPath);
}

export async function deleteReservation(idPrenotazione: number) {
  const db = getDb();
  try {
    db.prepare('DELETE FROM Prenotazione WHERE idPrenotazione = ?').run(idPrenotazione);
    revalidatePath('/gestore/dashboard');
    return { success: true };
  } catch (error: any) {
    console.error('Failed to delete reservation:', error.message);
    return { success: false, error: 'Errore durante l\'eliminazione della prenotazione' };
  } finally {
    db.close();
  }
}

export async function updateReservation(
  idPrenotazione: number, 
  data: { numeroPersone?: number, stato?: string, dataPrenotazione?: string }
) {
  const db = getDb();
  try {
    const updates = [];
    const params = [];
    
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

export async function markNoShow(idPrenotazione: number, applyPenalty: boolean) {
  const db = getDb();
  try {
    // transaction for marking as noShow and adding a penalty note if needed
    const transaction = db.transaction(() => {
      db.prepare("UPDATE Prenotazione SET stato = 'noShow' WHERE idPrenotazione = ?").run(idPrenotazione);
      
      if (applyPenalty) {
        db.prepare("UPDATE Prenotazione SET noteCliente = noteCliente || ' [PENALE APPLICATA]' WHERE idPrenotazione = ?").run(idPrenotazione);
        
        // We could also record it in Pagamento table, but updating notes is sufficient for visual
        db.prepare(`
          INSERT INTO Pagamento (idPrenotazione, importo, dataPagamento, ricevuta, metodoPagamento)
          VALUES (?, (SELECT caparraPagata FROM Prenotazione WHERE idPrenotazione = ?), date('now'), 'Trattenuta Penale NoShow', 'Sistema')
        `).run(idPrenotazione, idPrenotazione);
      }
    });

    transaction();
    revalidatePath('/gestore/dashboard');
    return { success: true };
  } catch (error: any) {
    console.error('Failed to mark NoShow:', error.message);
    return { success: false, error: 'Errore durante la segnalazione del No-Show' };
  } finally {
    db.close();
  }
}

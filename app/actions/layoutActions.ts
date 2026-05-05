'use server';

import Database from 'better-sqlite3';
import path from 'path';
import { revalidatePath } from 'next/cache';

function getDb() {
  const dbPath = path.resolve(process.cwd(), 'database.db');
  return new Database(dbPath);
}

// SALE
export async function createSala(nome: string, idRistorante: number) {
  const db = getDb();
  try {
    db.prepare('INSERT INTO Sala (idRistorante, nome, capacita, attiva) VALUES (?, ?, ?, ?)').run(idRistorante, nome, 0, 1);
    revalidatePath('/gestore/layout');
    return { success: true };
  } catch (error: any) {
    console.error('Failed to create sala:', error.message);
    return { success: false, error: 'Errore durante la creazione della sala.' };
  } finally {
    db.close();
  }
}

export async function deleteSala(idSala: number) {
  const db = getDb();
  try {
    // Delete Sala cascades down to Tavolo if configured, but let's be explicit
    const transaction = db.transaction(() => {
      db.prepare('DELETE FROM Tavolo WHERE idSala = ?').run(idSala);
      db.prepare('DELETE FROM Sala WHERE idSala = ?').run(idSala);
    });
    transaction();
    revalidatePath('/gestore/layout');
    return { success: true };
  } catch (error: any) {
    console.error('Failed to delete sala:', error.message);
    return { success: false, error: 'Errore durante l\'eliminazione della sala.' };
  } finally {
    db.close();
  }
}

// TAVOLI
export async function createTavolo(idSala: number, numero: number, posti: number, postiMinimi: number) {
  const db = getDb();
  try {
    db.prepare('INSERT INTO Tavolo (idSala, numero, posti, postiMinimi, stato) VALUES (?, ?, ?, ?, ?)').run(idSala, numero, posti, postiMinimi, 'Libero');
    revalidatePath('/gestore/layout');
    return { success: true };
  } catch (error: any) {
    console.error('Failed to create tavolo:', error.message);
    return { success: false, error: 'Errore durante la creazione del tavolo.' };
  } finally {
    db.close();
  }
}

export async function updateTavolo(idTavolo: number, numero: number, posti: number, postiMinimi: number) {
  const db = getDb();
  try {
    db.prepare('UPDATE Tavolo SET numero = ?, posti = ?, postiMinimi = ? WHERE idTavolo = ?').run(numero, posti, postiMinimi, idTavolo);
    revalidatePath('/gestore/layout');
    return { success: true };
  } catch (error: any) {
    console.error('Failed to update tavolo:', error.message);
    return { success: false, error: 'Errore durante la modifica del tavolo.' };
  } finally {
    db.close();
  }
}

export async function deleteTavolo(idTavolo: number) {
  const db = getDb();
  try {
    db.prepare('DELETE FROM Tavolo WHERE idTavolo = ?').run(idTavolo);
    revalidatePath('/gestore/layout');
    return { success: true };
  } catch (error: any) {
    console.error('Failed to delete tavolo:', error.message);
    return { success: false, error: 'Errore durante l\'eliminazione del tavolo.' };
  } finally {
    db.close();
  }
}

export async function linkTavoli(tavoloIds: number[]) {
  if (tavoloIds.length < 2) return { success: false, error: 'Seleziona almeno 2 tavoli.' };
  
  const db = getDb();
  try {
    const idGruppo = `GRUPPO-${Date.now()}`;
    const placeholders = tavoloIds.map(() => '?').join(',');
    
    db.prepare(`UPDATE Tavolo SET idGruppo = ? WHERE idTavolo IN (${placeholders})`)
      .run(idGruppo, ...tavoloIds);
      
    revalidatePath('/gestore/layout');
    return { success: true };
  } catch (error: any) {
    console.error('Failed to link tavoli:', error.message);
    return { success: false, error: 'Errore durante il collegamento dei tavoli.' };
  } finally {
    db.close();
  }
}

export async function unlinkTavolo(idTavolo: number) {
  const db = getDb();
  try {
    db.prepare('UPDATE Tavolo SET idGruppo = NULL WHERE idTavolo = ?').run(idTavolo);
    
    // Check if any groups have only 1 table left and remove the group if so
    db.prepare(`
      UPDATE Tavolo 
      SET idGruppo = NULL 
      WHERE idGruppo IN (
        SELECT idGruppo 
        FROM Tavolo 
        WHERE idGruppo IS NOT NULL 
        GROUP BY idGruppo 
        HAVING COUNT(*) < 2
      )
    `).run();

    revalidatePath('/gestore/layout');
    return { success: true };
  } catch (error: any) {
    console.error('Failed to unlink tavolo:', error.message);
    return { success: false, error: 'Errore durante lo scollegamento del tavolo.' };
  } finally {
    db.close();
  }
}

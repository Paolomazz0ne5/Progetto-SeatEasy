'use server';

import Database from 'better-sqlite3';
import path from 'path';
import { revalidatePath } from 'next/cache';

function getDb() {
  const dbPath = path.resolve(process.cwd(), 'database.db');
  return new Database(dbPath);
}

// SALE
export async function createSala(nome: string) {
  const db = getDb();
  try {
    // Hardcoding idRistorante = 1 for the scope of this demo
    db.prepare('INSERT INTO Sala (idRistorante, nome, capacita, attiva) VALUES (?, ?, ?, ?)').run(1, nome, 0, 1);
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
export async function createTavolo(idSala: number, numero: number, posti: number) {
  const db = getDb();
  try {
    db.prepare('INSERT INTO Tavolo (idSala, numero, posti, stato) VALUES (?, ?, ?, ?)').run(idSala, numero, posti, 'Libero');
    revalidatePath('/gestore/layout');
    return { success: true };
  } catch (error: any) {
    console.error('Failed to create tavolo:', error.message);
    return { success: false, error: 'Errore durante la creazione del tavolo.' };
  } finally {
    db.close();
  }
}

export async function updateTavolo(idTavolo: number, numero: number, posti: number) {
  const db = getDb();
  try {
    db.prepare('UPDATE Tavolo SET numero = ?, posti = ? WHERE idTavolo = ?').run(numero, posti, idTavolo);
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

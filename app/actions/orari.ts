// Direttiva fondamentale: questo file contiene solo logica di backend.
'use server';

import Database from 'better-sqlite3';
import path from 'path';
import { revalidatePath } from 'next/cache';

// Helper: connessione al database SQLite.
function getDb() {
  const dbPath = path.resolve(process.cwd(), 'database.db');
  return new Database(dbPath);
}

// [MIGRAZIONI]: Queste funzioni controllano che le tabelle Orario e Turno
// abbiano le colonne giuste per le nuove feature (es: 'durataMedia').
export async function ensureNomeOrarioColumn() {
  const db = getDb();
  try {
    const tableInfo = db.prepare("PRAGMA table_info(Orario)").all() as any[];
    const hasNome = tableInfo.some(col => col.name === 'nome');

    // Se manca la colonna 'nome', la aggiungo al volo.
    if (!hasNome) {
      db.prepare("ALTER TABLE Orario ADD COLUMN nome TEXT DEFAULT 'Fascia Oraria'").run();
    }

    await ensureTurnoColumns();
  } catch (error) {
    console.error("Migration check failed:", error);
  } finally {
    db.close();
  }
}

export async function ensureTurnoColumns() {
  const db = getDb();
  try {
    const tableInfo = db.prepare("PRAGMA table_info(Turno)").all() as any[];
    const columns = tableInfo.map(col => col.name);

    // Assicuro che ogni turno sappia quanto dura (default 90 minuti).
    if (!columns.includes('durataMedia')) {
      db.prepare("ALTER TABLE Turno ADD COLUMN durataMedia INTEGER DEFAULT 90").run();
    }
  } catch (error) {
    console.error("Migration check for Turno failed:", error);
  } finally {
    db.close();
  }
}

// [CREAZIONE FASCE ORARIE]:
// Nota bene: quando creo un orario, creo automaticamente anche un turno di default.
export async function createOrario(idRistorante: number, nome: string, oraInizio: string, oraFine: string, durataMedia: number) {
  const db = getDb();
  try {
    // Inserisco l'orario e prendo l'ID appena creato (lastInsertRowid)
    const info = db.prepare(`
      INSERT INTO Orario (idRistorante, nome, oraInizio, oraFine)
      VALUES (?, ?, ?, ?)
    `).run(idRistorante, nome, oraInizio, oraFine);

    // Creo il turno collegato (One-to-One logico)
    db.prepare(`
      INSERT INTO Turno (idOrario, durataMedia)
      VALUES (?, ?)
    `).run(info.lastInsertRowid, durataMedia);

    revalidatePath('/gestore/orari');
    return { success: true };
  } catch (error: any) {
    console.error('Create Orario failed:', error.message);
    return { success: false, error: 'Errore durante la creazione della fascia oraria.' };
  } finally {
    db.close();
  }
}

// [AGGIORNAMENTO]: Sincronizza il nome dell'orario e la durata del turno associato.
export async function updateOrario(idOrario: number, nome: string, oraInizio: string, oraFine: string, durataMedia: number) {
  const db = getDb();
  try {
    db.prepare(`
      UPDATE Orario 
      SET nome = ?, oraInizio = ?, oraFine = ?
      WHERE idOrario = ?
    `).run(nome, oraInizio, oraFine, idOrario);

    // Aggiorno anche il turno collegato alla stessa durata
    db.prepare(`
      UPDATE Turno 
      SET durataMedia = ?
      WHERE idOrario = ?
    `).run(durataMedia, idOrario);

    revalidatePath('/gestore/orari');
    return { success: true };
  } catch (error: any) {
    console.error('Update Orario failed:', error.message);
    return { success: false, error: 'Errore durante l\'aggiornamento.' };
  } finally {
    db.close();
  }
}

// [ELIMINAZIONE]: Usa db.transaction per cancellare turno e orario insieme.
export async function deleteOrario(idOrario: number) {
  const db = getDb();
  try {
    const transaction = db.transaction(() => {
      // Devo cancellare prima il turno (chiave esterna) e poi l'orario
      db.prepare('DELETE FROM Turno WHERE idOrario = ?').run(idOrario);
      db.prepare('DELETE FROM Orario WHERE idOrario = ?').run(idOrario);
    });
    transaction();

    revalidatePath('/gestore/orari');
    return { success: true };
  } catch (error: any) {
    console.error('Delete Orario failed:', error.message);
    return { success: false, error: 'Errore durante l\'eliminazione.' };
  } finally {
    db.close();
  }
}

// [GESTIONE TURNI]: Funzioni semplici per creare/modificare/eliminare i turni.
export async function createTurno(idOrario: number, durataMedia: number) {
  const db = getDb();
  try {
    db.prepare(`
      INSERT INTO Turno (idOrario, durataMedia)
      VALUES (?, ?)
    `).run(idOrario, durataMedia);

    revalidatePath('/gestore/orari');
    return { success: true };
  } catch (error: any) {
    console.error('Create Turno failed:', error.message);
    return { success: false, error: 'Errore durante la creazione del turno.' };
  } finally {
    db.close();
  }
}

export async function updateTurno(idTurno: number, durataMedia: number) {
  const db = getDb();
  try {
    db.prepare(`
      UPDATE Turno 
      SET durataMedia = ?
      WHERE idTurno = ?
    `).run(durataMedia, idTurno);

    revalidatePath('/gestore/orari');
    return { success: true };
  } catch (error: any) {
    console.error('Update Turno failed:', error.message);
    return { success: false, error: 'Errore durante l\'aggiornamento del turno.' };
  } finally {
    db.close();
  }
}

export async function deleteTurno(idTurno: number) {
  const db = getDb();
  try {
    db.prepare('DELETE FROM Turno WHERE idTurno = ?').run(idTurno);

    revalidatePath('/gestore/orari');
    return { success: true };
  } catch (error: any) {
    console.error('Delete Turno failed:', error.message);
    return { success: false, error: 'Errore durante l\'eliminazione del turno.' };
  } finally {
    db.close();
  }
}
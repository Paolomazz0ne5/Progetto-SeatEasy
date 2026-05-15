'use server';

import Database from 'better-sqlite3';
import path from 'path';
import { revalidatePath } from 'next/cache';

function getDb() {
  const dbPath = path.resolve(process.cwd(), 'database.db');
  return new Database(dbPath);
}

// Ensure the schema is patched
export async function ensureNomeOrarioColumn() {
  const db = getDb();
  try {
    const tableInfo = db.prepare("PRAGMA table_info(Orario)").all() as any[];
    const hasNome = tableInfo.some(col => col.name === 'nome');
    
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
    
    if (!columns.includes('durataMedia')) {
      db.prepare("ALTER TABLE Turno ADD COLUMN durataMedia INTEGER DEFAULT 90").run();
    }
  } catch (error) {
    console.error("Migration check for Turno failed:", error);
  } finally {
    db.close();
  }
}

// ORARI (FASCE)
export async function createOrario(idRistorante: number, nome: string, oraInizio: string, oraFine: string, durataMedia: number) {
  const db = getDb();
  try {
    const info = db.prepare(`
      INSERT INTO Orario (idRistorante, nome, oraInizio, oraFine)
      VALUES (?, ?, ?, ?)
    `).run(idRistorante, nome, oraInizio, oraFine);
    
    // Automatically create a default Turno for this Orario so it shows up in bookings
    db.prepare(`
      INSERT INTO Turno (idOrario, nomeTurno, maxPrenotazioni, durataMedia)
      VALUES (?, ?, ?, ?)
    `).run(info.lastInsertRowid, nome, 20, durataMedia);
    
    revalidatePath('/gestore/orari');
    return { success: true };
  } catch (error: any) {
    console.error('Create Orario failed:', error.message);
    return { success: false, error: 'Errore durante la creazione della fascia oraria.' };
  } finally {
    db.close();
  }
}

export async function updateOrario(idOrario: number, nome: string, oraInizio: string, oraFine: string, durataMedia: number) {
  const db = getDb();
  try {
    db.prepare(`
      UPDATE Orario 
      SET nome = ?, oraInizio = ?, oraFine = ?
      WHERE idOrario = ?
    `).run(nome, oraInizio, oraFine, idOrario);

    // Also update the default Turno's duration (the one with the same name as the Orario)
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

export async function deleteOrario(idOrario: number) {
  const db = getDb();
  try {
    const transaction = db.transaction(() => {
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

// TURNI
export async function createTurno(idOrario: number, nomeTurno: string, maxPrenotazioni: number, durataMedia: number) {
  const db = getDb();
  try {
    db.prepare(`
      INSERT INTO Turno (idOrario, nomeTurno, maxPrenotazioni, durataMedia)
      VALUES (?, ?, ?, ?)
    `).run(idOrario, nomeTurno, maxPrenotazioni, durataMedia);
    
    revalidatePath('/gestore/orari');
    return { success: true };
  } catch (error: any) {
    console.error('Create Turno failed:', error.message);
    return { success: false, error: 'Errore durante la creazione del turno.' };
  } finally {
    db.close();
  }
}

export async function updateTurno(idTurno: number, nomeTurno: string, maxPrenotazioni: number, durataMedia: number) {
  const db = getDb();
  try {
    db.prepare(`
      UPDATE Turno 
      SET nomeTurno = ?, maxPrenotazioni = ?, durataMedia = ?
      WHERE idTurno = ?
    `).run(nomeTurno, maxPrenotazioni, durataMedia, idTurno);
    
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

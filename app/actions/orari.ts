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
  } catch (error) {
    console.error("Migration check failed:", error);
  } finally {
    db.close();
  }
}

// ORARI (FASCE)
export async function createOrario(nome: string, oraInizio: string, oraFine: string, durataMediaServizio: number) {
  const db = getDb();
  try {
    db.prepare(`
      INSERT INTO Orario (idRistorante, nome, oraInizio, oraFine, durataMediaServizio)
      VALUES (?, ?, ?, ?, ?)
    `).run(1, nome, oraInizio, oraFine, durataMediaServizio); // Assumes idRistorante=1
    
    revalidatePath('/gestore/orari');
    return { success: true };
  } catch (error: any) {
    console.error('Create Orario failed:', error.message);
    return { success: false, error: 'Errore durante la creazione della fascia oraria.' };
  } finally {
    db.close();
  }
}

export async function updateOrario(idOrario: number, nome: string, oraInizio: string, oraFine: string, durataMediaServizio: number) {
  const db = getDb();
  try {
    db.prepare(`
      UPDATE Orario 
      SET nome = ?, oraInizio = ?, oraFine = ?, durataMediaServizio = ?
      WHERE idOrario = ?
    `).run(nome, oraInizio, oraFine, durataMediaServizio, idOrario);
    
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
export async function createTurno(idOrario: number, nomeTurno: string, maxPrenotazioni: number) {
  const db = getDb();
  try {
    db.prepare(`
      INSERT INTO Turno (idOrario, nomeTurno, maxPrenotazioni)
      VALUES (?, ?, ?)
    `).run(idOrario, nomeTurno, maxPrenotazioni);
    
    revalidatePath('/gestore/orari');
    return { success: true };
  } catch (error: any) {
    console.error('Create Turno failed:', error.message);
    return { success: false, error: 'Errore durante la creazione del turno.' };
  } finally {
    db.close();
  }
}

export async function updateTurno(idTurno: number, nomeTurno: string, maxPrenotazioni: number) {
  const db = getDb();
  try {
    db.prepare(`
      UPDATE Turno 
      SET nomeTurno = ?, maxPrenotazioni = ?
      WHERE idTurno = ?
    `).run(nomeTurno, maxPrenotazioni, idTurno);
    
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

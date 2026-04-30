'use server';

import Database from 'better-sqlite3';
import path from 'path';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

function getDb() {
  const dbPath = path.resolve(process.cwd(), 'database.db');
  return new Database(dbPath);
}

export type Ristorante = {
  idRistorante: number;
  nome: string;
  indirizzo: string;
  telefono: string | null;
  email: string | null;
  politicaNoShow: string | null;
  caparraRichiesta: number | null;
  tipologia: string | null;
};

export async function ensureRistoranteColumns() {
  const db = getDb();
  try {
    const tableInfo = db.prepare("PRAGMA table_info(Ristorante)").all() as any[];
    const columns = tableInfo.map(col => col.name);

    if (!columns.includes('politicaNoShow')) {
      db.prepare("ALTER TABLE Ristorante ADD COLUMN politicaNoShow TEXT").run();
    }
    if (!columns.includes('caparraRichiesta')) {
      db.prepare("ALTER TABLE Ristorante ADD COLUMN caparraRichiesta REAL").run();
    }
    if (!columns.includes('tipologia')) {
      db.prepare("ALTER TABLE Ristorante ADD COLUMN tipologia TEXT").run();
    }
  } catch (err) {
    console.error("Error patching Ristorante table:", err);
  } finally {
    db.close();
  }
}

export async function getMyRistoranti(): Promise<{ success: boolean; data?: Ristorante[]; error?: string }> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get('seateasy_session')?.value;

  if (!sessionId) {
    return { success: false, error: 'Non autenticato.' };
  }

  await ensureRistoranteColumns();
  const db = getDb();
  try {
    const rows = db
      .prepare(
        `SELECT idRistorante, nome, indirizzo, telefono, email, politicaNoShow, caparraRichiesta, tipologia
         FROM Ristorante
         WHERE idGestoreRistorante = ?`
      )
      .all(Number(sessionId)) as Ristorante[];

    return { success: true, data: rows };
  } catch (error: any) {
    console.error('getMyRistoranti error:', error.message);
    return { success: false, error: 'Errore nel recupero dei ristoranti.' };
  } finally {
    db.close();
  }
}

export async function addRistorante(formData: FormData): Promise<{ success: boolean; error?: string }> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get('seateasy_session')?.value;

  if (!sessionId) {
    return { success: false, error: 'Non autenticato.' };
  }

  await ensureRistoranteColumns();
  const nome = (formData.get('nome') as string)?.trim();
  const indirizzo = (formData.get('indirizzo') as string)?.trim();
  const telefono = (formData.get('telefono') as string)?.trim() || null;
  const email = (formData.get('email') as string)?.trim() || null;
  const politicaNoShow = (formData.get('politicaNoShow') as string)?.trim() || null;
  const caparraRaw = formData.get('caparraRichiesta') as string;
  const caparraRichiesta = caparraRaw ? parseFloat(caparraRaw) : null;
  const tipologia = (formData.get('tipologia') as string)?.trim() || 'Italiano';

  if (!nome || !indirizzo) {
    return { success: false, error: 'Nome e indirizzo sono obbligatori.' };
  }

  const db = getDb();
  try {
    db.prepare(
      `INSERT INTO Ristorante (idGestoreRistorante, nome, indirizzo, telefono, email, politicaNoShow, caparraRichiesta, tipologia)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(Number(sessionId), nome, indirizzo, telefono, email, politicaNoShow, caparraRichiesta, tipologia);

    revalidatePath('/');
    revalidatePath('/cliente');
    return { success: true };
  } catch (error: any) {
    console.error('addRistorante error:', error.message);
    return { success: false, error: 'Errore durante il salvataggio del ristorante.' };
  } finally {
    db.close();
  }
}

export async function updateRistorante(
  idRistorante: number,
  formData: FormData
): Promise<{ success: boolean; error?: string }> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get('seateasy_session')?.value;

  if (!sessionId) {
    return { success: false, error: 'Non autenticato.' };
  }

  await ensureRistoranteColumns();
  const nome = (formData.get('nome') as string)?.trim();
  const indirizzo = (formData.get('indirizzo') as string)?.trim();
  const telefono = (formData.get('telefono') as string)?.trim() || null;
  const email = (formData.get('email') as string)?.trim() || null;
  const politicaNoShow = (formData.get('politicaNoShow') as string)?.trim() || null;
  const caparraRaw = formData.get('caparraRichiesta') as string;
  const caparraRichiesta = caparraRaw ? parseFloat(caparraRaw) : null;
  const tipologia = (formData.get('tipologia') as string)?.trim() || 'Italiano';

  if (!nome || !indirizzo) {
    return { success: false, error: 'Nome e indirizzo sono obbligatori.' };
  }

  const db = getDb();
  try {
    // Only allow update if the restaurant belongs to this gestore
    const result = db
      .prepare(
        `UPDATE Ristorante
         SET nome = ?, indirizzo = ?, telefono = ?, email = ?, politicaNoShow = ?, caparraRichiesta = ?, tipologia = ?
         WHERE idRistorante = ? AND idGestoreRistorante = ?`
      )
      .run(nome, indirizzo, telefono, email, politicaNoShow, caparraRichiesta, tipologia, idRistorante, Number(sessionId));

    if (result.changes === 0) {
      return { success: false, error: 'Ristorante non trovato o permesso negato.' };
    }

    revalidatePath('/');
    revalidatePath('/cliente');
    return { success: true };
  } catch (error: any) {
    console.error('updateRistorante error:', error.message);
    return { success: false, error: 'Errore durante la modifica del ristorante.' };
  } finally {
    db.close();
  }
}

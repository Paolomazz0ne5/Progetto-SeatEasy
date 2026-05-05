'use server';

import Database from 'better-sqlite3';
import path from 'path';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { writeFile, mkdir, unlink } from 'fs/promises';
import { existsSync } from 'fs';

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

export type GalleriaItem = {
  idImmagine: number;
  idRistorante: number;
  immagineUrl: string;
  prezzo: number | null;
  nota: string | null;
};

export async function addToGallery(idRistorante: number, formData: FormData): Promise<{ success: boolean; error?: string }> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get('seateasy_session')?.value;
  if (!sessionId) return { success: false, error: 'Non autenticato.' };

  const file = formData.get('immagine') as File;
  const prezzo = formData.get('prezzo') ? parseFloat(formData.get('prezzo') as string) : null;
  const nota = (formData.get('nota') as string)?.substring(0, 100) || null;

  if (!file || file.size === 0) return { success: false, error: 'Nessuna immagine selezionata.' };

  // Validate extension
  const validExtensions = ['.png', '.jpg', '.jpeg'];
  const ext = path.extname(file.name).toLowerCase();
  if (!validExtensions.includes(ext)) {
    return { success: false, error: 'Formato immagine non valido. Usa PNG o JPG.' };
  }

  const db = getDb();
  try {
    // Ownership check
    const risto = db.prepare('SELECT idRistorante FROM Ristorante WHERE idRistorante = ? AND idGestoreRistorante = ?').get(idRistorante, Number(sessionId));
    if (!risto) return { success: false, error: 'Ristorante non trovato o permesso negato.' };

    // Save file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    const fileName = `${Date.now()}-${file.name.replace(/\s+/g, '_')}`;
    const filePath = path.join(uploadDir, fileName);
    const publicUrl = `/uploads/${fileName}`;

    await writeFile(filePath, buffer);

    // Save to DB
    db.prepare('INSERT INTO GalleriaRistorante (idRistorante, immagineUrl, prezzo, nota) VALUES (?, ?, ?, ?)').run(idRistorante, publicUrl, prezzo, nota);

    revalidatePath(`/gestore/dashboard`);
    return { success: true };
  } catch (error: any) {
    console.error('addToGallery error:', error.message);
    return { success: false, error: 'Errore durante il caricamento dell\'immagine.' };
  } finally {
    db.close();
  }
}

export async function removeFromGallery(idImmagine: number): Promise<{ success: boolean; error?: string }> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get('seateasy_session')?.value;
  if (!sessionId) return { success: false, error: 'Non autenticato.' };

  const db = getDb();
  try {
    const item = db.prepare(`
      SELECT G.* 
      FROM GalleriaRistorante G
      JOIN Ristorante R ON G.idRistorante = R.idRistorante
      WHERE G.idImmagine = ? AND R.idGestoreRistorante = ?
    `).get(idImmagine, Number(sessionId)) as GalleriaItem | undefined;

    if (!item) return { success: false, error: 'Immagine non trovata o permesso negato.' };

    // Delete file
    const filePath = path.join(process.cwd(), 'public', item.immagineUrl);
    if (existsSync(filePath)) {
      await unlink(filePath);
    }

    // Delete from DB
    db.prepare('DELETE FROM GalleriaRistorante WHERE idImmagine = ?').run(idImmagine);

    revalidatePath(`/gestore/dashboard`);
    return { success: true };
  } catch (error: any) {
    console.error('removeFromGallery error:', error.message);
    return { success: false, error: 'Errore durante la rimozione dell\'immagine.' };
  } finally {
    db.close();
  }
}

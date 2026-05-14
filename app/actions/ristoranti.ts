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
  foto_url: string | null;
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
    if (!columns.includes('foto_url')) {
      db.prepare("ALTER TABLE Ristorante ADD COLUMN foto_url TEXT").run();
    }
  } catch (err) {
    console.error("Error patching Ristorante table:", err);
  } finally {
    db.close();
  }
}

export async function ensureGalleriaTable() {
  const db = getDb();
  try {
    db.prepare(`
      CREATE TABLE IF NOT EXISTS GalleriaRistorante (
        idImmagine INTEGER PRIMARY KEY AUTOINCREMENT,
        idRistorante INTEGER NOT NULL,
        immagineUrl TEXT NOT NULL,
        prezzo REAL,
        nota TEXT,
        FOREIGN KEY (idRistorante) REFERENCES Ristorante(idRistorante) ON DELETE CASCADE
      )
    `).run();
  } catch (err) {
    console.error("Error creating GalleriaRistorante table:", err);
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
        `SELECT idRistorante, nome, indirizzo, telefono, email, politicaNoShow, caparraRichiesta, tipologia, foto_url
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
    let foto_url = null;
    const file = formData.get('foto') as File;
    
    if (file && file.size > 0) {
      const validExtensions = ['.png', '.jpg', '.jpeg'];
      const ext = path.extname(file.name).toLowerCase();
      if (!validExtensions.includes(ext)) {
        return { success: false, error: 'Formato immagine non valido. Usa PNG o JPG.' };
      }

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      
      const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'ristoranti');
      if (!existsSync(uploadDir)) {
        await mkdir(uploadDir, { recursive: true });
      }

      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}${ext}`;
      const filePath = path.join(uploadDir, fileName);
      foto_url = `/uploads/ristoranti/${fileName}`;

      await writeFile(filePath, buffer);
    }

    db.prepare(
      `INSERT INTO Ristorante (idGestoreRistorante, nome, indirizzo, telefono, email, politicaNoShow, caparraRichiesta, tipologia, foto_url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(Number(sessionId), nome, indirizzo, telefono, email, politicaNoShow, caparraRichiesta, tipologia, foto_url);

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
    // Check existing
    const existing = db.prepare('SELECT foto_url FROM Ristorante WHERE idRistorante = ? AND idGestoreRistorante = ?').get(idRistorante, Number(sessionId)) as { foto_url: string | null } | undefined;
    if (!existing) return { success: false, error: 'Ristorante non trovato.' };

    let foto_url = existing.foto_url;
    const file = formData.get('foto') as File;
    const removeFoto = formData.get('removeFoto') === 'true';

    if (removeFoto && foto_url) {
      const oldPath = path.join(process.cwd(), 'public', foto_url);
      if (existsSync(oldPath)) await unlink(oldPath);
      foto_url = null;
    }

    if (file && file.size > 0) {
      // Remove old if exists
      if (foto_url) {
        const oldPath = path.join(process.cwd(), 'public', foto_url);
        if (existsSync(oldPath)) await unlink(oldPath);
      }

      const validExtensions = ['.png', '.jpg', '.jpeg'];
      const ext = path.extname(file.name).toLowerCase();
      if (!validExtensions.includes(ext)) {
        return { success: false, error: 'Formato immagine non valido. Usa PNG o JPG.' };
      }

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      
      const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'ristoranti');
      if (!existsSync(uploadDir)) {
        await mkdir(uploadDir, { recursive: true });
      }

      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}${ext}`;
      const filePath = path.join(uploadDir, fileName);
      foto_url = `/uploads/ristoranti/${fileName}`;

      await writeFile(filePath, buffer);
    }

    const result = db
      .prepare(
        `UPDATE Ristorante
         SET nome = ?, indirizzo = ?, telefono = ?, email = ?, politicaNoShow = ?, caparraRichiesta = ?, tipologia = ?, foto_url = ?
         WHERE idRistorante = ? AND idGestoreRistorante = ?`
      )
      .run(nome, indirizzo, telefono, email, politicaNoShow, caparraRichiesta, tipologia, foto_url, idRistorante, Number(sessionId));

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

  await ensureGalleriaTable();
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

  await ensureGalleriaTable();
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

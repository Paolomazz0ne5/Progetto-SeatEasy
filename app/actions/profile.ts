// Direttiva obbligatoria per far capire a Next.js che questo file contiene 
// funzioni che girano esclusivamente sul server (Server Actions).
'use server';

import Database from 'better-sqlite3';
import path from 'path';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

// Helper per connettersi al database SQLite. 
// È lo stesso pattern che usiamo ovunque per mantenere la connessione pulita.
function getDb() {
  const dbPath = path.resolve(process.cwd(), 'database.db');
  return new Database(dbPath);
}

// Funzione per aggiornare i dati del profilo (nome, cognome, email).
// Accetta il FormData che arriva direttamente dal form del frontend.
export async function updateProfile(formData: FormData) {
  const nome = formData.get('nome') as string;
  const cognome = formData.get('cognome') as string;
  const email = formData.get('email') as string;

  // 1. Recupero la sessione dai cookie. 
  // Se non trovo il cookie 'seateasy_session', l'utente non è loggato.
  const cookieStore = await cookies();
  const session = cookieStore.get('seateasy_session');

  if (!session) return { success: false, error: 'Unauthorized' };
  const userId = Number(session.value);

  // 2. Connessione al DB e esecuzione della query di UPDATE.
  const db = getDb();
  try {
    db.prepare(`
      UPDATE Account SET nome = ?, cognome = ?, email = ? WHERE idAccount = ?
    `).run(nome, cognome, email, userId);

    // IMPORTANTE: Dico a Next.js di aggiornare la cache della pagina profilo
    // così che l'utente veda subito le modifiche appena salvate.
    revalidatePath('/gestore/profilo');
    return { success: true };
  } catch (error: any) {
    console.error('Failed to update profile:', error.message);
    // Un errore qui potrebbe essere dovuto a un'email duplicata nel DB.
    return { success: false, error: 'Salvataggio fallito. Email già in uso?' };
  } finally {
    // Chiudo sempre la connessione per non lasciare il DB bloccato.
    db.close();
  }
}

// Funzione "nucleare": cancella l'intero account dal database.
export async function deleteAccount() {
  const cookieStore = await cookies();
  const session = cookieStore.get('seateasy_session');

  if (!session) return { success: false, error: 'Unauthorized' };
  const userId = Number(session.value);

  const db = getDb();
  try {
    // Grazie alla clausola "ON DELETE CASCADE" che abbiamo impostato nel database, 
    // cancellando l'account vengono rimossi automaticamente anche tutti i ristoranti,
    // le prenotazioni e gli altri dati collegati a questo ID.
    db.prepare('DELETE FROM Account WHERE idAccount = ?').run(userId);

    // Nuke cookie: distruggo il cookie di sessione per disconnettere l'utente.
    cookieStore.delete('seateasy_session');
  } catch (error: any) {
    console.error('Failed to delete account:', error.message);
    return { success: false, error: 'Errore durante la chiusura dell\'account.' };
  } finally {
    db.close();
  }

  // Infine, rimando l'utente alla home.
  // Nota: redirect va chiamato fuori dal blocco try/catch perché interrompe l'esecuzione.
  redirect('/');
}
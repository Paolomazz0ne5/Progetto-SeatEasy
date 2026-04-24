'use server';

import Database from 'better-sqlite3';
import path from 'path';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

function getDb() {
  const dbPath = path.resolve(process.cwd(), 'database.db');
  return new Database(dbPath);
}

export async function updateProfile(formData: FormData) {
  const nome = formData.get('nome') as string;
  const cognome = formData.get('cognome') as string;
  const email = formData.get('email') as string;
  
  const cookieStore = await cookies();
  const session = cookieStore.get('seateasy_session');
  
  if (!session) return { success: false, error: 'Unauthorized' };
  const userId = Number(session.value);

  const db = getDb();
  try {
    db.prepare(`
      UPDATE Account SET nome = ?, cognome = ?, email = ? WHERE idAccount = ?
    `).run(nome, cognome, email, userId);
    
    revalidatePath('/gestore/profilo');
    return { success: true };
  } catch (error: any) {
    console.error('Failed to update profile:', error.message);
    return { success: false, error: 'Salvataggio fallito. Email già in uso?' };
  } finally {
    db.close();
  }
}

export async function deleteAccount() {
  const cookieStore = await cookies();
  const session = cookieStore.get('seateasy_session');
  
  if (!session) return { success: false, error: 'Unauthorized' };
  const userId = Number(session.value);

  const db = getDb();
  try {
    // Cascades will delete associated records in GestoreRistorante, etc.
    db.prepare('DELETE FROM Account WHERE idAccount = ?').run(userId);
    
    // Nuke cookie
    cookieStore.delete('seateasy_session');
  } catch (error: any) {
    console.error('Failed to delete account:', error.message);
    return { success: false, error: 'Errore durante la chiusura dell\'account.' };
  } finally {
    db.close();
  }

  // Redirect to homepage after wiping out the account
  redirect('/');
}

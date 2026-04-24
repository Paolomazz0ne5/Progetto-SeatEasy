'use server';

import Database from 'better-sqlite3';
import path from 'path';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

function getDb() {
  const dbPath = path.resolve(process.cwd(), 'database.db');
  return new Database(dbPath);
}

export async function loginAction(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string; // in a real app, hash and compare
  
  if (!email || !password) {
    return { success: false, error: 'Compila tutti i campi' };
  }

  const db = getDb();
  try {
    const user = db.prepare('SELECT * FROM Account WHERE email = ? AND password = ?').get(email, password) as any;
    
    if (!user) {
      return { success: false, error: 'Credenziali non valide o utente inesistente.' };
    }

    // Verify if user is actually a Gestore
    const gestore = db.prepare('SELECT idAccount FROM GestoreRistorante WHERE idAccount = ?').get(user.idAccount);
    if (!gestore) {
      return { success: false, error: 'Questo account non ha i permessi di Area Gestore.' };
    }

    const cookieStore = await cookies();
    cookieStore.set('seateasy_session', String(user.idAccount), { 
      path: '/',
      httpOnly: true,
      maxAge: 86400 * 7 // 7 days
    });

  } catch (error) {
    console.error(error);
    return { success: false, error: 'Errore interno del server.' };
  } finally {
    db.close();
  }

  // Redirect should be outside try-catch to avoid interception
  redirect('/gestore/dashboard');
}

export async function registerAction(formData: FormData) {
  const nome = formData.get('nome') as string;
  const cognome = formData.get('cognome') as string;
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password || !nome || !cognome) {
    return { success: false, error: 'Compila tutti i campi richiesti.' };
  }

  const db = getDb();
  try {
    const existing = db.prepare('SELECT idAccount FROM Account WHERE email = ?').get(email);
    if (existing) {
      return { success: false, error: 'Email già registrata nel sistema.' };
    }

    const transaction = db.transaction(() => {
      const res = db.prepare('INSERT INTO Account (email, password, nome, cognome) VALUES (?, ?, ?, ?)').run(email, password, nome, cognome);
      const newId = res.lastInsertRowid;
      
      // Auto-assign Gestore role
      db.prepare('INSERT INTO GestoreRistorante (idAccount, ruolo, PIN) VALUES (?, ?, ?)').run(newId, 'Manager', '0000');
      
      return newId;
    });

    const newAccountId = transaction();

    const cookieStore = await cookies();
    cookieStore.set('seateasy_session', String(newAccountId), { 
      path: '/',
      httpOnly: true,
      maxAge: 86400 * 7
    });

  } catch (error: any) {
    console.error(error);
    return { success: false, error: 'Errore inaspettato durante la registrazione.' };
  } finally {
    db.close();
  }

  redirect('/gestore/dashboard');
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete('seateasy_session');
  redirect('/auth/login');
}

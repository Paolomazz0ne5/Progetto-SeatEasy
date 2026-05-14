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
  const password = formData.get('password') as string;
  const role = formData.get('role') as string; // 'cliente' or 'gestore'
  
  if (!email || !password) {
    return { success: false, error: 'Compila tutti i campi' };
  }

  const db = getDb();
  try {
    const user = db.prepare('SELECT * FROM Account WHERE email = ? AND password = ?').get(email, password) as { idAccount: number } | undefined;
    
    if (!user) {
      return { success: false, error: 'Credenziali non valide o utente inesistente.' };
    }

    if (role === 'gestore') {
      const gestore = db.prepare('SELECT idAccount FROM GestoreRistorante WHERE idAccount = ?').get(user.idAccount);
      if (!gestore) {
        return { success: false, error: 'Questo account non ha i permessi di Area Gestore.' };
      }
    } else {
      const cliente = db.prepare('SELECT idAccount FROM Cliente WHERE idAccount = ?').get(user.idAccount);
      if (!cliente) {
        return { success: false, error: 'Questo account non è registrato come Cliente.' };
      }
    }

    const cookieStore = await cookies();
    cookieStore.set('seateasy_session', String(user.idAccount), { 
      path: '/',
      httpOnly: true,
      maxAge: 86400 * 7
    });

    return { success: true, role };

  } catch (error) {
    console.error(error);
    return { success: false, error: 'Errore interno del server.' };
  } finally {
    db.close();
  }
}

export async function registerAction(formData: FormData) {
  const nome = formData.get('nome') as string;
  const cognome = formData.get('cognome') as string;
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const telefono = formData.get('telefono') as string;
  const role = formData.get('role') as string;
  const pin = formData.get('pin') as string;

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
      const res = db.prepare('INSERT INTO Account (email, password, nome, cognome, telefono) VALUES (?, ?, ?, ?, ?)').run(email, password, nome, cognome, telefono);
      const newId = res.lastInsertRowid;
      
      if (role === 'gestore') {
        db.prepare('INSERT INTO GestoreRistorante (idAccount, ruolo, PIN) VALUES (?, ?, ?)').run(newId, 'Manager', pin || '0000');
      } else {
        db.prepare('INSERT INTO Cliente (idAccount) VALUES (?)').run(newId);
      }
      
      return newId;
    });

    const newAccountId = transaction();

    const cookieStore = await cookies();
    cookieStore.set('seateasy_session', String(newAccountId), { 
      path: '/',
      httpOnly: true,
      maxAge: 86400 * 7
    });

    return { success: true, role };

  } catch (error: unknown) {
    console.error(error);
    return { success: false, error: 'Errore inaspettato durante la registrazione.' };
  } finally {
    db.close();
  }
}


export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete('seateasy_session');
  redirect('/auth');
}


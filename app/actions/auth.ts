'use server';

import Database from 'better-sqlite3';
import path from 'path';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import bcrypt from 'bcryptjs';

// Helper di connessione al database
function getDb() {
  const dbPath = path.resolve(process.cwd(), 'database.db');
  return new Database(dbPath);
}

// [LOGIN]: Verifica le credenziali e imposta il cookie di sessione.
export async function loginAction(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const role = formData.get('role') as string; // 'cliente' o 'gestore'

  if (!email || !password) {
    return { success: false, error: 'Compila tutti i campi' };
  }

  const db = getDb();
  try {
    // 1. Cerco l'utente nella tabella base 'Account'
    // [Nuova Logica]: Estraiamo i dati utente in base all'email per verificare successivamente
    // la password tramite confronto di hash, senza salvare la password in chiaro.
    const user = db.prepare('SELECT * FROM Account WHERE email = ?').get(email) as { idAccount: number, password: string } | undefined;

    if (!user) {
      // Restituiamo un messaggio generico in caso di utente non trovato per non fornire indizi agli attaccanti.
      return { success: false, error: 'Credenziali non valide' };
    }

    // [Nuova Logica]: Verifichiamo che la password immessa corrisponda all'hash nel database.
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      // Restituiamo lo stesso messaggio generico per sicurezza.
      return { success: false, error: 'Credenziali non valide' };
    }

    // 2. Controllo di Autorizzazione (RBAC - Role Based Access Control)
    // Verifico che l'utente esista nella tabella specifica del ruolo scelto
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

    // 3. Imposto il Cookie di sessione. 
    // httpOnly: true è fondamentale per evitare attacchi XSS.
    const cookieStore = await cookies();
    cookieStore.set('seateasy_session', String(user.idAccount), {
      path: '/',
      httpOnly: true,
      maxAge: 86400 * 7 // Sessione valida per 7 giorni
    });

    return { success: true, role };
  } catch (error) {
    console.error(error);
    return { success: false, error: 'Errore interno del server.' };
  } finally {
    db.close();
  }
}

// [REGISTRAZIONE]: Crea un nuovo utente e lo collega alla tabella del ruolo.
export async function registerAction(formData: FormData) {
  const nome = formData.get('nome') as string;
  const cognome = formData.get('cognome') as string;
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const telefono = formData.get('telefono') as string;
  const role = formData.get('role') as string;

  if (!email || !password || !nome || !cognome) {
    return { success: false, error: 'Compila tutti i campi richiesti.' };
  }

  const db = getDb();
  try {
    // Controllo se l'email è già in uso
    const existing = db.prepare('SELECT idAccount FROM Account WHERE email = ?').get(email);
    if (existing) {
      return { success: false, error: 'Email già registrata nel sistema.' };
    }

    // [Nuova Logica]: Cifriamo la password dell'utente prima di salvarla nel database.
    // Utilizziamo bcrypt con 10 salt rounds per un equilibrio ottimale tra sicurezza e performance.
    const hashedPassword = await bcrypt.hash(password, 10);

    // Transazione per garantire che l'account e il ruolo vengano creati insieme
    const transaction = db.transaction(() => {
      const res = db.prepare('INSERT INTO Account (email, password, nome, cognome, telefono) VALUES (?, ?, ?, ?, ?)').run(email, hashedPassword, nome, cognome, telefono);
      const newId = res.lastInsertRowid;

      // Inserimento nella tabella specifica del ruolo
      if (role === 'gestore') {
        db.prepare('INSERT INTO GestoreRistorante (idAccount) VALUES (?)').run(newId);
      } else {
        db.prepare('INSERT INTO Cliente (idAccount) VALUES (?)').run(newId);
      }
      return newId;
    });

    const newAccountId = transaction();

    // Login automatico post-registrazione
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

// [LOGOUT]: Distrugge la sessione corrente.
export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete('seateasy_session');
  redirect('/auth');
}

// [SICUREZZA EXTRA]: PIN per accedere a funzioni sensibili del ristorante.
export async function verifyRestaurantPinAction(idRistorante: number, pin: string) {
  const cookieStore = await cookies();
  const session = cookieStore.get('seateasy_session');
  if (!session) return { success: false, error: 'Sessione non valida' };

  const idAccount = parseInt(session.value);
  const db = getDb();
  try {
    const ristorante = db.prepare('SELECT pin FROM Ristorante WHERE idRistorante = ? AND idGestoreRistorante = ?').get(idRistorante, idAccount) as { pin: string | null } | undefined;

    if (!ristorante) return { success: false, error: 'Ristorante non trovato' };

    // Verifica PIN (se impostato)
    if (ristorante.pin === null || ristorante.pin === '') {
      return { success: true };
    }

    if (ristorante.pin === pin) {
      return { success: true };
    } else {
      return { success: false, error: 'PIN non corretto' };
    }
  } catch (error) {
    console.error('Error verifying Restaurant PIN:', error);
    return { success: false, error: 'Errore durante la verifica del PIN' };
  } finally {
    db.close();
  }
}
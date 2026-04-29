import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Database from 'better-sqlite3';
import path from 'path';

export default async function RootPage() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get('seateasy_session')?.value;

  if (!sessionId) {
    redirect('/auth');
  }

  const dbPath = path.resolve(process.cwd(), 'database.db');
  const db = new Database(dbPath);
  
  try {
    const gestore = db.prepare('SELECT idAccount FROM GestoreRistorante WHERE idAccount = ?').get(sessionId);
    if (gestore) {
      redirect('/gestore/ristoranti');
    } else {
      redirect('/cliente');
    }
  } finally {
    db.close();
  }
}

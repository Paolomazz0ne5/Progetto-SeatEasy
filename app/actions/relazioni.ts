'use server';

import Database from 'better-sqlite3';
import path from 'path';
import { revalidatePath } from 'next/cache';

function getDb() {
  const dbPath = path.resolve(process.cwd(), 'database.db');
  return new Database(dbPath);
}

// Interfaccia per ritornare stati sicuri
export async function ensureCRMDatabase() {
  const db = getDb();
  try {
    const transaction = db.transaction(() => {
      // 1. Create Recensione table if missing
      db.prepare(`
        CREATE TABLE IF NOT EXISTS Recensione (
            idRecensione INTEGER PRIMARY KEY AUTOINCREMENT,
            idCliente INTEGER NOT NULL,
            idRistorante INTEGER NOT NULL,
            punteggio INTEGER NOT NULL,
            testo TEXT,
            dataCreazione TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (idCliente) REFERENCES Cliente(idAccount) ON DELETE CASCADE,
            FOREIGN KEY (idRistorante) REFERENCES Ristorante(idRistorante) ON DELETE CASCADE
        )
      `).run();

      // Ensure some mock data exists for UI demonstration
      const countReviews = db.prepare('SELECT COUNT(*) as c FROM Recensione').get() as { c: number };
      if (countReviews.c === 0) {
        // Find some valid clients
        const clients = db.prepare('SELECT idAccount FROM Cliente LIMIT 3').all() as { idAccount: number }[];
        if (clients.length >= 2) {
          const stmt = db.prepare('INSERT INTO Recensione (idCliente, idRistorante, punteggio, testo, dataCreazione) VALUES (?, ?, ?, ?, ?)');
          stmt.run(clients[0].idAccount, 1, 5, "Atmosfera incantevole e menù assolutamente favoloso. Il servizio è stato attento senza mai risultare invadente.", new Date().toISOString());
          stmt.run(clients[1].idAccount, 1, 4, "Buonissimo, carne cotta alla perfezione. Peccato solo per il leggero ritardo al momento di sedersi, ma gestione cordiale.", new Date(Date.now() - 86400000).toISOString()); // 1 day ago
          if(clients[2]) {
             stmt.run(clients[2].idAccount, 1, 5, "Un'esperienza incredibile! Ristorante bellissimo, tornerò sicuramente col mio compagno per il nostro prossimo anniversario.", new Date(Date.now() - 86400000 * 3).toISOString());
          }
        }
      }

      // Check for mock Chat messages in Notifica mapped as 'Chat'
      const countChat = db.prepare("SELECT COUNT(*) as c FROM Notifica WHERE tipo = 'Chat'").get() as { c: number };
      if (countChat.c === 0) {
        const reservations = db.prepare('SELECT idPrenotazione FROM Prenotazione LIMIT 1').all() as { idPrenotazione: number }[];
        if(reservations.length > 0) {
          const insertNotifica = db.prepare("INSERT INTO Notifica (idPrenotazione, tipo, messaggio, dataInvio, statoInvio) VALUES (?, 'Chat', ?, ?, ?)");
          // Fake conversation
          insertNotifica.run(reservations[0].idPrenotazione, 'Salve, accettate cani di piccola taglia?', new Date(Date.now() - 3600000).toISOString(), 'InviatoDaCliente');
          insertNotifica.run(reservations[0].idPrenotazione, 'Certamente! Sarà nostra cura prepararvi un tavolo con maggiore spazio laterale.', new Date(Date.now() - 3000000).toISOString(), 'InviatoDaGestore');
        }
      }
    });

    transaction();
  } catch (error) {
    console.error("Failed CRM Database sync:", error);
  } finally {
    db.close();
  }
}

export async function sendChatMessage(idPrenotazione: number, text: string) {
  const db = getDb();
  try {
    db.prepare(`
      INSERT INTO Notifica (idPrenotazione, tipo, messaggio, dataInvio, statoInvio)
      VALUES (?, 'Chat', ?, ?, 'InviatoDaGestore')
    `).run(idPrenotazione, text, new Date().toISOString());
    revalidatePath('/gestore/relazioni');
    return { success: true };
  } catch {
    return { success: false, error: 'Errore invio messaggio' };
  } finally {
    db.close();
  }
}

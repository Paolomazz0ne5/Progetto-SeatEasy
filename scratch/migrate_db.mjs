import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.resolve(process.cwd(), 'database.db');
const db = new Database(dbPath);

try {
  console.log("Inizio migrazione database...");

  // 1. Tabella Cliente: Sostituzione/Aggiunta metodoPagamentoPredefinito
  const clienteCols = db.prepare("PRAGMA table_info(Cliente)").all();
  if (!clienteCols.some(c => c.name === 'metodoPagamentoPredefinito')) {
    console.log("Aggiungo metodoPagamentoPredefinito a Cliente...");
    db.prepare("ALTER TABLE Cliente ADD COLUMN metodoPagamentoPredefinito TEXT").run();
  }

  // 2. Tabella Tavolo: postiMinimi e idGruppo
  const tavoloCols = db.prepare("PRAGMA table_info(Tavolo)").all();
  if (!tavoloCols.some(c => c.name === 'postiMinimi')) {
    db.prepare("ALTER TABLE Tavolo ADD COLUMN postiMinimi INTEGER DEFAULT 1").run();
  }
  if (!tavoloCols.some(c => c.name === 'idGruppo')) {
    db.prepare("ALTER TABLE Tavolo ADD COLUMN idGruppo TEXT").run();
  }

  // 3. Tabella Orario: nome
  const orarioCols = db.prepare("PRAGMA table_info(Orario)").all();
  if (!orarioCols.some(c => c.name === 'nome')) {
    db.prepare("ALTER TABLE Orario ADD COLUMN nome TEXT DEFAULT 'Fascia Oraria'").run();
  }

  // 4. Tabella Turno: durataMedia
  const turnoCols = db.prepare("PRAGMA table_info(Turno)").all();
  if (!turnoCols.some(c => c.name === 'durataMedia')) {
    db.prepare("ALTER TABLE Turno ADD COLUMN durataMedia INTEGER DEFAULT 90").run();
  }

  // 5. Creazione Tabella Recensione
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

  console.log("Migrazione completata con successo!");
} catch (err) {
  console.error("Errore durante la migrazione:", err);
} finally {
  db.close();
}

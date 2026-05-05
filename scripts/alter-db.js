const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.resolve(__dirname, '../database.db');
const db = new Database(dbPath, { verbose: console.log });

try {
  // Check if column already exists to prevent errors on multiple runs
  const columns = db.prepare("PRAGMA table_info(Tavolo)").all();
  const hasIdGruppo = columns.some(c => c.name === 'idGruppo');

  if (!hasIdGruppo) {
    console.log("Aggiungo colonna idGruppo a Tavolo...");
    db.prepare("ALTER TABLE Tavolo ADD COLUMN idGruppo TEXT").run();
    console.log("Colonna aggiunta con successo.");
  } else {
    console.log("La colonna idGruppo esiste già in Tavolo.");
  }

  // Add durataMedia to Turno
  const turnoColumns = db.prepare("PRAGMA table_info(Turno)").all();
  const hasDurataMedia = turnoColumns.some(c => c.name === 'durataMedia');

  if (!hasDurataMedia) {
    console.log("Aggiungo colonna durataMedia a Turno...");
    db.prepare("ALTER TABLE Turno ADD COLUMN durataMedia INTEGER DEFAULT 90").run();
    console.log("Colonna durataMedia aggiunta con successo.");
  } else {
    console.log("La colonna durataMedia esiste già in Turno.");
  }
} catch (error) {
  console.error("Errore durante l'aggiornamento del DB:", error);
} finally {
  db.close();
}

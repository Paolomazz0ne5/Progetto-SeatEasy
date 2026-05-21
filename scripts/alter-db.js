const Database = require('better-sqlite3');
const path = require('path');

// [NOTA D'ESAME]: Uso __dirname. Il path è relativo alla posizione fisica di questo script.
const dbPath = path.resolve(__dirname, '../database.db');
const db = new Database(dbPath, { verbose: console.log });

try {
  // ==========================================
  // MIGRAZIONE 1: TABELLA TAVOLO
  // ==========================================
  const columns = db.prepare("PRAGMA table_info(Tavolo)").all();
  const hasIdGruppo = columns.some(c => c.name === 'idGruppo');

  if (!hasIdGruppo) {
    console.log("Aggiungo colonna idGruppo a Tavolo...");
    // [NOTA D'ESAME - NULLABILITY]: Qui NON c'è il vincolo NOT NULL e non c'è DEFAULT.
    // Questo significa che tutti i record esistenti prenderanno automaticamente il valore NULL.
    db.prepare("ALTER TABLE Tavolo ADD COLUMN idGruppo TEXT").run();
    console.log("Colonna aggiunta con successo.");
  } else {
    console.log("La colonna idGruppo esiste già in Tavolo.");
  }

  // ==========================================
  // MIGRAZIONE 2: TABELLA TURNO
  // ==========================================
  const turnoColumns = db.prepare("PRAGMA table_info(Turno)").all();
  const hasDurataMedia = turnoColumns.some(c => c.name === 'durataMedia');

  if (!hasDurataMedia) {
    console.log("Aggiungo colonna durataMedia a Turno...");
    // [NOTA D'ESAME - BUSINESS LOGIC]: Qui c'è un DEFAULT 90. Anche se non è NOT NULL,
    // forziamo i vecchi record ad avere il valore 90 anziché NULL.
    db.prepare("ALTER TABLE Turno ADD COLUMN durataMedia INTEGER DEFAULT 90").run();
    console.log("Colonna durataMedia aggiunta con successo.");
  } else {
    console.log("La colonna durataMedia esiste già in Turno.");
  }
} catch (error) {
  // Intercettazione degli errori (es. database lock o errori di sintassi SQL)
  console.error("Errore durante l'aggiornamento del DB:", error);
} finally {
  // Sblocco del file system obbligatorio
  db.close();
}

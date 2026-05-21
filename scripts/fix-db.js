const Database = require('better-sqlite3');
const path = require('path');

// Risoluzione deterministica del percorso del database.
const dbPath = path.resolve(process.cwd(), 'database.db');
const db = new Database(dbPath);

try {
  // [VINCOLO DI INTEGRITÀ]: In SQLite le Foreign Keys sono disabilitate di default 
  // per ogni nuova connessione. È vitale riattivarle prima di un'operazione di UPDATE.
  db.pragma('foreign_keys = ON');

  // [PATTERN: PREPARED STATEMENT]: Astrazione della query DML (Data Manipulation Language).
  // L'uso dei segnaposto (?) previene a livello architetturale la SQL Injection.
  const stmt = db.prepare('UPDATE Sala SET idRistorante = ? WHERE idRistorante = ?');
  
  // Esecuzione dell'operazione di scrittura. Il metodo .run() restituisce un oggetto 
  // contenente i metadati dell'operazione (es. numero di righe effettivamente alterate).
  const info = stmt.run(2, 1);
  
  // Feedback dinamico basato sul reale esito dell'operazione nel motore relazionale.
  console.log(`Aggiornamento completato. Sale riassegnate: ${info.changes}`);

} catch (error) {
  // Intercettazione di violazioni di vincoli (es. idRistorante = 2 non esiste) 
  // o errori di lock concorrente.
  console.error('Eccezione durante l\'operazione DML:', error.message);

} finally {
  // Rilascio garantito del lock (Exclusive/Shared) a livello di sistema operativo.
  db.close();
}
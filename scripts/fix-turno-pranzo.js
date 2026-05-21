const Database = require('better-sqlite3');
const path = require('path');

// Risoluzione deterministica del path per prevenire la creazione di file 
// SQLite fantasma in directory errate.
const dbPath = path.resolve(process.cwd(), 'database.db');
const db = new Database(dbPath);

try {
  // [VINCOLO DI INTEGRITÀ RELAZIONALE]
  // Obbliga SQLite a validare le Foreign Keys prima di consentire l'inserimento.
  db.pragma('foreign_keys = ON');

  // [PATTERN: PREPARED STATEMENT]
  // La query DML (INSERT) non contiene i valori hardcoded, ma i segnaposto (?).
  // Questo separa logicamente il comando SQL dal payload dei dati.
  const stmt = db.prepare(`
    INSERT INTO Turno (idOrario, nomeTurno) 
    VALUES (?, ?)
  `);
  
  // Esecuzione dell'inserimento passando i parametri tramite binding.
  // Il metodo .run() restituisce un oggetto contenente l'ID della nuova tupla inserita.
  const info = stmt.run(2, 'Pranzo');
  
  // Utilizzo dell'oggetto info per stampare un log basato sul reale stato del DB.
  console.log(`Turno inserito con successo. RowID generato: ${info.lastInsertRowid}`);

} catch (error) {
  // Intercettazione di violazioni di Foreign Key (es. idOrario = 2 non esiste) 
  // o di violazioni di unicità (UNIQUE constraints).
  console.error('Eccezione durante l\'inserimento DML:', error.message);

} finally {
  // [PATTERN: RESOURCE MANAGEMENT]
  // Il blocco finally assicura il rilascio deterministico dell'handle del file.
  db.close();
}
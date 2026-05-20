const Database = require('better-sqlite3');
const path = require('path');

// [NOTA D'ESAME]: Qui usi process.cwd() al posto di __dirname. 
// cwd() prende la cartella da cui è stato lanciato il comando nel terminale (la root del progetto),
// non la cartella fisica in cui si trova questo specifico file JS.
const dbPath = path.resolve(process.cwd(), 'database.db');
const db = new Database(dbPath);

try {
  // [IDEMPOTENZA]: Verifico se la colonna esiste interrogando i metadati interni di SQLite.
  const cols = db.prepare("PRAGMA table_info(Tavolo)").all();
  
  // [NOTA JS]: Uso il metodo funzionale .some() degli array. È più efficiente di un .filter() o .map()
  // perché si ferma (short-circuit) non appena trova il primo elemento che soddisfa la condizione.
  const exists = cols.some(c => c.name === 'postiMinimi');
  
  if (exists) {
    console.log('Column postiMinimi already exists, skipping.');
  } else {
    // [IL CUORE DELLA MIGRAZIONE]: ALTER TABLE con vincolo NOT NULL e DEFAULT.
    // L'aggiunta di "DEFAULT 1" non è opzionale qui, è l'unico modo per non far esplodere il DB.
    db.prepare("ALTER TABLE Tavolo ADD COLUMN postiMinimi INTEGER NOT NULL DEFAULT 1").run();
    console.log('Column postiMinimi added successfully.');
  }
} finally {
  // Rilascio sempre il lock dal file system, indipendentemente dal successo o fallimento del blocco try.
  db.close();
}
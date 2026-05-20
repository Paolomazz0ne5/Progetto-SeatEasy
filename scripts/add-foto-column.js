const Database = require('better-sqlite3');
const path = require('path');

// [NOTA D'ESAME]: Uso __dirname per costruire un percorso ASSOLUTO. 
// Se usassi un percorso relativo come '../database.db', dipenderebbe da dove l'utente 
// lancia il comando nel terminale (cwd), rischiando di non trovare il file.
const dbPath = path.resolve(__dirname, '../database.db');
const db = new Database(dbPath, { verbose: console.log });

try {
  // [NOTA D'ESAME]: Uso PRAGMA. SQLite non ha un "information_schema" standard come MySQL.
  // PRAGMA table_info restituisce i metadati (struttura) della tabella Ristorante.
  // Uso .all() perché mi aspetto più record di ritorno (uno per ogni colonna).
  const tableInfo = db.prepare("PRAGMA table_info(Ristorante)").all();
  
  // Mappo l'array di oggetti restituito dal DB in un semplice array di stringhe 
  // contenente solo i nomi delle colonne.
  const columns = tableInfo.map(col => col.name);

  // [PRINCIPIO DI IDEMPOTENZA]: Controllo se la colonna esiste prima di agire.
  if (!columns.includes('foto_url')) {
    console.log('Aggiunta colonna foto_url alla tabella Ristorante...');
    
    // Eseguo un'operazione DDL (Data Definition Language). 
    // Uso .run() perché non mi aspetto dati di ritorno (nessun recordset), 
    // ma solo l'esecuzione del comando.
    db.prepare("ALTER TABLE Ristorante ADD COLUMN foto_url TEXT").run();
    console.log('Colonna aggiunta con successo.');
  } else {
    console.log('La colonna foto_url esiste già.');
  }
} catch (err) {
  // Catturo eventuali eccezioni (es. DB bloccato, errori di sintassi) per evitare il crash di Node.js
  console.error('Errore durante la migrazione:', err);
} finally {
  // [NOTA D'ESAME]: Il blocco finally viene eseguito SEMPRE, sia in caso di successo che di errore.
  // Serve a rilasciare il lock (blocco) del file system imposto da SQLite.
  db.close();
}
const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.resolve(__dirname, '../database.db');
const db = new Database(dbPath, { verbose: console.log });

try {
  const tableInfo = db.prepare("PRAGMA table_info(Ristorante)").all();
  const columns = tableInfo.map(col => col.name);

  if (!columns.includes('foto_url')) {
    console.log('Aggiunta colonna foto_url alla tabella Ristorante...');
    db.prepare("ALTER TABLE Ristorante ADD COLUMN foto_url TEXT").run();
    console.log('Colonna aggiunta con successo.');
  } else {
    console.log('La colonna foto_url esiste già.');
  }
} catch (err) {
  console.error('Errore durante la migrazione:', err);
} finally {
  db.close();
}

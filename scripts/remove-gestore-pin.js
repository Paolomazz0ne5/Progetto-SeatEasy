import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.resolve(process.cwd(), 'database.db');
const db = new Database(dbPath, { verbose: console.log });

console.log('Rimozione della colonna pin dalla tabella GestoreRistorante...');

try {
  // Verifichiamo se la colonna esiste
  const info = db.prepare("PRAGMA table_info(GestoreRistorante)").all();
  const hasPin = info.some(col => col.name === 'pin');

  if (hasPin) {
    // In SQLite 3.35.0+ è possibile usare DROP COLUMN
    db.prepare("ALTER TABLE GestoreRistorante DROP COLUMN pin").run();
    console.log('Colonna pin rimossa con successo.');
  } else {
    console.log('La colonna pin non esiste già nella tabella GestoreRistorante.');
  }
} catch (error) {
  console.error('Errore durante la migrazione:', error.message);
  console.log('Tentativo di migrazione manuale (per versioni vecchie di SQLite)...');
  
  try {
    db.transaction(() => {
      // 1. Creo la nuova tabella senza pin
      db.prepare(`
        CREATE TABLE GestoreRistorante_new (
          idAccount INTEGER PRIMARY KEY,
          FOREIGN KEY (idAccount) REFERENCES Account(idAccount) ON DELETE CASCADE
        )
      `).run();

      // 2. Copio i dati
      db.prepare("INSERT INTO GestoreRistorante_new (idAccount) SELECT idAccount FROM GestoreRistorante").run();

      // 3. Rimuovo la vecchia e rinomino la nuova
      db.prepare("DROP TABLE GestoreRistorante").run();
      db.prepare("ALTER TABLE GestoreRistorante_new RENAME TO GestoreRistorante").run();
    })();
    console.log('Migrazione manuale completata con successo.');
  } catch (innerError) {
    console.error('Errore critico durante la migrazione manuale:', innerError.message);
  }
} finally {
  db.close();
}

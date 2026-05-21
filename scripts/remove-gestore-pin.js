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
    try {
      // Tentativo via veloce: in SQLite 3.35.0+ è possibile usare DROP COLUMN
      db.prepare("ALTER TABLE GestoreRistorante DROP COLUMN pin").run();
      console.log('Colonna pin rimossa con successo tramite ALTER TABLE.');
    } catch (dropError) {
      console.warn('ALTER TABLE fallito. Tentativo di migrazione manuale...', dropError.message);
      
      // Prepariamo la transazione
      const eseguiMigrazione = db.transaction(() => {
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
      });

      // ESECUZIONE MIGRAZIONE MANUALE
      // Disabilitiamo le chiavi esterne PRIMA della transazione
      db.prepare('PRAGMA foreign_keys = OFF').run();
      
      // Eseguiamo la transazione
      eseguiMigrazione();
      
      // Riabilitiamo le chiavi esterne DOPO la transazione
      db.prepare('PRAGMA foreign_keys = ON').run();

      console.log('Migrazione manuale completata con successo.');
    }
  } else {
    console.log('La colonna pin non esiste già nella tabella GestoreRistorante.');
  }
} catch (error) {
  console.error('Errore critico durante lo script di migrazione:', error.message);
  process.exit(1);
} finally {
  db.close();
}
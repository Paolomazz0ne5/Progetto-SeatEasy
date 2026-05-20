const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.resolve(process.cwd(), 'database.db');
const db = new Database(dbPath, { verbose: console.log });

console.log('Rimozione della colonna caparraPagata_old dalla tabella Prenotazione...');

try {
  // Verifichiamo se la colonna esiste
  const info = db.prepare("PRAGMA table_info(Prenotazione)").all();
  const hasCaparraOld = info.some(col => col.name === 'caparraPagata_old');

  if (hasCaparraOld) {
    try {
      // In SQLite 3.35.0+ è possibile usare DROP COLUMN
      db.prepare("ALTER TABLE Prenotazione DROP COLUMN caparraPagata_old").run();
      console.log('Colonna caparraPagata_old rimossa con successo tramite ALTER TABLE DROP COLUMN.');
    } catch (dropError) {
      console.warn('DROP COLUMN fallito. Tentativo di migrazione manuale...', dropError.message);
      
      db.transaction(() => {
        // Disabilitiamo temporaneamente le chiavi esterne per la ricostruzione
        db.prepare('PRAGMA foreign_keys = OFF').run();

        // 1. Creiamo la nuova tabella senza caparraPagata_old
        db.prepare(`
          CREATE TABLE Prenotazione_new (
              idPrenotazione INTEGER PRIMARY KEY AUTOINCREMENT,
              idCliente INTEGER NOT NULL,
              idTurno INTEGER NOT NULL,
              dataPrenotazione TEXT NOT NULL,
              numeroPersone INTEGER NOT NULL,
              stato TEXT NOT NULL,
              noteCliente TEXT,
              caparraPagata REAL DEFAULT 0,
              dataCreazione TEXT DEFAULT CURRENT_TIMESTAMP,
              FOREIGN KEY (idCliente) REFERENCES Cliente(idAccount) ON DELETE RESTRICT,
              FOREIGN KEY (idTurno) REFERENCES Turno(idTurno) ON DELETE RESTRICT
          )
        `).run();

        // 2. Copiamo i dati
        db.prepare(`
          INSERT INTO Prenotazione_new (
            idPrenotazione, idCliente, idTurno, dataPrenotazione, numeroPersone, stato, noteCliente, caparraPagata, dataCreazione
          )
          SELECT 
            idPrenotazione, idCliente, idTurno, dataPrenotazione, numeroPersone, stato, noteCliente, caparraPagata, dataCreazione
          FROM Prenotazione
        `).run();

        // 3. Rimuoviamo la vecchia e rinominiamo la nuova
        db.prepare("DROP TABLE Prenotazione").run();
        db.prepare("ALTER TABLE Prenotazione_new RENAME TO Prenotazione").run();
        
        // Riabilitiamo le chiavi esterne
        db.prepare('PRAGMA foreign_keys = ON').run();
      })();
      console.log('Migrazione manuale completata con successo.');
    }
  } else {
    console.log('La colonna caparraPagata_old non esiste già nella tabella Prenotazione.');
  }
} catch (error) {
  console.error('Errore critico durante la migrazione:', error.message);
  process.exit(1);
} finally {
  db.close();
}

const Database = require('better-sqlite3');
const path = require('path');

// Configurazione del percorso assoluto per garantire l'accesso al file del database 
// indipendentemente dalla directory (CWD) da cui viene avviato il processo Node.js.
const dbPath = path.resolve(process.cwd(), 'database.db');

// Inizializzazione della connessione al database SQLite.
const db = new Database(dbPath);

try {
  // Esecuzione di una query con proiezione esplicita degli attributi sulla tabella Tavolo.
  // L'esplicitazione delle colonne riduce il payload in memoria e previene 
  // anomalie software in caso di future alterazioni dello schema DDL.
  const tavoli = db.prepare('SELECT idTavolo, numero, stato, idSala FROM Tavolo').all();
  console.log('Tavoli:', tavoli);

  // Proiezione esplicita per la tabella Orario.
  const orari = db.prepare('SELECT idOrario, idRistorante, oraInizio, oraFine FROM Orario').all();
  console.log('Orari:', orari);

  // Proiezione esplicita per la tabella Turno.
  const turni = db.prepare('SELECT idTurno, idOrario, durataMedia FROM Turno').all();
  console.log('Turni:', turni);

} catch (error) {
  // Intercettazione delle eccezioni (es. tabella inesistente o database corrotto) 
  // per impedire il crash del runtime di Node.js.
  console.error('Errore di lettura dal database:', error.message);
  
} finally {
  // Il blocco finally garantisce la chiusura della connessione al database 
  // e il rilascio del lock sul file system in ogni scenario (successo o eccezione).
  db.close();
}

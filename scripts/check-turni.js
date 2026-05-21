const Database = require('better-sqlite3');
const path = require('path');

// Risoluzione assoluta del percorso: process.cwd() vincola il path alla root 
// di esecuzione del processo Node.js, garantendo l'invarianza del puntamento al file 
// indipendente dalla directory da cui viene invocato lo script.
const dbPath = path.resolve(process.cwd(), 'database.db');

// Inizializzazione del database. Viene allocato l'handle per l'accesso al file system.
const db = new Database(dbPath);

try {
  // Applicazione rigorosa dell'operazione di Proiezione (Algebra Relazionale).
  // L'esplicitazione dei soli campi necessari riduce il payload in memoria Heap 
  // e disaccoppia lo script da future mutazioni DDL dello schema logico (es. aggiunta di nuove colonne).
  const orari = db.prepare('SELECT idOrario, idRistorante, oraInizio, oraFine FROM Orario').all();
  console.log('ORARI:', orari);

  const turni = db.prepare('SELECT idTurno, idOrario, durataMedia FROM Turno').all();
  console.log('TURNI:', turni);

  // Risoluzione della relazione 1:N tramite JOIN.
  // Demanda il carico computazionale dell'incrocio dei dati al Query Optimizer del DBMS,
  // sfruttando gli indici B-Tree delle chiavi esterne per ottenere un set di dati coeso.
  const turniConOrari = db.prepare(`
    SELECT Turno.idTurno, Turno.durataMedia, Orario.oraInizio, Orario.oraFine
    FROM Turno
    INNER JOIN Orario ON Turno.idOrario = Orario.idOrario
  `).all();
  console.log('\nTURNI E RELATIVI ORARI (JOIN):', turniConOrari);

} catch (error) {
  // Gestione delle eccezioni per prevenire il crash non gestito del runtime V8 di Node.js
  // in caso di anomalie a livello di I/O o di sintassi SQL.
  console.error('Eccezione durante il fetch dei dati:', error.message);

} finally {
  // Rilascio deterministico delle risorse. 
  // Garantisce la rimozione del lock a livello di sistema operativo sul file SQLite,
  // prevenendo deadlock (SQLITE_BUSY) per altre istanze o connessioni concorrenti.
  db.close();
}
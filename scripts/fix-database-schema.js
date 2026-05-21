const Database = require('better-sqlite3');
const path = require('path');

// Risoluzione assoluta del percorso tramite process.cwd() per garantire 
// l'invarianza del contesto di esecuzione.
const dbPath = path.resolve(process.cwd(), 'database.db');
const db = new Database(dbPath, { verbose: console.log });

console.log('Aggiornamento dello schema del database in corso...');

try {
  // [PATTERN STRUTTURALE: HELPER FUNCTION]
  // Questa funzione incapsula la logica di interrogazione dei metadati interni (PRAGMA).
  // Restituisce un booleano, disaccoppiando l'ispezione del DB dalla logica di alterazione.
  const columnExists = (tableName, columnName) => {
    // Il metodo .pragma() esegue query sui metadati e restituisce un array di oggetti colonna
    const info = db.pragma(`table_info(${tableName})`);
    return info.some(col => col.name === columnName);
  };

  // ==========================================
  // BLOCCO DDL (Data Definition Language) E IDEMPOTENZA
  // ==========================================
  
  if (!columnExists('Cliente', 'metodoPagamentoPredefinito')) {
    console.log('Aggiunta colonna metodoPagamentoPredefinito a Cliente...');
    // Utilizzo di db.exec() consentito poiché le stringhe SQL sono hardcoded (statiche)
    // e prive di input utente, azzerando la superficie di attacco per SQL Injection.
    db.exec('ALTER TABLE Cliente ADD COLUMN metodoPagamentoPredefinito TEXT');
  } else {
    console.log('Colonna metodoPagamentoPredefinito già esistente in Cliente.');
  }

  if (!columnExists('Ristorante', 'penaleNoShow')) {
    console.log('Aggiunta colonna penaleNoShow a Ristorante...');
    db.exec('ALTER TABLE Ristorante ADD COLUMN penaleNoShow REAL DEFAULT 0');
  }

  if (!columnExists('Ristorante', 'messaggioPenale')) {
    console.log('Aggiunta colonna messaggioPenale a Ristorante...');
    db.exec('ALTER TABLE Ristorante ADD COLUMN messaggioPenale TEXT');
  }

  if (!columnExists('Ristorante', 'pin')) {
    console.log('Aggiunta colonna pin a Ristorante...');
    db.exec('ALTER TABLE Ristorante ADD COLUMN pin TEXT');
  }

  console.log('Schema del database aggiornato con successo!');
} catch (error) {
  console.error('Errore durante l\'aggiornamento dello schema:', error);
  // [PATTERN: FAIL-FAST]
  // Terminazione forzata del processo Node.js con codice di errore (1).
  process.exit(1);
} finally {
  // Rilascio del lock sul file system per garantire l'integrità e prevenire deadlock.
  db.close();
}
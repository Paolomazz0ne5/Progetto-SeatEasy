const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.resolve(process.cwd(), 'database.db');
const db = new Database(dbPath, { verbose: console.log });

console.log('Aggiornamento dello schema del database in corso...');

try {
  // Funzione helper per verificare se una colonna esiste
  const columnExists = (tableName, columnName) => {
    const info = db.pragma(`table_info(${tableName})`);
    return info.some(col => col.name === columnName);
  };

  // 1. Aggiornamento tabella Cliente
  if (!columnExists('Cliente', 'metodoPagamentoPredefinito')) {
    console.log('Aggiunta colonna metodoPagamentoPredefinito a Cliente...');
    db.exec('ALTER TABLE Cliente ADD COLUMN metodoPagamentoPredefinito TEXT');
  } else {
    console.log('Colonna metodoPagamentoPredefinito già esistente in Cliente.');
  }

  // 2. Aggiornamento tabella Ristorante
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
  process.exit(1);
} finally {
  db.close();
}

import Database from 'better-sqlite3';
import path from 'path';

// Crea il file del database nella cartella principale
const dbPath = path.resolve(process.cwd(), 'database.db');
const db = new Database(dbPath, { verbose: console.log });

console.log('Inizializzazione del database in corso...');

// Eseguiamo le query per creare le tabelle principali
db.exec(`
  PRAGMA foreign_keys = ON;

  CREATE TABLE IF NOT EXISTS Account (
      idAccount INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      nome TEXT NOT NULL,
      cognome TEXT NOT NULL,
      telefono TEXT,
      dataCreazione TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS GestoreRistorante (
      idAccount INTEGER PRIMARY KEY,
      ruolo TEXT NOT NULL,
      pin TEXT,
      FOREIGN KEY (idAccount) REFERENCES Account(idAccount) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS Ristorante (
      idRistorante INTEGER PRIMARY KEY AUTOINCREMENT,
      idGestoreRistorante INTEGER NOT NULL,
      nome TEXT NOT NULL,
      indirizzo TEXT NOT NULL,
      telefono TEXT,
      email TEXT,
      politicaRistorante TEXT,
      FOREIGN KEY (idGestoreRistorante) REFERENCES GestoreRistorante(idAccount) ON DELETE RESTRICT
  );
`);

// Inseriamo un dato di prova (se la tabella è vuota)
const count = db.prepare('SELECT COUNT(*) as count FROM Account').get();
if (count.count === 0) {
  const insertAccount = db.prepare('INSERT INTO Account (email, password, nome, cognome) VALUES (?, ?, ?, ?)');
  const res = insertAccount.run('admin@ristorante.it', 'password_hashata_123', 'Mario', 'Rossi');
  
  const insertGestore = db.prepare('INSERT INTO GestoreRistorante (idAccount, ruolo, pin) VALUES (?, ?, ?)');
  insertGestore.run(res.lastInsertRowid, 'Admin', '1234');

  const insertRisto = db.prepare('INSERT INTO Ristorante (idGestoreRistorante, nome, indirizzo) VALUES (?, ?, ?)');
  insertRisto.run(res.lastInsertRowid, 'La Trattoria di Mario', 'Via Roma 1, Milano');
  
  console.log('Dati di prova inseriti con successo!');
}

console.log('Setup completato! File database.db pronto.');
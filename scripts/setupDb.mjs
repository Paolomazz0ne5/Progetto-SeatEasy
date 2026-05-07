import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.resolve(process.cwd(), 'database.db');
const db = new Database(dbPath, { verbose: console.log });

console.log('Inizializzazione del database in corso...');

db.exec(`
  PRAGMA foreign_keys = ON;

  -- 1. ACCOUNT E UTENTI
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
      PIN TEXT,
      FOREIGN KEY (idAccount) REFERENCES Account(idAccount) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS Cliente (
      idAccount INTEGER PRIMARY KEY,
      richiesteSpeciali TEXT,
      FOREIGN KEY (idAccount) REFERENCES Account(idAccount) ON DELETE CASCADE
  );

  -- 2. STRUTTURA RISTORANTE
  CREATE TABLE IF NOT EXISTS Ristorante (
      idRistorante INTEGER PRIMARY KEY AUTOINCREMENT,
      idGestoreRistorante INTEGER NOT NULL,
      nome TEXT NOT NULL,
      indirizzo TEXT NOT NULL,
      telefono TEXT,
      email TEXT,
      politicaNoShow TEXT,
      caparraRichiesta REAL,
      tipologia TEXT,
      foto_url TEXT,
      FOREIGN KEY (idGestoreRistorante) REFERENCES GestoreRistorante(idAccount) ON DELETE RESTRICT
  );

  CREATE TABLE IF NOT EXISTS Sala (
      idSala INTEGER PRIMARY KEY AUTOINCREMENT,
      idRistorante INTEGER NOT NULL,
      nome TEXT NOT NULL,
      capacita INTEGER NOT NULL,
      layoutDescrizione TEXT,
      attiva INTEGER DEFAULT 1,
      FOREIGN KEY (idRistorante) REFERENCES Ristorante(idRistorante) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS Tavolo (
      idTavolo INTEGER PRIMARY KEY AUTOINCREMENT,
      idSala INTEGER NOT NULL,
      numero INTEGER NOT NULL,
      posti INTEGER NOT NULL,
      posizione TEXT,
      stato TEXT,
      FOREIGN KEY (idSala) REFERENCES Sala(idSala) ON DELETE CASCADE
  );

  -- 3. ORARI E TURNI
  CREATE TABLE IF NOT EXISTS Orario (
      idOrario INTEGER PRIMARY KEY AUTOINCREMENT,
      idRistorante INTEGER NOT NULL,
      oraInizio TEXT NOT NULL,
      oraFine TEXT NOT NULL,
      durataMediaServizio INTEGER,
      FOREIGN KEY (idRistorante) REFERENCES Ristorante(idRistorante) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS Turno (
      idTurno INTEGER PRIMARY KEY AUTOINCREMENT,
      idOrario INTEGER NOT NULL,
      nomeTurno TEXT NOT NULL,
      maxPrenotazioni INTEGER,
      durataMedia INTEGER DEFAULT 90,
      FOREIGN KEY (idOrario) REFERENCES Orario(idOrario) ON DELETE CASCADE
  );

  -- 4. PRENOTAZIONI E OPERAZIONI
  CREATE TABLE IF NOT EXISTS Prenotazione (
      idPrenotazione INTEGER PRIMARY KEY AUTOINCREMENT,
      idCliente INTEGER NOT NULL,
      idTurno INTEGER NOT NULL,
      dataPrenotazione TEXT NOT NULL,
      numeroPersone INTEGER NOT NULL,
      stato TEXT NOT NULL,
      noteCliente TEXT,
      caparraPagata INTEGER DEFAULT 0,
      dataCreazione TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (idCliente) REFERENCES Cliente(idAccount) ON DELETE RESTRICT,
      FOREIGN KEY (idTurno) REFERENCES Turno(idTurno) ON DELETE RESTRICT
  );

  CREATE TABLE IF NOT EXISTS OccupazioneTavolo (
      idTavolo INTEGER NOT NULL,
      idPrenotazione INTEGER NOT NULL,
      PRIMARY KEY (idTavolo, idPrenotazione),
      FOREIGN KEY (idTavolo) REFERENCES Tavolo(idTavolo) ON DELETE CASCADE,
      FOREIGN KEY (idPrenotazione) REFERENCES Prenotazione(idPrenotazione) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS Pagamento (
      idPagamento INTEGER PRIMARY KEY AUTOINCREMENT,
      idPrenotazione INTEGER NOT NULL,
      importo REAL NOT NULL,
      dataPagamento TEXT NOT NULL,
      ricevuta TEXT,
      metodoPagamento TEXT,
      FOREIGN KEY (idPrenotazione) REFERENCES Prenotazione(idPrenotazione) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS Notifica (
      idNotifica INTEGER PRIMARY KEY AUTOINCREMENT,
      idPrenotazione INTEGER NOT NULL,
      tipo TEXT,
      messaggio TEXT,
      dataInvio TEXT,
      statoInvio TEXT,
      FOREIGN KEY (idPrenotazione) REFERENCES Prenotazione(idPrenotazione) ON DELETE CASCADE
  );
  CREATE TABLE IF NOT EXISTS GalleriaRistorante (
    idImmagine INTEGER PRIMARY KEY AUTOINCREMENT,
    idRistorante INTEGER NOT NULL,
    immagineUrl TEXT NOT NULL,
    prezzo REAL,
    nota TEXT,
    FOREIGN KEY (idRistorante) REFERENCES Ristorante(idRistorante) ON DELETE CASCADE
);
`);

// Inseriamo i dati di prova di base
const count = db.prepare('SELECT COUNT(*) as count FROM Account').get();
if (count.count === 0) {
    // 1. Creo l'Admin
    const insertAccount = db.prepare('INSERT INTO Account (email, password, nome, cognome) VALUES (?, ?, ?, ?)');
    const resAdmin = insertAccount.run('admin@seateasy.it', 'hash_pass', 'Mario', 'Gestore');

    db.prepare('INSERT INTO GestoreRistorante (idAccount, ruolo, PIN) VALUES (?, ?, ?)').run(resAdmin.lastInsertRowid, 'Admin', '1234');

    // 2. Creo il Ristorante
    const insertRisto = db.prepare('INSERT INTO Ristorante (idGestoreRistorante, nome, indirizzo, politicaNoShow, caparraRichiesta, tipologia) VALUES (?, ?, ?, ?, ?, ?)');
    const resRisto = insertRisto.run(resAdmin.lastInsertRowid, 'La Trattoria di Mario', 'Via Roma 1, Milano', 'Caparra trattenuta dopo 15 min di ritardo', 20.00, 'Italiano');

    // 3. Creo una Sala e un Tavolo di prova per la Dashboard
    const insertSala = db.prepare('INSERT INTO Sala (idRistorante, nome, capacita, attiva) VALUES (?, ?, ?, ?)');
    const resSala = insertSala.run(resRisto.lastInsertRowid, 'Sala Principale', 50, 1);

    db.prepare('INSERT INTO Tavolo (idSala, numero, posti, stato) VALUES (?, ?, ?, ?)').run(resSala.lastInsertRowid, 1, 4, 'Libero');

    // 4. Creo un Cliente finto
    const resCliente = insertAccount.run('cliente@email.it', 'hash_pass', 'Luigi', 'Bianchi');
    db.prepare('INSERT INTO Cliente (idAccount, richiesteSpeciali) VALUES (?, ?)').run(resCliente.lastInsertRowid, 'Allergia alle noci');

    console.log('Dati di prova (Ristorante, Sale, Tavoli e Clienti) inseriti con successo!');
}

console.log('Setup completato! Database allineato al report ufficiale.');
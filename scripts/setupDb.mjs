import Database from 'better-sqlite3';
import path from 'path';

// 1. PATH DINAMICO: Usare process.cwd() garantisce che il db venga trovato a prescindere da dove viene lanciato lo script
const dbPath = path.resolve(process.cwd(), 'database.db');
const db = new Database(dbPath, { verbose: console.log });

console.log('Inizializzazione del database in corso...');

db.exec(`
  -- i vincoli di chiave esterna (Foreign Keys) sono disabilitati di default per retrocompatibilità. 
  -- Questa istruzione li forza ad essere attivi, garantendo l'integrità referenziale del nostro schema.
  PRAGMA foreign_keys = ON;

  -- ==========================================
  -- 1. ACCOUNT E UTENTI (Pattern Generalizzazione)
  -- ==========================================
  CREATE TABLE IF NOT EXISTS Account (
      idAccount INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL, -- Nota esame: qui salveremo l'hash (es. bcrypt), MAI in chiaro.
      nome TEXT NOT NULL,
      cognome TEXT NOT NULL,
      telefono TEXT,
      dataCreazione TEXT DEFAULT CURRENT_TIMESTAMP
  );

  -- MAPPATURA SOTTOCLASSE: GestoreRistorante
  CREATE TABLE IF NOT EXISTS GestoreRistorante (
      idAccount INTEGER PRIMARY KEY, -- Funge SIA da Primary Key che da Foreign Key
      FOREIGN KEY (idAccount) REFERENCES Account(idAccount) ON DELETE CASCADE
  );

  -- MAPPATURA SOTTOCLASSE: Cliente
  CREATE TABLE IF NOT EXISTS Cliente (
      idAccount INTEGER PRIMARY KEY,
      metodoPagamentoPredefinito TEXT,
      FOREIGN KEY (idAccount) REFERENCES Account(idAccount) ON DELETE CASCADE
  );

  -- ==========================================
  -- 2. STRUTTURA RISTORANTE
  -- ==========================================
  CREATE TABLE IF NOT EXISTS Ristorante (
      idRistorante INTEGER PRIMARY KEY AUTOINCREMENT,
      idGestoreRistorante INTEGER NOT NULL,
      nome TEXT NOT NULL,
      indirizzo TEXT NOT NULL,
      telefono TEXT,
      email TEXT,
      penaleNoShow REAL DEFAULT 0,
      messaggioPenale TEXT,
      pin TEXT,
      caparraRichiesta REAL,
      tipologia TEXT,
      foto_url TEXT,
      --  ON DELETE RESTRICT
      -- Se un gestore viene cancellato, NON possiamo cancellare a cascata il ristorante,
      -- altrimenti perderemmo lo storico fiscale. L'operazione di delete viene bloccata.
      FOREIGN KEY (idGestoreRistorante) REFERENCES GestoreRistorante(idAccount) ON DELETE RESTRICT
  );

  CREATE TABLE IF NOT EXISTS Sala (
      idSala INTEGER PRIMARY KEY AUTOINCREMENT,
      idRistorante INTEGER NOT NULL,
      nome TEXT NOT NULL,
      capacita INTEGER NOT NULL,
      attiva INTEGER DEFAULT 1,
      FOREIGN KEY (idRistorante) REFERENCES Ristorante(idRistorante) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS Tavolo (
      idTavolo INTEGER PRIMARY KEY AUTOINCREMENT,
      idSala INTEGER NOT NULL,
      numero INTEGER NOT NULL,
      posti INTEGER NOT NULL,
      stato TEXT,
      FOREIGN KEY (idSala) REFERENCES Sala(idSala) ON DELETE CASCADE
  );

  -- ==========================================
  -- 3. ORARI E TURNI
  -- ==========================================
  CREATE TABLE IF NOT EXISTS Orario (
      idOrario INTEGER PRIMARY KEY AUTOINCREMENT,
      idRistorante INTEGER NOT NULL,
      oraInizio TEXT NOT NULL,
      oraFine TEXT NOT NULL,
      FOREIGN KEY (idRistorante) REFERENCES Ristorante(idRistorante) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS Turno (
      idTurno INTEGER PRIMARY KEY AUTOINCREMENT,
      idOrario INTEGER NOT NULL,
      durataMedia INTEGER DEFAULT 90,
      FOREIGN KEY (idOrario) REFERENCES Orario(idOrario) ON DELETE CASCADE
  );

  -- ==========================================
  -- 4. PRENOTAZIONI E OPERAZIONI
  -- ==========================================
  CREATE TABLE IF NOT EXISTS Prenotazione (
      idPrenotazione INTEGER PRIMARY KEY AUTOINCREMENT,
      idCliente INTEGER NOT NULL,
      idTurno INTEGER NOT NULL,
      dataPrenotazione TEXT NOT NULL,
      numeroPersone INTEGER NOT NULL,
      stato TEXT NOT NULL DEFAULT 'In Attesa',
      noteCliente TEXT,
      caparraPagata REAL DEFAULT 0,
      dataCreazione TEXT DEFAULT CURRENT_TIMESTAMP,
      -- VINCOLI FISCALI/STORICI: RESTRICT
      -- Non si possono cancellare clienti o turni se hanno prenotazioni associate!
      FOREIGN KEY (idCliente) REFERENCES Cliente(idAccount) ON DELETE RESTRICT,
      FOREIGN KEY (idTurno) REFERENCES Turno(idTurno) ON DELETE RESTRICT
  );

  -- TABELLA PONTE (Relazione Molti-a-Molti)
  CREATE TABLE IF NOT EXISTS OccupazioneTavolo (
      idTavolo INTEGER NOT NULL,
      idPrenotazione INTEGER NOT NULL,
      PRIMARY KEY (idTavolo, idPrenotazione), -- Chiave primaria composta!
      FOREIGN KEY (idTavolo) REFERENCES Tavolo(idTavolo) ON DELETE CASCADE,
      FOREIGN KEY (idPrenotazione) REFERENCES Prenotazione(idPrenotazione) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS Pagamento (
      idPagamento INTEGER PRIMARY KEY AUTOINCREMENT,
      idPrenotazione INTEGER NOT NULL,
      importo REAL NOT NULL,
      dataPagamento TEXT NOT NULL,
      metodoPagamento TEXT,
      FOREIGN KEY (idPrenotazione) REFERENCES Prenotazione(idPrenotazione) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS Notifica (
      idNotifica INTEGER PRIMARY KEY AUTOINCREMENT,
      idPrenotazione INTEGER NOT NULL,
      tipo TEXT,
      messaggio TEXT,
      destinatario TEXT,
      canale TEXT,
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

// ==========================================
// 5. SEEDING (Popolamento Iniziale)
// ==========================================
// Controllo dell'idempotenza: si inseriscono i dati SOLO se il DB è vuoto.
const count = db.prepare('SELECT COUNT(*) as count FROM Account').get();

if (count.count === 0) {
    // Uso le query parametrizzate (?) per prevenire SQL Injection, anche nel seeding
    const insertAccount = db.prepare('INSERT INTO Account (email, password, nome, cognome) VALUES (?, ?, ?, ?)');
    
    // .run() restituisce un oggetto info con lastInsertRowid
    const resAdmin = insertAccount.run('admin@seateasy.it', 'hash_pass', 'Mario', 'Gestore');
    db.prepare('INSERT INTO GestoreRistorante (idAccount) VALUES (?)').run(resAdmin.lastInsertRowid);

    const insertRisto = db.prepare('INSERT INTO Ristorante (idGestoreRistorante, nome, indirizzo, penaleNoShow, caparraRichiesta, tipologia) VALUES (?, ?, ?, ?, ?, ?)');
    const resRisto = insertRisto.run(resAdmin.lastInsertRowid, 'La Trattoria di Mario', 'Via Roma 1, Milano', 15.00, 20.00, 'Italiano');

    const insertSala = db.prepare('INSERT INTO Sala (idRistorante, nome, capacita, attiva) VALUES (?, ?, ?, ?)');
    const resSala = insertSala.run(resRisto.lastInsertRowid, 'Sala Principale', 50, 1);

    db.prepare('INSERT INTO Tavolo (idSala, numero, posti, stato) VALUES (?, ?, ?, ?)').run(resSala.lastInsertRowid, 1, 4, 'Libero');

    const resCliente = insertAccount.run('cliente@email.it', 'hash_pass', 'Luigi', 'Bianchi');
    db.prepare('INSERT INTO Cliente (idAccount) VALUES (?)').run(resCliente.lastInsertRowid);

    console.log('Dati di prova (Ristorante, Sale, Tavoli e Clienti) inseriti con successo!');
}

console.log('Setup completato! Database allineato al report ufficiale.');
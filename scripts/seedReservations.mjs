import Database from 'better-sqlite3';
import path from 'path';

// Definiamo il percorso assoluto per il file del database per evitare problemi di path relativi
const dbPath = path.resolve(process.cwd(), 'database.db');
// Inizializziamo la connessione a SQLite. L'opzione 'verbose' stamperà ogni query eseguita (ottimo per il debug)
const db = new Database(dbPath, { verbose: console.log });

console.log('Avvio script di seeding per le prenotazioni fittizie...');

// --- STEP 1: VERIFICA O CREAZIONE DELLE IMPOSTAZIONI BASE (Orario e Turno) ---
// Per poter inserire delle prenotazioni, il database deve avere almeno un Turno collegato a un Orario.
const countOrario = db.prepare('SELECT COUNT(*) as c FROM Orario').get();
let idOrario = 1;
let idTurno = 1;

// Se la tabella Orario è vuota, creiamo i dati di default
if (countOrario.c === 0) {
  // Inseriamo un orario standard (es. servizio dalle 19:00 alle 23:30)
  const insertOrario = db.prepare('INSERT INTO Orario (idRistorante, oraInizio, oraFine, durataMediaServizio) VALUES (?, ?, ?, ?)');
  const resOrario = insertOrario.run(1, '19:00', '23:30', 90);
  idOrario = resOrario.lastInsertRowid; // Recuperiamo l'ID appena generato
  
  // Colleghiamo un "Turno di Cena" all'orario appena creato
  const insertTurno = db.prepare('INSERT INTO Turno (idOrario, nomeTurno) VALUES (?, ?)');
  const resTurno = insertTurno.run(idOrario, 'Cena');
  idTurno = resTurno.lastInsertRowid; 
} else {
  // Se i turni esistono già, peschiamo il primo ID disponibile per non creare duplicati nel DB
  const turno = db.prepare('SELECT idTurno FROM Turno LIMIT 1').get();
  if (turno) idTurno = turno.idTurno;
}

// --- STEP 2: PREPARAZIONE QUERY CLIENTI ---
// Usiamo db.prepare per "compilare" le query in anticipo. Usandole poi dentro un ciclo for, l'esecuzione sarà molto più rapida.
const insertAccount = db.prepare('INSERT INTO Account (email, password, nome, cognome, telefono) VALUES (?, ?, ?, ?, ?)');
const insertCliente = db.prepare('INSERT INTO Cliente (idAccount) VALUES (?)');

// Controllo di Idempotenza: verifichiamo se questo script è già stato eseguito in passato.
// Lo facciamo cercando le email fittizie che finiscono con '@seed.test'.
const existingClients = db.prepare("SELECT idAccount FROM Account WHERE email LIKE '%@seed.test'").all();

// Se l'array è vuoto, il database è pulito e possiamo iniettare i dati
if (existingClients.length === 0) {
  
  // --- INIZIO TRANSAZIONE ---
  // Racchiudiamo tutti gli inserimenti in una transazione (db.transaction).
  // Questo garantisce due cose: prestazioni altissime (scrive sul disco una volta sola) 
  // e sicurezza totale (se fallisce un inserimento, annulla tutto ed evita dati corrotti o a metà).
  const inserisciDatiSeed = db.transaction(() => {
    
    // Anagrafiche fittizie dei clienti da inserire
    const clients = [
      { e: 'm.rossi@seed.test', p: 'x', n: 'Mario', c: 'Rossi', t: '3331234567', rs: 'Tavolo vicino alla finestra' },
      { e: 'g.verdi@seed.test', p: 'x', n: 'Giulia', c: 'Verdi', t: '3339876543', rs: '' },
      { e: 'a.neri@seed.test', p: 'x', n: 'Alessandro', c: 'Neri', t: '3201112233', rs: 'Seggiolone per bambino' }
    ];

    let clientIds = []; // Ci salviamo qui gli ID generati per usarli subito dopo nelle prenotazioni
    
    // Inseriamo a cascata l'Account e il relativo profilo Cliente
    for (const client of clients) {
      const resA = insertAccount.run(client.e, client.p, client.n, client.c, client.t);
      insertCliente.run(resA.lastInsertRowid); // Il vincolo Foreign Key collega il Cliente all'Account
      clientIds.push(resA.lastInsertRowid);
    }
    const insertPrenotazione = db.prepare('INSERT INTO Prenotazione (idCliente, idTurno, dataPrenotazione, numeroPersone, stato, noteCliente, caparraPagata) VALUES (?, ?, ?, ?, ?, ?, ?)');
    
    const today = new Date();
    const d1 = new Date(); d1.setDate(today.getDate() + 1);
    const d2 = new Date(); d2.setDate(today.getDate() + 2);

    insertPrenotazione.run(clientIds[0], idTurno, d1.toISOString().split('T')[0], 4, 'Confermata', 'Anniversario', 20);
    insertPrenotazione.run(clientIds[1], idTurno, d1.toISOString().split('T')[0], 2, 'In Attesa', '', 0);
    insertPrenotazione.run(clientIds[2], idTurno, d2.toISOString().split('T')[0], 3, 'Confermata', '', 20);
    
    const utenteEsistente = db.prepare("SELECT idAccount FROM Account WHERE nome = 'Luigi' AND cognome = 'Bianchi' LIMIT 1").get();
    if (utenteEsistente) {
      insertPrenotazione.run(utenteEsistente.idAccount, idTurno, today.toISOString().split('T')[0], 5, 'Confermata', 'Allergia alle noci', 0);
    }

    const pastData = new Date(); 
    pastData.setDate(today.getDate() - 10);
    insertPrenotazione.run(clientIds[0], idTurno, pastData.toISOString().split('T')[0], 2, 'noShow', '', 0);
    
    pastData.setDate(today.getDate() - 20);
    insertPrenotazione.run(clientIds[0], idTurno, pastData.toISOString().split('T')[0], 2, 'noShow', '', 0);

    pastData.setDate(today.getDate() - 15);
    insertPrenotazione.run(clientIds[1], idTurno, pastData.toISOString().split('T')[0], 3, 'noShow', '', 0);
  });

  inserisciDatiSeed();
  console.log('Seeding completato.');
} else {
  console.log('Dati già presenti.');
}

db.close();
import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.resolve(process.cwd(), 'database.db');
const db = new Database(dbPath, { verbose: console.log });

console.log('Seeding mock reservations...');

// 1. Ensure we have an Orario and Turno
const countOrario = db.prepare('SELECT COUNT(*) as c FROM Orario').get();
let idOrario = 1;
let idTurno = 1;
if (countOrario.c === 0) {
  const insertOrario = db.prepare('INSERT INTO Orario (idRistorante, oraInizio, oraFine, durataMediaServizio) VALUES (?, ?, ?, ?)');
  const resOrario = insertOrario.run(1, '19:00', '23:30', 90);
  idOrario = resOrario.lastInsertRowid;
  
  const insertTurno = db.prepare('INSERT INTO Turno (idOrario, nomeTurno, maxPrenotazioni) VALUES (?, ?, ?)');
  const resTurno = insertTurno.run(idOrario, 'Cena', 20);
  idTurno = resTurno.lastInsertRowid;
} else {
  // Grab the existing Turno
  const turno = db.prepare('SELECT idTurno FROM Turno LIMIT 1').get();
  if (turno) idTurno = turno.idTurno;
}

// 2. Create more Clients
const insertAccount = db.prepare('INSERT INTO Account (email, password, nome, cognome, telefono) VALUES (?, ?, ?, ?, ?)');
const insertCliente = db.prepare('INSERT INTO Cliente (idAccount, richiesteSpeciali) VALUES (?, ?)');

// Check if test users exist
const existingClients = db.prepare("SELECT idAccount FROM Account WHERE email LIKE '%@seed.test'").all();
if (existingClients.length === 0) {
  const clients = [
    { e: 'm.rossi@seed.test', p: 'x', n: 'Mario', c: 'Rossi', t: '3331234567', rs: 'Tavolo vicino alla finestra' },
    { e: 'g.verdi@seed.test', p: 'x', n: 'Giulia', c: 'Verdi', t: '3339876543', rs: '' },
    { e: 'a.neri@seed.test', p: 'x', n: 'Alessandro', c: 'Neri', t: '3201112233', rs: 'Seggiolone per bambino' }
  ];

  let clientIds = [];
  for (const client of clients) {
    const resA = insertAccount.run(client.e, client.p, client.n, client.c, client.t);
    insertCliente.run(resA.lastInsertRowid, client.rs);
    clientIds.push(resA.lastInsertRowid);
  }

  // 3. Create Reservations
  const insertPrenotazione = db.prepare('INSERT INTO Prenotazione (idCliente, idTurno, dataPrenotazione, numeroPersone, stato, noteCliente, caparraPagata) VALUES (?, ?, ?, ?, ?, ?, ?)');
  
  // Date around today
  const today = new Date();
  const d1 = new Date(); d1.setDate(today.getDate() + 1);
  const d2 = new Date(); d2.setDate(today.getDate() + 2);

  // Active reservations
  insertPrenotazione.run(clientIds[0], idTurno, d1.toISOString().split('T')[0], 4, 'Confermata', 'Anniversario', 20);
  insertPrenotazione.run(clientIds[1], idTurno, d1.toISOString().split('T')[0], 2, 'In Attesa', '', 0);
  insertPrenotazione.run(clientIds[2], idTurno, d2.toISOString().split('T')[0], 3, 'Confermata', '', 20);
  
  // Existing client (Luigi Bianchi, id 2)
  insertPrenotazione.run(2, idTurno, today.toISOString().split('T')[0], 5, 'Confermata', 'Allergia alle noci', 0);

  // 4. Create NoShow history to test the reliability icon
  // Mario Rossi has 2 previous noshows
  const pastData = new Date(); pastData.setDate(today.getDate() - 10);
  insertPrenotazione.run(clientIds[0], idTurno, pastData.toISOString().split('T')[0], 2, 'noShow', '', 0);
  pastData.setDate(today.getDate() - 20);
  insertPrenotazione.run(clientIds[0], idTurno, pastData.toISOString().split('T')[0], 2, 'noShow', '', 0);

  // Giulia Verdi has 1 previous noshow
  pastData.setDate(today.getDate() - 15);
  insertPrenotazione.run(clientIds[1], idTurno, pastData.toISOString().split('T')[0], 3, 'noShow', '', 0);

  console.log('Seeding completed. Dummy reservations and clients injected.');
} else {
  console.log('Seed data already present. Skipping...');
}

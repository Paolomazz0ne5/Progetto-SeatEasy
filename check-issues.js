const Database = require('better-sqlite3');
const db = new Database('database.db');
const tavoli = db.prepare('SELECT idTavolo, numero, stato, idSala FROM Tavolo').all();
console.log('Tavoli:', tavoli);

const orari = db.prepare('SELECT * FROM Orario').all();
console.log('Orari:', orari);

const turni = db.prepare('SELECT * FROM Turno').all();
console.log('Turni:', turni);

db.close();

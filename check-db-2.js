const Database = require('better-sqlite3');
const db = new Database('database.db');
const sale = db.prepare('SELECT * FROM Sala').all();
console.log('SALE:', sale);
const tavoli = db.prepare('SELECT * FROM Tavolo').all();
console.log('TAVOLI:', tavoli);
db.close();

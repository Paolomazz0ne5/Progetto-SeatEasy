const Database = require('better-sqlite3');
const db = new Database('database.db');
// 1. Migrate Orari to idRistorante = 2
// (This was already successful, but it's safe to run again)
db.prepare("UPDATE Orario SET idRistorante = 2 WHERE idRistorante = 1").run();
console.log('Migrati orari a idRistorante 2');

// 2. Reset all tables to Libero
db.prepare("UPDATE Tavolo SET stato = 'Libero'").run();
console.log('Tutti i tavoli resettati a Libero');

db.close();

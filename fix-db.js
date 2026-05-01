const Database = require('better-sqlite3');
const db = new Database('database.db');
db.prepare('UPDATE Sala SET idRistorante = 2 WHERE idRistorante = 1').run();
console.log('Aggiornato idRistorante nelle sale a 2');
db.close();

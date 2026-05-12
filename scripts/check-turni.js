const Database = require('better-sqlite3');
const db = new Database('database.db');
const orari = db.prepare('SELECT * FROM Orario').all();
console.log('ORARI:', orari);
const turni = db.prepare('SELECT * FROM Turno').all();
console.log('TURNI:', turni);
db.close();

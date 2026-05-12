const Database = require('better-sqlite3');
const db = new Database('database.db');
const ristoranti = db.prepare('SELECT idRistorante, nome FROM Ristorante').all();
console.log('Ristoranti:', ristoranti);
const sale = db.prepare('SELECT * FROM Sala').all();
console.log('Sale:', sale);
db.close();

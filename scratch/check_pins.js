const Database = require('better-sqlite3');
const path = require('path');
const dbPath = path.resolve(__dirname, '../database.db');
const db = new Database(dbPath);
const rows = db.prepare("SELECT * FROM GestoreRistorante").all();
console.log(JSON.stringify(rows, null, 2));
db.close();

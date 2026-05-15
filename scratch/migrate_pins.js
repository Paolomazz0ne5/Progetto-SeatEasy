const Database = require('better-sqlite3');
const path = require('path');
const dbPath = path.resolve(__dirname, '../database.db');
const db = new Database(dbPath);
const res = db.prepare("UPDATE GestoreRistorante SET pin = NULL WHERE pin = '0000'").run();
console.log(`Updated ${res.changes} rows.`);
db.close();

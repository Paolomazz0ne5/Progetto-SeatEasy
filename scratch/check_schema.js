const Database = require('better-sqlite3');
const path = require('path');
const dbPath = path.resolve(__dirname, '../database.db');
const db = new Database(dbPath);
const schema = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='GestoreRistorante'").get();
console.log(schema.sql);
db.close();

const Database = require('better-sqlite3');
const path = require('path');
const dbPath = path.resolve(__dirname, '../database.db');
const db = new Database(dbPath);

const tables = ['Orario', 'Pagamento', 'Sala'];
tables.forEach(table => {
    const schema = db.prepare(`SELECT sql FROM sqlite_master WHERE type='table' AND name='${table}'`).get();
    console.log(`--- ${table} ---`);
    console.log(schema ? schema.sql : 'Table not found');
});

db.close();

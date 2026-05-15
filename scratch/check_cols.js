const Database = require('better-sqlite3');
const path = require('path');
const dbPath = path.resolve(__dirname, '../database.db');
const db = new Database(dbPath);

const tables = ['Orario', 'Pagamento', 'Sala'];
tables.forEach(table => {
    console.log(`--- ${table} ---`);
    console.log(db.prepare(`PRAGMA table_info(${table})`).all());
});

db.close();

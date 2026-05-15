const Database = require('better-sqlite3');
const path = require('path');
const dbPath = path.resolve(__dirname, '../database.db');
const db = new Database(dbPath);

function dropColumn(table, column) {
    try {
        db.prepare(`ALTER TABLE ${table} DROP COLUMN ${column}`).run();
        console.log(`Column '${column}' dropped from table '${table}'.`);
    } catch (error) {
        console.error(`Failed to drop '${column}' from '${table}': ${error.message}`);
        // If it fails, it might be because the column doesn't exist or version issue.
    }
}

dropColumn('Orario', 'durataMediaServizio');
dropColumn('Pagamento', 'ricevuta');
dropColumn('Sala', 'layoutDescrizione');
dropColumn('Sala', 'posizione'); // Just in case it exists and I missed it

db.close();

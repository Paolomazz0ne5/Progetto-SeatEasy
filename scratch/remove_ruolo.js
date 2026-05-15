const Database = require('better-sqlite3');
const path = require('path');
const dbPath = path.resolve(__dirname, '../database.db');
const db = new Database(dbPath);

try {
    db.prepare("ALTER TABLE GestoreRistorante DROP COLUMN ruolo").run();
    console.log("Column 'ruolo' dropped successfully.");
} catch (error) {
    console.error("Standard DROP COLUMN failed, attempting manual migration:", error.message);
    
    // Manual migration
    db.transaction(() => {
        db.prepare("CREATE TABLE GestoreRistorante_new (idAccount INTEGER PRIMARY KEY, pin TEXT, FOREIGN KEY (idAccount) REFERENCES Account(idAccount) ON DELETE CASCADE)").run();
        db.prepare("INSERT INTO GestoreRistorante_new (idAccount, pin) SELECT idAccount, pin FROM GestoreRistorante").run();
        db.prepare("DROP TABLE GestoreRistorante").run();
        db.prepare("ALTER TABLE GestoreRistorante_new RENAME TO GestoreRistorante").run();
    })();
    console.log("Manual migration completed successfully.");
}

db.close();

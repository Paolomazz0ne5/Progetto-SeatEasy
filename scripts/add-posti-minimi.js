const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.resolve(process.cwd(), 'database.db');
const db = new Database(dbPath);

try {
  // Check if column already exists
  const cols = db.prepare("PRAGMA table_info(Tavolo)").all();
  const exists = cols.some(c => c.name === 'postiMinimi');
  if (exists) {
    console.log('Column postiMinimi already exists, skipping.');
  } else {
    db.prepare("ALTER TABLE Tavolo ADD COLUMN postiMinimi INTEGER NOT NULL DEFAULT 1").run();
    console.log('Column postiMinimi added successfully.');
  }
} finally {
  db.close();
}

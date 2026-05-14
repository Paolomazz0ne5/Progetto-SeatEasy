const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.resolve(process.cwd(), 'database.db');
const db = new Database(dbPath);

try {
  db.prepare(`
    CREATE TABLE IF NOT EXISTS GalleriaRistorante (
      idImmagine INTEGER PRIMARY KEY AUTOINCREMENT,
      idRistorante INTEGER NOT NULL,
      immagineUrl TEXT NOT NULL,
      prezzo REAL,
      nota TEXT,
      FOREIGN KEY (idRistorante) REFERENCES Ristorante(idRistorante) ON DELETE CASCADE
    )
  `).run();
  console.log('Table GalleriaRistorante ensured.');
} catch (err) {
  console.error('Error:', err);
} finally {
  db.close();
}

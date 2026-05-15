const Database = require('better-sqlite3');
const db = new Database('database.db');
// The Orario for Pranzo has idOrario = 2
// Insert a Turno for it
try {
  db.prepare(`
    INSERT INTO Turno (idOrario, nomeTurno) 
    VALUES (2, 'Pranzo')
  `).run();
  console.log('Turno Pranzo inserito');
} catch (e) {
  console.error(e.message);
}
db.close();

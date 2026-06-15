const db = require('better-sqlite3')('c:/Users/User/seateasy/database.db');
const orariWithoutTurni = db.prepare(`
  SELECT O.idOrario, O.nome, O.oraInizio, O.oraFine
  FROM Orario O
  LEFT JOIN Turno T ON O.idOrario = T.idOrario
  WHERE T.idTurno IS NULL
`).all();

console.log("Orari missing Turni:", orariWithoutTurni);

for (const o of orariWithoutTurni) {
  db.prepare(`
    INSERT INTO Turno (idOrario, nomeTurno, durataMedia)
    VALUES (?, ?, ?)
  `).run(o.idOrario, o.nome || 'Turno Generico', 90);
  console.log("Created Turno for Orario", o.idOrario);
}

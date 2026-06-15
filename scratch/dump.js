const db = require('better-sqlite3')('c:/Users/User/seateasy/database.db');
console.log("Orari:");
console.log(db.prepare("SELECT * FROM Orario").all());
console.log("Turni:");
console.log(db.prepare("SELECT * FROM Turno").all());

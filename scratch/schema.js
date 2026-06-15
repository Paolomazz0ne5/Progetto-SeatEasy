const db = require('better-sqlite3')('c:/Users/User/seateasy/database.db');
console.log(db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name IN ('Orario', 'Turno')").all());

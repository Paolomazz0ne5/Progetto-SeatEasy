import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.resolve(process.cwd(), 'database.db');
const db = new Database(dbPath);

const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='GalleriaRistorante'").get();

if (tables) {
    console.log('Table GalleriaRistorante exists.');
} else {
    console.log('Table GalleriaRistorante DOES NOT exist.');
}

db.close();

// Script to hash existing plain-text passwords in the SQLite database
import Database from 'better-sqlite3';
import path from 'path';
import bcrypt from 'bcryptjs';

function getDb() {
  const dbPath = path.resolve(process.cwd(), 'database.db');
  return new Database(dbPath);
}

function isHashed(password) {
  // bcrypt hashes start with $2a$,$2b$,$2y$ etc and have length 60
  return typeof password === 'string' && password.startsWith('$2') && password.length === 60;
}

function hashExistingPasswords() {
  const db = getDb();
  try {
    const accounts = db.prepare('SELECT idAccount, password FROM Account').all();
    const updateStmt = db.prepare('UPDATE Account SET password = ? WHERE idAccount = ?');
    let updatedCount = 0;
    for (const acc of accounts) {
      if (!isHashed(acc.password)) {
        const hashed = bcrypt.hashSync(acc.password, 10);
        updateStmt.run(hashed, acc.idAccount);
        updatedCount++;
      }
    }
    console.log(`Hashed ${updatedCount} password(s) out of ${accounts.length} account(s).`);
  } catch (err) {
    console.error('Error hashing passwords:', err);
  } finally {
    db.close();
  }
}

hashExistingPasswords();

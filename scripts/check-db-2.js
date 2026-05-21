const Database = require('better-sqlite3');
const path = require('path'); // 1. IMPORTANTE: Importiamo il modulo 'path' per gestire i percorsi

// 2. CORREZIONE PATH: Trasformiamo il percorso da relativo a assoluto.
// Se lo script si trova nella root, usiamo process.cwd(). Se si trova in una sottocartella, usiamo __dirname.
const dbPath = path.resolve(process.cwd(), 'database.db');
const db = new Database(dbPath);

// 3. CORREZIONE ARCHITETTURALE: Avvolgiamo le operazioni sensibili nel blocco try
try {
  const sale = db.prepare('SELECT * FROM Sala').all();
  console.log('SALE:', sale);

  const tavoli = db.prepare('SELECT * FROM Tavolo').all();
  console.log('TAVOLI:', tavoli);
  
} catch (error) {
  // 4. GESTIONE ERRORI: Se il database è corrotto o mancano le tabelle, intercettiamo l'errore senza crash
  console.error('Errore critico durante la lettura del database:', error);
  
} finally {
  // 5. CHIUSURA GARANTITA: Questo blocco viene eseguito SEMPRE. 
  // Anche se le query sopra falliscono, il database viene chiuso e il file sbloccato.
  db.close();
  console.log('Connessione al database chiusa in sicurezza.');
}
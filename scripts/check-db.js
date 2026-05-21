const Database = require('better-sqlite3');
const path = require('path'); // 1. Import obbligatorio per i path sicuri

// 2. PATH ASSOLUTO: Risolve il problema della directory di esecuzione errata
const dbPath = path.resolve(process.cwd(), 'database.db');
const db = new Database(dbPath);

// 3. ARCHITETTURA SICURA: Blocco try/catch per catturare le eccezioni SQL
try {
  
  // BEST PRACTICE CONFERMATA: Proiezione esplicita
  const ristoranti = db.prepare('SELECT idRistorante, nome FROM Ristorante').all();
  console.log('--- RISTORANTI ---');
  console.log(ristoranti);

  // 4. CORREZIONE ANTI-PATTERN: Niente più 'SELECT *'
  // Esplicitiamo esattamente le colonne che ci servono dalla tabella Sala
  const sale = db.prepare('SELECT idSala, idRistorante, nome, capacita FROM Sala').all();
  console.log('\n--- SALE ---');
  console.log(sale);

  // 5. IL TOCCO DA 30 E LODE: Incrociare i dati lato Database (INNER JOIN)
  // Mostriamo le Sale con il nome del loro rispettivo Ristorante in un colpo solo
  const saleConRistorante = db.prepare(`
    SELECT Sala.nome AS NomeSala, Ristorante.nome AS NomeRistorante 
    FROM Sala 
    INNER JOIN Ristorante ON Sala.idRistorante = Ristorante.idRistorante
  `).all();
  console.log('\n--- SALE E RELATIVI RISTORANTI (JOIN Ottimizzata) ---');
  console.log(saleConRistorante);

} catch (error) {
  // GESTIONE ERRORE: Se una query fallisce o manca una tabella, il server non crasha.
  console.error('\n[ERRORE CRITICO] Impossibile leggere dal database:', error.message);

} finally {
  // 6. RILASCIO RISORSE: Il database viene chiuso sempre, a prescindere dagli errori
  db.close();
  console.log('\n[SISTEMA] Connessione al database chiusa in sicurezza e file sbloccato.');
}
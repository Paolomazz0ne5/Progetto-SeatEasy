const Database = require('better-sqlite3');
const path = require('path');

// Risoluzione deterministica del percorso tramite process.cwd()
const dbPath = path.resolve(process.cwd(), 'database.db');
const db = new Database(dbPath);

try {
  // [VINCOLO DI INTEGRITÀ]: Attivazione esplicita dei controlli sulle Foreign Keys.
  // Indispensabile per evitare di assegnare gli orari a un idRistorante inesistente.
  db.pragma('foreign_keys = ON');

  // ==========================================
  // OPERAZIONE 1: MIGRAZIONE LOGICA (Targeted Update)
  // ==========================================
  // [PATTERN: PREPARED STATEMENT]: Astrazione della query DML. L'utilizzo dei parametri (?) 
  // previene vulnerabilità di iniezione e favorisce il riutilizzo del piano di esecuzione.
  const stmtOrario = db.prepare('UPDATE Orario SET idRistorante = ? WHERE idRistorante = ?');
  const infoOrario = stmtOrario.run(2, 1);
  console.log(`Migrazione orari completata. Record alterati: ${infoOrario.changes}`);

  // ==========================================
  // OPERAZIONE 2: RESET MASSIVO (Bulk Update)
  // ==========================================
  // Esecuzione di un'operazione di aggiornamento globale (assenza della clausola WHERE).
  const stmtTavolo = db.prepare('UPDATE Tavolo SET stato = ?');
  const infoTavolo = stmtTavolo.run('Libero');
  console.log(`Reset stato tavoli completato. Record alterati: ${infoTavolo.changes}`);

} catch (error) {
  // Intercettazione di violazioni relazionali o di lock concorrenti (SQLITE_BUSY).
  console.error('Eccezione critica durante l\'aggiornamento dei dati:', error.message);

} finally {
  // Rilascio garantito del lock esclusivo sul file system.
  db.close();
}
// Diciamo a Next.js che questo file deve essere eseguito ESCLUSIVAMENTE sul server.
// Nessuna parte di questo codice o delle librerie importate finirà nel browser dell'utente.
// Questo garantisce la massima sicurezza per l'interazione diretta con il database.
'use server';

// Importiamo il driver sincrono e performante per SQLite.
import Database from 'better-sqlite3';
// Importiamo 'path' nativo di Node.js per trovare il percorso esatto del file del database.
import path from 'path';

// Funzione di utilità per istanziare la connessione al database.
// Viene isolata in una funzione così da non tenere la connessione sempre aperta inutilmente.
function getDb() {
  // process.cwd() restituisce la cartella radice del progetto Next.js dove si trova database.db
  const dbPath = path.resolve(process.cwd(), 'database.db');
  return new Database(dbPath);
}

/**
 * Assicura che la tabella Recensione esista e inserisce dei dati fittizi (Mock Data)
 * se il database è vuoto. È una funzione di utilità fondamentale per le presentazioni
 * del progetto all'esame, così da avere la Dashboard CRM sempre popolata.
 */
export async function ensureCRMDatabase() {
  const db = getDb();

  try {
    // Avviamo una TRANSAZIONE ACID.
    // Se una qualsiasi query fallisce, nessuna modifica viene salvata nel file .db,
    // prevenendo la corruzione dei dati.
    const transaction = db.transaction(() => {

      // 1. CREAZIONE DELLA TABELLA (Se non esiste)
      // Utilizziamo le chiavi esterne (FOREIGN KEY) con ON DELETE CASCADE.
      // Questo significa che se viene eliminato un Cliente o un Ristorante, 
      // le recensioni collegate verranno eliminate in automatico da SQLite per mantenere la pulizia!
      db.prepare(`
        CREATE TABLE IF NOT EXISTS Recensione (
          idRecensione INTEGER PRIMARY KEY AUTOINCREMENT,
          idCliente INTEGER NOT NULL,
          idRistorante INTEGER NOT NULL,
          punteggio INTEGER NOT NULL,
          testo TEXT,
          dataCreazione TEXT DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (idCliente) REFERENCES Cliente(idAccount) ON DELETE CASCADE,
          FOREIGN KEY (idRistorante) REFERENCES Ristorante(idRistorante) ON DELETE CASCADE
        )
      `).run(); // Usiamo .run() perché è un'operazione di struttura (DDL), non dobbiamo leggere dati

      // 2. CONTROLLO E POPOLAMENTO MOCK DATA
      // Contiamo quante recensioni ci sono attualmente nel DB per evitare di duplicarle a ogni avvio
      const countReviews = db.prepare('SELECT COUNT(*) as c FROM Recensione').get() as { c: number };

      // Se la tabella è appena stata creata (o svuotata) e ha 0 recensioni, inseriamo i dati finti
      if (countReviews.c === 0) {

        // Peschiamo dal DB fino a 3 clienti esistenti a cui "intestare" le recensioni fittizie
        const clients = db.prepare('SELECT idAccount FROM Cliente LIMIT 3').all() as { idAccount: number }[];

        // Assicuriamoci di avere almeno due clienti registrati nel sistema per i test
        if (clients.length >= 2) {

          // Prepariamo la query parametrizzata (?) per prevenire le SQL Injection.
          // Inseriamo i valori tramite parametri sicuri, mai concatenando stringhe.
          const stmt = db.prepare('INSERT INTO Recensione (idCliente, idRistorante, punteggio, testo, dataCreazione) VALUES (?, ?, ?, ?, ?)');

          // Inseriamo la prima recensione per il cliente 0 (Usando la data e ora attuali)
          stmt.run(
            clients[0].idAccount,
            1, // ID del Ristorante di test
            5,
            "Atmosfera incantevole e menù assolutamente favoloso. Il servizio è stato attento senza mai risultare invadente.",
            new Date().toISOString()
          );

          // Inseriamo la seconda recensione per il cliente 1 (Simuliamo che sia stata scritta ieri sottraendo 86400000 ms)
          stmt.run(
            clients[1].idAccount,
            1,
            4,
            "Buonissimo, carne cotta alla perfezione. Peccato solo per il leggero ritardo al momento di sedersi, ma gestione cordiale.",
            new Date(Date.now() - 86400000).toISOString()
          );

          // Se esiste un terzo cliente, inseriamo l'ultima recensione (Simuliamo scritta 3 giorni fa)
          if (clients[2]) {
            stmt.run(
              clients[2].idAccount,
              1,
              5,
              "Un'esperienza incredibile! Ristorante bellissimo, tornerò sicuramente col mio compagno per il nostro prossimo anniversario.",
              new Date(Date.now() - 86400000 * 3).toISOString()
            );
          }
        }
      }

      // NOTA: Il blocco mock relativo alla chat è stato rimosso per riflettere 
      // le attuali logiche di business (Feature Creep removal).
    });

    // Eseguiamo effettivamente la transazione che abbiamo appena preparato
    transaction();

  } catch (error) {
    // In caso di errore (es. tabella bloccata o permessi errati), catturiamo il problema
    // sul server per il debug e impediamo che il sito crashi all'utente finale.
    console.error("Sincronizzazione del Database CRM fallita:", error);
  } finally {
    // IL PASSAGGIO PIÙ IMPORTANTE:
    // Il blocco finally garantisce matematicamente che la connessione al database 
    // venga chiusa (liberando memoria e togliendo il 'lock' al file SQLite), 
    // sia in caso di successo che in caso di errore catastrofico.
    db.close();
  }
}
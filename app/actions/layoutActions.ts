// Direttiva fondamentale di Next.js: blocca l'esecuzione di questo file nel browser.
// Garantisce che le query SQL e la struttura del database rimangano segrete e sicure sul server.
'use server';

import Database from 'better-sqlite3';
import path from 'path';
import { revalidatePath } from 'next/cache';

// Istanzia la connessione al database SQLite leggendo il file 'database.db' nella root del progetto.
function getDb() {
  const dbPath = path.resolve(process.cwd(), 'database.db');
  return new Database(dbPath);
}

/**
 * FUNZIONE HELPER: Mantiene la coerenza dei dati.
 * Calcola la somma totale dei posti di tutti i tavoli in una specifica sala
 * e aggiorna il campo 'capacita' della sala stessa.
 */
function updateSalaCapacita(db: any, idSala: number) {
  // Esegue una somma (SUM) SQL per trovare i posti totali. Ritorna null se la sala è vuota.
  const result = db.prepare('SELECT SUM(posti) as totale FROM Tavolo WHERE idSala = ?').get(idSala) as { totale: number | null };
  const capacita = result.totale || 0; // Fallback a 0 se non ci sono tavoli
  
  // Aggiorna il record della sala con la nuova capienza calcolata
  db.prepare('UPDATE Sala SET capacita = ? WHERE idSala = ?').run(capacita, idSala);
}

// ==========================================
// SEZIONE: GESTIONE SALE
// ==========================================

export async function createSala(nome: string, idRistorante: number) {
  const db = getDb();
  try {
    // Inserisce una nuova sala partendo con 0 posti (capacita = 0) e impostandola come attiva (1)
    db.prepare('INSERT INTO Sala (idRistorante, nome, capacita, attiva) VALUES (?, ?, ?, ?)').run(idRistorante, nome, 0, 1);
    
    // Dice a Next.js di ricaricare i dati visivi nella pagina del layout senza fare un refresh completo
    revalidatePath('/gestore/sala-layout');
    return { success: true };
  } catch (error: any) {
    console.error('Failed to create sala:', error.message);
    return { success: false, error: 'Errore durante la creazione della sala.' };
  } finally {
    db.close(); // Chiusura fondamentale per non bloccare il file .db
  }
}

export async function deleteSala(idSala: number) {
  const db = getDb();
  try {
    // TRANSAZIONE ACID: Operazione di eliminazione a cascata (Cascade) manuale.
    // Garantisce che non rimangano "Tavoli Orfani" nel database se la sala viene distrutta.
    const transaction = db.transaction(() => {
      db.prepare('DELETE FROM Tavolo WHERE idSala = ?').run(idSala); // 1. Distrugge prima i tavoli
      db.prepare('DELETE FROM Sala WHERE idSala = ?').run(idSala);   // 2. Distrugge poi la sala
    });
    
    transaction(); // Esegue le due operazioni come se fossero un blocco unico e sicuro
    revalidatePath('/gestore/sala-layout');
    return { success: true };
  } catch (error: any) {
    console.error('Failed to delete sala:', error.message);
    return { success: false, error: 'Errore durante l\'eliminazione della sala.' };
  } finally {
    db.close();
  }
}

// ==========================================
// SEZIONE: GESTIONE TAVOLI
// ==========================================

export async function createTavolo(idSala: number, numero: number, posti: number, postiMinimi: number) {
  const db = getDb();
  try {
    // Inserisce il nuovo tavolo e lo imposta di default come 'Libero'
    db.prepare('INSERT INTO Tavolo (idSala, numero, posti, postiMinimi, stato) VALUES (?, ?, ?, ?, ?)').run(idSala, numero, posti, postiMinimi, 'Libero');
    
    // Avendo aggiunto un tavolo, ricalcoliamo la capienza totale della sala
    updateSalaCapacita(db, idSala);
    
    revalidatePath('/gestore/sala-layout');
    return { success: true };
  } catch (error: any) {
    console.error('Failed to create tavolo:', error.message);
    return { success: false, error: 'Errore durante la creazione del tavolo.' };
  } finally {
    db.close();
  }
}

export async function updateTavolo(idTavolo: number, numero: number, posti: number, postiMinimi: number) {
  const db = getDb();
  try {
    // Recupera l'idSala prima di aggiornare, perché ci servirà per ricalcolare i posti totali
    const table = db.prepare('SELECT idSala FROM Tavolo WHERE idTavolo = ?').get(idTavolo) as { idSala: number } | undefined;
    
    // Aggiorna le caratteristiche fisiche e logiche (posti minimi anti-spreco) del tavolo
    db.prepare('UPDATE Tavolo SET numero = ?, posti = ?, postiMinimi = ? WHERE idTavolo = ?').run(numero, posti, postiMinimi, idTavolo);
    
    // Se il tavolo esiste, ricalcola i posti della sala (nel caso il gestore abbia aumentato/diminuito le sedie)
    if (table) {
      updateSalaCapacita(db, table.idSala);
    }
    
    revalidatePath('/gestore/sala-layout');
    return { success: true };
  } catch (error: any) {
    console.error('Failed to update tavolo:', error.message);
    return { success: false, error: 'Errore durante la modifica del tavolo.' };
  } finally {
    db.close();
  }
}

export async function deleteTavolo(idTavolo: number) {
  const db = getDb();
  try {
    // Come per l'update, capiamo in che sala si trova per aggiornarne il totale dopo l'eliminazione
    const table = db.prepare('SELECT idSala FROM Tavolo WHERE idTavolo = ?').get(idTavolo) as { idSala: number } | undefined;
    
    db.prepare('DELETE FROM Tavolo WHERE idTavolo = ?').run(idTavolo);
    
    if (table) {
      updateSalaCapacita(db, table.idSala); // Ricalcola al ribasso i posti totali della sala
    }
    
    revalidatePath('/gestore/sala-layout');
    return { success: true };
  } catch (error: any) {
    console.error('Failed to delete tavolo:', error.message);
    return { success: false, error: 'Errore durante l\'eliminazione del tavolo.' };
  } finally {
    db.close();
  }
}

// ==========================================
// SEZIONE: GESTIONE TAVOLATE (GRUPPI)
// ==========================================

export async function linkTavoli(tavoloIds: number[]) {
  // Validazione di business: non si può creare un gruppo con un solo tavolo
  if (tavoloIds.length < 2) return { success: false, error: 'Seleziona almeno 2 tavoli.' };
  
  const db = getDb();
  try {
    // Genera un ID univoco basato sul timestamp attuale (es. GRUPPO-168492019)
    const idGruppo = `GRUPPO-${Date.now()}`;
    
    // Costruisce i placeholder '?, ?, ?' in base a quanti tavoli sono stati selezionati
    // Questo previene le SQL Injection pur gestendo array di lunghezza variabile
    const placeholders = tavoloIds.map(() => '?').join(',');
    
    // Aggiorna in un colpo solo (Bulk Update) tutti i tavoli selezionati, assegnandoli allo stesso gruppo
    db.prepare(`UPDATE Tavolo SET idGruppo = ? WHERE idTavolo IN (${placeholders})`)
      .run(idGruppo, ...tavoloIds);
      
    revalidatePath('/gestore/sala-layout');
    return { success: true };
  } catch (error: any) {
    console.error('Failed to link tavoli:', error.message);
    return { success: false, error: 'Errore durante il collegamento dei tavoli.' };
  } finally {
    db.close();
  }
}

export async function unlinkTavolo(idTavolo: number) {
  const db = getDb();
  try {
    // 1. Rimuove il tavolo specifico dal gruppo impostando il campo a NULL
    db.prepare('UPDATE Tavolo SET idGruppo = NULL WHERE idTavolo = ?').run(idTavolo);
    
    // 2. OPERAZIONE DI PULIZIA (Garbage Collection logica):
    // Cerca se l'operazione precedente ha lasciato dei gruppi "zoppi" (con un solo tavolo rimasto).
    // In tal caso, smantella completamente il gruppo rimuovendo l'idGruppo all'ultimo tavolo superstite.
    db.prepare(`
      UPDATE Tavolo 
      SET idGruppo = NULL 
      WHERE idGruppo IN (
        SELECT idGruppo 
        FROM Tavolo 
        WHERE idGruppo IS NOT NULL 
        GROUP BY idGruppo 
        HAVING COUNT(*) < 2
      )
    `).run();

    revalidatePath('/gestore/sala-layout');
    return { success: true };
  } catch (error: any) {
    console.error('Failed to unlink tavolo:', error.message);
    return { success: false, error: 'Errore durante lo scollegamento del tavolo.' };
  } finally {
    db.close();
  }
}
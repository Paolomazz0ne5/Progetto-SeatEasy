# SeatEasy - Panoramica e Spiegazione del Progetto (Estesa)

Questo documento riassume gli aspetti fondamentali del progetto **SeatEasy**, utile come riferimento per l'esame orale. 
Non contiene codice, ma spiega l'architettura, le tecnologie e le logiche più importanti, scendendo nel dettaglio di alcune meccaniche chiave.

---

## 1. Descrizione Generale
**SeatEasy** è una piattaforma web completa dedicata alla prenotazione e alla gestione dei tavoli nei ristoranti. Il sistema è diviso in due macro-aree:
- **Lato Cliente**: L'interfaccia dedicata agli utenti finali. Permette di cercare ristoranti, visualizzarne le informazioni, effettuare prenotazioni e gestire il proprio storico e profilo.
- **Lato Gestore**: Una dashboard amministrativa riservata ai proprietari dei ristoranti. Da qui il ristoratore può configurare le sale, inserire i tavoli, gestire gli orari di apertura, i turni e monitorare le prenotazioni in tempo reale.

---

## 2. Architettura e Stack Tecnologico
- **Framework Core**: [Next.js](https://nextjs.org/) (versione basata su **App Router**). Gestisce il routing, il rendering lato server (SSR) e l'ottimizzazione dell'interfaccia.
- **Linguaggio**: **TypeScript**. Aggiunge tipizzazione statica, fondamentale per prevenire errori nel passaggio di dati complessi come le prenotazioni.
- **Database**: **SQLite** (gestito tramite `better-sqlite3`). Un database relazionale serverless e performante, salvato localmente nel file `database.db`.
- **Styling**: **Tailwind CSS**. Framework utility-first per interfacce responsive.
- **Sicurezza**: Hashing delle password con **`bcryptjs`** e sessioni gestite nativamente con **Cookie**. Le query usano sempre *Prepared Statements* per azzerare il rischio di SQL Injection.

---

## 3. Mappa dei Tavoli e Gestione Spazi (Layout)
L'amministrazione degli spazi è gestita tramite specifiche Server Actions (es. `layoutActions.ts`):
- **Creazione Dinamica**: Il gestore può creare delle **Sale**. Per ogni sala, può aggiungere **Tavoli**, specificando il numero identificativo, la capienza massima (`posti`) e il minimo di persone accettate (`postiMinimi`).
- **Capacità Calcolata**: Ogni volta che un tavolo viene aggiunto, modificato o rimosso, una funzione (`updateSalaCapacita`) ricalcola dinamicamente la capacità totale della sala, mantenendo sempre aggiornato il database.
- **Unione Tavoli (Linking)**: È presente una logica per gestire le grosse tavolate. Il ristoratore può "collegare" due o più tavoli insieme. A livello di codice, a questi tavoli viene assegnato un identificativo comune (`idGruppo`), permettendo all'algoritmo di considerarli come un'unica grande entità.
- **Integrità Referenziale**: Se il ristoratore elimina una sala, tutte le entità che dipendono da essa (come i tavoli al suo interno) vengono eliminate tramite transazioni sicure o vincoli `ON DELETE CASCADE`.

---

## 4. Logica di Prenotazione (Algoritmo)
Il cuore del sistema è un algoritmo che previene l'overbooking e trova i tavoli liberi incrociando il tempo e lo spazio.
1. Il gestore definisce gli **Orari** e i relativi **Turni**. Ogni turno possiede un attributo vitale: la `durataMedia` del pasto (in minuti).
2. Quando il cliente richiede un tavolo per le `20:30` per `4` persone, il sistema estrae dal database tutti i tavoli della sala con capienza compatibile (`posti >= 4`).
3. L'algoritmo crea una finestra temporale (es. `dalle 20:30 alle 22:00`, sommando la `durataMedia` all'orario richiesto).
4. Successivamente, interroga la tabella `OccupazioneTavolo` congiunta a `Prenotazione`, per vedere se qualcuno dei tavoli papabili ha già una prenotazione che *interseca* questa finestra temporale.
5. Tutti i tavoli occupati in quel range vengono scartati (`filter`). Se rimane almeno un tavolo libero nell'array risultante, la prenotazione va a buon fine e il tavolo viene assegnato.

---

## 5. Relazioni col Cliente (CRM) e Sistema di Recensioni
Il gestionale raccoglie informazioni sui clienti per avvantaggiare il ristoratore (logiche visibili in `relazioni.ts` e `dashboard/page.tsx`):
- **Recensioni Guidate**: C'è una tabella dedicata per i feedback (`Recensione`). È collegata sia al cliente che al ristorante. Se un cliente si cancella dal sito, le sue recensioni spariscono dal DB automaticamente (`ON DELETE CASCADE`), mantenendo l'app "GDPR Compliant".
- **Sistema di Affidabilità (No-Show)**: La piattaforma agisce da CRM. Quando il gestore apre la dashboard e vede la lista delle prenotazioni del giorno, una complessa *sub-query SQL* conta lo storico del cliente. Se quel cliente ha già prenotato in passato e non si è mai presentato (`stato = 'noShow'`), la dashboard mostra al ristoratore un bollino o un contatore di allarme per avvertirlo in anticipo del rischio.

---

## 6. Interfaccia del Gestore e Sicurezza Applicativa
La Dashboard dei ristoranti vanta logiche rigorose:
- **Dati in Tempo Reale**: I componenti come le dashboard hanno la direttiva `export const dynamic = 'force-dynamic'`. Questo obbliga Next.js a bypassare la cache e a re-interrogare il database ad ogni singolo caricamento di pagina. Questo è essenziale per non perdersi prenotazioni appena arrivate.
- **Ownership Check (Verifica Proprietà)**: L'ID del ristorante da amministrare è passato tramite l'URL (es. `?ristorante=12`). Per evitare che il Gestore "A" cambi l'URL in `?ristorante=13` per spiare le prenotazioni del Gestore "B", c'è un controllo bloccante sul server. Il sistema verifica che `idRistorante` coincida effettivamente con `idGestoreRistorante = [ID Cookie di Sessione]`. Se l'Ownership Check fallisce, la richiesta viene respinta prima di eseguire le query sui tavoli.
- **File System ed Immagini**: Per l'upload di foto per la Galleria, le Server Actions utilizzano il modulo `fs/promises` nativo di Node.js. L'immagine viene validata per estensione e salvata fisicamente sul file system (`/public/uploads/...`), per poi salvare il solo URL relativo nel database. Se il gestore elimina la foto dal gestionale, la funzione provvede ad eliminare il file fisicamente dal disco tramite `unlink`, evitando di sprecare memoria nel server.

---

## 7. Next.js: Server Components vs Server Actions
- **Server Components**: L'interfaccia principale e i layout sono Server Components. Leggono il DB e preparano l'HTML sul server in modo sicuro, passandolo al client già montato (SEO-friendly e veloce).
- **Server Actions**: Al posto di fare delle vecchie "API REST" (chiamate fetch a `/api/qualcosa`), SeatEasy usa le Server Actions. I form inviano i dati direttamente a delle funzioni lato server (marcate con `"use server"`). Queste funzioni validano i dati, li inseriscono con SQLite e chiamano `revalidatePath(...)` per dire a Next.js di rinfrescare l'interfaccia aggiornando la vista istantaneamente senza far ricaricare la pagina all'utente.

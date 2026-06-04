/**
 * DESCRIZIONE PRELIMINARE:
 * `GestorePage` è un componente di routing interno che agisce come pagina
 * di default per la directory `/gestore`. Poiché questa directory contiene
 * più sottosezioni (come i ristoranti o le recensioni), questo file ha il
 * semplice ma fondamentale compito di reindirizzare automaticamente l'utente
 * verso la dashboard principale, evitando che l'utente arrivi in una cartella
 * vuota.
 */
import { redirect } from 'next/navigation';

export default function GestorePage() {
  redirect('/gestore/ristoranti');
}

'use client';

import React, { useState, useEffect } from 'react';
import { updateReservation } from '@/app/actions/cliente';
import { getAvailableTablesForManual } from '@/app/actions/gestore';
import { useRouter } from 'next/navigation';
import { Calendar, Clock, Users, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

/**
 * Funzione che serve a creare i singoli orari selezionabili (ogni 15 minuti)
 * partendo dall'orario di apertura fino a quello di chiusura del turno.
 */
function generateTimeSlots(start: string, end: string) {
  if (!start || !end) return [];
  const [h1, m1] = start.split(':').map(Number);
  const [h2, m2] = end.split(':').map(Number);

  // Trasforma tutto in minuti dalla mezzanotte per fare i calcoli più facilmente
  let currentMinutes = h1 * 60 + m1;
  let endMinutes = h2 * 60 + m2;

  // Se il locale chiude dopo la mezzanotte, aggiunge un giorno in minuti per non sballare i calcoli
  if (endMinutes < currentMinutes) endMinutes += 24 * 60;

  const slots = [];
  while (currentMinutes <= endMinutes) {
    const h = Math.floor(currentMinutes / 60) % 24;
    const m = currentMinutes % 60;
    // Crea la stringa dell'orario fissa a due cifre (es. "09:15")
    slots.push(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
    currentMinutes += 15; // Va avanti di un quarto d'ora alla volta
  }
  return slots;
}

export default function ModificaPrenotazioneClient({
  reservation,
  turni
}: {
  reservation: any,
  turni: any[]
}) {
  // Spezza la data e l'ora che arrivano insieme dal database (es. "2026-10-15 20:30") per metterle nei due campi separati
  const initialDateStr = reservation.dataPrenotazione.includes(' ')
    ? reservation.dataPrenotazione.split(' ')[0]
    : reservation.dataPrenotazione;
  const initialTimeStr = reservation.dataPrenotazione.includes(' ')
    ? reservation.dataPrenotazione.split(' ')[1]
    : '20:00';

  // Variabili per salvare i dati inseriti dall'utente nei campi del modulo
  const [dataPrenotazione, setDataPrenotazione] = useState(initialDateStr);
  const [ora, setOra] = useState(initialTimeStr);
  const [numPersone, setNumPersone] = useState(reservation.numeroPersone);
  const [noteCliente, setNoteCliente] = useState(reservation.noteCliente || "");

  // Prende tutti i turni del ristorante, genera gli orari da 15 minuti, toglie i duplicati e li ordina
  const validTimeSlots = Array.from(new Set(turni.flatMap(t => generateTimeSlots(t.oraInizio, t.oraFine)))).sort();

  // Variabili per gestire i tavoli liberi trovati e il tavolo scelto
  const [freeTables, setFreeTables] = useState<any[]>([]);
  const [availableTurnoId, setAvailableTurnoId] = useState<number | null>(reservation.idTurno);
  const [isSearchingTables, setIsSearchingTables] = useState(false);
  const [selectedTavoloId, setSelectedTavoloId] = useState<number>(0);

  // Variabili per gestire il caricamento del salvataggio e i messaggi di successo o errore sullo schermo
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const router = useRouter();

  /**
   * Questo blocco di codice si attiva da solo ogni volta che l'utente cambia la data, l'orario o il numero di persone.
   * Serve a ricalcolare all'istante quali tavoli sono rimasti liberi nel ristorante.
   */
  useEffect(() => {
    async function fetchTables() {
      if (dataPrenotazione && ora && numPersone > 0) {
        setIsSearchingTables(true);

        // Chiede al database la lista dei tavoli liberi per quel giorno e quell'ora.
        // Gli passiamo anche l'ID della prenotazione attuale così il database sa che non deve considerare occupato 
        // il tavolo da noi stessi mentre stiamo cercando di modificarlo.
        const res = await getAvailableTablesForManual(
          reservation.idRistorante,
          dataPrenotazione,
          ora,
          numPersone,
          reservation.idPrenotazione
        );

        if (res.success && res.freeTables) {
          setFreeTables(res.freeTables);
          setAvailableTurnoId(res.idTurno || null);

          // Se trova tavoli liberi, seleziona automaticamente il primo della lista, altrimenti azzera la selezione
          if (res.freeTables.length > 0) {
            setSelectedTavoloId(res.freeTables[0].idTavolo);
          } else {
            setSelectedTavoloId(0);
          }
        } else {
          // Se la ricerca fallisce o non ci sono tavoli, svuota la lista
          setFreeTables([]);
          setAvailableTurnoId(null);
          setSelectedTavoloId(0);
        }
        setIsSearchingTables(false);
      }
    }

    // Aspetta 400 millisecondi prima di fare la richiesta al database. 
    // Evita di mandare troppe richieste di fila se l'utente clicca velocemente per cambiare l'ora o i coperti.
    const timeoutId = setTimeout(() => {
      fetchTables();
    }, 400);

    return () => clearTimeout(timeoutId);
  }, [dataPrenotazione, ora, numPersone, reservation.idRistorante, reservation.idPrenotazione]);

  /**
   * Funzione che scatta quando l'utente clicca sul bottone "Conferma Modifiche" per salvare tutto.
   */
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    // Blocco di sicurezza: se non è stato trovato o selezionato nessun tavolo libero, interrompe il salvataggio
    if (!selectedTavoloId || !availableTurnoId) {
      setMessage({ type: 'error', text: 'Nessun tavolo disponibile per questi parametri. Cambia data o orario.' });
      return;
    }

    setLoading(true);

    // Riunisce la data e l'orario in un unico testo prima di mandarlo al database
    const fullDate = `${dataPrenotazione} ${ora}`;

    // Invia i dati aggiornati al database per modificare la prenotazione esistente
    const result = await updateReservation(reservation.idPrenotazione, {
      numeroPersone: numPersone,
      noteCliente,
      idTurno: availableTurnoId,
      dataPrenotazione: fullDate,
      idTavolo: selectedTavoloId // Salva il nuovo tavolo assegnato!
    });

    if (result.success) {
      setMessage({ type: 'success', text: 'Modifica salvata! Tavolo confermato.' });
      // Dopo un secondo e mezzo rimanda l'utente alla pagina con tutte le sue prenotazioni
      setTimeout(() => router.push('/cliente/prenotazioni'), 1500);
    } else {
      setMessage({ type: 'error', text: result.error || 'Errore durante il salvataggio.' });
    }
    setLoading(false);
  };

  return (
    <div className="bg-white border border-[#F5CBA7]/60 rounded-[2.5rem] p-8 sm:p-12 shadow-2xl relative overflow-hidden">
      {/* Notifica visiva in alto che mostra se il salvataggio è andato a buon fine o se c'è un errore */}
      {message && (
        <div className={`absolute top-0 left-0 w-full p-4 text-center font-bold z-20 animate-in slide-in-from-top duration-300 ${message.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
          {message.text}
        </div>
      )}

      {/* Intestazione della pagina con il pulsante per tornare indietro e il nome del ristorante */}
      <div className="flex items-center gap-4 mb-10">
        <Link href="/cliente/prenotazioni" className="p-3 bg-gray-50 hover:bg-[#FDF1E9] text-gray-400 hover:text-[#D35400] rounded-2xl transition-all">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h2 className="text-3xl font-black text-[#781D2D] tracking-tight">Modifica Prenotazione</h2>
          <p className="text-[#D35400] font-medium text-sm">Ristorante: {reservation.ristoranteNome}</p>
        </div>
      </div>

      <form onSubmit={handleUpdate} className="space-y-8">
        {/* Campi di scelta per la Data e l'Orario della prenotazione */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-xs font-black text-[#781D2D] uppercase tracking-widest ml-1">
              <Calendar size={14} /> Data
            </label>
            <input
              type="date"
              value={dataPrenotazione}
              min={new Date().toISOString().split('T')[0]} // Blocca la scelta sui giorni passati, si può scegliere solo da oggi in poi
              onChange={(e) => setDataPrenotazione(e.target.value)}
              className="w-full bg-[#FDF1E9]/50 border-2 border-transparent focus:border-[#F5CBA7] focus:bg-white rounded-2xl px-5 py-4 font-bold text-[#781D2D] outline-none transition-all"
            />
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-xs font-black text-[#781D2D] uppercase tracking-widest ml-1">
              <Clock size={14} /> Orario
            </label>
            <select
              value={ora}
              onChange={(e) => setOra(e.target.value)}
              className="w-full bg-[#FDF1E9]/50 border-2 border-transparent focus:border-[#F5CBA7] focus:bg-white rounded-2xl px-5 py-4 font-bold text-[#781D2D] outline-none transition-all appearance-none cursor-pointer"
            >
              <option value="">Seleziona orario</option>
              {validTimeSlots.map(slot => (
                <option key={slot} value={slot}>{slot}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Campi per il Numero di Ospiti e la scelta del Tavolo Libero */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-xs font-black text-[#781D2D] uppercase tracking-widest ml-1">
              <Users size={14} /> Numero Ospiti
            </label>
            <input
              type="number"
              min="1"
              max="20"
              value={numPersone}
              onChange={(e) => setNumPersone(parseInt(e.target.value) || 1)}
              className="w-full bg-[#FDF1E9]/50 border-2 border-transparent focus:border-[#F5CBA7] focus:bg-white rounded-2xl px-5 py-4 font-bold text-[#781D2D] outline-none transition-all"
            />
          </div>

          {/* Menu a tendina per il tavolo: si aggiorna da solo mostrando solo i tavoli effettivamente liberi per quel momento */}
          <div className="space-y-2">
            <label className="flex items-center justify-between text-xs font-black text-[#781D2D] uppercase tracking-widest ml-1">
              <span>Tavolo Assegnato</span>
              {isSearchingTables && <span className="text-[#D35400] text-[10px] animate-pulse">Ricerca in corso...</span>}
            </label>
            <select
              value={selectedTavoloId}
              onChange={(e) => setSelectedTavoloId(Number(e.target.value))}
              disabled={freeTables.length === 0 || isSearchingTables} // Si blocca se non ci sono tavoli o se la ricerca è ancora in corso
              className="w-full bg-[#FDF1E9]/50 border-2 border-transparent focus:border-[#F5CBA7] focus:bg-white rounded-2xl px-5 py-4 font-bold text-[#781D2D] outline-none transition-all appearance-none cursor-pointer disabled:opacity-50"
            >
              {freeTables.length > 0 ? (
                freeTables.map(t => (
                  <option key={t.idTavolo} value={t.idTavolo}>
                    Tavolo {t.numero} ({t.posti} posti) - {t.nomeSala}
                  </option>
                ))
              ) : (
                <option value="0">Nessun tavolo disponibile</option>
              )}
            </select>
          </div>
        </div>

        {/* Spazio per scrivere le note o esigenze speciali del cliente */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-xs font-black text-[#781D2D] uppercase tracking-widest ml-1">
            Esigenze Speciali
          </label>
          <textarea
            value={noteCliente}
            onChange={(e) => setNoteCliente(e.target.value)}
            placeholder="Allergie, seggiolone, anniversario..."
            className="w-full bg-[#FDF1E9]/50 border-2 border-transparent focus:border-[#F5CBA7] focus:bg-white rounded-2xl px-5 py-4 font-medium text-[#781D2D] outline-none transition-all resize-none"
            rows={3}
          />
        </div>

        {/* Pulsanti finali per salvare le modifiche fatte o per annullare e tornare indietro */}
        <div className="pt-6 border-t border-gray-100 flex flex-col sm:flex-row gap-4">
          <button
            type="submit"
            disabled={loading || freeTables.length === 0}
            className="flex-1 py-5 bg-gradient-to-r from-[#D35400] to-[#781D2D] text-white font-black text-lg rounded-[2rem] shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-1 active:scale-95 disabled:opacity-50"
          >
            {loading ? 'Salvataggio...' : 'Conferma Modifiche'}
          </button>
          <Link
            href="/cliente/prenotazioni"
            className="flex-1 py-5 bg-gray-50 text-gray-500 font-bold text-lg rounded-[2rem] border border-gray-100 hover:bg-gray-100 transition-all flex items-center justify-center"
          >
            Annulla
          </Link>
        </div>
      </form>
    </div>
  );
}
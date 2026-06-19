/**
 * DESCRIZIONE PRELIMINARE:
 * Il componente `TableMap` è il cuore interattivo della prenotazione lato cliente.
 * Genera una mappa visiva e reattiva dei tavoli in base a data e turno scelti.
 * Gestisce regole di business complesse (capacità minima/massima, prevenzione 
 * overbooking) bloccando selezioni non valide. Calcola la disponibilità 
 * interrogando il server in tempo reale e gestisce il checkout finale,
 * includendo anche la simulazione di un eventuale pagamento di caparra.
 */
"use client";
//import di librerie React e Next.js
import React, { useState, useEffect } from 'react';
import { getAvailableTables, createReservation } from '@/app/actions/cliente';
import { useRouter } from 'next/navigation';

// 1. DEFINIZIONE DEI CONTRATTI (TYPES)
//Usiamo "type" invece di "interface" per mappare esattamente 
// la struttura dei dati restituita da SQLite. Questo previene errori a runtime.
type Tavolo = {
  idTavolo: number;
  numero: number;
  posti: number;
  postiMinimi: number; // Novità anti-spreco!
  stato: string;
  idGruppo?: string | null;
};

type Turno = {
  idTurno: number;
  nomeTurno: string;
  oraInizio: string;
  oraFine: string;
};

// 2. FUNZIONE PURA: GENERATORE DI SLOT ORARI
// Spiegazione: Prende un orario di inizio e fine (es. 19:00 - 23:00) e genera 
// un array di stringhe spaziate di 15 minuti. Lo fa convertendo le ore in minuti totali.
function generateTimeSlots(start: string, end: string) {
  if (!start || !end) return [];
  const [h1, m1] = start.split(':').map(Number); //serve per estrarre ore e minuti
  const [h2, m2] = end.split(':').map(Number); //serve per estrarre ore e minuti

  let currentMinutes = h1 * 60 + m1; //conversione dell'ora di inizio in minuti
  const endMinutes = h2 * 60 + m2;  //conversione dell'ora di fine in minuti

  const slots = [];
  while (currentMinutes <= endMinutes) {
    const h = Math.floor(currentMinutes / 60);  //conversione dei minuti in ore
    const m = currentMinutes % 60;  //conversione delle ore in minuti
    // .padStart(2, '0') assicura che il formato sia sempre "HH:MM" (es. "09:05" e non "9:5")
    slots.push(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
    currentMinutes += 15;
  }
  return slots;
}

export default function TableMap({ //è un componente react che renderizza la mappa dei tavoli
  initialTavoli, // array di tavoli
  idRistorante, // id del ristorante
  turni, // array di turni
  pax, // numero di persone
  initialDate, // data
  caparraRichiesta = 0,
  metodoPagamentoPredefinito,
}: {
  // Le props passate dal server component (page.tsx)
  initialTavoli: Tavolo[];
  idRistorante: number;
  turni: Turno[];
  pax?: number;
  initialDate?: string;
  caparraRichiesta?: number;
  metodoPagamentoPredefinito?: string;
}) {
  // 3. STATI DI REACT (La Memoria del Componente)
  const [tavoli, setTavoli] = useState<Tavolo[]>(initialTavoli);
  const [selectedTavoli, setSelectedTavoli] = useState<Tavolo[]>([]);
  const [selectedTurno, setSelectedTurno] = useState<number>(0);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [selectedDate] = useState<string>(initialDate || new Date().toISOString().split('T')[0]);
  const [specialRequests, setSpecialRequests] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [turnoError, setTurnoError] = useState<string | null>(null);
  const [tavoliError, setTavoliError] = useState<string | null>(null);

  // Stati per la simulazione del pagamento caparra
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentCompleted, setPaymentCompleted] = useState(false);
  const [minToast, setMinToast] = useState<string | null>(null);

  const router = useRouter();

  // 4. EFFETTO COLLATERALE: AUTO-SELEZIONE DEL TURNO
  // Appena il componente viene montato, se ci sono turni, seleziona in automatico il primo.
  useEffect(() => {
    if (turni.length > 0 && selectedTurno === 0) {
      setSelectedTurno(turni[0].idTurno);
    }
  }, [turni, selectedTurno]);

  // 5. IL MOTORE DI AGGIORNAMENTO DISPONIBILITÀ (REATTIVITÀ)
  // Questo useEffect si attiva ogni volta che l'utente cambia Data, Turno o Ora.
  // Chiama la Server Action getAvailableTables per avere la situazione reale dei tavoli.
  useEffect(() => {
    async function updateAvailability() {
      if (!selectedTurno || !selectedDate) return;
      setLoading(true);
      // Chiamata asincrona al server per calcolare il turnover
      const updated = await getAvailableTables(idRistorante, selectedDate, selectedTurno, selectedTime);
      setTavoli(updated);
      setLoading(false);

      // Controllo di sicurezza: se l'utente aveva selezionato un tavolo che nel nuovo
      // orario risulta occupato, lo togliamo dalla sua selezione in automatico.
      setSelectedTavoli(prev =>
        prev.filter(sel => {
          const t = updated.find(u => u.idTavolo === sel.idTavolo);
          return t && t.stato === 'Libero';
        })
      );
    }
    updateAvailability();
  }, [selectedTurno, selectedDate, selectedTime, idRistorante]);

  // 6. VALORI DERIVATI (Non serve metterli in uno useState)
  const selectedIds = new Set(selectedTavoli.map(t => t.idTavolo)); // Set per ricerca ultra-veloce O(1)
  const totalPostiSelezione = selectedTavoli.reduce((s, t) => s + t.posti, 0); // Calcola la capacità totale scelta
  const isFulfilled = pax !== undefined && totalPostiSelezione >= pax; // True se i posti bastano
  const canBook = selectedTavoli.length > 0 && (!pax || totalPostiSelezione >= pax); // Check finale per abilitare il bottone

  // Funzione helper per mostrare gli avvisi temporanei
  const showMinToast = (text: string) => {
    setMinToast(text);
    setTimeout(() => setMinToast(null), 3500);
  };

  // Algoritmo combinatorio: verifica se ESISTE almeno un sottoinsieme di tavoli nel gruppo
  // che INCLUDA il tavolo corrente e che soddisfi SIA i posti massimi SIA i posti minimi richiesti.
  const isTableUsable = (table: Tavolo, groupTables: Tavolo[], targetPax: number) => {
    if (groupTables.length === 1) {
      return table.posti >= targetPax && (table.postiMinimi ?? 1) <= targetPax;
    }
    const others = groupTables.filter(t => t.idTavolo !== table.idTavolo);
    const numOthers = others.length;
    // Genera tutte le combinazioni possibili con bitwise shift (2^n)
    for (let i = 0; i < (1 << numOthers); i++) {
      let sumPosti = table.posti;
      let sumMin = table.postiMinimi ?? 1;
      for (let j = 0; j < numOthers; j++) {
        if ((i & (1 << j)) !== 0) {
          sumPosti += others[j].posti;
          sumMin += (others[j].postiMinimi ?? 1);
        }
      }
      if (sumPosti >= targetPax && sumMin <= targetPax) {
        return true; // Trovata almeno una combinazione valida
      }
    }
    return false; // Il tavolo è del tutto inutile per questo numero di pax
  };

  // 7. IL CUORE DELLA BUSINESS LOGIC LATO CLIENT (L'algoritmo di selezione)
  const handleTableClick = (tavolo: Tavolo) => {
    setTavoliError(null);
    if (tavolo.stato !== 'Libero') return; // Se è occupato, interrompe tutto.

    // BLOCCO AL CLICK PER TAVOLI INUTILIZZABILI MATEMATICAMENTE
    if (pax !== undefined) {
      const groupTables = tavolo.idGruppo ? tavoli.filter(t => t.idGruppo === tavolo.idGruppo && t.stato === 'Libero') : [tavolo];
      if (!isTableUsable(tavolo, groupTables, pax)) {
        setTimeout(() => showMinToast("Questo tavolo non può soddisfare i requisiti minimi o massimi per il numero di persone selezionate."), 0);
        return;
      }
    }

    // 7A. CONTROLLO OVERBOOKING (Il tavolo è troppo piccolo?)
    if (pax !== undefined) {
      // Se il tavolo fa parte di un gruppo, sommiamo i posti di tutto il gruppo
      const groupTables = tavolo.idGruppo
        ? tavoli.filter(t => t.idGruppo === tavolo.idGruppo && t.stato === 'Libero')
        : [tavolo];
      const groupMax = groupTables.reduce((s, t) => s + t.posti, 0);

      // Se le persone sono più della capienza massima del tavolo/gruppo, si blocca.
      if (pax > groupMax) {
        const msg = tavolo.idGruppo
          ? `Questo gruppo di tavoli può ospitare al massimo ${groupMax} persone.`
          : `Questo tavolo può ospitare al massimo ${tavolo.posti} persone.`;
        setTimeout(() => showMinToast(msg), 0);
        return;
      }
    }

    // Aggiornamento dello stato (precedente -> successivo)
    setSelectedTavoli(prev => {
      const isAlreadySelected = prev.some(t => t.idTavolo === tavolo.idTavolo);

      // 7B. BLOCCO A SODDISFACIMENTO
      // Se hai già raggiunto i posti necessari (isFulfilled) e stai cliccando su un tavolo NUOVO, ti blocco.
      if (isFulfilled && !isAlreadySelected) {
        setTimeout(() => showMinToast("Hai già selezionato un numero di posti sufficiente per il tuo gruppo. Rimuovi un tavolo se vuoi sceglierne un altro."), 0);
        return prev; // Ritorna lo stato invariato
      }

      // 7C. TOGGLE (Deselezione se era già selezionato)
      if (isAlreadySelected) {
        return prev.filter(t => t.idTavolo !== tavolo.idTavolo);
      }

      // Costruiamo l'ipotesi della nuova selezione
      let nextSelection: Tavolo[];
      if (!tavolo.idGruppo) {
        nextSelection = [tavolo]; // Se è un tavolo singolo, sostituisce la selezione precedente
      } else {
        // Se è un tavolo di un gruppo, verifica se appartiene allo stesso gruppo già selezionato
        const currentGroupId = prev.length > 0 ? prev[0].idGruppo : null;
        nextSelection = currentGroupId === tavolo.idGruppo
          ? [...prev, tavolo] // Aggiungi al gruppo
          : [tavolo];         // Inizia un nuovo gruppo diverso
      }

      // 7D. VALIDAZIONE POSTI MINIMI (Anti-spreco per il Ristoratore)
      if (pax !== undefined) {
        // Calcola la somma dei requisiti minimi della selezione
        const totalMin = nextSelection.reduce((s, t) => s + (t.postiMinimi ?? 1), 0);
        if (pax < totalMin) {
          const isSingle = nextSelection.length === 1;
          const msg = isSingle
            ? `Per prenotare questo tavolo è richiesto un minimo di ${tavolo.postiMinimi} persone.`
            : `Per unire questi tavoli è richiesto un minimo di ${totalMin} persone totali.`;
          setTimeout(() => showMinToast(msg), 0);
          return prev; // Blocca l'inserimento
        }
      }

      return nextSelection; // Se supera tutti i controlli, aggiorna lo stato!
    });
  };

  // Helper per inviare la prenotazione al server
  const executeBooking = async (pagata: boolean) => {
    setLoading(true);
    try {
      // 8B. CHIAMATA ALLA SERVER ACTION
      const result = await createReservation({
        idRistorante,
        idTurno: selectedTurno,
        dataPrenotazione: `${selectedDate} ${selectedTime}`,
        numeroPersone: pax || totalPostiSelezione,
        idTavoli: selectedTavoli.map(t => t.idTavolo),
        noteCliente: specialRequests,
        caparraPagata: pagata, // Salva il flag del pagamento
      });
      if (result.success) {
        setMessage({ type: 'success', text: 'Prenotazione effettuata con successo!' });
        // NON sblocchiamo il loading in caso di successo, così l'utente non può cliccare di nuovo
        setTimeout(() => { router.push('/cliente/prenotazioni'); }, 2000);
        return true;
      } else {
        setMessage({ type: 'error', text: result.error || 'Errore durante la prenotazione.' });
        setLoading(false);
        return false;
      }
    } catch {
      setMessage({ type: 'error', text: 'Errore di connessione al server.' });
      setLoading(false);
      return false;
    }
  };

  // 8. LA FUNZIONE DI SUBMIT (Invio dati al server)
  const handleBooking = async () => {
    if (loading || paymentLoading) return; // BLOCCO DOPPIO CLICK
    
    setLoading(true); // Blocca subito l'interfaccia
    setTurnoError(null);
    setTavoliError(null);
    setMessage(null);

    let hasError = false;

    // Controlli finali di validazione lato client
    if (!selectedTurno || !selectedTime) {
      setTurnoError('Devi selezionare un turno e un orario per procedere.');
      document.getElementById('selettore-turno')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      hasError = true;
    }

    if (!hasError && selectedTavoli.length === 0) {
      setTavoliError('Seleziona almeno un tavolo sulla mappa.');
      document.getElementById('mappa-tavoli')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      hasError = true;
    }

    if (!hasError && pax && totalPostiSelezione < pax) {
      setTavoliError(`Servono almeno ${pax} posti. Attualmente selezionati: ${totalPostiSelezione}.`);
      document.getElementById('mappa-tavoli')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      hasError = true;
    }

    if (hasError) {
      setLoading(false); // Sblocca se ci sono errori
      return;
    }

    // 8A. GESTIONE CAPARRA (CRM)
    // Se c'è una caparra e non è stata pagata, blocca e apri il modale.
    if (caparraRichiesta > 0 && !paymentCompleted) {
      setLoading(false); // Sblocca il pulsante principale
      setShowPaymentModal(true);
      return;
    }

    await executeBooking(paymentCompleted);
  };

  // Funzione simulata per il gateway di pagamento
  const simulatePayment = () => {
    if (paymentLoading) return;
    
    setPaymentLoading(true);
    setTimeout(async () => {
      setPaymentLoading(false);
      setPaymentCompleted(true);
      setShowPaymentModal(false);
      // Esegui in automatico la prenotazione post pagamento (Paga e Conferma in uno step)
      await executeBooking(true);
    }, 2000);
  };

  // ... (Qui inizia il JSX che esegue il rendering della mappa visiva)

  // 9. INIZIO DEL RENDER DELL'INTERFACCIA (JSX)
  return (
    <div className="bg-white border border-[#F5CBA7] rounded-3xl p-6 md:p-8 shadow-md relative overflow-hidden">

      {/* 10. GESTIONE NOTIFICHE (TOAST) */}
      {/* Spiegazione: Usiamo il rendering condizionale {message && ...} per mostrare 
          l'alert solo se lo stato 'message' non è nullo. */}
      {message && (
        <div className={`absolute top-0 left-0 w-full p-4 text-center font-bold z-20 animate-in slide-in-from-top duration-300 ${message.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
          {message.text}
        </div>
      )}

      {/* Toast specifico per gli errori di capacità minima */}
      {minToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-gray-900 text-white px-5 py-3 rounded-2xl shadow-2xl animate-in slide-in-from-bottom-4 duration-300 max-w-sm text-sm font-semibold">
          <span className="text-xl">🚫</span>
          {minToast}
        </div>
      )}

      {/* 11. IL MODALE DEL PAGAMENTO (CRM) */}
      {/* Questo blocco appare SOLO se c'è una caparra e il gestore l'ha richiesta */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] p-8 md:p-10 max-w-md w-full shadow-2xl border-2 border-[#F5CBA7]/30">
            {/* Intestazione del Pagamento */}
            <div className="flex flex-col items-center mb-8">
              {/* ... icone e titoli ... */}
              <h3 className="text-2xl font-black text-[#781D2D] text-center">Pagamento Caparra</h3>
              <p className="text-[#D35400] font-bold text-center mt-1">Importo: €{caparraRichiesta.toFixed(2)}</p>
            </div>

            {/* Metodo di pagamento salvato dal cliente (Mostrato se esiste) */}
            {metodoPagamentoPredefinito && metodoPagamentoPredefinito !== "" && (
              <div className="mb-8 p-5 bg-[#FDF1E9] rounded-2xl border-2 border-[#F5CBA7] flex items-center justify-between shadow-sm animate-in fade-in zoom-in duration-500">
                <div className="flex items-center gap-4">
                  {/* ... icone in base al metodo (Apple Pay, PayPal, ecc.) ... */}
                  <div>
                    <p className="text-[10px] font-black text-[#D35400] uppercase tracking-[0.15em] mb-0.5">Metodo Predefinito</p>
                    <p className="font-extrabold text-[#781D2D] text-lg">{metodoPagamentoPredefinito}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Finto form della carta di credito (UI Mockup) */}
            <div className="space-y-4 mb-8">
              {/* ... input visivi per Numero Carta, Scadenza, CVC ... */}
            </div>

            {/* Bottoni del Modale */}
            <div className="flex flex-col gap-3">
              <button onClick={simulatePayment} disabled={paymentLoading} className="w-full bg-[#781D2D] text-white py-4 rounded-2xl font-black text-lg hover:bg-[#5f1723] transition-all flex items-center justify-center gap-3 shadow-lg disabled:opacity-70">
                {paymentLoading
                  ? <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>Elaborazione...</>
                  : <>Paga €{caparraRichiesta.toFixed(2)}</>}
              </button>
              <button onClick={() => setShowPaymentModal(false)} disabled={paymentLoading} className="w-full bg-white text-[#781D2D] py-4 rounded-2xl font-bold text-sm hover:bg-gray-50 transition-all">
                Annulla
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 12. HEADER DELLA PAGINA E LEGENDA */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h2 className="text-3xl font-black text-[#781D2D] tracking-tight">Prenota il tuo Tavolo</h2>
            <p className="text-[#D35400] font-medium text-sm mt-1">Seleziona uno o più tavoli liberi sulla mappa, poi conferma.</p>
          </div>
          {/* Legenda Colori */}
          <div className="flex flex-wrap gap-3 text-[10px] font-black uppercase tracking-widest bg-gray-50 px-4 py-2 rounded-full border border-gray-100">
            {/* ... pallini colorati per Libero, Selezionato, Occupato ... */}
          </div>
        </div>

        {/* 13. RIEPILOGO DATA E OSPITI */}
        {/* Mostra i dati che l'utente ha selezionato nella Home (pax e data) */}
        <div className="flex flex-col md:flex-row items-center gap-6 bg-[#FDF1E9]/50 px-6 py-4 rounded-3xl border border-[#F5CBA7]/30 mb-8">
          {/* ... UI Data e Pax ... */}
        </div>

        {/* 14. SELETTORE DEL TURNO (Menu a bottoni) */}
        <div id="selettore-turno" className="bg-[#FDF1E9]/30 p-6 rounded-[2rem] border border-[#F5CBA7]/20">
          <div className="space-y-6">
            {/* Render dei bottoni dei Turni estratti dal DB */}
            <div>
              <label className="block text-[10px] font-black text-[#781D2D] uppercase tracking-widest mb-3 ml-1">Fascia Oraria</label>
              <div className="flex flex-wrap gap-2">
                {turni.map(t => (
                  <button
                    key={t.idTurno}
                    type="button"
                    // Al click: imposta l'ID del turno, resetta l'ora e cancella i tavoli selezionati
                    onClick={() => { setTurnoError(null); setSelectedTurno(t.idTurno); setSelectedTime(''); setSelectedTavoli([]); }}
                    // Classe dinamica: se è selezionato lo coloro di rosso, altrimenti bianco
                    className={`px-6 py-3 rounded-xl text-sm font-bold transition-all border-2 ${selectedTurno === t.idTurno
                      ? 'bg-[#781D2D] border-[#781D2D] text-white shadow-md'
                      : 'bg-white border-[#F5CBA7]/30 text-[#781D2D] hover:border-[#F5CBA7]'}`}
                  >
                    {t.nomeTurno}
                  </button>
                ))}
              </div>
            </div>

            {/* 15. SELETTORE DELL'ORA (Compare solo se hai scelto un turno) */}
            {selectedTurno !== 0 && (
              <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                <label className="block text-[10px] font-black text-[#781D2D] uppercase tracking-widest mb-3 ml-1">Seleziona l'Ora esatta</label>
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                  {/* Usa la funzione pura generateTimeSlots passandogli inizio e fine del turno selezionato */}
                  {generateTimeSlots(
                    turni.find(t => t.idTurno === selectedTurno)?.oraInizio || '',
                    turni.find(t => t.idTurno === selectedTurno)?.oraFine || ''
                  ).map(slot => (
                    <button
                      key={slot}
                      type="button"
                      // Al click sull'ora, la imposta nello stato. Questo innesca lo useEffect che interroga il DB!
                      onClick={() => { setTurnoError(null); setSelectedTime(slot); setSelectedTavoli([]); }}
                      className={`px-4 py-2 rounded-xl text-sm font-bold transition-all border-2 ${selectedTime === slot
                        ? 'bg-[#781D2D] border-[#781D2D] text-white shadow-md'
                        : 'bg-white border-[#F5CBA7]/30 text-[#781D2D] hover:border-[#F5CBA7]'}`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 16. LA MAPPA DEI TAVOLI (IL CORE VISIVO) */}
      {/* Disabilita il click sulla mappa se sta ancora caricando (opacity-50 pointer-events-none) */}
      <div id="mappa-tavoli" className={`bg-[#FFFDFB] border-2 border-dashed border-[#F5CBA7] rounded-2xl p-6 md:p-10 mb-6 transition-opacity duration-300 ${loading ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>

        <div className="flex flex-wrap gap-6 justify-center mt-3">
          {(() => {
            // Estrae tutti i gruppi univoci presenti attualmente in mappa
            const uniqueGroups = Array.from(new Set(tavoli.map(t => t.idGruppo).filter(Boolean)));
            
            // Palette di colori ben distinti per differenziare i vari gruppi visivamente
            const groupColors = [
              'bg-blue-100 text-blue-700 border-blue-300',
              'bg-purple-100 text-purple-700 border-purple-300',
              'bg-pink-100 text-pink-700 border-pink-300',
              'bg-teal-100 text-teal-800 border-teal-300',
              'bg-indigo-100 text-indigo-700 border-indigo-300',
              'bg-emerald-100 text-emerald-800 border-emerald-300',
            ];

            return tavoli.map((tavolo) => {
            // 17. CALCOLO DELLO STATO VISIVO DEL SINGOLO TAVOLO
            const isOccupato = tavolo.stato === 'Occupato' || tavolo.stato === 'Non Disponibile';
            const isLibero = tavolo.stato === 'Libero';
            const isSelected = selectedIds.has(tavolo.idTavolo);

            // Recupera tutto il gruppo a cui appartiene
            const groupTables = tavolo.idGruppo ? tavoli.filter(t => t.idGruppo === tavolo.idGruppo && t.stato === 'Libero') : [tavolo];
            const groupMax = groupTables.reduce((s, t) => s + t.posti, 0);
            
            // Calcola dinamicamente se il tavolo ha un'effettiva utilità combinatoria per i pax richiesti
            const isUsable = pax === undefined || isTableUsable(tavolo, groupTables, pax);
            const isBlockedByFulfillment = isFulfilled && isLibero && !isSelected;

            // --- NUOVA FEATURE: TAVOLO CONSIGLIATO (IDEALE) ---
            // Il tavolo (o gruppo) viene considerato "ideale" se i suoi posti combaciano ESATTAMENTE col numero di pax richiesto
            const isRecommended = isLibero && pax !== undefined && !isSelected && isUsable && (tavolo.idGruppo ? groupMax === pax : tavolo.posti === pax);
            
            // Calcola a quale indice appartiene il gruppo per assegnargli un colore specifico
            const groupIndex = tavolo.idGruppo ? uniqueGroups.indexOf(tavolo.idGruppo) : -1;
            const groupColor = groupIndex >= 0 ? groupColors[groupIndex % groupColors.length] : '';

            // 18. ASSEGNAZIONE DINAMICA DELLE CLASSI CSS TRAMITE LOGICA
            let cls = '';
            if (isOccupato) {
              cls = 'bg-red-50 border-red-200 text-red-300 cursor-not-allowed'; // ROSSO
            } else if (!isLibero || isBlockedByFulfillment || !isUsable) {
              cls = 'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed opacity-60'; // GRIGIO INATTIVO (Bloccato perché matematicamente inutilizzabile)
            } else if (isSelected) {
              cls = 'bg-gradient-to-br from-[#D35400] to-[#781D2D] border-[#781D2D] text-white shadow-xl scale-110 ring-4 ring-[#F5CBA7] cursor-pointer z-10'; // ARANCIONE/ROSSO SELEZIONATO
            } else if (isRecommended) {
              cls = 'bg-green-50 border-green-500 text-[#781D2D] hover:shadow-lg hover:scale-105 cursor-pointer ring-2 ring-green-400 shadow-md z-10'; // CONSIGLIATO (Glow Verde)
            } else {
              cls = 'bg-white border-[#F5CBA7] text-[#781D2D] hover:border-[#D35400] hover:shadow-lg hover:scale-105 cursor-pointer'; // BIANCO LIBERO
            }

            return (
              <div
                key={tavolo.idTavolo}
                onClick={() => handleTableClick(tavolo)}
                className={`relative flex flex-col items-center justify-center w-24 h-24 rounded-2xl border-2 transition-all duration-200 select-none ${cls}`}
              >
                <span className="block font-black text-xl">T{tavolo.numero}</span>
                <span className="block text-[10px] uppercase font-bold opacity-75 mt-0.5">{tavolo.posti} posti</span>

                {/* 19. BADGE DINAMICI */}
                {/* Se ha un posto minimo > 1, mostra la label */}
                {isLibero && (tavolo.postiMinimi ?? 1) > 1 && !isSelected && (
                  <span className={`block text-[9px] font-bold mt-0.5 ${!isUsable ? 'text-red-400' : 'text-gray-400 opacity-70'}`}>
                    min {tavolo.postiMinimi}
                  </span>
                )}
                
                {/* Badge Consigliato "Ideale" */}
                {isRecommended && !isSelected && (
                  <span className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-green-500 text-white text-[8.5px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full shadow-sm whitespace-nowrap">
                    Ideale
                  </span>
                )}

                {/* Se fa parte di un gruppo, mostra l'etichetta col colore e numero del gruppo */}
                {tavolo.idGruppo && isLibero && (
                  <span className={`absolute -top-3 left-1/2 -translate-x-1/2 text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border shadow-sm whitespace-nowrap ${groupColor}`}>
                    🔗 GRUPPO {groupIndex + 1}
                  </span>
                )}
              </div>
            );
          })})()}
        </div>
      </div>

      {/* 20. PANNELLO LIVE RIASSUNTIVO FLOTTANTE */}
      {/* Appare solo se c'è almeno un tavolo selezionato (selectedTavoli.length > 0) */}
      <div className={`transition-all duration-500 mb-6 ${selectedTavoli.length > 0 ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none h-0 overflow-hidden'}`}>
        <div className="bg-gradient-to-r from-[#FDF1E9] to-orange-50 border-2 border-[#F5CBA7] rounded-2xl px-6 py-4 flex flex-col sm:flex-row sm:items-center gap-4">

          <div className="flex-1">
            <p className="text-[10px] font-black text-[#781D2D] uppercase tracking-widest mb-1">Tavoli selezionati</p>
            <div className="flex flex-wrap gap-2">
              {/* Renderizza dei "bottoncini" per ogni tavolo selezionato, cliccarli deseleziona il tavolo */}
              {selectedTavoli.map(t => (
                <button
                  key={t.idTavolo}
                  onClick={() => handleTableClick(t)}
                  className="flex items-center gap-1.5 bg-white border-2 border-[#D35400] text-[#781D2D] text-xs font-black px-3 py-1 rounded-xl hover:bg-red-50 transition-all"
                >
                  T{t.numero} <span className="text-[#D35400] text-xs">×</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-center">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Capacità totale</p>
              {/* Cambia colore (Verde/Rosso) in base alla variabile booleana canBook */}
              <p className={`text-3xl font-black transition-colors ${canBook ? 'text-green-600' : 'text-[#D35400]'}`}>
                {totalPostiSelezione} <span className="text-sm font-bold text-gray-400 ml-1">posti</span>
              </p>
            </div>
            {/* ... */}
          </div>
        </div>
      </div>

      {/* 21. TEXTAREA NOTE E BOTTONE DI CONFERMA FINALE */}
      <div className="transition-all duration-500 border-t-2 border-[#FDF1E9] pt-8">
        <div className="mb-8">
          <label className="block text-xs font-bold text-[#781D2D] uppercase tracking-widest mb-2 ml-1">Note Speciali</label>
          <textarea
            value={specialRequests}
            onChange={(e) => setSpecialRequests(e.target.value)} // Salva il testo nello stato di React
            className="w-full bg-white border border-gray-200 rounded-2xl px-4 py-3 min-h-[100px]"
          />
        </div>

        <button
          onClick={handleBooking}
          disabled={loading || message?.type === 'success'} // Disabilita in modo permanente se è un successo
          className={`w-full py-5 rounded-[2rem] font-black text-xl shadow-xl transition-all transform active:scale-95 ${canBook && !loading && message?.type !== 'success'
            ? 'bg-gradient-to-r from-[#D35400] via-[#E74C3C] to-[#781D2D] text-white hover:shadow-2xl hover:-translate-y-1'
            : 'bg-gray-100 text-gray-400'}`}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-3">Elaborazione...</span>
          ) : (caparraRichiesta > 0 && !paymentCompleted)
            ? `Procedi al Pagamento (€${caparraRichiesta.toFixed(2)})`
            : 'Conferma Prenotazione'}
        </button>
        {/*//verifica che l'importo della caparra sia maggiore di 0 e che il pagamento sia stato completato*/}
        {paymentCompleted && caparraRichiesta > 0 && (
          <p className="text-center mt-3 text-green-600 font-bold text-sm flex items-center justify-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
            Caparra di €{caparraRichiesta.toFixed(2)} pagata con successo!
          </p>
        )}
      </div>
    </div>
  );
}
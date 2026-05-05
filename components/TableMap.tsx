"use client";

import React, { useState, useEffect } from 'react';
import { getAvailableTables, createReservation } from '@/app/actions/cliente';
import { useRouter } from 'next/navigation';

type Tavolo = {
  idTavolo: number;
  numero: number;
  posti: number;
  postiMinimi: number;
  stato: string;
  idGruppo?: string | null;
};

type Turno = {
  idTurno: number;
  nomeTurno: string;
  oraInizio: string;
  oraFine: string;
};

function generateTimeSlots(start: string, end: string) {
  if (!start || !end) return [];
  const [h1, m1] = start.split(':').map(Number);
  const [h2, m2] = end.split(':').map(Number);
  
  let currentMinutes = h1 * 60 + m1;
  const endMinutes = h2 * 60 + m2;
  
  const slots = [];
  while (currentMinutes <= endMinutes) {
    const h = Math.floor(currentMinutes / 60);
    const m = currentMinutes % 60;
    slots.push(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
    currentMinutes += 15;
  }
  return slots;
}

export default function TableMap({
  initialTavoli,
  idRistorante,
  turni,
  pax,
  initialDate,
  caparraRichiesta = 0,
}: {
  initialTavoli: Tavolo[];
  idRistorante: number;
  turni: Turno[];
  pax?: number;
  initialDate?: string;
  caparraRichiesta?: number;
}) {
  const [tavoli, setTavoli] = useState<Tavolo[]>(initialTavoli);
  const [selectedTavoli, setSelectedTavoli] = useState<Tavolo[]>([]);
  const [selectedTurno, setSelectedTurno] = useState<number>(0);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(
    initialDate || new Date().toISOString().split('T')[0]
  );
  const [specialRequests, setSpecialRequests] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentCompleted, setPaymentCompleted] = useState(false);
  // Temporary toast for minimum-capacity blocks
  const [minToast, setMinToast] = useState<string | null>(null);

  const router = useRouter();

  useEffect(() => {
    if (turni.length > 0 && selectedTurno === 0) {
      setSelectedTurno(turni[0].idTurno);
    }
  }, [turni]);

  useEffect(() => {
    async function updateAvailability() {
      if (!selectedTurno || !selectedDate) return;
      setLoading(true);
      const updated = await getAvailableTables(idRistorante, selectedDate, selectedTurno, selectedTime);
      setTavoli(updated);
      setLoading(false);
      // Deselect any tables that are no longer free
      setSelectedTavoli(prev =>
        prev.filter(sel => {
          const t = updated.find(u => u.idTavolo === sel.idTavolo);
          return t && t.stato === 'Libero';
        })
      );
    }
    updateAvailability();
  }, [selectedTurno, selectedDate, selectedTime, idRistorante]);

  // Derived values
  const selectedIds = new Set(selectedTavoli.map(t => t.idTavolo));
  const totalPostiSelezione = selectedTavoli.reduce((s, t) => s + t.posti, 0);
  const isFulfilled = pax !== undefined && totalPostiSelezione >= pax;
  const canBook = selectedTavoli.length > 0 && (!pax || totalPostiSelezione >= pax);

  const showMinToast = (text: string) => {
    setMinToast(text);
    setTimeout(() => setMinToast(null), 3500);
  };

  const handleTableClick = (tavolo: Tavolo) => {
    if (tavolo.stato !== 'Libero') return;

    setSelectedTavoli(prev => {
      const isAlreadySelected = prev.some(t => t.idTavolo === tavolo.idTavolo);

      // Blocco a Soddisfacimento
      if (isFulfilled && !isAlreadySelected) {
        setTimeout(() => showMinToast("Hai già selezionato un numero di posti sufficiente per il tuo gruppo. Rimuovi un tavolo se vuoi sceglierne un altro."), 0);
        return prev;
      }

      // Deselect
      if (isAlreadySelected) {
        return prev.filter(t => t.idTavolo !== tavolo.idTavolo);
      }

      // Build the hypothetical new selection
      let nextSelection: Tavolo[];
      if (!tavolo.idGruppo) {
        nextSelection = [tavolo];
      } else {
        const currentGroupId = prev.length > 0 ? prev[0].idGruppo : null;
        nextSelection = currentGroupId === tavolo.idGruppo
          ? [...prev, tavolo]
          : [tavolo];
      }

      // Validate postiMinimi:
      // pax must be >= sum of postiMinimi of all tables in new selection
      if (pax !== undefined) {
        const totalMin = nextSelection.reduce((s, t) => s + (t.postiMinimi ?? 1), 0);
        if (pax < totalMin) {
          const isSingle = nextSelection.length === 1;
          const msg = isSingle
            ? `Per prenotare questo tavolo è richiesto un minimo di ${tavolo.postiMinimi} persone.`
            : `Per unire questi tavoli è richiesto un minimo di ${totalMin} persone totali.`;
          // Schedule toast (can't call setState inside setState updater synchronously)
          setTimeout(() => showMinToast(msg), 0);
          return prev; // no change
        }
      }

      return nextSelection;
    });
  };

  const handleBooking = async () => {
    if (!selectedTurno || !selectedTime) {
      setMessage({ type: 'error', text: 'Seleziona un turno e un orario.' });
      return;
    }
    if (selectedTavoli.length === 0) {
      setMessage({ type: 'error', text: 'Seleziona almeno un tavolo sulla mappa.' });
      return;
    }
    if (pax && totalPostiSelezione < pax) {
      setMessage({ type: 'error', text: `Servono almeno ${pax} posti. Attualmente selezionati: ${totalPostiSelezione}.` });
      return;
    }
    if (caparraRichiesta > 0 && !paymentCompleted) {
      setShowPaymentModal(true);
      return;
    }
    setLoading(true);
    try {
      const result = await createReservation({
        idRistorante,
        idTurno: selectedTurno,
        dataPrenotazione: `${selectedDate} ${selectedTime}`,
        numeroPersone: pax || totalPostiSelezione,
        idTavoli: selectedTavoli.map(t => t.idTavolo),
        noteCliente: specialRequests,
        caparraPagata: paymentCompleted,
      });
      if (result.success) {
        setMessage({ type: 'success', text: 'Prenotazione effettuata con successo!' });
        setTimeout(() => { router.push('/cliente/prenotazioni'); }, 2000);
      } else {
        setMessage({ type: 'error', text: result.error || 'Errore durante la prenotazione.' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Errore di connessione al server.' });
    } finally {
      setLoading(false);
    }
  };

  const simulatePayment = () => {
    setPaymentLoading(true);
    setTimeout(() => {
      setPaymentLoading(false);
      setPaymentCompleted(true);
      setShowPaymentModal(false);
    }, 2000);
  };

  return (
    <div className="bg-white border border-[#F5CBA7] rounded-3xl p-6 md:p-8 shadow-md relative overflow-hidden">

      {/* Toast message */}
      {message && (
        <div className={`absolute top-0 left-0 w-full p-4 text-center font-bold z-20 animate-in slide-in-from-top duration-300 ${message.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
          {message.text}
        </div>
      )}

      {/* Minimum capacity toast */}
      {minToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-gray-900 text-white px-5 py-3 rounded-2xl shadow-2xl animate-in slide-in-from-bottom-4 duration-300 max-w-sm text-sm font-semibold">
          <span className="text-xl">🚫</span>
          {minToast}
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] p-8 md:p-10 max-w-md w-full shadow-2xl border-2 border-[#F5CBA7]/30">
            <div className="flex flex-col items-center mb-8">
              <div className="w-20 h-20 bg-[#FDF1E9] rounded-full flex items-center justify-center mb-4">
                <svg className="w-10 h-10 text-[#D35400]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
              <h3 className="text-2xl font-black text-[#781D2D] text-center">Pagamento Caparra</h3>
              <p className="text-[#D35400] font-bold text-center mt-1">Importo: €{caparraRichiesta.toFixed(2)}</p>
            </div>
            <div className="space-y-4 mb-8">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Numero Carta</label>
                <div className="bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 text-gray-400 font-mono text-sm tracking-widest flex justify-between items-center">
                  <span>•••• •••• •••• 4242</span>
                  <div className="flex space-x-1">
                    <div className="w-6 h-4 bg-red-400 rounded-sm opacity-50"></div>
                    <div className="w-6 h-4 bg-yellow-400 rounded-sm opacity-50"></div>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Scadenza</label>
                  <div className="bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 text-gray-400 font-bold text-sm">MM/AA</div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">CVC</label>
                  <div className="bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 text-gray-400 font-bold text-sm">•••</div>
                </div>
              </div>
            </div>
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
            <div className="mt-6 pt-4 border-t border-gray-50 flex items-center justify-center gap-2 text-gray-300">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
              <span className="text-[10px] font-bold uppercase tracking-widest">Pagamento 100% Sicuro</span>
            </div>
          </div>
        </div>
      )}

      {/* ── Header ── */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h2 className="text-3xl font-black text-[#781D2D] tracking-tight">Prenota il tuo Tavolo</h2>
            <p className="text-[#D35400] font-medium text-sm mt-1">Seleziona uno o più tavoli liberi sulla mappa, poi conferma.</p>
          </div>
          {/* Legend */}
          <div className="flex flex-wrap gap-3 text-[10px] font-black uppercase tracking-widest bg-gray-50 px-4 py-2 rounded-full border border-gray-100">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 bg-green-500 rounded-full"></span>
              <span className="text-gray-500">Libero</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 bg-[#D35400] rounded-full"></span>
              <span className="text-gray-500">Selezionato</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 bg-red-400 rounded-full"></span>
              <span className="text-gray-500">Occupato</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 bg-gray-300 rounded-full"></span>
              <span className="text-gray-500">N/D</span>
            </div>
          </div>
        </div>

        {/* Read-only reservation summary */}
        <div className="flex flex-col md:flex-row items-center gap-6 bg-[#FDF1E9]/50 px-6 py-4 rounded-3xl border border-[#F5CBA7]/30 mb-8">
          <div className="flex items-center gap-3 text-[#781D2D]">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm text-xl">📅</div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Data selezionata</p>
              <p className="font-bold">{new Date(selectedDate).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            </div>
          </div>
          <div className="hidden md:block w-px h-10 bg-[#F5CBA7]/30"></div>
          <div className="flex items-center gap-3 text-[#781D2D]">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm text-xl">👥</div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Numero Ospiti</p>
              <p className="font-bold">{pax} {pax === 1 ? 'persona' : 'persone'}</p>
            </div>
          </div>
        </div>

        {/* Turno selector (Remaining Interactive) */}
        <div className="bg-[#FDF1E9]/30 p-6 rounded-[2rem] border border-[#F5CBA7]/20">
          <div className="space-y-6">
            <div>
              <label className="block text-[10px] font-black text-[#781D2D] uppercase tracking-widest mb-3 ml-1">Fascia Oraria</label>
              <div className="flex flex-wrap gap-2">
                {turni.length === 0 ? (
                  <div className="text-sm font-bold text-red-500 bg-red-50 p-3 rounded-xl border border-red-100">
                    Nessun orario di servizio configurato.
                  </div>
                ) : (
                  turni.map(t => (
                    <button
                      key={t.idTurno}
                      type="button"
                      onClick={() => { setSelectedTurno(t.idTurno); setSelectedTime(''); setSelectedTavoli([]); }}
                      className={`px-6 py-3 rounded-xl text-sm font-bold transition-all border-2 ${selectedTurno === t.idTurno
                        ? 'bg-[#781D2D] border-[#781D2D] text-white shadow-md'
                        : 'bg-white border-[#F5CBA7]/30 text-[#781D2D] hover:border-[#F5CBA7]'}`}
                    >
                      {t.nomeTurno}
                    </button>
                  ))
                )}
              </div>
            </div>

            {selectedTurno !== 0 && (
              <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                <label className="block text-[10px] font-black text-[#781D2D] uppercase tracking-widest mb-3 ml-1">Seleziona l&apos;Ora esatta</label>
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                  {generateTimeSlots(
                    turni.find(t => t.idTurno === selectedTurno)?.oraInizio || '',
                    turni.find(t => t.idTurno === selectedTurno)?.oraFine || ''
                  ).map(slot => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => { setSelectedTime(slot); setSelectedTavoli([]); }}
                      className={`py-2 rounded-lg text-xs font-bold transition-all border ${selectedTime === slot
                        ? 'bg-[#D35400] border-[#D35400] text-white shadow-sm'
                        : 'bg-white border-[#F5CBA7]/30 text-[#781D2D] hover:border-[#D35400]'}`}
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

      {/* ── Table Map ── */}
      <div className={`bg-[#FFFDFB] border-2 border-dashed border-[#F5CBA7] rounded-2xl p-6 md:p-10 mb-6 transition-opacity duration-300 ${loading ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <div className="w-8 h-8 border-4 border-[#F5CBA7] border-t-[#D35400] rounded-full animate-spin"></div>
          </div>
        )}
        <div className="flex flex-wrap gap-6 justify-center">
          {tavoli.map((tavolo) => {
            const isOccupato = tavolo.stato === 'Occupato' || tavolo.stato === 'Non Disponibile';
            const isLibero = tavolo.stato === 'Libero';
            const isSelected = selectedIds.has(tavolo.idTavolo);
            // Check if pax respects the minimum for this table
            const belowMinimum = isLibero && pax !== undefined && pax < (tavolo.postiMinimi ?? 1);
            // Blocco a Soddisfacimento
            const isBlockedByFulfillment = isFulfilled && isLibero && !isSelected;

            let cls = '';
            if (isOccupato) {
              cls = 'bg-red-50 border-red-200 text-red-300 cursor-not-allowed';
            } else if (!isLibero) {
              cls = 'bg-gray-50 border-gray-200 text-gray-300 cursor-not-allowed opacity-50';
            } else if (isBlockedByFulfillment) {
              cls = 'bg-white border-[#F5CBA7] text-[#781D2D] opacity-50 cursor-not-allowed';
            } else if (belowMinimum) {
              cls = 'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed opacity-60';
            } else if (isSelected) {
              cls = 'bg-gradient-to-br from-[#D35400] to-[#781D2D] border-[#781D2D] text-white shadow-xl scale-110 ring-4 ring-[#F5CBA7] cursor-pointer';
            } else {
              cls = 'bg-white border-[#F5CBA7] text-[#781D2D] hover:border-[#D35400] hover:shadow-lg hover:scale-105 cursor-pointer';
            }

            return (
              <div
                key={tavolo.idTavolo}
                onClick={() => handleTableClick(tavolo)}
                className={`relative flex flex-col items-center justify-center w-24 h-24 rounded-2xl border-2 transition-all duration-200 select-none ${cls}`}
              >
                <span className="block font-black text-xl">T{tavolo.numero}</span>
                <span className="block text-[10px] uppercase font-bold opacity-75 mt-0.5">{tavolo.posti} posti</span>
                {/* Minimum capacity indicator */}
                {isLibero && (tavolo.postiMinimi ?? 1) > 1 && !isSelected && (
                  <span className={`block text-[9px] font-bold mt-0.5 ${belowMinimum ? 'text-red-400' : 'text-gray-400 opacity-70'}`}>
                    min {tavolo.postiMinimi}
                  </span>
                )}

                {/* Group badge for linkable tables */}
                {tavolo.idGruppo && isLibero && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-orange-100 text-orange-600 text-[8px] font-black uppercase tracking-wide px-1.5 py-0.5 rounded-full border border-orange-200 whitespace-nowrap">
                    🔗
                  </span>
                )}

                {isOccupato && (
                  <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-red-100 text-red-500 text-[8px] font-black uppercase px-1.5 py-0.5 rounded-full border border-red-200 whitespace-nowrap">
                    Occupato
                  </span>
                )}

                {isSelected && (
                  <div className="absolute -top-2 -right-2 bg-white text-[#D35400] w-6 h-6 rounded-full flex items-center justify-center shadow-md">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Live Summary Panel ── */}
      <div className={`transition-all duration-500 mb-6 ${selectedTavoli.length > 0 ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none h-0 overflow-hidden'}`}>
        <div className="bg-gradient-to-r from-[#FDF1E9] to-orange-50 border-2 border-[#F5CBA7] rounded-2xl px-6 py-4 flex flex-col sm:flex-row sm:items-center gap-4">
          {/* Tables list */}
          <div className="flex-1">
            <p className="text-[10px] font-black text-[#781D2D] uppercase tracking-widest mb-1">Tavoli selezionati</p>
            <div className="flex flex-wrap gap-2">
              {selectedTavoli.map(t => (
                <button
                  key={t.idTavolo}
                  onClick={() => handleTableClick(t)}
                  className="flex items-center gap-1.5 bg-white border-2 border-[#D35400] text-[#781D2D] text-xs font-black px-3 py-1 rounded-xl hover:bg-red-50 transition-all"
                  title="Clicca per deselezionare"
                >
                  T{t.numero}
                  <span className="text-[#D35400] text-xs">×</span>
                </button>
              ))}
            </div>
          </div>

          {/* Capacity counter */}
          <div className="flex items-center gap-4">
            <div className="text-center">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Capacità totale</p>
              <p className={`text-3xl font-black transition-colors ${canBook ? 'text-green-600' : 'text-[#D35400]'}`}>
                {totalPostiSelezione}
                <span className="text-sm font-bold text-gray-400 ml-1">posti</span>
              </p>
            </div>

            {pax && (
              <div className="text-center">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Richiesti</p>
                <p className="text-3xl font-black text-gray-700">
                  {pax}
                  <span className="text-sm font-bold text-gray-400 ml-1">pers.</span>
                </p>
              </div>
            )}

            {/* Status badge */}
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black border-2 ${canBook ? 'bg-green-50 border-green-200 text-green-700' : 'bg-orange-50 border-orange-200 text-orange-700'}`}>
              {canBook ? (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                  Sufficiente
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M12 3a9 9 0 110 18A9 9 0 0112 3z" />
                  </svg>
                  {pax ? `Mancano ${pax - totalPostiSelezione} posti` : 'Seleziona'}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Booking Form ── */}
      <div className="transition-all duration-500 border-t-2 border-[#FDF1E9] pt-8">
        <div className="mb-8">
          <label className="block text-xs font-bold text-[#781D2D] uppercase tracking-widest mb-2 ml-1">Note Speciali</label>
          <textarea
            value={specialRequests}
            onChange={(e) => setSpecialRequests(e.target.value)}
            placeholder="Allergie, compleanni, richieste particolari..."
            className="w-full bg-white border border-gray-200 rounded-2xl px-4 py-3 text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-[#D35400] transition-all resize-none"
            rows={2}
          />
        </div>

        <button
          onClick={handleBooking}
          disabled={!canBook || loading}
          className={`w-full py-5 rounded-[2rem] font-black text-xl shadow-xl transition-all transform active:scale-95 ${canBook && !loading
            ? 'bg-gradient-to-r from-[#D35400] via-[#E74C3C] to-[#781D2D] text-white hover:shadow-2xl hover:-translate-y-1'
            : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-3">
              <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-500 rounded-full animate-spin"></div>
              Elaborazione...
            </span>
          ) : (caparraRichiesta > 0 && !paymentCompleted)
            ? `Procedi al Pagamento (€${caparraRichiesta.toFixed(2)})`
            : 'Conferma Prenotazione'}
        </button>

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

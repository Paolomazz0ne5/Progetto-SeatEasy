"use client";

import React, { useState, useEffect } from 'react';
import { getAvailableTables, createReservation } from '@/app/actions/cliente';
import { useRouter } from 'next/navigation';

type Tavolo = {
  idTavolo: number;
  numero: number;
  posti: number;
  stato: string; // 'Libero', 'Occupato', 'Non Disponibile'
};

type Turno = {
  idTurno: number;
  nomeTurno: string;
  oraInizio: string;
};

export default function TableMap({ 
  initialTavoli, 
  idRistorante, 
  turni 
}: { 
  initialTavoli: Tavolo[], 
  idRistorante: number,
  turni: Turno[]
}) {
  const [tavoli, setTavoli] = useState<Tavolo[]>(initialTavoli);
  const [selectedTable, setSelectedTable] = useState<Tavolo | null>(null);
  const [selectedTurno, setSelectedTurno] = useState<number>(0);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    if (turni.length > 0 && selectedTurno === 0) {
      setSelectedTurno(turni[0].idTurno);
    }
  }, [turni]);
  const [numPersone, setNumPersone] = useState<number>(2);
  const [specialRequests, setSpecialRequests] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  
  // Payment states
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentCompleted, setPaymentCompleted] = useState(false);
  
  const router = useRouter();

  useEffect(() => {
    async function updateAvailability() {
      if (selectedTurno && selectedDate) {
        setLoading(true);
        const updated = await getAvailableTables(idRistorante, selectedDate, selectedTurno);
        setTavoli(updated);
        setLoading(false);
        // Reset selected table if it's now occupied or too small
        if (selectedTable) {
          const t = updated.find(t => t.idTavolo === selectedTable.idTavolo);
          if (!t || t.stato !== 'Libero' || (pax && t.posti < pax)) {
            setSelectedTable(null);
          }
        }
      }
    }
    updateAvailability();
  }, [selectedTurno, selectedDate, idRistorante]);

  const handleTableClick = (tavolo: Tavolo) => {
    // Non permette di selezionare tavoli troppo piccoli per gli ospiti richiesti
    if (tavolo.stato === 'Libero' && (!pax || tavolo.posti >= pax)) {
      setSelectedTable(tavolo);
      if (numPersone > tavolo.posti) {
        setNumPersone(tavolo.posti);
      } else if (pax && numPersone < pax) {
        setNumPersone(pax);
      }
    }
  };

  const handleBooking = async () => {
    if (!selectedTurno) {
      setMessage({ type: 'error', text: 'Nessun orario disponibile per questa data.' });
      return;
    }
    if (!selectedTable) {
      setMessage({ type: 'error', text: 'Seleziona un tavolo sulla mappa.' });
      return;
    }

    // Check if payment is required but not completed
    if (caparraRichiesta > 0 && !paymentCompleted) {
      setShowPaymentModal(true);
      return;
    }

    setLoading(true);
    try {
      const result = await createReservation({
        idRistorante,
        idTurno: selectedTurno,
        dataPrenotazione: selectedDate,
        numeroPersone: numPersone,
        idTavolo: selectedTable.idTavolo,
        noteCliente: specialRequests,
        caparraPagata: paymentCompleted
      });

      if (result.success) {
        setMessage({ type: 'success', text: 'Prenotazione effettuata con successo!' });
        setTimeout(() => {
          router.push('/cliente/prenotazioni');
        }, 2000);
      } else {
        setMessage({ type: 'error', text: result.error || 'Errore durante la prenotazione.' });
      }
    } catch (err) {
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
      
      {message && (
        <div className={`absolute top-0 left-0 w-full p-4 text-center font-bold z-20 animate-in slide-in-from-top duration-300 ${message.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
          {message.text}
        </div>
      )}

      {/* Simulated Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] p-8 md:p-10 max-w-md w-full shadow-2xl relative overflow-hidden border-2 border-[#F5CBA7]/30">
            {/* Modal Header */}
            <div className="flex flex-col items-center mb-8">
              <div className="w-20 h-20 bg-[#FDF1E9] rounded-full flex items-center justify-center mb-4">
                <svg className="w-10 h-10 text-[#D35400]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
              <h3 className="text-2xl font-black text-[#781D2D] text-center">Pagamento Caparra</h3>
              <p className="text-[#D35400] font-bold text-center mt-1">Importo: €{caparraRichiesta.toFixed(2)}</p>
            </div>

            {/* Mock Credit Card Form */}
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

            {/* Simulated Payment Actions */}
            <div className="flex flex-col gap-3">
              <button
                onClick={simulatePayment}
                disabled={paymentLoading}
                className="w-full bg-[#781D2D] text-white py-4 rounded-2xl font-black text-lg hover:bg-[#5f1723] transition-all flex items-center justify-center gap-3 shadow-lg shadow-[#781D2D]/20 disabled:opacity-70"
              >
                {paymentLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Elaborazione...
                  </>
                ) : (
                  <>Paga €{caparraRichiesta.toFixed(2)}</>
                )}
              </button>
              <button
                onClick={() => setShowPaymentModal(false)}
                disabled={paymentLoading}
                className="w-full bg-white text-[#781D2D] py-4 rounded-2xl font-bold text-sm hover:bg-gray-50 transition-all border-2 border-transparent hover:border-[#F5CBA7]/20"
              >
                Annulla
              </button>
            </div>
            
            {/* Security Note */}
            <div className="mt-8 pt-6 border-t border-gray-50 flex items-center justify-center gap-2 text-gray-300">
               <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                 <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
               </svg>
               <span className="text-[10px] font-bold uppercase tracking-widest">Pagamento 100% Sicuro - Simulazione Protetta</span>
            </div>
          </div>
        </div>
      )}

      <div className="mb-10 flex flex-col gap-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-3xl font-black text-[#781D2D] tracking-tight">Prenota il tuo Tavolo</h2>
            <p className="text-[#D35400] font-medium text-sm mt-1">Scegli data e ora, poi seleziona il tuo posto sulla mappa.</p>
          </div>

          <div className="flex space-x-4 text-[10px] font-black uppercase tracking-widest bg-gray-50 px-4 py-2 rounded-full border border-gray-100">
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 bg-green-500 rounded-full shadow-sm"></span>
              <span className="text-gray-500">Libero</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 bg-red-500 rounded-full shadow-sm"></span>
              <span className="text-gray-500">Occupato</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 bg-gray-300 rounded-full shadow-sm"></span>
              <span className="text-gray-500">N/D</span>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end bg-[#FDF1E9]/30 p-6 rounded-[2rem] border border-[#F5CBA7]/20">
          <div className="md:col-span-3">
            <label className="block text-[10px] font-black text-[#781D2D] uppercase tracking-widest mb-1.5 ml-1">Data</label>
            <input 
              type="date" 
              value={selectedDate}
              min={new Date().toISOString().split('T')[0]}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full bg-[#FDF1E9] border border-[#F5CBA7]/50 rounded-xl px-4 py-3 text-sm font-bold text-[#781D2D] focus:outline-none focus:ring-2 focus:ring-[#D35400]"
            />
          </div>

          <div className="md:col-span-9">
             <label className="block text-[10px] font-black text-[#781D2D] uppercase tracking-widest mb-3 ml-1">Seleziona l'Orario</label>
             <div className="flex flex-wrap gap-2">
               {turni.length === 0 ? (
                 <div className="text-sm font-bold text-red-500 bg-red-50 p-3 rounded-xl border border-red-100">
                   Nessun orario di servizio configurato per questo ristorante.
                 </div>
               ) : (
                 turni.map(t => (
                   <button
                     key={t.idTurno}
                     type="button"
                     onClick={() => setSelectedTurno(t.idTurno)}
                     className={`px-4 py-2 rounded-xl text-sm font-bold transition-all border-2 ${selectedTurno === t.idTurno 
                        ? 'bg-[#781D2D] border-[#781D2D] text-white shadow-md' 
                        : 'bg-white border-[#F5CBA7]/30 text-[#781D2D] hover:border-[#F5CBA7]'}`}
                   >
                     {t.nomeTurno}
                   </button>
                 ))
               )}
             </div>
          </div>
        </div>
      </div>

      {/* The Interactive Room Map Grid */}
      <div className={`bg-[#FFFDFB] border-2 border-dashed border-[#F5CBA7] rounded-2xl p-6 md:p-10 mb-8 relative transition-opacity duration-300 ${loading ? 'opacity-50' : 'opacity-100'}`}>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-8 place-items-center">
          {tavoli.map((tavolo) => {
            const isTroppoPiccolo = pax ? tavolo.posti < pax : false;
            const isLibero = tavolo.stato === 'Libero' && !isTroppoPiccolo;
            const isOccupato = tavolo.stato === 'Occupato';
            const isSelected = selectedTable?.idTavolo === tavolo.idTavolo;

            let bgColor = "bg-gray-100 border-gray-200 text-gray-400";
            if (isLibero) bgColor = "bg-white border-[#F5CBA7] text-[#781D2D] hover:border-[#D35400] hover:shadow-lg cursor-pointer";
            if (isOccupato) bgColor = "bg-red-50 border-red-200 text-red-300 cursor-not-allowed";
            if (isTroppoPiccolo && tavolo.stato !== 'Occupato') bgColor = "bg-gray-50 border-gray-200 text-gray-300 cursor-not-allowed opacity-50";
            if (isSelected) bgColor = "bg-gradient-to-br from-[#D35400] to-[#781D2D] border-[#781D2D] text-white shadow-xl scale-110 ring-4 ring-[#F5CBA7]";

            return (
              <div 
                key={tavolo.idTavolo}
                onClick={() => handleTableClick(tavolo)}
                className={`relative flex flex-col items-center justify-center w-20 h-20 sm:w-24 sm:h-24 rounded-2xl border-2 transition-all duration-500 ${bgColor}`}
              >
                <span className="block font-black text-lg">T{tavolo.numero}</span>
                <span className="block text-[10px] uppercase font-bold opacity-80">{tavolo.posti} POSTI</span>
                
                {/* Visual indicator for selection */}
                {isSelected && (
                  <div className="absolute -top-2 -right-2 bg-white text-[#D35400] w-6 h-6 rounded-full flex items-center justify-center shadow-md animate-bounce">
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

      {/* Booking Summary Section */}
      <div className={`transition-all duration-700 ease-in-out border-t-2 border-[#FDF1E9] pt-8 ${selectedTable ? 'opacity-100 translate-y-0' : 'opacity-40 translate-y-4 pointer-events-none'}`}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          <div className="lg:col-span-1">
            <h3 className="text-xl font-black text-[#781D2D] mb-4">Il Tuo Tavolo</h3>
            {selectedTable && (
              <div className="bg-gradient-to-r from-[#FDF1E9] to-white p-6 rounded-[2rem] border border-[#F5CBA7]/50 shadow-sm">
                 <div className="flex items-center gap-4">
                   <div className="w-16 h-16 bg-[#781D2D] rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-[#781D2D]/20">
                     T{selectedTable.numero}
                   </div>
                   <div>
                     <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">Selezionato</p>
                     <p className="font-black text-[#781D2D] text-lg">Tavolo da {selectedTable.posti}</p>
                   </div>
                 </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-[#781D2D] uppercase tracking-widest mb-2 ml-1">Numero di Persone</label>
              <select 
                value={numPersone}
                onChange={(e) => setNumPersone(Number(e.target.value))}
                className="w-full bg-white border border-gray-200 rounded-2xl px-4 py-3 text-gray-900 font-bold focus:outline-none focus:ring-2 focus:ring-[#D35400] transition-all"
              >
                {Array.from({ length: selectedTable?.posti || 0 }).map((_, i) => (
                  <option key={i} value={i + 1}>{i + 1} {i === 0 ? 'Persona' : 'Persone'}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-[#781D2D] uppercase tracking-widest mb-2 ml-1">Note Speciali</label>
              <textarea 
                value={specialRequests}
                onChange={(e) => setSpecialRequests(e.target.value)}
                placeholder="Allergie, compleanni..."
                className="w-full bg-white border border-gray-200 rounded-2xl px-4 py-3 text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-[#D35400] transition-all resize-none"
                rows={1}
              />
            </div>
          </div>
        </div>

        <button 
          onClick={handleBooking}
          disabled={!selectedTable || loading}
          className={`w-full mt-8 py-5 rounded-[2rem] font-black text-xl shadow-xl transition-all transform active:scale-95 ${selectedTable && !loading ? 'bg-gradient-to-r from-[#D35400] via-[#E74C3C] to-[#781D2D] text-white hover:shadow-2xl hover:-translate-y-1' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
        >
          {loading ? 'Elaborazione...' : 
           (caparraRichiesta > 0 && !paymentCompleted) ? `Procedi al Pagamento (€${caparraRichiesta.toFixed(2)})` : 
           `Conferma Prenotazione`}
        </button>
        
        {paymentCompleted && caparraRichiesta > 0 && (
          <p className="text-center mt-3 text-green-600 font-bold text-sm animate-pulse flex items-center justify-center gap-2">
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

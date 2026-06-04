'use client';

import React, { useState, useEffect } from 'react';
import { updateReservation } from '@/app/actions/cliente';
import { getAvailableTablesForManual } from '@/app/actions/gestore';
import { useRouter } from 'next/navigation';
import { Calendar, Clock, Users, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

function generateTimeSlots(start: string, end: string) {
  if (!start || !end) return [];
  const [h1, m1] = start.split(':').map(Number);
  const [h2, m2] = end.split(':').map(Number);

  let currentMinutes = h1 * 60 + m1;
  let endMinutes = h2 * 60 + m2;
  if (endMinutes < currentMinutes) endMinutes += 24 * 60;

  const slots = [];
  while (currentMinutes <= endMinutes) {
    const h = Math.floor(currentMinutes / 60) % 24;
    const m = currentMinutes % 60;
    slots.push(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
    currentMinutes += 15;
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
  // Precompiliamo i dati dividendo la data e l'ora se sono congiunti (es. "2026-10-15 20:30")
  const initialDateStr = reservation.dataPrenotazione.includes(' ') 
    ? reservation.dataPrenotazione.split(' ')[0] 
    : reservation.dataPrenotazione;
  const initialTimeStr = reservation.dataPrenotazione.includes(' ') 
    ? reservation.dataPrenotazione.split(' ')[1] 
    : '20:00';

  const [dataPrenotazione, setDataPrenotazione] = useState(initialDateStr);
  const [ora, setOra] = useState(initialTimeStr);
  const [numPersone, setNumPersone] = useState(reservation.numeroPersone);
  const [noteCliente, setNoteCliente] = useState(reservation.noteCliente || "");

  const validTimeSlots = Array.from(new Set(turni.flatMap(t => generateTimeSlots(t.oraInizio, t.oraFine)))).sort();

  // Stati per la ricerca dinamica dei tavoli liberi
  const [freeTables, setFreeTables] = useState<any[]>([]);
  const [availableTurnoId, setAvailableTurnoId] = useState<number | null>(reservation.idTurno);
  const [isSearchingTables, setIsSearchingTables] = useState(false);
  const [selectedTavoloId, setSelectedTavoloId] = useState<number>(0);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const router = useRouter();

  // Effetto "reattivo": ricalcola i tavoli quando l'utente cambia Data, Ora o Pax
  useEffect(() => {
    async function fetchTables() {
      if (dataPrenotazione && ora && numPersone > 0) {
        setIsSearchingTables(true);
        // Chiamata alla Server Action del Gestore per cercare i tavoli liberi
        // Passiamo reservation.idPrenotazione per far capire al DB di "ignorare" l'ingombro della nostra stessa prenotazione
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
          
          if (res.freeTables.length > 0) {
            setSelectedTavoloId(res.freeTables[0].idTavolo);
          } else {
            setSelectedTavoloId(0);
          }
        } else {
          setFreeTables([]);
          setAvailableTurnoId(null);
          setSelectedTavoloId(0);
        }
        setIsSearchingTables(false);
      }
    }
    
    // Piccolo debounce per non spammare il database ad ogni singolo carattere digitato nell'orario
    const timeoutId = setTimeout(() => {
      fetchTables();
    }, 400);
    
    return () => clearTimeout(timeoutId);
  }, [dataPrenotazione, ora, numPersone, reservation.idRistorante, reservation.idPrenotazione]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Controllo bloccante: se non ci sono tavoli, non si può prenotare
    if (!selectedTavoloId || !availableTurnoId) {
      setMessage({ type: 'error', text: 'Nessun tavolo disponibile per questi parametri. Cambia data o orario.' });
      return;
    }

    setLoading(true);

    // Ricomponiamo la stringa completa per il DB
    const fullDate = `${dataPrenotazione} ${ora}`;

    const result = await updateReservation(reservation.idPrenotazione, {
      numeroPersone: numPersone,
      noteCliente,
      idTurno: availableTurnoId,
      dataPrenotazione: fullDate,
      idTavolo: selectedTavoloId // Passiamo il nuovo tavolo!
    });

    if (result.success) {
      setMessage({ type: 'success', text: 'Modifica salvata! Tavolo confermato.' });
      setTimeout(() => router.push('/cliente/prenotazioni'), 1500);
    } else {
      setMessage({ type: 'error', text: result.error || 'Errore durante il salvataggio.' });
    }
    setLoading(false);
  };

  return (
    <div className="bg-white border border-[#F5CBA7]/60 rounded-[2.5rem] p-8 sm:p-12 shadow-2xl relative overflow-hidden">
      {message && (
        <div className={`absolute top-0 left-0 w-full p-4 text-center font-bold z-20 animate-in slide-in-from-top duration-300 ${message.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
          {message.text}
        </div>
      )}

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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-xs font-black text-[#781D2D] uppercase tracking-widest ml-1">
              <Calendar size={14} /> Data
            </label>
            <input
              type="date"
              value={dataPrenotazione}
              min={new Date().toISOString().split('T')[0]}
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

          {/* Selezione Tavolo Dinamica */}
          <div className="space-y-2">
            <label className="flex items-center justify-between text-xs font-black text-[#781D2D] uppercase tracking-widest ml-1">
              <span>Tavolo Assegnato</span>
              {isSearchingTables && <span className="text-[#D35400] text-[10px] animate-pulse">Ricerca in corso...</span>}
            </label>
            <select
              value={selectedTavoloId}
              onChange={(e) => setSelectedTavoloId(Number(e.target.value))}
              disabled={freeTables.length === 0 || isSearchingTables}
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
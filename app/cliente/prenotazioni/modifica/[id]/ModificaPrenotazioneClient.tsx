'use client';

import React, { useState } from 'react';
import { updateReservation } from '@/app/actions/cliente';
import { useRouter } from 'next/navigation';
import { Calendar, Clock, Users, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function ModificaPrenotazioneClient({ 
  reservation, 
  turni 
}: { 
  reservation: any, 
  turni: any[] 
}) {
  const [numPersone, setNumPersone] = useState(reservation.numeroPersone);
  const [idTurno, setIdTurno] = useState(reservation.idTurno);
  const [dataPrenotazione, setDataPrenotazione] = useState(reservation.dataPrenotazione);
  const [noteCliente, setNoteCliente] = useState(reservation.noteCliente || "");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const router = useRouter();

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const result = await updateReservation(reservation.idPrenotazione, {
      numeroPersone: numPersone,
      noteCliente,
      idTurno,
      dataPrenotazione
    });

    if (result.success) {
      setMessage({ type: 'success', text: 'Modifica salvata!' });
      setTimeout(() => router.push('/mie-prenotazioni'), 1500);
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
          {/* Data */}
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

          {/* Turno */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-xs font-black text-[#781D2D] uppercase tracking-widest ml-1">
              <Clock size={14} /> Orario (Turno)
            </label>
            <select 
              value={idTurno}
              onChange={(e) => setIdTurno(Number(e.target.value))}
              className="w-full bg-[#FDF1E9]/50 border-2 border-transparent focus:border-[#F5CBA7] focus:bg-white rounded-2xl px-5 py-4 font-bold text-[#781D2D] outline-none transition-all appearance-none cursor-pointer"
            >
              {turni.map(t => (
                <option key={t.idTurno} value={t.idTurno}>{t.nomeTurno} ({t.oraInizio})</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Numero Persone */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-xs font-black text-[#781D2D] uppercase tracking-widest ml-1">
              <Users size={14} /> Numero Ospiti
            </label>
            <select 
              value={numPersone}
              onChange={(e) => setNumPersone(Number(e.target.value))}
              className="w-full bg-[#FDF1E9]/50 border-2 border-transparent focus:border-[#F5CBA7] focus:bg-white rounded-2xl px-5 py-4 font-bold text-[#781D2D] outline-none transition-all appearance-none cursor-pointer"
            >
              {[...Array(reservation.postiMassimi)].map((_, i) => (
                <option key={i} value={i + 1}>{i + 1} {i === 0 ? 'Persona' : 'Persone'}</option>
              ))}
            </select>
            <p className="text-[10px] text-gray-400 font-bold ml-1 uppercase">Il tavolo T{reservation.numeroTavolo} può ospitare fino a {reservation.postiMassimi} persone.</p>
          </div>

          {/* Note */}
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
        </div>

        <div className="pt-6 border-t border-gray-100 flex flex-col sm:flex-row gap-4">
           <button 
             type="submit"
             disabled={loading}
             className="flex-1 py-5 bg-gradient-to-r from-[#D35400] to-[#781D2D] text-white font-black text-lg rounded-[2rem] shadow-xl hover:shadow-2xl transition-all transform hover:-translate-y-1 active:scale-95 disabled:opacity-50"
           >
             {loading ? 'Salvataggio...' : 'Salva Modifiche'}
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

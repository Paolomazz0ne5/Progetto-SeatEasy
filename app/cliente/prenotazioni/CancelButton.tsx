'use client';

import React, { useState } from 'react';
import { cancelReservation } from '@/app/actions/cliente';
import { Trash2, AlertTriangle, X } from 'lucide-react';

export default function CancelButton({ 
  idPrenotazione, 
  ristoranteNome,
  politica,
  caparra
}: { 
  idPrenotazione: number, 
  ristoranteNome: string,
  politica?: string,
  caparra?: number
}) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleCancel = async () => {
    setLoading(true);
    const result = await cancelReservation(idPrenotazione);
    if (result.success) {
      setShowConfirm(false);
    } else {
      alert(result.error);
    }
    setLoading(false);
  };

  return (
    <>
      <button 
        onClick={() => setShowConfirm(true)}
        className="flex-1 md:w-32 flex items-center justify-center gap-2 py-3 border border-red-100 text-red-500 font-bold rounded-xl hover:bg-red-50 transition-colors text-sm"
      >
        <Trash2 size={16} /> Annulla
      </button>

      {showConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
           <div className="bg-white rounded-[2.5rem] w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
              <div className="bg-red-50 p-8 flex items-center gap-4 border-b border-red-100">
                 <div className="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center text-red-600 shrink-0">
                    <AlertTriangle size={30} />
                 </div>
                 <div>
                    <h3 className="text-xl font-black text-[#781D2D]">Annulla Prenotazione</h3>
                    <p className="text-red-600/80 font-medium text-sm">{ristoranteNome}</p>
                 </div>
                 <button 
                  onClick={() => setShowConfirm(false)}
                  className="ml-auto p-2 hover:bg-red-100 rounded-full text-red-400 transition-colors"
                 >
                   <X size={24} />
                 </button>
              </div>

              <div className="p-8 space-y-6">
                 <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                    <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Politica del Ristorante</h4>
                    <p className="text-[#781D2D] font-bold leading-relaxed italic">
                       "{politica || "Nessuna politica specifica fornita. Contatta il ristorante per i dettagli."}"
                    </p>
                    {caparra && caparra > 0 && (
                      <div className="mt-4 flex items-center gap-2 text-red-600 font-black text-sm">
                         <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></div>
                         Attenzione: Caparra di €{caparra.toFixed(2)} non rimborsabile.
                      </div>
                    )}
                 </div>

                 <p className="text-gray-500 text-sm font-medium px-2">
                    Sei sicuro di voler procedere? Questa azione non può essere annullata e lo stato della prenotazione diventerà "Annullata".
                 </p>

                 <div className="flex flex-col sm:flex-row gap-4 pt-4">
                    <button 
                      onClick={handleCancel}
                      disabled={loading}
                      className="flex-1 py-4 bg-red-600 hover:bg-red-700 text-white font-black rounded-2xl shadow-lg shadow-red-200 transition-all transform active:scale-95 disabled:opacity-50 flex items-center justify-center min-h-[56px]"
                    >
                      <span className="block">{loading ? 'Annullamento...' : 'Sì, Annulla ora'}</span>
                    </button>
                    <button 
                      onClick={() => setShowConfirm(false)}
                      className="flex-1 py-4 bg-gray-100 text-gray-500 font-bold rounded-2xl hover:bg-gray-200 transition-all"
                    >
                      No, Mantieni
                    </button>
                 </div>
              </div>
           </div>
        </div>
      )}
    </>
  );
}

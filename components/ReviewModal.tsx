"use client";

import React, { useState, useEffect } from 'react';
import { Star, X, Loader2 } from 'lucide-react';
import { addReview, updateReview } from '@/app/actions/cliente';
import { useRouter } from 'next/navigation';

interface ReviewModalProps {
  idRistorante: number;
  ristoranteNome: string;
  onClose: () => void;
  onSuccess: () => void;
  existingReview?: {
    idRecensione: number;
    punteggio: number;
    commento: string;
  } | null;
}

export default function ReviewModal({ idRistorante, ristoranteNome, onClose, onSuccess, existingReview }: ReviewModalProps) {
  const [punteggio, setPunteggio] = useState(existingReview?.punteggio || 5);
  const [commento, setCommento] = useState(existingReview?.commento || "");
  const [hover, setHover] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      let result;
      if (existingReview) {
        result = await updateReview(existingReview.idRecensione, idRistorante, punteggio, commento);
      } else {
        result = await addReview(idRistorante, punteggio, commento);
      }

      if (result.success) {
        router.refresh();
        onSuccess();
        onClose();
      } else {
        setError(result.error || "Si è verificato un errore.");
      }
    } catch (err) {
      setError("Errore di connessione al server.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden border border-[#F5CBA7]/30 flex flex-col animate-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="px-8 py-6 bg-gradient-to-r from-[#FDF1E9] to-white border-b border-[#F5CBA7]/20 flex justify-between items-center">
          <div>
            <h3 className="text-2xl font-black text-[#781D2D]">{existingReview ? 'Modifica Recensione' : 'Lascia una Recensione'}</h3>
            <p className="text-[#D35400] text-sm font-bold opacity-80">{ristoranteNome}</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-[#F5CBA7]/20 rounded-full transition-colors text-[#781D2D]"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-bold flex items-center gap-2 border border-red-100">
              <X size={16} /> {error}
            </div>
          )}

          {/* Rating */}
          <div className="flex flex-col items-center gap-4">
            <label className="text-xs font-black text-[#781D2D] uppercase tracking-widest">Valutazione</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setPunteggio(star)}
                  onMouseEnter={() => setHover(star)}
                  onMouseLeave={() => setHover(0)}
                  className="transition-transform hover:scale-125 focus:outline-none"
                >
                  <Star 
                    size={40} 
                    fill={(hover || punteggio) >= star ? "#D35400" : "none"} 
                    className={(hover || punteggio) >= star ? "text-[#D35400]" : "text-gray-200"}
                  />
                </button>
              ))}
            </div>
            <p className="text-sm font-bold text-[#D35400]">
              {punteggio === 1 && "Pessimo"}
              {punteggio === 2 && "Sufficiente"}
              {punteggio === 3 && "Buono"}
              {punteggio === 4 && "Ottimo"}
              {punteggio === 5 && "Eccellente!"}
            </p>
          </div>

          {/* Comment */}
          <div className="space-y-2">
            <label className="text-xs font-black text-[#781D2D] uppercase tracking-widest ml-1">Il tuo commento</label>
            <textarea
              value={commento}
              onChange={(e) => setCommento(e.target.value)}
              placeholder="Com'è stata la tua esperienza?"
              className="w-full bg-[#FDF1E9]/30 border border-[#F5CBA7]/50 rounded-2xl p-5 text-gray-800 font-medium focus:ring-2 focus:ring-[#D35400] transition-all outline-none resize-none"
              rows={4}
              required
            />
          </div>

          {/* Actions */}
          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 py-4 text-[#781D2D] font-bold hover:bg-gray-50 rounded-2xl transition-colors"
            >
              Annulla
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-[2] py-4 bg-gradient-to-r from-[#D35400] to-[#781D2D] text-white font-black rounded-2xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {loading ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Salvataggio...
                </>
              ) : (
                existingReview ? 'Salva Modifiche' : 'Invia Recensione'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

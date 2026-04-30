"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { Calendar, Clock, MapPin, Users, Edit, Trash2, Star, MessageSquarePlus } from 'lucide-react';
import CancelButton from './CancelButton';
import ReviewModal from '@/components/ReviewModal';
import { deleteReview } from '@/app/actions/cliente';
import { useRouter } from 'next/navigation';

interface Reservation {
  idPrenotazione: number;
  idRistorante: number;
  ristoranteNome: string;
  ristoranteIndirizzo: string;
  dataPrenotazione: string;
  oraInizio: string;
  numeroPersone: number;
  stato: string;
  noteCliente: string | null;
  numeroTavolo: number;
  politicaNoShow: string;
  caparraRichiesta: number;
}

interface Review {
  idRecensione: number;
  idRistorante: number;
  punteggio: number;
  commento: string;
}

export default function PrenotazioniClient({ 
  reservations, 
  userReviews 
}: { 
  reservations: Reservation[], 
  userReviews: Review[] 
}) {
  const [selectedReviewInfo, setSelectedReviewInfo] = useState<{ idRistorante: number, nome: string, existing?: Review } | null>(null);
  const router = useRouter();

  const today = new Date().toISOString().split('T')[0];

  const attive = reservations.filter(p => p.stato !== 'Annullata' && p.dataPrenotazione >= today);
  const passate = reservations.filter(p => p.stato !== 'Annullata' && p.dataPrenotazione < today);
  const annullate = reservations.filter(p => p.stato === 'Annullata');

  const handleDeleteReview = async (idRecensione: number, idRistorante: number) => {
    if (confirm('Sei sicuro di voler eliminare la tua recensione?')) {
      await deleteReview(idRecensione, idRistorante);
      router.refresh();
    }
  };

  const renderPrenotazione = (pre: Reservation, isPast: boolean) => {
    const review = userReviews.find(r => r.idRistorante === pre.idRistorante);

    return (
      <div 
        key={pre.idPrenotazione}
        className={`bg-white border border-[#F5CBA7]/40 rounded-[2rem] p-6 sm:p-8 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row gap-8 items-center ${pre.stato === 'Annullata' ? 'opacity-60 grayscale-[0.5]' : ''}`}
      >
        <div className={`w-full md:w-48 h-32 rounded-2xl flex items-center justify-center overflow-hidden shrink-0 ${pre.stato === 'Annullata' ? 'bg-gray-100' : (isPast ? 'bg-gray-50' : 'bg-[#FDF1E9]')}`}>
           <div className="text-center">
              <p className={`font-black text-2xl ${pre.stato === 'Annullata' ? 'text-gray-400' : (isPast ? 'text-gray-300' : 'text-[#781D2D]')}`}>T{pre.numeroTavolo}</p>
              <p className={`text-[10px] font-bold uppercase tracking-widest ${pre.stato === 'Annullata' ? 'text-gray-400' : (isPast ? 'text-gray-300' : 'text-[#D35400]')}`}>Tavolo</p>
           </div>
        </div>

        <div className="flex-1 space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-tighter ${pre.stato === 'Confermata' ? (isPast ? 'bg-gray-100 text-gray-500' : 'bg-green-100 text-green-700') : 'bg-red-100 text-red-700'}`}>
                {isPast && pre.stato === 'Confermata' ? 'Completata' : pre.stato}
              </span>
              <span className="text-xs text-gray-400 font-medium">#{pre.idPrenotazione}</span>
            </div>
            <h3 className={`text-2xl font-black ${isPast ? 'text-gray-500' : 'text-[#781D2D]'}`}>{pre.ristoranteNome}</h3>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2 text-gray-400 font-medium text-sm">
              <Calendar size={16} />
              {pre.dataPrenotazione}
            </div>
            <div className="flex items-center gap-2 text-gray-400 font-medium text-sm">
              <Clock size={16} />
              {pre.oraInizio}
            </div>
            <div className="flex items-center gap-2 text-gray-400 font-medium text-sm">
              <Users size={16} />
              {pre.numeroPersone} {pre.numeroPersone === 1 ? 'Persona' : 'Persone'}
            </div>
            <div className="flex items-center gap-2 text-gray-400 font-medium text-sm">
              <MapPin size={16} />
              <span className="truncate">{pre.ristoranteIndirizzo}</span>
            </div>
          </div>
        </div>

        <div className="flex md:flex-col gap-2 w-full md:w-auto">
          {pre.stato !== 'Annullata' && !isPast && (
            <>
              <Link 
                href={`/cliente/prenotazioni/modifica/${pre.idPrenotazione}`}
                className="flex-1 md:w-32 flex items-center justify-center gap-2 py-3 bg-[#FDF1E9] text-[#781D2D] font-bold rounded-xl hover:bg-[#F5CBA7]/30 transition-colors text-sm"
              >
                <Edit size={16} /> Modifica
              </Link>
              <CancelButton 
                idPrenotazione={pre.idPrenotazione} 
                ristoranteNome={pre.ristoranteNome}
                politica={pre.politicaNoShow}
                caparra={pre.caparraRichiesta}
              />
            </>
          )}

          {isPast && pre.stato !== 'Annullata' && (
            <div className="flex flex-col gap-2 w-full">
              {!review ? (
                <button
                  onClick={() => setSelectedReviewInfo({ idRistorante: pre.idRistorante, nome: pre.ristoranteNome })}
                  className="flex items-center justify-center gap-2 py-3 bg-[#781D2D] text-white font-bold rounded-xl hover:bg-[#5f1723] transition-all text-sm w-full md:w-40 shadow-lg shadow-[#781D2D]/20"
                >
                  <MessageSquarePlus size={16} /> Scrivi Recensione
                </button>
              ) : (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-center gap-1 py-1 px-3 bg-green-50 text-green-700 rounded-full text-[10px] font-black uppercase tracking-widest border border-green-100 self-center md:self-stretch">
                    <Star size={10} fill="currentColor" /> Recensito ({review.punteggio}/5)
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSelectedReviewInfo({ idRistorante: pre.idRistorante, nome: pre.ristoranteNome, existing: review })}
                      className="flex-1 flex items-center justify-center gap-2 py-2 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200 transition-all text-xs"
                    >
                      <Edit size={14} /> Modifica
                    </button>
                    <button
                      onClick={() => handleDeleteReview(review.idRecensione, pre.idRistorante)}
                      className="p-2 text-red-400 hover:bg-red-50 hover:text-red-600 rounded-xl transition-all"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="space-y-16">
        {attive.length > 0 && (
          <div className="space-y-6">
            <h2 className="text-xl font-black text-[#781D2D] uppercase tracking-widest flex items-center gap-3">
              <span className="w-8 h-1 bg-[#D35400] rounded-full"></span>
              In Corso
            </h2>
            <div className="grid gap-6">
              {attive.map(p => renderPrenotazione(p, false))}
            </div>
          </div>
        )}

        {passate.length > 0 && (
          <div className="space-y-6">
            <h2 className="text-xl font-black text-[#781D2D] opacity-40 uppercase tracking-widest flex items-center gap-3">
              <span className="w-8 h-1 bg-gray-200 rounded-full"></span>
              Storico Visite
            </h2>
            <div className="grid gap-6">
              {passate.map(p => renderPrenotazione(p, true))}
            </div>
          </div>
        )}

        {annullate.length > 0 && (
          <div className="space-y-6">
            <h2 className="text-xl font-black text-gray-300 uppercase tracking-widest flex items-center gap-3">
              <span className="w-8 h-1 bg-gray-100 rounded-full"></span>
              Annullate
            </h2>
            <div className="grid gap-6">
              {annullate.map(p => renderPrenotazione(p, false))}
            </div>
          </div>
        )}
      </div>

      {selectedReviewInfo && (
        <ReviewModal 
          idRistorante={selectedReviewInfo.idRistorante}
          ristoranteNome={selectedReviewInfo.nome}
          existingReview={selectedReviewInfo.existing}
          onClose={() => setSelectedReviewInfo(null)}
          onSuccess={() => {}}
        />
      )}
    </>
  );
}

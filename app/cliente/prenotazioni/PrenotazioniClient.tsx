"use client"; // Indica a Next.js che questo componente deve essere renderizzato e idratato sul browser, abilitando interattività, hook e stati

import React, { useState } from 'react';
import Link from 'next/link';
// Importazione delle icone SVG vettoriali per la rappresentazione grafica dei dettagli della prenotazione
import { Calendar, Clock, MapPin, Users, Edit, Trash2, Star, MessageSquarePlus } from 'lucide-react';
// Importa il componente pulsante personalizzato che gestisce la logica di cancellazione di una prenotazione
import CancelButton from './CancelButton';
// Importa l'utility di Next.js per il caricamento dinamico (Lazy Loading) dei componenti
import dynamic from 'next/dynamic';
// Carica il Modal delle recensioni in modalità Client-Only (ssr: false), escludendolo dal rendering iniziale sul server per alleggerire il primo caricamento
const ReviewModal = dynamic(() => import('@/components/ReviewModal'), { ssr: false });
// Importa la Server Action per l'eliminazione fisica di una recensione dal database
import { deleteReview } from '@/app/actions/cliente';
// Importa lo hook di navigazione lato client di Next.js
import { useRouter } from 'next/navigation';

// Definizione dell'interfaccia TypeScript per tipizzare in modo rigido la struttura di un record Prenotazione
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
  numeroTavolo: string;
  politicaNoShow: string;
  caparraRichiesta: number;
}

// Definizione dell'interfaccia TypeScript per tipizzare la struttura di una Recensione
interface Review {
  idRecensione: number;
  idRistorante: number;
  punteggio: number;
  commento: string;
}

// Componente principale esportato che riceve le proprietà (props) strutturate dal Server Component padre
export default function PrenotazioniClient({
  reservations,
  userReviews
}: {
  reservations: Reservation[],
  userReviews: Review[]
}) {
  // Stato locale che memorizza le info del ristorante selezionato per scrivere/modificare una recensione. Se è null, il modal è chiuso.
  const [selectedReviewInfo, setSelectedReviewInfo] = useState<{ idRistorante: number, nome: string, existing?: Review } | null>(null);
  // Inizializza l'istanza del router per aggiornare i dati della pagina senza ricaricare l'intera scheda
  const router = useRouter();

  // Ottiene la data odierna in formato ISO string (AAAA-MM-GG) eliminando la parte dell'orario
  const today = new Date().toISOString().split('T')[0];

  // LOGICA DI FILTRAGGIO (SMISTAMENTO): Divide l'array unico in 3 sottogruppi logici
  // 1. Attive: Prenotazioni non annullate con data maggiore o uguale a oggi
  const attive = reservations.filter(p => p.stato !== 'Annullata' && p.dataPrenotazione >= today);
  // 2. Passate: Prenotazioni non annullate con data antecedente a oggi (storico visite)
  const passate = reservations.filter(p => p.stato !== 'Annullata' && p.dataPrenotazione < today);
  // 3. Annullate: Tutte le prenotazioni che hanno lo stato impostato esplicitamente su 'Annullata'
  const annullate = reservations.filter(p => p.stato === 'Annullata');

  // Funzione asincrona che gestisce la rimozione di una recensione tramite conferma nativa del browser
  const handleDeleteReview = async (idRecensione: number, idRistorante: number) => {
    if (confirm('Sei sicuro di voler eliminare la tua recensione?')) {
      // Esegue la Server Action per cancellare il record dalla tabella SQL
      await deleteReview(idRecensione, idRistorante);
      // Forza il refresh dei Server Component per aggiornare l'array userReviews e far ricomparire il tasto "Scrivi Recensione"
      router.refresh();
    }
  };

  // Funzione helper interna (Render Pattern) incaricata di generare la singola card grafica della prenotazione
  const renderPrenotazione = (pre: Reservation, isPast: boolean) => {
    // Cerca all'interno dell'array userReviews se l'utente ha già lasciato una recensione per questo specifico ristorante
    const review = userReviews.find(r => r.idRistorante === pre.idRistorante);

    return (
      <div
        className={`bg-white border border-[#F5CBA7]/40 rounded-[2rem] p-6 sm:p-8 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row gap-8 items-center ${pre.stato === 'Annullata' ? 'opacity-60 grayscale-[0.5]' : ''}`}
      >
        {/* Blocco grafico laterale che mostra l'identificativo del tavolo (es. T1, T2) */}
        <div className={`w-full md:w-48 h-32 rounded-2xl flex items-center justify-center overflow-hidden shrink-0 ${pre.stato === 'Annullata' ? 'bg-gray-100' : (isPast ? 'bg-gray-50' : 'bg-[#FDF1E9]')}`}>
          <div className="text-center">
            <p className={`font-black text-2xl ${pre.stato === 'Annullata' ? 'text-gray-400' : (isPast ? 'text-gray-300' : 'text-[#781D2D]')}`}>
              {/* Prende la stringa dei tavoli (es. "1, 2"), la separa e mappa aggiungendo il prefisso 'T' prima di riaggregarla */}
              {String(pre.numeroTavolo).split(',').map(n => `T${n.trim()}`).join(', ')}
            </p>
            <p className={`text-[10px] font-bold uppercase tracking-widest ${pre.stato === 'Annullata' ? 'text-gray-400' : (isPast ? 'text-gray-300' : 'text-[#D35400]')}`}>Tavolo</p>
          </div>
        </div>

        {/* Dettagli informativi della prenotazione (Nome ristorante, data, ora, persone, indirizzo) */}
        <div className="flex-1 space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              {/* Badge di stato colorato dinamicamente in base allo stato temporale o di annullamento */}
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-tighter ${pre.stato === 'Confermata' ? (isPast ? 'bg-gray-100 text-gray-500' : 'bg-green-100 text-green-700') : 'bg-red-100 text-red-700'}`}>
                {isPast && pre.stato === 'Confermata' ? 'Completata' : pre.stato}
              </span>
              <span className="text-xs text-gray-400 font-medium">#{pre.idPrenotazione}</span>
            </div>
            <h3 className={`text-2xl font-black ${isPast ? 'text-gray-500' : 'text-[#781D2D]'}`}>{pre.ristoranteNome}</h3>
          </div>

          {/* Griglia responsive dei dettagli con le rispettive icone */}
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

        {/* COLONNA DELLE AZIONI DISPONIBILI (Varia in base allo stato della prenotazione) */}
        <div className="flex md:flex-col gap-2 w-full md:w-auto">
          {/* CASO A: Prenotazione attiva ed imminente (In Corso). Consente la Modifica e l'Annullamento */}
          {pre.stato !== 'Annullata' && !isPast && (
            <>
              {/* Link di reindirizzamento alla pagina di modifica passando l'ID della prenotazione nell'URL */}
              <Link
                href={`/cliente/prenotazioni/modifica/${pre.idPrenotazione}`}
                className="flex-1 md:w-32 flex items-center justify-center gap-2 py-3 bg-[#FDF1E9] text-[#781D2D] font-bold rounded-xl hover:bg-[#F5CBA7]/30 transition-colors text-sm"
              >
                <Edit size={16} /> Modifica
              </Link>
              {/* Componente pulsante isolato che ingloba la logica e il modal di cancellazione */}
              <CancelButton
                idPrenotazione={pre.idPrenotazione}
                ristoranteNome={pre.ristoranteNome}
                politica={pre.politicaNoShow}
                caparra={pre.caparraRichiesta}
              />
            </>
          )}

          {/* CASO B: Prenotazione passata e conclusa (Storico Visite). Consente la gestione del feedback */}
          {isPast && pre.stato !== 'Annullata' && (
            <div className="flex flex-col gap-2 w-full">
              {/* Sotto-Caso B1: L'utente NON ha ancora recensito questo ristorante. Mostra il pulsante per scriverla */}
              {!review ? (
                <button
                  onClick={() => setSelectedReviewInfo({ idRistorante: pre.idRistorante, nome: pre.ristoranteNome })}
                  className="flex items-center justify-center gap-2 py-3 bg-[#781D2D] text-white font-bold rounded-xl hover:bg-[#5f1723] transition-all text-sm w-full md:w-40 shadow-lg shadow-[#781D2D]/20"
                >
                  <MessageSquarePlus size={16} /> Scrivi Recensione
                </button>
              ) : (
                /* Sotto-Caso B2: Il ristorante è già stato recensito. Mostra il punteggio e i controlli per modificare/eliminare */
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-center gap-1 py-1 px-3 bg-green-50 text-green-700 rounded-full text-[10px] font-black uppercase tracking-widest border border-green-100 self-center md:self-stretch">
                    <Star size={10} fill="currentColor" /> Recensito ({review.punteggio}/5)
                  </div>
                  <div className="flex gap-2">
                    {/* Imposta le info dello stato includendo l'oggetto 'existing' per precompilare il modal di modifica */}
                    <button
                      onClick={() => setSelectedReviewInfo({ idRistorante: pre.idRistorante, nome: pre.ristoranteNome, existing: review })}
                      className="flex-1 flex items-center justify-center gap-2 py-2 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200 transition-all text-xs"
                    >
                      <Edit size={14} /> Modifica
                    </button>
                    {/* Pulsante di eliminazione della recensione */}
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
        {/* SEZIONE 1: Renderizza la lista delle prenotazioni attive se l'elenco filtrato non è vuoto */}
        {attive.length > 0 && (
          <div className="space-y-6">
            <h2 className="text-xl font-black text-[#781D2D] uppercase tracking-widest flex items-center gap-3">
              <span className="w-8 h-1 bg-[#D35400] rounded-full"></span>
              In Corso
            </h2>
            <div className="grid gap-6">
              {attive.map(p => <React.Fragment key={p.idPrenotazione}>{renderPrenotazione(p, false)}</React.Fragment>)}
            </div>
          </div>
        )}

        {/* SEZIONE 2: Renderizza lo storico delle visite passate */}
        {passate.length > 0 && (
          <div className="space-y-6">
            <h2 className="text-xl font-black text-[#781D2D] opacity-40 uppercase tracking-widest flex items-center gap-3">
              <span className="w-8 h-1 bg-gray-200 rounded-full"></span>
              Storico Visite
            </h2>
            <div className="grid gap-6">
              {passate.map(p => <React.Fragment key={p.idPrenotazione}>{renderPrenotazione(p, true)}</React.Fragment>)}
            </div>
          </div>
        )}

        {/* SEZIONE 3: Renderizza l'elenco delle prenotazioni che l'utente ha annullato */}
        {annullate.length > 0 && (
          <div className="space-y-6">
            <h2 className="text-xl font-black text-gray-300 uppercase tracking-widest flex items-center gap-3">
              <span className="w-8 h-1 bg-gray-100 rounded-full"></span>
              Annullate
            </h2>
            <div className="grid gap-6">
              {annullate.map(p => <React.Fragment key={p.idPrenotazione}>{renderPrenotazione(p, false)}</React.Fragment>)}
            </div>
          </div>
        )}
      </div>

      {/* RENDER MODALE CONDIZIONALE: Se lo stato contiene informazioni, monta il modal passandogli i dati e le funzioni di chiusura */}
      {selectedReviewInfo && (
        <ReviewModal
          idRistorante={selectedReviewInfo.idRistorante}
          ristoranteNome={selectedReviewInfo.nome}
          existingReview={selectedReviewInfo.existing} // Se presente permette la modifica, se assente la creazione ex-novo
          onClose={() => setSelectedReviewInfo(null)} // Callback di chiusura: azzera lo stato smontando il modal dal DOM
          onSuccess={() => { }}
        />
      )}
    </>
  );
}
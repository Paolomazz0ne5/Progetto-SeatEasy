'use client';

import React, { useState, useTransition } from 'react';
import { Camera, Plus, Trash2, Loader2, Euro, FileText } from 'lucide-react';
import { addToGallery, removeFromGallery, GalleriaItem } from '@/app/actions/ristoranti';

interface GestoreGalleriaProps {
  idRistorante: number;
  items: GalleriaItem[];
}

export default function GestoreGalleriaClient({ idRistorante, items }: GestoreGalleriaProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  /**
   * Gestisce l'upload di una nuova immagine.
   * Utilizza FormData per catturare i campi nativamente e startTransition 
   * per non bloccare la UI durante la Server Action.
   */
  async function handleUpload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setError(null);

    startTransition(async () => {
      const result = await addToGallery(idRistorante, formData);
      if (!result.success) {
        setError(result.error || 'Errore durante il caricamento.');
      } else {
        (e.target as HTMLFormElement).reset();
      }
    });
  }

  /**
   * Gestisce l'eliminazione di un'immagine esistente.
   */
  async function handleDelete(idImmagine: number) {
    if (!confirm('Sei sicuro di voler eliminare questa immagine?')) return;

    startTransition(async () => {
      const result = await removeFromGallery(idImmagine);
      if (!result.success) {
        alert(result.error || 'Errore durante l\'eliminazione.');
      }
    });
  }

  return (
    <div className="space-y-10">

      {/* =========================================================================
          SEZIONE 1: IL FORM DI UPLOAD
          ========================================================================= */}
      <div className="bg-white rounded-3xl border border-[#F5CBA7]/40 shadow-sm overflow-hidden">

        {/* Intestazione del form: qui usiamo flexbox per allineare l'icona della macchina fotografica e il testo */}
        <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#fdf1e9] flex items-center justify-center text-[#D35400]">
            <Camera size={20} />
          </div>
          <div>
            <h3 className="font-bold text-gray-900">Aggiungi al Menù / Galleria</h3>
            <p className="text-xs text-gray-500">Carica foto dei tuoi piatti migliori.</p>
          </div>
        </div>

        {/* IL FORM VERO E PROPRIO 
          L'evento onSubmit è fondamentale: invece di ricaricare la pagina (comportamento HTML base), 
          intercetta l'invio e chiama la nostra funzione React 'handleUpload'.
        */}
        <form onSubmit={handleUpload} className="p-6">

          {/* RESPONSIVE DESIGN (Tailwind): 
            grid-cols-1: Su cellulare gli input stanno in una singola colonna (uno sotto l'altro).
            md:grid-cols-3: Su schermi medi (tablet/PC) si affiancano su 3 colonne.
          */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            {/* INPUT IMMAGINE */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-700 ml-1">Immagine (PNG, JPG) *</label>
              <input
                name="immagine" // <-- FONDAMENTALE! Senza il 'name', FormData non cattura il file.
                type="file"
                accept=".png,.jpg,.jpeg" // Limita la scelta solo alle immagini
                required // Il browser blocca l'invio se non c'è il file
                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[#fdf1e9] file:text-[#D35400] hover:file:bg-[#fae5d3] transition-all cursor-pointer border border-gray-100 rounded-xl p-1"
              />
            </div>

            {/* INPUT PREZZO */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-700 ml-1">Prezzo (€)</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <Euro size={15} /> {/* Icona dell'Euro inserita dentro l'input */}
                </div>
                <input
                  name="prezzo" // <-- Catturato da FormData
                  type="number"
                  step="0.01"   // Permette di inserire i centesimi (es. 10.50)
                  min="0"       // Evita prezzi negativi
                  placeholder="0.00"
                  className="w-full bg-white border border-gray-200 rounded-xl py-2.5 pl-10 pr-3 focus:outline-none focus:ring-2 focus:ring-[#D35400] transition-shadow text-gray-900 text-sm"
                />
              </div>
            </div>

            {/* INPUT NOTA */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-700 ml-1">Nota (max 100 car.)</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <FileText size={15} />
                </div>
                <input
                  name="nota" // <-- Catturato da FormData
                  type="text"
                  maxLength={100} // Limita il numero di caratteri digitabili
                  placeholder="Es: Ideale per 2 persone"
                  className="w-full bg-white border border-gray-200 rounded-xl py-2.5 pl-10 pr-3 focus:outline-none focus:ring-2 focus:ring-[#D35400] transition-shadow text-gray-900 text-sm"
                />
              </div>
            </div>
          </div>

          {/* RENDERING CONDIZIONALE (Gestione Errori)
            Se la variabile 'error' ha un valore (true), React disegna questo paragrafo rosso.
            Se 'error' è null (false), questa riga viene ignorata.
          */}
          {error && (
            <p className="mt-4 text-xs font-bold text-red-500 bg-red-50 p-3 rounded-xl border border-red-100 flex items-center gap-2">
              <span>⚠️</span> {error}
            </p>
          )}

          {/* BOTTONE DI INVIO */}
          <div className="mt-6 flex justify-end">
            <button
              type="submit"
              disabled={isPending} // Disabilita il click se stiamo già caricando un'immagine
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#D35400] to-[#781D2D] text-white text-sm font-bold rounded-xl shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all disabled:opacity-70 disabled:transform-none"
            >
              {/* Se isPending è vero, mostra l'icona che gira (Loader2), altrimenti mostra l'icona col "+" (Plus) */}
              {isPending ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
              Carica Immagine
            </button>
          </div>
        </form>
      </div>

      {/* =========================================================================
          SEZIONE 2: LA GRIGLIA DELLE IMMAGINI
          ========================================================================= */}
      <div className="space-y-6">

        {/* Intestazione della griglia col conteggio totale delle foto */}
        <div className="flex items-center justify-between border-b border-[#F5CBA7] pb-4">
          <h3 className="text-xl font-extrabold text-[#781D2D]">Immagini Caricate</h3>
          <span className="text-xs font-bold text-[#D35400] bg-[#fdf1e9] px-3 py-1 rounded-full border border-[#fae5d3]">
            {items.length} {items.length === 1 ? 'elemento' : 'elementi'}
          </span>
        </div>

        {/* OPERATORE TERNARIO: condizione ? se_vero : se_falso 
          Controlla se l'array 'items' è vuoto. 
        */}
        {items.length === 0 ? (

          /* CASO 1: L'array è vuoto -> Mostra messaggio di "Galleria vuota" */
          <div className="py-20 text-center bg-gray-50/50 rounded-[2rem] border-2 border-dashed border-gray-200">
            <Camera size={40} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-400 font-medium">Nessuna immagine presente in galleria.</p>
          </div>

        ) : (

          /* CASO 2: L'array ha delle foto -> Disegna la griglia */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">

            {/* IL CICLO MAP: Prende l'array 'items' e per ogni foto genera una 'card' HTML. 
            */}
            {items.map((item) => (
              <div
                key={item.idImmagine} // <-- FONDAMENTALE! React usa la 'key' per identificare in modo univoco l'elemento e aggiornare il DOM senza bug.
                className="group relative bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-xl transition-all duration-300"
              >

                {/* L'immagine fisica */}
                <div className="aspect-square overflow-hidden bg-gray-100">
                  <img
                    src={item.immagineUrl} // L'URL salvato nel database
                    alt={item.nota || 'Immagine piatto'}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" // Effetto zoom al passaggio del mouse (hover:scale-110)
                  />
                </div>

                {/* Didascalia (Prezzo e Nota) */}
                <div className="p-4">
                  {item.prezzo && (
                    <p className="text-[#D35400] font-black text-sm mb-1">€{item.prezzo.toFixed(2)}</p>
                  )}
                  {item.nota ? (
                    <p className="text-gray-600 text-xs font-medium line-clamp-2">{item.nota}</p>
                  ) : (
                    <p className="text-gray-300 text-xs italic">Nessuna nota</p>
                  )}
                </div>

                {/* BOTTONE ELIMINA */}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    // Usiamo un'Arrow Function '() =>' così la funzione non parte da sola all'avvio,
                    // ma viene eseguita SOLO quando l'utente fa materialmente click.
                    onClick={() => handleDelete(item.idImmagine)}
                    className="p-2 bg-red-500 text-white rounded-lg shadow-lg hover:bg-red-600 transition-colors"
                    title="Elimina immagine"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
'use client';

import React, { useState, useTransition } from 'react';
import { Camera, Plus, Trash2, Loader2, Euro, FileText } from 'lucide-react';
import { addToGallery, removeFromGallery, GalleriaItem } from '@/app/actions/ristoranti';

export default function GestoreGalleriaClient({
  idRistorante,
  items
}: {
  idRistorante: number;
  items: GalleriaItem[];
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

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
      {/* Upload Form */}
      <div className="bg-white rounded-3xl border border-[#F5CBA7]/40 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#fdf1e9] flex items-center justify-center text-[#D35400]">
            <Camera size={20} />
          </div>
          <div>
            <h3 className="font-bold text-gray-900">Aggiungi al Menù / Galleria</h3>
            <p className="text-xs text-gray-500">Carica foto dei tuoi piatti migliori.</p>
          </div>
        </div>

        <form onSubmit={handleUpload} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* File Input */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-700 ml-1">Immagine (PNG, JPG) *</label>
              <input
                name="immagine"
                type="file"
                accept=".png,.jpg,.jpeg"
                required
                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[#fdf1e9] file:text-[#D35400] hover:file:bg-[#fae5d3] transition-all cursor-pointer border border-gray-100 rounded-xl p-1"
              />
            </div>

            {/* Prezzo */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-700 ml-1">Prezzo (€)</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <Euro size={15} />
                </div>
                <input
                  name="prezzo"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  className="w-full bg-white border border-gray-200 rounded-xl py-2.5 pl-10 pr-3 focus:outline-none focus:ring-2 focus:ring-[#D35400] transition-shadow text-gray-900 text-sm"
                />
              </div>
            </div>

            {/* Nota */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-700 ml-1">Nota (max 100 car.)</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <FileText size={15} />
                </div>
                <input
                  name="nota"
                  type="text"
                  maxLength={100}
                  placeholder="Es: Ideale per 2 persone"
                  className="w-full bg-white border border-gray-200 rounded-xl py-2.5 pl-10 pr-3 focus:outline-none focus:ring-2 focus:ring-[#D35400] transition-shadow text-gray-900 text-sm"
                />
              </div>
            </div>
          </div>

          {error && (
            <p className="mt-4 text-xs font-bold text-red-500 bg-red-50 p-3 rounded-xl border border-red-100 flex items-center gap-2">
              <span>⚠️</span> {error}
            </p>
          )}

          <div className="mt-6 flex justify-end">
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#D35400] to-[#781D2D] text-white text-sm font-bold rounded-xl shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all disabled:opacity-70 disabled:transform-none"
            >
              {isPending ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
              Carica Immagine
            </button>
          </div>
        </form>
      </div>

      {/* Grid Display */}
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-[#F5CBA7] pb-4">
          <h3 className="text-xl font-extrabold text-[#781D2D]">Immagini Caricate</h3>
          <span className="text-xs font-bold text-[#D35400] bg-[#fdf1e9] px-3 py-1 rounded-full border border-[#fae5d3]">
            {items.length} {items.length === 1 ? 'elemento' : 'elementi'}
          </span>
        </div>

        {items.length === 0 ? (
          <div className="py-20 text-center bg-gray-50/50 rounded-[2rem] border-2 border-dashed border-gray-200">
            <Camera size={40} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-400 font-medium">Nessuna immagine presente in galleria.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {items.map((item) => (
              <div key={item.idImmagine} className="group relative bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-xl transition-all duration-300">
                <div className="aspect-square overflow-hidden bg-gray-100">
                  <img
                    src={item.immagineUrl}
                    alt={item.nota || 'Immagine piatto'}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                </div>
                
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

                {/* Delete button (overlay on hover) */}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
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

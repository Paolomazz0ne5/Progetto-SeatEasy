
'use client';

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Euro, FileText } from 'lucide-react';

type GalleriaItem = {
  idImmagine: number;
  idRistorante: number;
  immagineUrl: string;
  prezzo: number | null;
  nota: string | null;
};

export default function RestaurantGallery({ items }: { items: GalleriaItem[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!items || items.length === 0) return null;

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev === 0 ? items.length - 1 : prev - 1));
  };

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev === items.length - 1 ? 0 : prev + 1));
  };

  const currentItem = items[currentIndex];

  return (
    <section className="w-full py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h2 className="text-2xl font-bold text-[#781D2D] mb-6 flex items-center border-b-2 border-[#F5CBA7] pb-2 inline-block">
          I Nostri Piatti
        </h2>
        
        <div className="relative group overflow-hidden rounded-[2.5rem] bg-gray-100 shadow-xl border border-[#F5CBA7]/30">
          {/* Main Image */}
          <div className="aspect-[16/9] md:aspect-[21/9] w-full overflow-hidden">
            <img
              src={currentItem.immagineUrl}
              alt={currentItem.nota || 'Piatto del ristorante'}
              className="w-full h-full object-cover transition-all duration-700 ease-in-out"
            />
          </div>

          {/* Navigation Buttons */}
          {items.length > 1 && (
            <>
              <button
                onClick={prevSlide}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/80 text-[#781D2D] hover:bg-white shadow-lg transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
              >
                <ChevronLeft size={24} />
              </button>
              <button
                onClick={nextSlide}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/80 text-[#781D2D] hover:bg-white shadow-lg transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
              >
                <ChevronRight size={24} />
              </button>
            </>
          )}

          {/* Overlay Info Box */}
          {(currentItem.prezzo || currentItem.nota) && (
            <div className="absolute bottom-6 left-6 right-6">
              <div className="bg-white/90 backdrop-blur-md p-5 rounded-3xl border border-[#F5CBA7]/30 shadow-2xl inline-block max-w-[80%]">
                <div className="flex flex-col gap-1">
                  {currentItem.prezzo && (
                    <div className="flex items-center gap-2 text-[#D35400] font-black text-xl">
                      <Euro size={20} />
                      <span>€ {currentItem.prezzo.toFixed(2)}</span>
                    </div>
                  )}
                  {currentItem.nota && (
                    <div className="flex items-start gap-2 text-[#781D2D] font-medium text-sm">
                      <FileText size={16} className="mt-0.5 flex-shrink-0 opacity-70" />
                      <p>{currentItem.nota}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Indicators */}
          {items.length > 1 && (
            <div className="absolute bottom-6 right-8 flex gap-2">
              {items.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentIndex(i)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    currentIndex === i ? 'bg-[#781D2D] w-6' : 'bg-[#781D2D]/30'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

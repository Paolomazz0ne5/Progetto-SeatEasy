import React from 'react';

/**
 * Accetta come proprietà opzionale 'className' per permettere al componente padre
 * di posizionarlo o ridimensionarlo dall'esterno (es. aggiungere margini o padding).
 */
export default function Logo({ className = '' }: { className?: string }) {
  return (

    <div className={`flex flex-col items-center justify-center ${className}`}>

      {/* Riproduce visivamente la forma stilizzata di una cupola o di una disposizione di mattoncini/tavoli */}
      <div className="flex items-end justify-center mb-1 gap-1 h-4 relative">
        {/* Mattoncino Sinistro Esterno: Piccolo, ruotato di -45 gradi, colore bordeaux opaco */}
        <div className="w-1.5 h-1.5 bg-[#781D2D] transform -rotate-45 mb-1 opacity-80"></div>

        {/* Mattoncino Sinistro Interno: Medio, inclinato di -25 gradi, colore arancione scuro */}
        <div className="w-2.5 h-2.5 bg-[#D35400] transform -rotate-[25deg] mb-2 rounded-sm"></div>

        {/* Mattoncino Centrale: Il più grande, dritto, colore rosso acceso. */}
        <div className="w-3 h-3 bg-[#E74C3C] rounded-sm mb-2.5"></div>

        {/* Mattoncino Destro Interno: Speculare a quello sinistro, inclinato di +25 gradi, arancione scuro */}
        <div className="w-2.5 h-2.5 bg-[#D35400] transform rotate-[25deg] mb-2 rounded-sm"></div>

        {/* Mattoncino Destro Esterno: Speculare a quello sinistro, ruotato di +45 gradi, bordeaux opaco */}
        <div className="w-1.5 h-1.5 bg-[#781D2D] transform rotate-45 mb-1 opacity-80"></div>
      </div>

      {/* 2. NOME DEL BRAND (TESTO PRINCIPALE) */}
      <div
        className="text-[#781D2D] font-extrabold tracking-tight leading-none"
        // Tecnica CSS Fluida: la funzione 'clamp' imposta una dimensione del font dinamica.
        // Avrà una dimensione minima di 1.5rem sui telefoni, crescerà in base alla larghezza dello schermo (5vw),
        // ma non supererà mai i 2.5rem sui monitor grandi. 
        style={{ fontSize: 'clamp(1.5rem, 5vw, 2.5rem)' }}
      >
        SeatEasy
      </div>

      {/* 3. SOTTOTITOLO*/}
      {/* Scritto in maiuscolo (uppercase), molto spaziato (tracking-widest) e leggermente rimpicciolito (0.45rem) 
          per estendersi esattamente lungo la stessa larghezza della parola "SeatEasy" soprastante, creando un blocco visivo compatto */}
      <div
        className="text-[#781D2D] font-semibold tracking-widest uppercase mt-1 opacity-90"
        style={{ fontSize: '0.45rem', letterSpacing: '0.15em' }}
      >
        Restaurant Management System
      </div>
    </div>
  );
}
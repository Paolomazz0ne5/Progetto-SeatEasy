'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

/**
  Componente Hero, Riceve dal Server Component genitore i parametri iniziali 'initialPax' e 'initialDate' estratti dall'URL. */
export default function Hero({ initialPax = 1, initialDate }: { initialPax?: number, initialDate?: string }) {


  const [pax, setPax] = useState(initialPax);
  const [date, setDate] = useState(initialDate || new Date().toISOString().split('T')[0]);
  const router = useRouter();

  /* Modifica l'URL del browser aggiungendo o aggiornando i parametri della query string (?pax=...&data=...)
    e successivamente effettua uno scroll fluido verso la lista dei ristoranti. */
  const handleSearch = () => {
    // router.push aggiorna i parametri nell'URL. Next.js intercetta questa modifica e, 
    // nel Server Component padre, riesegue automaticamente la Server Action 'getRestaurants(pax)' con i nuovi valori.
    router.push(`?pax=${pax}&data=${date}`);

    // Attende 100 millisecondi (il tempo minimo per permettere al server di elaborare e al DOM di aggiornarsi)
    // e poi esegue uno scorrimento (scroll) fluido e automatico della pagina fino all'elemento con ID 'ristoranti-list'
    setTimeout(() => {
      document.getElementById('ristoranti-list')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  return (
    // Contenitore principale della sezione Hero con padding (pt-32 pb-20) e sfondo pastello coordinato (#FDF1E9)
    <div className="relative pt-32 pb-20 lg:pt-40 lg:pb-28 overflow-hidden bg-[#FDF1E9]">

      {/* Contenitore interno centrato e limitato nella larghezza massima (max-w-7xl) */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-10">

        {/* Intestazione testuale della Hero (Titolo e Sottotitolo) */}
        <div className="text-center">
          <h1 className="text-4xl tracking-tight font-extrabold sm:text-5xl md:text-6xl text-[#781D2D]">
            Scegli il tavolo perfetto, <br className="hidden md:block" /> con semplicità.
          </h1>
          <p className="mt-4 max-w-md mx-auto text-base text-[#781D2D]/80 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
            Prenota il tuo tavolo in pochi istanti. Scopri i migliori ristoranti e assicurati un'esperienza culinaria indimenticabile su SeatEasy.
          </p>
        </div>

        {/*  MODULO DI RICERCA (IL FORM CONTROLLATO)*/}
        <div className="mt-10 max-w-4xl mx-auto">
          {/* Box contenitore del form: sfondo bianco semi-trasparente, effetto vetro sfocato (backdrop-blur-md) e ombreggiatura profonda (shadow-xl) */}
          <div className="bg-white/80 backdrop-blur-md rounded-2xl p-4 shadow-xl border border-white/50 md:p-6 transition-all hover:bg-white/95">

            {/* Tag form: e.preventDefault() è obbligatorio per evitare che il browser ricarichi la pagina intera (comportamento nativo dei form HTML) */}
            <form className="flex flex-col md:flex-row gap-4 items-end" onSubmit={(e) => { e.preventDefault(); handleSearch(); }}>

              {/* CAMPO 1: SELEZIONE DELLA DATA */}
              <div className="w-full md:w-1/3">
                <label htmlFor="date" className="block text-sm font-semibold text-[#781D2D] mb-1.5 ml-1">
                  Data
                </label>
                <div className="relative">
                  {/* Icona SVG del calendario posizionata assolutamente a sinistra dentro l'input */}
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-[#D35400]/70" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                    </svg>
                  </div>
                  {/* Input di tipo date */}
                  <input
                    type="date"
                    id="date"
                    value={date}
                    // Impedisce la selezione di date passate impostando il valore minimo ("min") alla data odierna
                    min={new Date().toISOString().split('T')[0]}
                    // Al cambio del valore, aggiorna lo stato locale
                    onChange={(e) => setDate(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 border-2 border-transparent bg-[#FDF1E9]/50 rounded-xl leading-5 text-[#781D2D] focus:outline-none focus:bg-white focus:border-[#E74C3C]/50 focus:ring-4 focus:ring-[#E74C3C]/10 transition-all sm:text-sm font-medium"
                  />
                </div>
              </div>

              {/* CAMPO 2: SELEZIONE DEL NUMERO DI OSPITI */}
              <div className="w-full md:w-1/3">
                <label htmlFor="people" className="block text-sm font-semibold text-[#781D2D] mb-1.5 ml-1">
                  Ospiti
                </label>
                <div className="relative">
                  {/* Icona SVG degli omini posizionata a sinistra */}
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-[#D35400]/70" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                    </svg>
                  </div>
                  {/* Input di tipo number */}
                  <input
                    type="number"
                    id="people"
                    min="1"
                    value={pax || ''} // Evita di mostrare lo '0' se l'input viene cancellato dall'utente
                    // converte la stringa digitata in numero intero. Se fallisce (input vuoto), imposta il fallback a 0
                    onChange={(e) => setPax(parseInt(e.target.value) || 0)}
                    placeholder="Numero persone"
                    className="block w-full pl-10 pr-3 py-3 border-2 border-transparent bg-[#FDF1E9]/50 rounded-xl leading-5 text-[#781D2D] focus:outline-none focus:bg-white focus:border-[#E74C3C]/50 focus:ring-4 focus:ring-[#E74C3C]/10 transition-all sm:text-sm font-medium"
                  />
                </div>
              </div>

              {/* PULSANTE DI SUBMIT */}
              <div className="w-full md:w-1/3">
                <button
                  type="submit"
                  // Sfondo con gradiente lineare sfumato (from-[#D35400] to-[#E74C3C]) ed effetto sollevamento al passaggio del mouse (hover:-translate-y-0.5)
                  className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-bold rounded-xl text-white bg-gradient-to-r from-[#D35400] to-[#E74C3C] hover:from-[#c0392b] hover:to-[#c0392b] md:py-[14px] md:text-lg md:px-10 transition-all shadow-lg hover:shadow-[#E74C3C]/40 transform hover:-translate-y-0.5"
                >
                  Vedi Disponibilità
                </button>
              </div>

            </form>
          </div>
        </div>
      </div>

      {/* ELEMENTI DECORATIVI DI SFONDO (CERCHI SFOCATI)
          Sfruttano la classe 'blur-3xl' per creare delle macchie di colore soffici, statiche e non cliccabili (pointer-events-none) */}
      {/* Cerchio sfocato sinistro */}
      <div className="absolute top-1/2 left-0 transform -translate-y-1/2 -ml-24 opacity-40 pointer-events-none">
        <div className="w-96 h-96 rounded-full bg-[#f6dfcc] blur-3xl"></div>
      </div>
      {/* Cerchio sfocato destro */}
      <div className="absolute top-0 right-0 transform translate-x-1/4 -mt-20 opacity-30 pointer-events-none">
        <div className="w-[30rem] h-[30rem] rounded-full bg-[#fca28c] blur-3xl"></div>
      </div>
    </div>
  );
}
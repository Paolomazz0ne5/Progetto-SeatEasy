/**
 * DESCRIZIONE PRELIMINARE:
 * Il componente `Hero` rappresenta la sezione visiva iniziale della piattaforma.
 * La sua funzione chiave è raccogliere i criteri di ricerca del cliente 
 * (numero di persone e data) tramite un form interattivo. Invece di usare 
 * complessi gestori di stato globali, all'invio del form il componente aggiorna 
 * direttamente i parametri nell'URL della pagina (es. ?pax=2&data=2026-05-29) 
 * e fa scorrere la visuale verso il basso. Questo approccio architetturale 
 * permette alla lista dei ristoranti sottostante di aggiornarsi da sola 
 * semplicemente leggendo il nuovo indirizzo web.
 */

'use client'; // Diciamo a Next.js che questo componente deve poter gestire click e stati nel browser dell'utente 

import React, { useState } from 'react';
// Importo il router di Next.js che mi permette di far viaggiare l'utente o modificare l'URL della pagina 
import { useRouter } from 'next/navigation';

// Il componente Hero (il grande blocco iniziale con la barra di ricerca).
// Riceve dei parametri "iniziali" (initialPax e initialDate). Questo serve nel caso in cui 
// l'utente ricarichi la pagina: vogliamo che i dati che aveva cercato restino scritti! [cite: 147]
export default function Hero({ initialPax = 1, initialDate }: { initialPax?: number, initialDate?: string }) {

  // --- LA MEMORIA DELLA BARRA DI RICERCA (Stati React) ---

  // Salvo il numero di persone (di default parto da 1 o dal numero passato) [cite: 147]
  const [pax, setPax] = useState(initialPax);

  // Salvo la data. Se non me ne passano una, prendo in automatico la data di OGGI.
  // Il pezzo ".toISOString().split('T')[0]" è un trucco veloce di Javascript per tagliare via l'ora 
  // e tenere solo la data nel formato "AAAA-MM-GG", che è l'unico formato che gli input HTML capiscono[cite: 148].
  const [date, setDate] = useState(initialDate || new Date().toISOString().split('T')[0]);

  // Inizializzo il router per poterlo usare dopo [cite: 148]
  const router = useRouter();

  // Questa è la funzione che scatta quando clicco il bottone "Vedi Disponibilità"
  const handleSearch = () => {

    // IL TRUCCO DELL'URL: invece di passare i dati con sistemi complessi, aggiorno l'URL della pagina!
    // Aggiungo i parametri di ricerca (es: miosito.it/?pax=2&data=2026-05-29)[cite: 149].
    // I componenti che stanno sotto a questo (come la lista dei ristoranti) leggeranno l'URL e si aggiorneranno da soli.
    router.push(`?pax=${pax}&data=${date}`);

    // Dopo aver aggiornato l'URL, aspetto 100 millisecondi e poi faccio scorrere la pagina 
    // in giù dolcemente ('smooth') dritto verso la lista dei ristoranti[cite: 150].
    setTimeout(() => {
      document.getElementById('ristoranti-list')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  // ==========================================
  // INIZIO DELLA PARTE GRAFICA (JSX e Tailwind)
  // ==========================================
  return (
    // Il contenitore principale. L'overflow-hidden serve per non far sbordare le decorazioni di sfondo[cite: 151].
    <div className="relative pt-32 pb-20 lg:pt-40 lg:pb-28 overflow-hidden bg-[#FDF1E9]">
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-10">

        {/* TITOLO E SOTTOTITOLO */}
        <div className="text-center">
          <h1 className="text-4xl tracking-tight font-extrabold sm:text-5xl md:text-6xl text-[#781D2D]">
            Scegli il tavolo perfetto, <br className="hidden md:block" /> con semplicità.
          </h1>
          <p className="mt-4 max-w-md mx-auto text-base text-[#781D2D]/80 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
            Prenota il tuo tavolo in pochi istanti. Scopri i migliori ristoranti e assicurati un'esperienza culinaria indimenticabile su SeatEasy.
          </p>
        </div>

        {/* IL MODULO DI RICERCA BIANCO (Il form) */}
        <div className="mt-10 max-w-4xl mx-auto">
          {/* Effetto vetro smerigliato (backdrop-blur-md) per far intravedere i colori dietro [cite: 152] */}
          <div className="bg-white/80 backdrop-blur-md rounded-2xl p-4 shadow-xl border border-white/50 md:p-6 transition-all hover:bg-white/95">

            {/* onSubmit: Blocco il comportamento base del form (ricaricare la pagina) con e.preventDefault() 
                e poi chiamo la mia funzione handleSearch[cite: 153]. */}
            <form className="flex flex-col md:flex-row gap-4 items-end" onSubmit={(e) => { e.preventDefault(); handleSearch(); }}>

              {/* CAMPO 1: LA DATA */}
              <div className="w-full md:w-1/3">
                <label htmlFor="date" className="block text-sm font-semibold text-[#781D2D] mb-1.5 ml-1">
                  Data
                </label>
                <div className="relative">
                  {/* L'iconcina del calendario (SVG) messa in posizione assoluta sopra l'input [cite: 155] */}
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-[#D35400]/70" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                    </svg>
                  </div>

                  {/* L'input vero e proprio controllato dallo stato 'date' */}
                  <input
                    type="date"
                    id="date"
                    value={date} // Legato alla memoria di React [cite: 156, 157]
                    // Uso min per impedire che la gente prenoti in date nel passato (da oggi in poi) [cite: 157]
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setDate(e.target.value)} // Aggiorno la memoria quando l'utente sceglie una data [cite: 157]
                    className="block w-full pl-10 pr-3 py-3 border-2 border-transparent bg-[#FDF1E9]/50 rounded-xl leading-5 text-[#781D2D] focus:outline-none focus:bg-white focus:border-[#E74C3C]/50 focus:ring-4 focus:ring-[#E74C3C]/10 transition-all sm:text-sm font-medium"
                  />
                </div>
              </div>

              {/* CAMPO 2: IL NUMERO DI OSPITI (PAX) */}
              <div className="w-full md:w-1/3">
                <label htmlFor="people" className="block text-sm font-semibold text-[#781D2D] mb-1.5 ml-1">
                  Ospiti
                </label>
                <div className="relative">
                  {/* Iconcina degli omini (SVG) [cite: 159, 160] */}
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-[#D35400]/70" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                    </svg>
                  </div>

                  {/* L'input controllato dallo stato 'pax' */}
                  <input
                    type="number"
                    id="people"
                    min="1" // Non puoi prenotare per 0 persone! [cite: 161]
                    value={pax || ''}
                    // parseInt converte il testo in numero. Se è vuoto, metto 0 per non far arrabbiare Javascript [cite: 162]
                    onChange={(e) => setPax(parseInt(e.target.value) || 0)}
                    placeholder="Numero persone"
                    className="block w-full pl-10 pr-3 py-3 border-2 border-transparent bg-[#FDF1E9]/50 rounded-xl leading-5 text-[#781D2D] focus:outline-none focus:bg-white focus:border-[#E74C3C]/50 focus:ring-4 focus:ring-[#E74C3C]/10 transition-all sm:text-sm font-medium"
                  />
                </div>
              </div>

              {/* PULSANTE SUBMIT */}
              <div className="w-full md:w-1/3">
                <button
                  type="submit"
                  className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-bold rounded-xl text-white bg-gradient-to-r from-[#D35400] to-[#E74C3C] hover:from-[#c0392b] hover:to-[#c0392b] md:py-[14px] md:text-lg md:px-10 transition-all shadow-lg hover:shadow-[#E74C3C]/40 transform hover:-translate-y-0.5"
                >
                  Vedi Disponibilità
                </button>
              </div>

            </form>
          </div>
        </div>
      </div>

      {/* ELEMENTI DECORATIVI DI SFONDO */}
      {/* Questi due div servono solo ad abbellire la pagina. Sono dei cerchi colorati ('rounded-full bg-[#f6dfcc]') 
          a cui applichiamo un filtro di sfocatura fortissimo ('blur-3xl') per creare quell'effetto "macchia di colore" 
          dietro al form di ricerca e dietro ai testi[cite: 165, 166]. */}
      <div className="absolute top-1/2 left-0 transform -translate-y-1/2 -ml-24 opacity-40 pointer-events-none">
        <div className="w-96 h-96 rounded-full bg-[#f6dfcc] blur-3xl"></div>
      </div>
      <div className="absolute top-0 right-0 transform translate-x-1/4 -mt-20 opacity-30 pointer-events-none">
        <div className="w-[30rem] h-[30rem] rounded-full bg-[#fca28c] blur-3xl"></div>
      </div>
    </div>
  );
}
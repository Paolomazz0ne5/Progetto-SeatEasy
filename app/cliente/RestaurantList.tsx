// Specifica che questo è un Client Component. È obbligatorio in Next.js (App Router) se usiamo hook come useState o eventi del browser come onClick.
'use client';

// Importa la libreria React e l'hook useState per gestire lo stato locale del filtro delle categorie
import React, { useState } from 'react';

// Importa il componente di navigazione nativo di Next.js che permette transizioni veloci tra le pagine senza ricaricare il browser (SPA behavior)
import Link from 'next/link';

// Esporta la funzione del componente RestaurantList, accettando le props: un array di ristoranti (initialRestaurants), il numero di persone (pax) e la data.
export default function RestaurantList({ initialRestaurants, pax = 1, date }: { initialRestaurants: any[], pax?: number, date?: string }) {

  // Definisce una variabile di stato 'filter' inizializzata a 'Tutti'. 'setFilter' è la funzione che useremo per aggiornarla.
  const [filter, setFilter] = useState('Tutti');

  // Operatore ternario: se il filtro è impostato su 'Tutti', usa l'array originale. 
  // Altrimenti, filtra l'array mantenendo solo i ristoranti la cui tipologia corrisponde esattamente alla stringa memorizzata nello stato 'filter'.
  const filteredRestaurants = filter === 'Tutti'
    ? initialRestaurants
    : initialRestaurants.filter(r => r.tipologia === filter);

  // Array statico contenente le categorie di ristoranti disponibili nella nostra interfaccia per generare i pulsanti
  const categories = ['Tutti', 'Italiano', 'Giapponese', 'Francese'];

  // Ritorna il layout del componente espresso in JSX
  return (
    // Tag semantico per una sezione, definisce la larghezza massima e la spaziatura interna responsive (Tailwind CSS)
    <section id="ristoranti-list" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">

      {/* Contenitore flessibile che organizza l'intestazione e i pulsanti dei filtri in colonna su mobile e in riga su schermi grandi */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
        <div>
          {/* Titolo principale della sezione in bordeaux con stile in grassetto extra */}
          <h2 className="text-3xl font-extrabold text-[#781D2D] tracking-tight">
            Ristoranti in Primo Piano
          </h2>
          {/* Sottotitolo descrittivo di colore arancione */}
          <p className="text-[#D35400] font-medium mt-2">
            Scopri le migliori eccellenze culinarie selezionate per te.
          </p>
        </div>

        {/* Contenitore per i bottoni dei filtri con allineamento flessibile e spazio tra loro (gap-2) */}
        <div className="flex flex-wrap gap-2">
          {/* Cicla l'array delle categorie usando il metodo .map() per generare un pulsante HTML per ogni stringa */}
          {categories.map(cat => (
            <button
              // Assegna la prop obbligatoria 'key' usando il nome della categoria (univoco in questo array) per l'algoritmo di riconciliazione di React
              key={cat}
              // Al click del mouse sul pulsante, esegue la funzione setFilter aggiornando lo stato globale del componente con la categoria cliccata
              onClick={() => setFilter(cat)}
              // Applica classi Tailwind dinamiche. Se il filtro corrente è uguale alla categoria di questo bottone, usa lo sfondo bordeaux. Altrimenti usa uno sfondo chiaro.
              className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all border ${filter === cat
                  ? 'bg-[#781D2D] text-white border-[#781D2D] shadow-md'
                  : 'bg-[#FDF1E9] text-[#781D2D] border-[#F5CBA7]/50 hover:bg-[#F5CBA7]/20'
                }`}
            >
              {/* Testo del pulsante (es. Tutti, Italiano...) */}
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Griglia responsive che mostra i ristoranti. 1 colonna su mobile, 2 su tablet, 3 su desktop */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {/* Cicla l'array dei ristoranti (precedentemente filtrato) per generare la card visiva di ciascuno */}
        {filteredRestaurants.map((risto) => {

          {/* Variabile locale che contiene la struttura JSX condivisa sia per i ristoranti disponibili che per quelli non disponibili */ }
          const cardContent = (
            <>
              {/* Contenitore dell'immagine del ristorante con effetto overflow nascosto per gestire gli zoom */}
              <div className="relative h-64 overflow-hidden shrink-0">
                <img
                  // Visualizza la foto del ristorante salvata sul database, oppure un'immagine di fallback di Unsplash se il campo è vuoto
                  src={risto.foto_url || `https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80`}
                  alt={risto.nome}
                  // Se il ristorante è disponibile applica lo zoom al passaggio del mouse, altrimenti applica l'effetto in bianco e nero (grayscale)
                  className={`w-full h-full object-cover transition-transform duration-700 ${risto.isDisponibile ? 'group-hover:scale-110' : 'grayscale opacity-70'}`}
                />
                {/* Sfumatura scura dal basso verso l'alto sopra l'immagine per far leggere meglio il testo bianco sovrastante */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity"></div>
                {/* Etichetta fluttuante in basso a sinistra che mostra la tipologia/categoria del ristorante */}
                <div className="absolute bottom-4 left-6">
                  <span className="bg-white/90 backdrop-blur-md text-[#781D2D] text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                    {risto.tipologia || 'Popolare'}
                  </span>
                </div>
              </div>

              {/* Corpo informativo della card sotto l'immagine */}
              <div className="p-8 flex-1 flex flex-col">
                <div className="flex items-start justify-between gap-2 mb-2">
                  {/* Nome del ristorante. Cambia colore in base alla disponibilità o se ci passi sopra con il mouse */}
                  <h3 className={`text-xl font-bold ${risto.isDisponibile ? 'text-[#781D2D] group-hover:text-[#D35400]' : 'text-gray-500'} transition-colors leading-tight`}>
                    {risto.nome}
                  </h3>
                  {/* Badge dinamico: mostra "Disponibile" in verde o "Non Disponibile" in rosso controllando il booleano risto.isDisponibile */}
                  {risto.isDisponibile ? (
                    <span className="bg-green-100 text-green-700 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider whitespace-nowrap">
                      Disponibile
                    </span>
                  ) : (
                    <span className="bg-red-100 text-red-600 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider whitespace-nowrap">
                      Non Disponibile
                    </span>
                  )}
                </div>

                {/* Indirizzo stradale del ristorante accompagnato da un'icona SVG segnaposto */}
                <div className="flex items-center text-gray-500 text-sm mb-4">
                  <svg className="w-4 h-4 mr-1 text-[#D35400]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  </svg>
                  {risto.indirizzo}
                </div>

                {/* Barra inferiore della card separata da una linea grigia sottile */}
                <div className="flex flex-col xl:flex-row xl:items-center justify-between pt-4 border-t border-gray-100 gap-4 mt-auto">
                  {/* Valutazione fissa del ristorante impostata a 4.8 con icona a forma di stella arancione */}
                  <div className="flex items-center gap-1 text-[#D35400] shrink-0">
                    <span className="font-bold">4.8</span>
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  </div>
                  {/* Sezione d'azione condizionale. Se è disponibile mostra l'invito a prenotare, altrimenti un messaggio di errore esplicativo */}
                  {risto.isDisponibile ? (
                    <span className="text-[#781D2D] font-bold group-hover:translate-x-1 transition-transform whitespace-nowrap text-right">
                      Prenota ora &rarr;
                    </span>
                  ) : (
                    <span className="text-red-500 font-bold text-xs text-right leading-tight">
                      Tavolo non disponibile, prova a diminuire il numero degli ospiti
                    </span>
                  )}
                </div>
              </div>
            </>
          );

          {/* Ritorno condizionale principale per ogni singola iterazione di ristorante */ }
          return risto.isDisponibile ? (
            // Se il ristorante è disponibile, l'intera card viene avvolta dal tag <Link> per renderla cliccabile.
            // L'URL di destinazione passa in query string anche i valori correnti di 'pax' e 'data' in modo da propagarli alla pagina dei dettagli.
            <Link
              key={risto.idRistorante}
              href={`/cliente/ristorante/${risto.idRistorante}?pax=${pax}&data=${date}`}
              className="group bg-white rounded-[2rem] overflow-hidden border border-[#F5CBA7]/40 shadow-sm hover:shadow-xl transition-all duration-500 hover:-translate-y-2 flex flex-col"
            >
              {cardContent}
            </Link>
          ) : (
            // Se il ristorante NON è disponibile, viene renderizzato come un normale tag <div> non cliccabile, con uno sfondo grigio spento
            <div
              key={risto.idRistorante}
              className="bg-gray-50 rounded-[2rem] overflow-hidden border border-gray-200 shadow-sm flex flex-col"
            >
              {cardContent}
            </div>
          );
        })}

        {/* Controlla se la lunghezza dell'array filtrato è zero. In tal caso, mostra un messaggio a schermo intero di nessun risultato trovato */}
        {filteredRestaurants.length === 0 && (
          <div className="col-span-full py-20 text-center">
            <p className="text-gray-400 font-medium text-lg italic">Nessun ristorante trovato per questa categoria.</p>
          </div>
        )}
      </div>
    </section>
  );
}
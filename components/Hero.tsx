import React from 'react';

export default function Hero() {
  return (
    <div className="relative pt-32 pb-20 lg:pt-40 lg:pb-28 overflow-hidden bg-[#FDF1E9]">
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-10">
        <div className="text-center">
          <h1 className="text-4xl tracking-tight font-extrabold sm:text-5xl md:text-6xl text-[#781D2D]">
             Scegli il tavolo perfetto, <br className="hidden md:block"/> con semplicità.
          </h1>
          <p className="mt-4 max-w-md mx-auto text-base text-[#781D2D]/80 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
            Prenota il tuo tavolo in pochi istanti. Scopri i migliori ristoranti e assicurati un'esperienza culinaria indimenticabile su SeatEasy.
          </p>
        </div>

        {/* Search Module */}
        <div className="mt-10 max-w-4xl mx-auto">
          <div className="bg-white/80 backdrop-blur-md rounded-2xl p-4 shadow-xl border border-white/50 md:p-6 transition-all hover:bg-white/95">
            <form className="flex flex-col md:flex-row gap-4 items-end">
              
              <div className="w-full md:w-1/3">
                <label htmlFor="date" className="block text-sm font-semibold text-[#781D2D] mb-1.5 ml-1">
                  Data
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-[#D35400]/70" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <input
                    type="date"
                    id="date"
                    className="block w-full pl-10 pr-3 py-3 border-2 border-transparent bg-[#FDF1E9]/50 rounded-xl leading-5 text-[#781D2D] focus:outline-none focus:bg-white focus:border-[#E74C3C]/50 focus:ring-4 focus:ring-[#E74C3C]/10 transition-all sm:text-sm font-medium"
                  />
                </div>
              </div>

              <div className="w-full md:w-1/3">
                <label htmlFor="people" className="block text-sm font-semibold text-[#781D2D] mb-1.5 ml-1">
                  Ospiti
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-[#D35400]/70" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                    </svg>
                  </div>
                  <select
                    id="people"
                    className="block w-full pl-10 pr-3 py-3 border-2 border-transparent bg-[#FDF1E9]/50 rounded-xl leading-5 text-[#781D2D] focus:outline-none focus:bg-white focus:border-[#E74C3C]/50 focus:ring-4 focus:ring-[#E74C3C]/10 transition-all sm:text-sm font-medium appearance-none cursor-pointer"
                  >
                    {[...Array(10)].map((_, i) => (
                      <option key={i} value={i + 1}>{i + 1} {i === 0 ? 'Persona' : 'Persone'}</option>
                    ))}
                    <option value="11+">11+ Persone</option>
                  </select>
                  {/* Custom arrow */}
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-[#781D2D]/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="w-full md:w-1/3">
                 <button
                   type="button"
                   className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-bold rounded-xl text-white bg-gradient-to-r from-[#D35400] to-[#E74C3C] hover:from-[#c0392b] hover:to-[#c0392b] md:py-[14px] md:text-lg md:px-10 transition-all shadow-lg hover:shadow-[#E74C3C]/40 transform hover:-translate-y-0.5"
                 >
                   Vedi Disponibilità
                 </button>
              </div>

            </form>
          </div>
        </div>
      </div>

      {/* Decorative background elements matching the logo aesthetics */}
      <div className="absolute top-1/2 left-0 transform -translate-y-1/2 -ml-24 opacity-40 pointer-events-none">
         <div className="w-96 h-96 rounded-full bg-[#f6dfcc] blur-3xl"></div>
      </div>
      <div className="absolute top-0 right-0 transform translate-x-1/4 -mt-20 opacity-30 pointer-events-none">
         <div className="w-[30rem] h-[30rem] rounded-full bg-[#fca28c] blur-3xl"></div>
      </div>
    </div>
  );
}

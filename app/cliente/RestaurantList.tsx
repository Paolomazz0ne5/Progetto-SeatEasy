'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export default function RestaurantList({ initialRestaurants }: { initialRestaurants: any[] }) {
  const [filter, setFilter] = useState('Tutti');

  const filteredRestaurants = filter === 'Tutti' 
    ? initialRestaurants 
    : initialRestaurants.filter(r => r.tipologia === filter);

  const categories = ['Tutti', 'Italiano', 'Giapponese', 'Francese'];

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
        <div>
          <h2 className="text-3xl font-extrabold text-[#781D2D] tracking-tight">
            Ristoranti in Primo Piano
          </h2>
          <p className="text-[#D35400] font-medium mt-2">
            Scopri le migliori eccellenze culinarie selezionate per te.
          </p>
        </div>
        
        {/* Filter Buttons */}
        <div className="flex flex-wrap gap-2">
           {categories.map(cat => (
             <button
               key={cat}
               onClick={() => setFilter(cat)}
               className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all border ${
                 filter === cat 
                   ? 'bg-[#781D2D] text-white border-[#781D2D] shadow-md' 
                   : 'bg-[#FDF1E9] text-[#781D2D] border-[#F5CBA7]/50 hover:bg-[#F5CBA7]/20'
               }`}
             >
               {cat}
             </button>
           ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredRestaurants.map((risto) => (
          <Link 
            key={risto.idRistorante} 
            href={`/cliente/ristorante/${risto.idRistorante}`}
            className="group bg-white rounded-[2rem] overflow-hidden border border-[#F5CBA7]/40 shadow-sm hover:shadow-xl transition-all duration-500 hover:-translate-y-2"
          >
            <div className="relative h-64 overflow-hidden">
              <img 
                src={`https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80`}
                alt={risto.nome}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity"></div>
              <div className="absolute bottom-4 left-6">
                <span className="bg-white/90 backdrop-blur-md text-[#781D2D] text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                  {risto.tipologia || 'Popolare'}
                </span>
              </div>
            </div>
            <div className="p-8">
              <h3 className="text-xl font-bold text-[#781D2D] mb-2 group-hover:text-[#D35400] transition-colors">
                {risto.nome}
              </h3>
              <div className="flex items-center text-gray-500 text-sm mb-4">
                <svg className="w-4 h-4 mr-1 text-[#D35400]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                </svg>
                {risto.indirizzo}
              </div>
              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <div className="flex items-center gap-1 text-[#D35400]">
                   <span className="font-bold">4.8</span>
                   <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                     <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                   </svg>
                </div>
                <span className="text-[#781D2D] font-bold group-hover:translate-x-1 transition-transform">
                  Prenota ora &rarr;
                </span>
              </div>
            </div>
          </Link>
        ))}
        {filteredRestaurants.length === 0 && (
          <div className="col-span-full py-20 text-center">
            <p className="text-gray-400 font-medium text-lg italic">Nessun ristorante trovato per questa categoria.</p>
          </div>
        )}
      </div>
    </section>
  );
}

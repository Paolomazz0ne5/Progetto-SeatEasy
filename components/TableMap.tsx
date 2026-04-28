"use client";

import React, { useState } from 'react';

type Tavolo = {
  idTavolo: number;
  numero: number;
  posti: number;
  stato: string; // 'Libero', 'Occupato', 'Non Disponibile'
};

export default function TableMap({ tavoli }: { tavoli: Tavolo[] }) {
  const [selectedTable, setSelectedTable] = useState<Tavolo | null>(null);
  const [selectedTime, setSelectedTime] = useState<string>("20:00");
  const [specialRequests, setSpecialRequests] = useState<string>("");

  const handleTableClick = (tavolo: Tavolo) => {
    if (tavolo.stato === 'Libero') {
      setSelectedTable(tavolo);
    }
  };

  return (
    <div className="bg-white border border-[#F5CBA7] rounded-3xl p-6 md:p-8 shadow-md">
      <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center">
        <div>
          <h2 className="text-2xl font-bold text-[#781D2D]">Mappa della Sala</h2>
          <p className="text-[#781D2D]/70 text-sm mt-1">Seleziona un tavolo libero per prenotarlo.</p>
        </div>
        
        {/* Legend */}
        <div className="mt-4 md:mt-0 flex space-x-4 text-sm font-medium">
          <div className="flex items-center space-x-1.5 border border-[#e2b793]/40 px-3 py-1.5 rounded-full">
            <span className="w-3.5 h-3.5 bg-green-500 rounded-full shadow-inner"></span>
            <span className="text-gray-700">Libero</span>
          </div>
          <div className="flex items-center space-x-1.5 border border-[#e2b793]/40 px-3 py-1.5 rounded-full">
            <span className="w-3.5 h-3.5 bg-red-500 rounded-full shadow-inner"></span>
            <span className="text-gray-700">Occupato</span>
          </div>
          <div className="flex items-center space-x-1.5 border border-[#e2b793]/40 px-3 py-1.5 rounded-full">
            <span className="w-3.5 h-3.5 bg-gray-300 rounded-full shadow-inner"></span>
            <span className="text-gray-700">N/D</span>
          </div>
        </div>
      </div>

      {/* The Interactive Room Map Grid */}
      <div className="bg-[#FFFDFB] border-2 border-dashed border-[#F5CBA7] rounded-2xl p-6 md:p-10 mb-8 relative">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6 place-items-center">
          {tavoli.map((tavolo) => {
            const isLibero = tavolo.stato === 'Libero';
            const isOccupato = tavolo.stato === 'Occupato';
            const isSelected = selectedTable?.idTavolo === tavolo.idTavolo;

            let bgColor = "bg-gray-200 border-gray-300 text-gray-500";
            if (isLibero) bgColor = "bg-green-100 border-green-400 text-green-800 hover:bg-green-200 hover:shadow-md cursor-pointer";
            if (isOccupato) bgColor = "bg-red-100 border-red-400 text-red-800 opacity-80 cursor-not-allowed";
            if (isSelected) bgColor = "bg-[#D35400] border-[#781D2D] text-white shadow-lg transform scale-105 ring-4 ring-[#F5CBA7]";

            return (
              <div 
                key={tavolo.idTavolo}
                onClick={() => handleTableClick(tavolo)}
                className={`relative flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 rounded-full border-2 transition-all duration-300 ${bgColor}`}
                title={isLibero ? `Clicca per prenotare il Tavolo ${tavolo.numero}` : `Tavolo ${tavolo.stato}`}
              >
                <div className="text-center">
                  <span className="block font-bold text-lg">T{tavolo.numero}</span>
                  <span className="block text-xs opacity-90">{tavolo.posti} posti</span>
                </div>
                {/* Visual chairs around the table */}
                <div className="absolute top-[-8px] w-6 h-2 bg-current opacity-30 rounded-full"></div>
                <div className="absolute bottom-[-8px] w-6 h-2 bg-current opacity-30 rounded-full"></div>
                {tavolo.posti > 2 && (
                   <>
                     <div className="absolute left-[-8px] w-2 h-6 bg-current opacity-30 rounded-full"></div>
                     <div className="absolute right-[-8px] w-2 h-6 bg-current opacity-30 rounded-full"></div>
                   </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Booking Summary Section */}
      <div className={`transition-all duration-500 ease-in-out border-t-2 border-[#F5CBA7]/40 pt-8 ${selectedTable ? 'opacity-100 max-h-screen' : 'opacity-50 pointer-events-none'}`}>
        <h3 className="text-xl font-bold text-[#781D2D] mb-4">Riepilogo e Conferma</h3>
        
        {selectedTable ? (
          <div className="bg-[#FDF1E9] p-5 rounded-xl border border-[#D35400]/30 mb-6 flex items-center shadow-sm">
             <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center border-2 border-[#D35400] text-[#781D2D] font-bold text-xl mr-4 shadow-sm">
               T{selectedTable.numero}
             </div>
             <div>
               <p className="font-semibold text-[#781D2D]">Hai selezionato il Tavolo {selectedTable.numero}</p>
               <p className="text-[#D35400] text-sm font-medium">Fino a {selectedTable.posti} persone massime</p>
             </div>
          </div>
        ) : (
          <div className="bg-gray-50 p-5 rounded-xl border border-gray-200 mb-6 text-gray-500 text-center italic">
            Nessun tavolo selezionato. Scegline uno libero dalla mappa.
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-semibold text-[#781D2D] mb-1.5 ml-1">Orario di Prenotazione</label>
            <select 
              value={selectedTime}
              onChange={(e) => setSelectedTime(e.target.value)}
              disabled={!selectedTable}
              className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-black font-medium focus:outline-none focus:ring-2 focus:ring-[#D35400] focus:border-[#D35400] transition-colors"
            >
              <option value="19:00">19:00</option>
              <option value="19:30">19:30</option>
              <option value="20:00">20:00</option>
              <option value="20:30">20:30</option>
              <option value="21:00">21:00</option>
              <option value="21:30">21:30</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-[#781D2D] mb-1.5 ml-1">Esigenze / Richieste Speciali</label>
            <textarea 
              value={specialRequests}
              onChange={(e) => setSpecialRequests(e.target.value)}
              disabled={!selectedTable}
              rows={2}
              placeholder="Allergie, seggiolone, anniversario..."
              className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-black font-medium placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#D35400] focus:border-[#D35400] transition-colors resize-none"
            ></textarea>
          </div>
        </div>

        <button 
          disabled={!selectedTable}
          className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-all transform ${selectedTable ? 'bg-gradient-to-r from-[#D35400] to-[#E74C3C] text-white hover:scale-[1.01] hover:shadow-xl' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
        >
          {selectedTable ? `Conferma Prenotazione alle ${selectedTime}` : 'Seleziona un Tavolo'}
        </button>

      </div>
    </div>
  );
}

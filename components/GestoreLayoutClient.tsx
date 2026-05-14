'use client';

import React, { useState } from 'react';
import { Plus, Edit3, Trash2, Save, Grid, LayoutDashboard, Link2, Unlink } from 'lucide-react';
import { createSala, deleteSala, createTavolo, updateTavolo, deleteTavolo, linkTavoli, unlinkTavolo } from '@/app/actions/layoutActions';

type Tavolo = {
  idTavolo: number;
  idSala: number;
  numero: number;
  posti: number;
  postiMinimi: number;
  stato: string;
  idGruppo?: string | null;
};

type Sala = {
  idSala: number;
  nome: string;
  capacita: number;
  tavoli: Tavolo[];
};

export default function GestoreLayoutClient({ initialSale, idRistorante }: { initialSale: Sala[], idRistorante: number }) {
  const [sale] = useState<Sala[]>(initialSale);
  const [activeSalaId, setActiveSalaId] = useState<number | null>(initialSale.length > 0 ? initialSale[0].idSala : null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isLinkMode, setIsLinkMode] = useState(false);
  const [selectedTavoliIds, setSelectedTavoliIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);

  // Modals
  const [newSalaModal, setNewSalaModal] = useState(false);
  const [newSalaName, setNewSalaName] = useState('');

  const [tavoloModal, setTavoloModal] = useState<{ isOpen: boolean; mode: 'create' | 'edit'; data: Partial<Tavolo> | null }>({
    isOpen: false,
    mode: 'create',
    data: null
  });

  const activeSala = sale.find(s => s.idSala === activeSalaId) || null;

  // --------------------------------------------------------
  // Sala Actions
  // --------------------------------------------------------
  const handleCreateSala = async () => {
    if (!newSalaName.trim()) return;
    setLoading(true);
    await createSala(newSalaName, idRistorante);
    // Hard refresh state could be done by router.refresh(), 
    // but Next 13+ App Router revalidatePath does this.
    // However, our passed prop will be updated from server.
    // For instant feedback we wait for server to resolve and reload.
    window.location.reload(); 
  };

  const handleDeleteSala = async () => {
    if (!activeSala) return;
    if (confirm(`Sei sicuro di voler eliminare la sala "${activeSala.nome}" e tutti i suoi tavoli?`)) {
      setLoading(true);
      await deleteSala(activeSala.idSala);
      window.location.reload();
    }
  };

  // --------------------------------------------------------
  // Tavolo Actions
  // --------------------------------------------------------
  const openAddTavolo = () => {
    // Find next available logical number
    const takenNumbers = activeSala?.tavoli.map(t => t.numero) || [];
    let nextNum = 1;
    while(takenNumbers.includes(nextNum)) nextNum++;

    setTavoloModal({ isOpen: true, mode: 'create', data: { numero: nextNum, posti: 4, postiMinimi: 1 } });
  };

  const openEditTavolo = (tavolo: Tavolo) => {
    if(!isEditMode) return;
    setTavoloModal({ isOpen: true, mode: 'edit', data: { ...tavolo } });
  };

  const saveTavolo = async () => {
    if(!activeSala || !tavoloModal.data) return;
    setLoading(true);

    const { idTavolo, numero, posti, postiMinimi } = tavoloModal.data;
    const postiMin = Math.max(1, Math.min(Number(postiMinimi) || 1, Number(posti)));

    if (tavoloModal.mode === 'create') {
      await createTavolo(activeSala.idSala, Number(numero), Number(posti), postiMin);
    } else if (tavoloModal.mode === 'edit' && idTavolo) {
      await updateTavolo(idTavolo, Number(numero), Number(posti), postiMin);
    }

    window.location.reload();
  };

  const removeTavolo = async () => {
    if(!tavoloModal.data?.idTavolo) return;
    setLoading(true);
    await deleteTavolo(tavoloModal.data.idTavolo);
    window.location.reload();
  };

  const handleTavoloClick = (tavolo: Tavolo) => {
    if (!isEditMode) return;
    if (isLinkMode) {
      if (selectedTavoliIds.includes(tavolo.idTavolo)) {
        setSelectedTavoliIds(selectedTavoliIds.filter(id => id !== tavolo.idTavolo));
      } else {
        setSelectedTavoliIds([...selectedTavoliIds, tavolo.idTavolo]);
      }
    } else {
      openEditTavolo(tavolo);
    }
  };

  const handleLinkTavoli = async () => {
    if (selectedTavoliIds.length < 2) return;
    setLoading(true);
    await linkTavoli(selectedTavoliIds);
    setIsLinkMode(false);
    setSelectedTavoliIds([]);
    window.location.reload();
  };

  const handleUnlinkTavolo = async (idTavolo: number) => {
    setLoading(true);
    await unlinkTavolo(idTavolo);
    setTavoloModal({ isOpen: false, mode: 'create', data: null });
    window.location.reload();
  };


  return (
    <div className="w-full flex text-[#781D2D]">
      
      {/* LEFT SIDEBAR - SALA NAVIGATION AND CONTROLS */}
      <div className="w-1/4 min-w-[250px] bg-white/60 backdrop-blur-xl border-r border-white/40 shadow-sm min-h-[70vh] p-6 rounded-l-3xl flex flex-col">
        
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
          <LayoutDashboard className="text-[#D35400]" size={22} /> Sale
        </h2>

        {/* Sala Tabs */}
        <div className="space-y-2 flex-1">
          {sale.map(s => (
            <button 
              key={s.idSala}
              onClick={() => { setActiveSalaId(s.idSala); setIsEditMode(false); setIsLinkMode(false); setSelectedTavoliIds([]); }}
              className={`w-full text-left px-4 py-3 rounded-xl font-bold transition-all ${
                activeSalaId === s.idSala 
                ? 'bg-[#781D2D] text-white shadow-md' 
                : 'bg-white/80 text-gray-600 hover:bg-[#FDF1E9] hover:text-[#781D2D]'
              }`}
            >
              <div className="flex items-center justify-between">
                <span>{s.nome}</span>
                <span className={`text-xs px-2 py-1 rounded-full ${activeSalaId === s.idSala ? 'bg-white/20' : 'bg-gray-100'}`}>
                  {s.tavoli.length} tavoli
                </span>
              </div>
            </button>
          ))}
          {sale.length === 0 && (
             <div className="text-sm text-gray-400 italic text-center p-4">Nessuna sala configurata.</div>
          )}
        </div>

        {/* Action Panel */}
        <div className="pt-6 border-t border-[#F5CBA7]/40 space-y-3">
          <button 
             onClick={() => setNewSalaModal(true)}
             disabled={loading}
             className="w-full py-2.5 rounded-xl border-2 border-dashed border-[#D35400] text-[#D35400] font-bold hover:bg-[#D35400] hover:text-white transition-colors flex justify-center items-center gap-2"
          >
             <Plus size={18} /> Crea Nuova Sala
          </button>
          
          <button 
             onClick={() => { 
               if(activeSala) {
                 const newMode = !isEditMode;
                 setIsEditMode(newMode);
                 if(!newMode) {
                   setIsLinkMode(false);
                   setSelectedTavoliIds([]);
                 }
               }
             }}
             disabled={loading || !activeSala}
             className={`w-full py-2.5 rounded-xl font-bold transition-colors flex justify-center items-center gap-2 ${
               !activeSala ? 'opacity-50 cursor-not-allowed bg-gray-200 text-gray-400' :
               isEditMode ? 'bg-[#D35400] text-white shadow-md' : 'bg-[#e2b793]/30 text-[#781D2D] hover:bg-[#e2b793]/50'
             }`}
          >
             {isEditMode ? <><Save size={18} /> Fatto</> : <><Edit3 size={18} /> Modifica Layout</>}
          </button>

          {isEditMode && activeSala && (
             <div className="pt-2 border-t border-[#F5CBA7]/40 space-y-2 animate-in fade-in slide-in-from-top-2">
               <button 
                  onClick={() => {
                    setIsLinkMode(!isLinkMode);
                    if (isLinkMode) setSelectedTavoliIds([]);
                  }}
                  className={`w-full py-2.5 rounded-xl font-bold transition-colors flex justify-center items-center gap-2 ${
                    isLinkMode ? 'bg-indigo-600 text-white shadow-md' : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                  }`}
               >
                  <Link2 size={18} /> {isLinkMode ? 'Annulla Collega' : 'Collega Tavoli'}
               </button>
               {isLinkMode && selectedTavoliIds.length > 0 && (
                 <button
                    onClick={handleLinkTavoli}
                    disabled={selectedTavoliIds.length < 2 || loading}
                    className="w-full py-2.5 rounded-xl bg-indigo-500 text-white font-bold disabled:opacity-50 hover:bg-indigo-600 transition flex justify-center items-center gap-2 shadow-md"
                 >
                    Crea Gruppo ({selectedTavoliIds.length})
                 </button>
               )}
             </div>
          )}

          <button 
             onClick={handleDeleteSala}
             disabled={loading || !activeSala}
             className="w-full py-2.5 rounded-xl text-red-500 font-bold hover:bg-red-50 transition-colors flex justify-center items-center gap-2"
          >
             <Trash2 size={18} /> Elimina Sala
          </button>
        </div>
      </div>


      {/* MAIN VIEW - GRID BUILDER */}
      <div className="flex-1 bg-[#FFFDFB]/60 backdrop-blur-sm p-8 rounded-r-3xl border border-[#F5CBA7]/30 shadow-sm relative relative">
        <div className="flex items-center justify-between mb-8">
           <h3 className="text-2xl font-extrabold text-[#781D2D] flex items-center gap-3">
             {activeSala ? activeSala.nome : 'Seleziona o crea una sala'}
             {isEditMode && <span className="bg-[#D35400] text-white text-xs px-3 py-1 rounded-full uppercase tracking-widest font-black animate-pulse">Builder Attivo</span>}
           </h3>
           
           {isEditMode && activeSala && (
             <button 
               onClick={openAddTavolo}
               className="bg-green-600 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-green-700 transition shadow-md"
             >
               <Plus size={18} /> Aggiungi Tavolo
             </button>
           )}
        </div>

        {activeSala ? (
          <div className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 place-items-center bg-white/50 p-8 rounded-3xl min-h-[400px] border-2 ${isEditMode ? 'border-dashed border-[#D35400] bg-[url("/grid-pattern.svg")]' : 'border-solid border-[#F5CBA7]/50'}`}>
            
            {activeSala.tavoli.map(tavolo => {
              const isSelected = selectedTavoliIds.includes(tavolo.idTavolo);
              const isGrouped = !!tavolo.idGruppo;

              // Compute color string based on idGruppo text to make it consistent
              const groupColor = isGrouped ? `hsl(${tavolo.idGruppo!.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % 360}, 70%, 50%)` : '';

              return (
                <div 
                  key={tavolo.idTavolo}
                  onClick={() => handleTavoloClick(tavolo)}
                  className={`relative flex flex-col items-center justify-center w-24 h-24 rounded-full border-4 shadow-sm transition-all duration-300
                    ${isEditMode && !isLinkMode ? 'cursor-pointer hover:border-[#D35400] hover:scale-110 bg-[#FDF1E9] border-[#e2b793]' : 
                      isLinkMode ? 'cursor-pointer hover:scale-105' : 'bg-white opacity-90'}
                    ${!isEditMode && !isGrouped ? 'border-green-400' : ''}
                    ${isLinkMode && isSelected ? 'border-indigo-600 bg-indigo-50 scale-110 ring-4 ring-indigo-200' : ''}
                  `}
                  style={isGrouped ? { 
                    borderColor: isLinkMode && isSelected ? undefined : groupColor,
                    borderStyle: isGrouped ? 'dashed' : 'solid',
                    borderWidth: '4px'
                  } : undefined}
                >
                  <span className="block font-black text-xl text-[#781D2D]">T{tavolo.numero}</span>
                  <span className="block text-xs font-semibold text-gray-500">{tavolo.posti} pax</span>
                  
                  {isGrouped && !isLinkMode && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-black uppercase text-white px-2 py-0.5 rounded-full shadow-sm whitespace-nowrap" style={{ backgroundColor: groupColor }}>
                      Gruppo
                    </div>
                  )}

                  {isEditMode && !isLinkMode && (
                    <div className="absolute -top-2 -right-2 bg-[#D35400] text-white rounded-full p-1 shadow-md opacity-0 hover:opacity-100 transition-opacity">
                      <Edit3 size={12} />
                    </div>
                  )}

                  {isLinkMode && isSelected && (
                    <div className="absolute -top-2 -right-2 bg-indigo-600 text-white rounded-full p-1 shadow-md">
                      <Link2 size={12} />
                    </div>
                  )}
                </div>
              );
            })}

            {isEditMode && (
              <button 
                onClick={openAddTavolo}
                className="flex flex-col items-center justify-center w-24 h-24 rounded-full border-4 border-dashed border-gray-300 text-gray-400 hover:border-green-500 hover:text-green-500 hover:bg-green-50 transition-all duration-300"
              >
                <Plus size={24} />
              </button>
            )}
            
            {!isEditMode && activeSala.tavoli.length === 0 && (
              <div className="col-span-full text-gray-400 italic font-medium">
                Questa sala non ha ancora nessun tavolo. Clicca su "Modifica Layout" per aggiungerli.
              </div>
            )}
            
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 opacity-50">
             <Grid size={64} className="mb-4" />
             <p className="text-lg font-medium">Canvas Layout Layout Vuoto</p>
          </div>
        )}
      </div>

      {/* --- MODALS --- */}

      {/* New Sala Modal */}
      {newSalaModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold text-[#781D2D] mb-4">Crea Nuova Sala</h3>
            <input 
               type="text" 
               placeholder="Es. Veranda Esterna" 
               value={newSalaName}
               onChange={e => setNewSalaName(e.target.value)}
               className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#D35400] focus:outline-none mb-6 font-medium text-[#781D2D]"
               autoFocus
            />
            <div className="flex justify-end gap-3">
              <button onClick={() => { setNewSalaModal(false); setNewSalaName(''); }} className="px-5 py-2.5 text-gray-500 font-medium hover:bg-gray-100 rounded-xl">Annulla</button>
              <button onClick={handleCreateSala} disabled={loading || !newSalaName} className="px-5 py-2.5 bg-[#D35400] text-white font-bold rounded-xl hover:bg-[#ba4a00] disabled:opacity-50">Crea Sala</button>
            </div>
          </div>
        </div>
      )}

      {/* Tavolo Modal (Create / Edit) */}
      {tavoloModal.isOpen && tavoloModal.data && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            
            <h3 className="text-xl font-bold text-[#781D2D] mb-6 flex items-center gap-2">
              <Grid className="text-[#D35400]" size={24} /> {tavoloModal.mode === 'create' ? 'Aggiungi Tavolo' : 'Modifica Tavolo'}
            </h3>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-1">Numero Identificativo</label>
                  <input
                    type="number" min={1}
                    value={tavoloModal.data.numero}
                    onChange={e => setTavoloModal(prev => ({ ...prev, data: { ...prev.data!, numero: Number(e.target.value) } }))}
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#D35400] font-bold text-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-1">Capacità Max (Posti)</label>
                  <input
                    type="number" min={1}
                    value={tavoloModal.data.posti}
                    onChange={e => {
                      const newPosti = Number(e.target.value);
                      setTavoloModal(prev => ({
                        ...prev,
                        data: {
                          ...prev.data!,
                          posti: newPosti,
                          // Keep postiMinimi clamped to new posti value
                          postiMinimi: Math.min(prev.data!.postiMinimi ?? 1, newPosti)
                        }
                      }));
                    }}
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#D35400] font-bold text-lg"
                  />
                </div>
              </div>

              {/* Capacità Minima */}
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1">
                  Capacità Minima (Posti)
                  <span className="ml-2 text-xs text-gray-400 font-normal">Min accettabile per una prenotazione</span>
                </label>
                <input
                  type="number"
                  min={1}
                  max={tavoloModal.data.posti || 99}
                  value={tavoloModal.data.postiMinimi ?? 1}
                  onChange={e => {
                    const val = Number(e.target.value);
                    setTavoloModal(prev => ({
                      ...prev,
                      data: { ...prev.data!, postiMinimi: val }
                    }));
                  }}
                  className={`w-full p-3 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-[#D35400] font-bold text-lg ${
                    (tavoloModal.data.postiMinimi ?? 1) > (tavoloModal.data.posti || 99)
                      ? 'border-red-400 bg-red-50'
                      : 'border-gray-200'
                  }`}
                />
                {(tavoloModal.data.postiMinimi ?? 1) > (tavoloModal.data.posti || 99) && (
                  <p className="text-red-500 text-xs font-semibold mt-1">
                    ⚠ La capacità minima non può superare quella massima ({tavoloModal.data.posti}).
                  </p>
                )}
                {(tavoloModal.data.postiMinimi ?? 1) < 1 && (
                  <p className="text-red-500 text-xs font-semibold mt-1">
                    ⚠ La capacità minima deve essere almeno 1.
                  </p>
                )}
              </div>
            </div>
            
            <div className="mt-8 flex justify-between items-center">
              <div className="flex flex-col gap-2">
                {tavoloModal.mode === 'edit' ? (
                  <>
                    <button onClick={removeTavolo} disabled={loading} className="px-4 py-2 text-red-500 font-bold hover:bg-red-50 focus:bg-red-50 rounded-xl transition flex items-center gap-2 text-sm">
                      <Trash2 size={16} /> Elimina Tavolo
                    </button>
                    {tavoloModal.data?.idGruppo && (
                      <button onClick={() => handleUnlinkTavolo(tavoloModal.data!.idTavolo!)} disabled={loading} className="px-4 py-2 text-orange-500 font-bold hover:bg-orange-50 focus:bg-orange-50 rounded-xl transition flex items-center gap-2 text-sm">
                        <Unlink size={16} /> Separa dal Gruppo
                      </button>
                    )}
                  </>
                ) : <div></div>}
              </div>
              
              <div className="flex gap-2 self-end">
                <button onClick={() => setTavoloModal({ isOpen: false, mode: 'create', data: null })} className="px-5 py-2.5 text-gray-500 font-medium hover:bg-gray-100 rounded-xl transition-colors">Annulla</button>
                <button
                  onClick={saveTavolo}
                  disabled={loading || (tavoloModal.data.postiMinimi ?? 1) > (tavoloModal.data.posti || 99) || (tavoloModal.data.postiMinimi ?? 1) < 1}
                  className="px-5 py-2.5 bg-[#781D2D] text-white font-bold rounded-xl hover:bg-[#5f1723] transition-colors shadow-md disabled:opacity-50"
                >Salva</button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

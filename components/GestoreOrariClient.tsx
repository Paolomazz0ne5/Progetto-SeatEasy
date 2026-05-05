'use client';

import React, { useState } from 'react';
import { Clock, Plus, Trash2, Edit, Save, X } from 'lucide-react';
import { createOrario, updateOrario, deleteOrario } from '@/app/actions/orari';

type Orario = {
  idOrario: number;
  nome: string;
  oraInizio: string;
  oraFine: string;
  durataMediaServizio: number;
  turni?: any[];
};

export default function GestoreOrariClient({ initialOrari, idRistorante }: { initialOrari: Orario[], idRistorante: number }) {
  const [orari] = useState<Orario[]>(initialOrari);
  const [loading, setLoading] = useState(false);

  // Fascia Oraria State
  const [editOrarioId, setEditOrarioId] = useState<number | null>(null);
  const [orarioForm, setOrarioForm] = useState({ 
    nome: '', 
    oraInizio: '', 
    oraFine: '', 
    durataMedia: '90' as string | number 
  });
  const [showAddOrario, setShowAddOrario] = useState(false);

  // --------------
  // Fasce Actions
  // --------------
  const handleSaveOrario = async () => {
    setLoading(true);
    const durata = Number(orarioForm.durataMedia) || 90;
    if (editOrarioId) {
      await updateOrario(editOrarioId, orarioForm.nome, orarioForm.oraInizio, orarioForm.oraFine, 0, durata);
    } else {
      await createOrario(idRistorante, orarioForm.nome, orarioForm.oraInizio, orarioForm.oraFine, 0, durata);
    }
    window.location.reload();
  };

  const handleEditOrarioInit = (o: Orario) => {
    setEditOrarioId(o.idOrario);
    const durata = o.turni && o.turni.length > 0 ? o.turni[0].durataMedia : 90;
    setOrarioForm({ nome: o.nome, oraInizio: o.oraInizio, oraFine: o.oraFine, durataMedia: durata });
    setShowAddOrario(true);
  };

  const handleDeleteOrario = async (id: number) => {
    if (confirm("Attenzione: questo eliminerà la fascia oraria. Procedere?")) {
      setLoading(true);
      await deleteOrario(id);
      window.location.reload();
    }
  };

  return (
    <div className="w-full space-y-8">
      
      {/* 1. SEZIONE FASCE ORARIE */}
      <section className="bg-white/60 backdrop-blur-xl border border-[#F5CBA7]/60 rounded-3xl p-6 md:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h2 className="text-2xl font-bold text-[#781D2D] flex items-center gap-3">
              <span className="bg-[#FDF1E9] p-2 rounded-xl text-[#D35400]">
                <Clock size={24} />
              </span>
              Fasce Orarie
            </h2>
            <p className="text-gray-500 text-sm mt-1">Definisci i periodi principali di servizio (es. Pranzo, Cena).</p>
          </div>
          <button 
             onClick={() => {
               setEditOrarioId(null);
               setOrarioForm({ nome: 'Nuovo Servizio', oraInizio: '12:00', oraFine: '15:00', durataMedia: '90' });
               setShowAddOrario(true);
             }}
             className="bg-[#D35400] text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-[#ba4a00] transition shadow-md"
          >
             <Plus size={18} /> Aggiungi Fascia
          </button>
        </div>

        {/* Form Orario (Create/Edit) */}
        {showAddOrario && (
          <div className="bg-[#FFFDFB] border-2 border-dashed border-[#F5CBA7] rounded-2xl p-6 mb-8 relative animate-in slide-in-from-top-4">
             <button onClick={() => setShowAddOrario(false)} className="absolute top-4 right-4 text-gray-400 hover:text-red-500 transition">
               <X size={20} />
             </button>
             <h3 className="text-lg font-bold text-[#781D2D] mb-4">{editOrarioId ? 'Modifica Fascia Oraria' : 'Nuova Fascia Oraria'}</h3>
             
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
               <div>
                 <label className="block text-xs font-semibold text-gray-500 mb-1">Nome Servizio</label>
                 <input type="text" value={orarioForm.nome} onChange={e => setOrarioForm({...orarioForm, nome: e.target.value})} className="w-full p-2.5 bg-white border border-[#F5CBA7] rounded-xl focus:ring-2 focus:ring-[#D35400] focus:outline-none font-bold text-black" placeholder="es. Pranzo" />
               </div>
               <div>
                 <label className="block text-xs font-semibold text-gray-500 mb-1">Ora Inizio</label>
                 <input type="time" value={orarioForm.oraInizio} onChange={e => setOrarioForm({...orarioForm, oraInizio: e.target.value})} className="w-full p-2.5 bg-white border border-[#F5CBA7] rounded-xl focus:ring-2 focus:ring-[#D35400] focus:outline-none font-bold text-black" />
               </div>
               <div>
                 <label className="block text-xs font-semibold text-gray-500 mb-1">Ora Fine</label>
                 <input type="time" value={orarioForm.oraFine} onChange={e => setOrarioForm({...orarioForm, oraFine: e.target.value})} className="w-full p-2.5 bg-white border border-[#F5CBA7] rounded-xl focus:ring-2 focus:ring-[#D35400] focus:outline-none font-bold text-black" />
               </div>
             </div>

             <div className="mt-6 border-t border-[#F5CBA7]/20 pt-6">
                <label className="block text-xs font-black text-[#781D2D] uppercase tracking-widest mb-3 ml-1">Parametri di Servizio</label>
                <div className="flex flex-col md:flex-row md:items-center gap-6 bg-[#FDF1E9]/30 p-5 rounded-2xl border border-[#F5CBA7]/20">
                  <div className="w-full md:w-48">
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Durata Media Tavolo</label>
                    <div className="relative">
                      <input 
                        type="number" 
                        value={orarioForm.durataMedia} 
                        onChange={e => setOrarioForm({...orarioForm, durataMedia: e.target.value})} 
                        className="w-full p-2.5 bg-white border border-[#F5CBA7] rounded-xl focus:ring-2 focus:ring-[#D35400] focus:outline-none font-bold text-black pr-12" 
                        min="15"
                        step="15"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-400">min</span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-[#781D2D]/70 font-medium italic leading-relaxed">
                      &quot;Il tempo stimato di permanenza dei clienti. Utile per far prenotare lo stesso tavolo più volte nello stesso turno.&quot;
                    </p>
                  </div>
                </div>
              </div>
             
             <div className="mt-6 flex justify-end">
               <button onClick={handleSaveOrario} disabled={loading} className="bg-[#781D2D] text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-[#5f1723] transition-colors shadow-md">
                 <Save size={18} /> Salva
               </button>
             </div>
          </div>
        )}

        {/* Elenco Fasce Orarie Orizzontali */}
        <div className="space-y-4">
          {orari.length === 0 && !showAddOrario && (
            <div className="text-center p-8 text-gray-400 font-medium italic border rounded-2xl bg-gray-50">Nessuna fascia oraria configurata.</div>
          )}
          
          {orari.map(orario => (
            <div key={orario.idOrario} className="border border-[#F5CBA7]/50 bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              {/* Header Accordion-like */}
              <div className="flex flex-col md:flex-row md:items-center justify-between p-5 bg-gradient-to-r from-[#FDF1E9]/50 to-transparent border-b border-[#F5CBA7]/20">
                <div className="flex items-center gap-4 mb-4 md:mb-0">
                   <div className="bg-[#D35400]/10 text-[#D35400] w-12 h-12 rounded-full flex items-center justify-center font-bold">
                     {orario.oraInizio.split(':')[0]}h
                   </div>
                   <div>
                     <h3 className="font-extrabold text-[#781D2D] text-lg uppercase tracking-wide">{orario.nome}</h3>
                     <p className="text-sm font-medium text-gray-500 flex items-center gap-2">
                       <span>{orario.oraInizio} - {orario.oraFine}</span>
                     </p>
                   </div>
                </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleEditOrarioInit(orario)} className="p-2 text-blue-500 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors">
                      <Edit size={18} />
                    </button>
                    <button onClick={() => handleDeleteOrario(orario.idOrario)} className="p-2 text-red-500 bg-red-50 hover:bg-red-100 rounded-xl transition-colors">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    );
  }

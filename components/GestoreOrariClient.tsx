'use client';

import React, { useState } from 'react';
import { Clock, Plus, Trash2, Edit, Save, Users, X, Activity } from 'lucide-react';
import { createOrario, updateOrario, deleteOrario, createTurno, updateTurno, deleteTurno } from '@/app/actions/orari';

type Turno = {
  idTurno: number;
  idOrario: number;
  nomeTurno: string;
  maxPrenotazioni: number;
};

type Orario = {
  idOrario: number;
  nome: string;
  oraInizio: string;
  oraFine: string;
  durataMediaServizio: number;
  turni: Turno[];
};

export default function GestoreOrariClient({ initialOrari }: { initialOrari: Orario[] }) {
  const [orari] = useState<Orario[]>(initialOrari);
  const [loading, setLoading] = useState(false);

  // Fascia Oraria State
  const [editOrarioId, setEditOrarioId] = useState<number | null>(null);
  const [orarioForm, setOrarioForm] = useState({ nome: '', oraInizio: '', oraFine: '', durataMed: 90 });
  const [showAddOrario, setShowAddOrario] = useState(false);

  // Turno Modal State
  const [turnoModal, setTurnoModal] = useState<{ isOpen: boolean, idOrario: number | null, idTurno: number | null, nomeTurno: string, maxP: number }>({
    isOpen: false,
    idOrario: null,
    idTurno: null,
    nomeTurno: '',
    maxP: 20
  });

  // --------------
  // Fasce Actions
  // --------------
  const handleSaveOrario = async () => {
    setLoading(true);
    if (editOrarioId) {
      await updateOrario(editOrarioId, orarioForm.nome, orarioForm.oraInizio, orarioForm.oraFine, orarioForm.durataMed);
    } else {
      await createOrario(orarioForm.nome, orarioForm.oraInizio, orarioForm.oraFine, orarioForm.durataMed);
    }
    window.location.reload();
  };

  const handleEditOrarioInit = (o: Orario) => {
    setEditOrarioId(o.idOrario);
    setOrarioForm({ nome: o.nome, oraInizio: o.oraInizio, oraFine: o.oraFine, durataMed: o.durataMediaServizio });
    setShowAddOrario(true);
  };

  const handleDeleteOrario = async (id: number) => {
    if (confirm("Attenzione: questo eliminerà la fascia oraria e tutti i turni ad essa associati. Procedere?")) {
      setLoading(true);
      await deleteOrario(id);
      window.location.reload();
    }
  };

  // --------------
  // Turni Actions
  // --------------
  const openAddTurno = (idOrario: number) => {
    setTurnoModal({ isOpen: true, idOrario, idTurno: null, nomeTurno: '20:00', maxP: 20 });
  };

  const openEditTurno = (t: Turno) => {
    setTurnoModal({ isOpen: true, idOrario: t.idOrario, idTurno: t.idTurno, nomeTurno: t.nomeTurno, maxP: t.maxPrenotazioni });
  };

  const handleSaveTurno = async () => {
    setLoading(true);
    if (turnoModal.idTurno) {
      await updateTurno(turnoModal.idTurno, turnoModal.nomeTurno, turnoModal.maxP);
    } else if (turnoModal.idOrario) {
      await createTurno(turnoModal.idOrario, turnoModal.nomeTurno, turnoModal.maxP);
    }
    window.location.reload();
  };

  const handleDeleteTurno = async (idTurno: number) => {
    if (confirm("Eliminare questo slot turno?")) {
      setLoading(true);
      await deleteTurno(idTurno);
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
               setOrarioForm({ nome: 'Nuovo Servizio', oraInizio: '12:00', oraFine: '15:00', durataMed: 90 });
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
             
             <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
               <div>
                 <label className="block text-xs font-semibold text-gray-500 mb-1">Nome Servizio</label>
                 <input type="text" value={orarioForm.nome} onChange={e => setOrarioForm({...orarioForm, nome: e.target.value})} className="w-full p-2.5 bg-white border border-[#F5CBA7] rounded-xl focus:ring-2 focus:ring-[#D35400] focus:outline-none font-bold text-[#781D2D]" placeholder="es. Pranzo" />
               </div>
               <div>
                 <label className="block text-xs font-semibold text-gray-500 mb-1">Ora Inizio</label>
                 <input type="time" value={orarioForm.oraInizio} onChange={e => setOrarioForm({...orarioForm, oraInizio: e.target.value})} className="w-full p-2.5 bg-white border border-[#F5CBA7] rounded-xl focus:ring-2 focus:ring-[#D35400] focus:outline-none" />
               </div>
               <div>
                 <label className="block text-xs font-semibold text-gray-500 mb-1">Ora Fine</label>
                 <input type="time" value={orarioForm.oraFine} onChange={e => setOrarioForm({...orarioForm, oraFine: e.target.value})} className="w-full p-2.5 bg-white border border-[#F5CBA7] rounded-xl focus:ring-2 focus:ring-[#D35400] focus:outline-none" />
               </div>
               <div>
                 <label className="block text-xs font-semibold text-gray-500 mb-1">Durata Media Tavolo (min)</label>
                 <input type="number" min={15} step={15} value={orarioForm.durataMed} onChange={e => setOrarioForm({...orarioForm, durataMed: Number(e.target.value)})} className="w-full p-2.5 bg-white border border-[#F5CBA7] rounded-xl focus:ring-2 focus:ring-[#D35400] focus:outline-none" />
               </div>
             </div>
             
             <div className="mt-4 flex justify-end">
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
                       <span className="text-[#F5CBA7]">|</span>
                       <span className="flex items-center gap-1"><Activity size={14} className="text-green-500" /> {orario.durataMediaServizio} min medi</span>
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

              {/* 2. SEZIONE TURNI (Inside Orario) */}
              <div className="p-5 bg-[#FFFDFB]">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-bold text-[#781D2D]/80 text-sm flex items-center gap-2">
                     <Users size={16} /> Slot Turni e Limiti di Prenotazione
                  </h4>
                  <button onClick={() => openAddTurno(orario.idOrario)} className="text-xs font-bold text-[#D35400] flex items-center gap-1 hover:text-[#ba4a00]">
                    <Plus size={14} /> Aggiungi Turno
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {orario.turni.length === 0 ? (
                    <div className="col-span-full text-xs text-gray-400 italic">Nessun turno specifico definito. Le prenotazioni non avranno slot pre-organizzati.</div>
                  ) : (
                    orario.turni.map(turno => (
                      <div key={turno.idTurno} className="border border-gray-200 rounded-xl p-3 bg-white flex flex-col hover:border-[#F5CBA7] transition-colors relative group">
                         <div className="flex items-center justify-between mb-2">
                           <span className="font-bold text-[#781D2D]">{turno.nomeTurno}</span>
                           <span className="text-xs font-bold bg-gray-100 text-gray-600 px-2 py-1 rounded-lg">Max {turno.maxPrenotazioni}</span>
                         </div>
                         <div className="flex opacity-0 group-hover:opacity-100 transition-opacity absolute top-[-10px] right-[-10px] gap-1">
                           <button onClick={() => openEditTurno(turno)} className="p-1 bg-white border border-gray-200 rounded-full text-blue-500 hover:bg-blue-50 shadow-sm"><Edit size={12} /></button>
                           <button onClick={() => handleDeleteTurno(turno.idTurno)} className="p-1 bg-white border border-gray-200 rounded-full text-red-500 hover:bg-red-50 shadow-sm"><Trash2 size={12} /></button>
                         </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Turno Modal */}
      {turnoModal.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold text-[#781D2D] mb-6 flex items-center gap-2">
              <Users className="text-[#D35400]" size={24} /> {turnoModal.idTurno ? 'Modifica Turno' : 'Aggiungi Turno'}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1">Nome/Orario Turno</label>
                <input 
                  type="text"
                  placeholder="es. 20:00 o Primo Turno"
                  value={turnoModal.nomeTurno} 
                  onChange={e => setTurnoModal(prev => ({ ...prev, nomeTurno: e.target.value }))} 
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#D35400] font-bold" 
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1">Max Prenotazioni Raggiungibili</label>
                <div className="flex items-center gap-3">
                  <input 
                    type="number" min={1}
                    value={turnoModal.maxP} 
                    onChange={e => setTurnoModal(prev => ({ ...prev, maxP: Number(e.target.value) }))} 
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#D35400] font-bold text-lg text-[#781D2D]" 
                  />
                  <span className="text-sm font-medium text-gray-400">tavoli/booking</span>
                </div>
              </div>
            </div>
            
            <div className="mt-8 flex justify-end gap-3">
              <button onClick={() => setTurnoModal({ isOpen: false, idOrario: null, idTurno: null, nomeTurno: '', maxP: 0 })} className="px-5 py-2.5 text-gray-500 font-medium hover:bg-gray-100 rounded-xl transition-colors">Annulla</button>
              <button onClick={handleSaveTurno} disabled={loading} className="px-5 py-2.5 bg-[#781D2D] text-white font-bold rounded-xl hover:bg-[#5f1723] transition-colors shadow-md">Salva Turno</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

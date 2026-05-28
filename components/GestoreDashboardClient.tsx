// Diciamo a Next.js che questo è un Client Component. 
// Ci serve perché usiamo "useState" e gestiamo i click sui bottoni.
'use client';

import React, { useState } from 'react';
import { Trash2, Edit, AlertTriangle, UserX, X, CheckCircle, ShieldAlert } from 'lucide-react';
// Importiamo le nostre Server Actions (il backend) per modificare il database
import { deleteReservation, updateReservation, markNoShow } from '@/app/actions/gestore';

// [TYPESCRIPT]: Definiamo lo "scheletro" di una prenotazione. 
// Aiuta l'editor a darci l'autocompletamento e previene errori di battitura.
export type ReservationData = {
  idPrenotazione: number;
  idCliente: number;
  clienteNome: string;
  clienteCognome: string;
  telefono: string;
  dataPrenotazione: string;
  numeroPersone: number;
  stato: string;
  noteCliente: string;
  caparraPagata: number;
  noShowCount: number;
};

// IL COMPONENTE PRINCIPALE
// Riceve i dati dal Server tramite le "props" (reservations, stats, penaleInfo)
export default function GestoreDashboardClient({
  reservations,
  stats,
  penaleInfo,
}: {
  reservations: ReservationData[];
  stats: { attive: number; noShows: number };
  penaleInfo: { amount: number; message: string | null };
}) {

  // STATI DI CARICAMENTO: Ci serve per disabilitare la riga della tabella 
  // mentre aspettiamo che il server risponda (evita doppi click).
  const [loadingId, setLoadingId] = useState<number | null>(null);

  // STATI DEI POPUP (Modali): Salvano *quale* prenotazione stiamo toccando.
  // Se sono "null", il popup è chiuso. Se contengono i dati, il popup si apre.
  const [editModalRes, setEditModalRes] = useState<ReservationData | null>(null);
  const [deleteModalRes, setDeleteModalRes] = useState<ReservationData | null>(null);
  const [noShowModalRes, setNoShowModalRes] = useState<ReservationData | null>(null);

  // STATI DEL FORM DI MODIFICA: Tengono in memoria i valori che digitiamo
  // negli input prima di cliccare "Salva".
  const [editPersone, setEditPersone] = useState(0);
  const [editData, setEditData] = useState('');
  const [editStato, setEditStato] = useState('');

  // Per capire se dobbiamo applicare la penale (se aveva pagato una caparra)
  const [noShowPenalty, setNoShowPenalty] = useState(false);

  // --- FUNZIONI DI SUPPORTO (Aprono i popup e riempiono i campi) ---
  const openEdit = (res: ReservationData) => {
    setEditModalRes(res);
    // Pre-compiliamo gli input con i dati attuali della prenotazione
    setEditPersone(res.numeroPersone);
    setEditData(res.dataPrenotazione);
    setEditStato(res.stato);
  };

  const openDelete = (res: ReservationData) => setDeleteModalRes(res);

  const openNoShow = (res: ReservationData) => {
    setNoShowModalRes(res);
    // Se la caparra è > 0, scatta la penale.
    setNoShowPenalty(res.caparraPagata > 0);
  };

  // --- FUNZIONI CHIAVE (Chiamano il backend) ---
  const handleDelete = async () => {
    if (!deleteModalRes) return;
    setLoadingId(deleteModalRes.idPrenotazione); // Mostra il caricamento
    await deleteReservation(deleteModalRes.idPrenotazione); // Chiamata al Server!
    setDeleteModalRes(null); // Chiude il popup
    setLoadingId(null); // Fine caricamento
  };

  const handleEdit = async () => {
    if (!editModalRes) return;
    setLoadingId(editModalRes.idPrenotazione);
    // Chiamata al Server passando i nuovi dati degli state (editPersone, ecc.)
    await updateReservation(editModalRes.idPrenotazione, {
      numeroPersone: editPersone,
      stato: editStato,
      dataPrenotazione: editData,
    });
    setEditModalRes(null);
    setLoadingId(null);
  };

  const handleNoShow = async () => {
    if (!noShowModalRes) return;
    setLoadingId(noShowModalRes.idPrenotazione);
    await markNoShow(noShowModalRes.idPrenotazione, noShowPenalty);
    setNoShowModalRes(null);
    setLoadingId(null);
    alert("Abbiamo mandato una mail a questo cliente con la penale da pagare.");
  };

  return (
    <div className="w-full flex text-[#781D2D]">
      <div className="flex-1 bg-[#FFFDFB]/60 backdrop-blur-sm rounded-3xl border border-[#F5CBA7]/30 shadow-sm overflow-hidden relative">

        {/* --- INTESTAZIONE E STATISTICHE --- */}
        <div className="p-8 border-b border-[#F5CBA7]/20 bg-white/40 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="bg-[#D35400]/10 text-[#D35400] w-12 h-12 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-extrabold text-[#781D2D]">Prenotazioni in Corso</h2>
              <p className="text-sm font-medium text-[#D35400]/70">Gestisci e monitora le prenotazioni del ristorante.</p>
            </div>
          </div>

          {/* Stampiamo i dati ricevuti dal Server (stats.attive e stats.noShows) */}
          <div className="flex items-center bg-[#FDF1E9] px-6 py-3 rounded-2xl border border-[#F5CBA7]/50 divide-x divide-[#F5CBA7]/30">
            <div className="pr-6 flex items-center gap-3">
              <span className="text-2xl font-black text-[#781D2D]">{stats.attive}</span>
              <span className="text-xs uppercase tracking-widest font-bold text-[#781D2D]/60">Attive</span>
            </div>
            <div className="pl-6 flex items-center gap-3">
              <span className="text-2xl font-black text-[#E74C3C]">{stats.noShows}</span>
              <span className="text-xs uppercase tracking-widest font-bold text-[#E74C3C]/60">No-Show</span>
            </div>
          </div>
        </div>

        {/* --- LA TABELLA DELLE PRENOTAZIONI --- */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#FDF1E9]/30 text-[#781D2D] font-bold text-sm uppercase tracking-wider">
                <th className="p-5 border-b border-[#F5CBA7]/20">Cliente</th>
                <th className="p-5 border-b border-[#F5CBA7]/20">Data</th>
                <th className="p-5 border-b border-[#F5CBA7]/20">Persone</th>
                <th className="p-5 border-b border-[#F5CBA7]/20">Stato</th>
                <th className="p-5 border-b border-[#F5CBA7]/20">Info</th>
                <th className="p-5 border-b border-[#F5CBA7]/20 text-right">Azioni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F5CBA7]/10 bg-white/30">

              {/* CONTROLLO ARRAY VUOTO: Se non ci sono prenotazioni, mostriamo un messaggio */}
              {reservations.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500 font-medium">Nessuna prenotazione attiva trovata.</td>
                </tr>
              ) : reservations.map((res) => {

                // Variabile per capire se QUESTA specifica riga sta caricando
                const isLoading = loadingId === res.idPrenotazione;

                return (
                  // La key è obbligatoria. Se la riga sta caricando (isLoading), 
                  // le togliamo i click (pointer-events-none) e la rendiamo trasparente (opacity-50)
                  <tr key={res.idPrenotazione} className={`hover:bg-white/80 transition-colors ${isLoading ? 'opacity-50 pointer-events-none' : ''}`}>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="font-bold text-[#781D2D] text-base group">
                          {res.clienteNome} {res.clienteCognome}
                          <div className="text-xs text-gray-400 font-normal">{res.telefono}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-[#781D2D]/80 font-medium">{res.dataPrenotazione}</td>
                    <td className="p-4 text-[#781D2D] font-bold text-lg">{res.numeroPersone} <span className="text-sm font-normal text-gray-400">pax</span></td>

                    {/* RENDERING CONDIZIONALE CLASSI: Cambiamo il colore della 'pillola' in base allo stato */}
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider
                        ${res.stato === 'Confermata' ? 'bg-[#D35400]/10 text-[#D35400] border border-[#D35400]/20' :
                          res.stato === 'In Attesa' ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' :
                            res.stato === 'noShow' ? 'bg-[#E74C3C]/10 text-[#E74C3C] border border-[#E74C3C]/20' :
                              'bg-gray-100 text-gray-600'}`}>
                        {res.stato}
                      </span>
                    </td>

                    <td className="p-4 text-xs text-gray-500 max-w-[150px] truncate" title={res.noteCliente}>
                      {res.noteCliente || '-'}
                      {res.caparraPagata > 0 && <div className="text-green-600 font-medium flex items-center gap-1 mt-1"><span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span> Caparra: €{res.caparraPagata}</div>}
                    </td>

                    {/* BOTTONI DELLE AZIONI */}
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-2">
                        {/* Mostriamo il bottone No-Show SOLO SE lo stato non è già noShow */}
                        {res.stato !== 'noShow' && (
                          <button
                            onClick={() => openNoShow(res)}
                            className="p-2 text-orange-500 bg-orange-50 hover:bg-orange-100 rounded-xl transition-colors border border-orange-200 shadow-sm group relative"
                            title="Segnala No-Show"
                          >
                            <AlertTriangle size={18} />
                          </button>
                        )}
                        <button
                          onClick={() => openEdit(res)}
                          className="p-2 text-blue-500 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors border border-blue-200 shadow-sm"
                          title="Modifica"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => openDelete(res)}
                          className="p-2 text-red-500 bg-red-50 hover:bg-red-100 rounded-xl transition-colors border border-red-200 shadow-sm"
                          title="Elimina"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- I POPUP (MODALI) --- */}
      {/* Funzionano tutti allo stesso modo: se lo stato NON è null, il popup viene disegnato */}

      {/* 1. Modifica Modale */}
      {editModalRes && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <button onClick={() => setEditModalRes(null)} className="absolute top-4 right-4 p-2 text-gray-400 hover:text-[#781D2D] bg-gray-50 hover:bg-[#FDF1E9] rounded-full transition-colors">
              <X size={20} />
            </button>
            <h3 className="text-xl font-bold text-[#781D2D] mb-6 flex items-center gap-2">
              <Edit className="text-[#D35400]" size={24} /> Modifica Prenotazione
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1">Data</label>
                <input type="date" value={editData} onChange={e => setEditData(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#D35400] focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1">Numero Persone</label>
                <input type="number" min={1} value={editPersone} onChange={e => setEditPersone(Number(e.target.value))} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#D35400] focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1">Stato</label>
                <select value={editStato} onChange={e => setEditStato(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#D35400] focus:outline-none">
                  <option value="Confermata">Confermata</option>
                  <option value="In Attesa">In Attesa</option>
                  <option value="Annullata">Annullata</option>
                </select>
              </div>
            </div>
            <div className="mt-8 flex justify-end gap-3">
              <button onClick={() => setEditModalRes(null)} className="px-5 py-2.5 text-gray-500 font-medium hover:bg-gray-100 rounded-xl transition-colors">Annulla</button>
              <button onClick={handleEdit} className="px-5 py-2.5 bg-[#781D2D] text-white font-bold rounded-xl hover:bg-[#5f1723] transition-colors shadow-md">Salva Modifiche</button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Elimina Modale */}
      {deleteModalRes && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200 text-center">
            <div className="mx-auto w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mb-4">
              <Trash2 size={32} />
            </div>
            <h3 className="text-xl font-bold text-[#781D2D] mb-2">Elimina Prenotazione</h3>
            <p className="text-gray-500 text-sm mb-8">Sei sicuro di voler eliminare la prenotazione a nome di <strong>{deleteModalRes.clienteNome} {deleteModalRes.clienteCognome}</strong>? L'azione è irreversibile.</p>
            <div className="flex justify-center gap-3">
              <button onClick={() => setDeleteModalRes(null)} className="px-5 py-2.5 text-gray-600 font-medium bg-gray-100 hover:bg-gray-200 rounded-xl inline-flex-1">Annulla</button>
              <button onClick={handleDelete} className="px-5 py-2.5 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 transition-colors shadow-md inline-flex-1 border border-red-600">Conferma Eliminazione</button>
            </div>
          </div>
        </div>
      )}

      {/* 3. NoShow Modale */}
      {noShowModalRes && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200 border-t-8 border-orange-500">
            <button onClick={() => setNoShowModalRes(null)} className="absolute top-4 right-4 p-2 text-gray-400 hover:text-orange-600 bg-gray-50 hover:bg-orange-50 rounded-full transition-colors">
              <X size={20} />
            </button>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center">
                <UserX size={24} />
              </div>
              <h3 className="text-xl font-extrabold text-[#781D2D]">Segnala No-Show</h3>
            </div>

            <p className="text-gray-600 text-sm mb-6 leading-relaxed">
              Confermando la segnalazione, invierai una mail automatica a <strong>{noShowModalRes.clienteNome} {noShowModalRes.clienteCognome}</strong> con il link di riferimento per pagare la penale di <strong>€{penaleInfo.amount}</strong> (pari a quella inserita nelle impostazioni del tuo ristorante).
            </p>

            <div className="flex justify-end gap-3 mt-4">
              <button onClick={() => setNoShowModalRes(null)} className="px-5 py-2.5 text-gray-500 font-medium hover:bg-gray-100 rounded-xl transition-colors">Annulla</button>
              <button onClick={handleNoShow} className="px-5 py-2.5 bg-orange-500 text-white font-bold rounded-xl hover:bg-orange-600 transition-colors shadow-md">
                Conferma Assenza
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
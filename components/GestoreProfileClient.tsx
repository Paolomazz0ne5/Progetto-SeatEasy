'use client';

import React, { useState } from 'react';
import { User, Mail, ShieldAlert, Save, Trash2, Key } from 'lucide-react';
import { updateProfile, deleteAccount } from '@/app/actions/profile';

/**
 * Interfaccia dei dati del profilo utente.
 */
type ProfileData = {
  nome: string;
  cognome: string;
  email: string;
};

interface GestoreProfileProps {
  initialData: ProfileData;
}

export default function GestoreProfileClient({ initialData }: GestoreProfileProps) {
  // --- STATI DEL COMPONENTE ---
  const [formData, setFormData] = useState<ProfileData>(initialData);
  const [loading, setLoading] = useState(false);

  // Stato per gestire i banner di notifica (successo o errore)
  const [msg, setMsg] = useState<{ type: 'ok' | 'err', text: string } | null>(null);

  /**
   * Gestisce l'aggiornamento dei dati del profilo.
   * Crea manualmente un oggetto FormData per la Server Action.
   */
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMsg(null); // Resetta eventuali messaggi precedenti

    // Creazione manuale del payload per il server
    const d = new FormData();
    d.append('nome', formData.nome);
    d.append('cognome', formData.cognome);
    d.append('email', formData.email);

    const res = await updateProfile(d);

    if (res.success) {
      setMsg({ type: 'ok', text: 'Profilo aggiornato con successo!' });
    } else {
      setMsg({ type: 'err', text: res.error || 'Errore durante l\'aggiornamento.' });
    }

    setLoading(false);
  };

  /**
   * Gestisce l'eliminazione irreversibile dell'account (Danger Zone).
   * Il reindirizzamento post-eliminazione viene gestito direttamente dalla Server Action.
   */
  const handleDelete = async () => {
    const confirmMessage = "Sei ASSOLUTAMENTE sicuro? Questa azione eliminerà il tuo account, il tuo ristorante e TUTTE le prenotazioni associate irreversibilmente.";

    if (confirm(confirmMessage)) {
      setLoading(true);
      await deleteAccount();
      // Nota: Non c'è setLoading(false) qui perché la Server Action 
      // si occuperà di fare il redirect della pagina alla Home.
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8">

      {/* =========================================================================
          SEZIONE 1: BANNER DI NOTIFICA (Feedback visivo)
          ========================================================================= */}
      {msg && (
        <div
          className={`p-4 rounded-xl flex items-center gap-3 font-medium animate-in fade-in 
            ${msg.type === 'ok'
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-red-50 text-red-700 border border-red-200'
            }`
          }
        >
          {msg.text}
        </div>
      )}

      {/* =========================================================================
          SEZIONE 2: FORM DI MODIFICA DATI PERSONALI
          ========================================================================= */}
      <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-[#F5CBA7]/60 shadow-sm overflow-hidden">

        {/* Intestazione della Card */}
        <div className="p-6 border-b border-[#F5CBA7]/30 bg-gradient-to-r from-[#FDF1E9]/50 to-transparent flex items-center gap-4">
          <div className="bg-[#D35400]/10 text-[#D35400] w-12 h-12 rounded-xl flex items-center justify-center">
            <User size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-[#781D2D]">Dettagli Personali</h2>
            <p className="text-sm text-gray-500">Modifica le tue informazioni di base e di contatto.</p>
          </div>
        </div>

        {/* Form controllato da React */}
        <form onSubmit={handleUpdate} className="p-6 md:p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Input: NOME */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">Nome</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  value={formData.nome}
                  onChange={e => setFormData({ ...formData, nome: e.target.value })}
                  className="w-full bg-gray-50/50 border border-gray-200 py-3 pl-11 pr-4 rounded-xl focus:ring-2 focus:ring-[#D35400] text-[#781D2D] font-bold"
                  required
                />
              </div>
            </div>

            {/* Input: COGNOME */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">Cognome</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  value={formData.cognome}
                  onChange={e => setFormData({ ...formData, cognome: e.target.value })}
                  className="w-full bg-gray-50/50 border border-gray-200 py-3 pl-11 pr-4 rounded-xl focus:ring-2 focus:ring-[#D35400] text-[#781D2D] font-bold"
                  required
                />
              </div>
            </div>
          </div>

          {/* Input: EMAIL */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">Indirizzo Email (Login identificativo)</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="email"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                className="w-full bg-gray-50/50 border border-gray-200 py-3 pl-11 pr-4 rounded-xl focus:ring-2 focus:ring-[#D35400] text-gray-600 font-medium"
                required
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="bg-[#D35400] text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-[#ba4a00] hover:shadow-lg transition-all disabled:opacity-50"
            >
              <Save size={18} /> Salva Modifiche
            </button>
          </div>
        </form>
      </div>

      {/* =========================================================================
          SEZIONE 3: INFO STATICHE DI SICUREZZA
          ========================================================================= */}
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-gray-200 shadow-sm p-6 flex items-start gap-4">
        <div className="bg-blue-50 text-blue-500 w-12 h-12 rounded-xl flex items-center justify-center shrink-0">
          <Key size={24} />
        </div>
        <div>
          <h3 className="font-bold text-gray-800">Metodo di Accesso Sicuro</h3>
          <p className="text-sm text-gray-500 mt-1">Il tuo account ed i dati sensibili dei tuoi clienti sono crittografati in base agli standard vigenti SeatEasy.</p>
        </div>
      </div>

      {/* =========================================================================
          SEZIONE 4: DANGER ZONE (Eliminazione Account)
          ========================================================================= */}
      <div className="bg-white/80 backdrop-blur-xl rounded-3xl border-2 border-red-200 shadow-sm overflow-hidden mt-10">
        <div className="p-6 border-b border-red-100 bg-red-50/50 flex items-center gap-4">
          <div className="text-red-500">
            <ShieldAlert size={28} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-red-600">Danger Zone</h2>
            <p className="text-sm text-red-400 font-medium">Le azioni intraprese in quest'area sono catastrofiche ed irreversibili.</p>
          </div>
        </div>

        <div className="p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h4 className="font-bold text-gray-800">Elimina Profilo Definitivamente</h4>
            <p className="text-sm text-gray-500 mt-1 max-w-md leading-relaxed">
              Chiudendo il profilo rinuncerai alla gestione del tuo locale. Tutti i dati dei tuoi tavoli, orari e soprattutto i contratti di prenotazione verranno annullati ed inceneriti.
            </p>
          </div>
          <button
            onClick={handleDelete}
            disabled={loading}
            className="whitespace-nowrap bg-white border-2 border-red-500 text-red-600 px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-red-500 hover:text-white transition-colors"
          >
            <Trash2 size={18} /> Elimina Account Core
          </button>
        </div>
      </div>

    </div>
  );
}
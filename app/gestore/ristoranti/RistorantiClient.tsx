/**
 * DESCRIZIONE PRELIMINARE:
 * `RistorantiClient` è il componente dinamico principale per la gestione
 * dei ristoranti da parte del gestore. Permette di visualizzare, aggiungere,
 * modificare ed eliminare i locali. Utilizza la tecnica del Server Actions
 * per recuperare i dati e salvare le modifiche. Gestisce la sincronizzazione 
 * locale dei dati dopo le modifiche e implementa un sistema di blocco con PIN 
 * per l'accesso e la modifica dei singoli ristoranti.
 */
'use client'; // Diciamo a Next.js che questo componente è interattivo e gira nel browser dell'utente

import React, { useState, useTransition, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// Importo un po' di icone da Lucide React per abbellire i bottoni e i campi
import {
  Plus, X, Store, MapPin, Phone, Mail, ChevronRight, KeyRound,
  FileText, Banknote, Loader2, AlertCircle, Pencil, Image as ImageIcon, Trash2,
  ShieldAlert, AlertTriangle
} from 'lucide-react';

// Importo le mie Server Actions: le funzioni che parlano direttamente col database (SQLite)
import { addRistorante, updateRistorante, Ristorante } from '@/app/actions/ristoranti';
import { verifyRestaurantPinAction } from '@/app/actions/auth';

// ─── CAMPI DEL FORM CONDIVISI (La regola del DRY: Don't Repeat Yourself) ──────
// Invece di scrivere tutto l'HTML del form due volte (una per creare, una per modificare),
// lo scrivo qui una volta sola. La prop "defaults" mi serve per pre-compilare i campi 
// se sto modificando un ristorante esistente.
function RistoranteFormFields({ defaults }: { defaults?: Partial<Ristorante> }) {
  return (
    <div className="overflow-y-auto px-6 py-5 space-y-4 flex-1">

      {/* Nome */}
      <div className="space-y-1.5">
        <label className="block text-xs font-bold text-gray-700 ml-1">
          Nome Ristorante <span className="text-[#D35400]">*</span>
        </label>
        <div className="relative">
          {/* Icona del negozio messa in posizione assoluta dentro l'input */}
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
            <Store size={15} />
          </div>
          <input
            name="nome" // Questo "name" è fondamentale: serve al FormData per prendere il valore da mandare al server!
            type="text"
            required
            defaultValue={defaults?.nome ?? ''} // Se c'è un nome di default usalo, altrimenti lascia la stringa vuota
            placeholder="Es: Trattoria da Mario"
            className="w-full bg-white border border-gray-200 rounded-xl py-2.5 pl-10 pr-3 focus:outline-none focus:ring-2 focus:ring-[#D35400] transition-shadow text-gray-900 text-sm"
          />
        </div>
      </div>

      {/* Indirizzo */}
      <div className="space-y-1.5">
        <label className="block text-xs font-bold text-gray-700 ml-1">
          Indirizzo <span className="text-[#D35400]">*</span>
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
            <MapPin size={15} />
          </div>
          <input
            name="indirizzo"
            type="text"
            required
            defaultValue={defaults?.indirizzo ?? ''}
            placeholder="Es: Via Roma 1, Milano"
            className="w-full bg-white border border-gray-200 rounded-xl py-2.5 pl-10 pr-3 focus:outline-none focus:ring-2 focus:ring-[#D35400] transition-shadow text-gray-900 text-sm"
          />
        </div>
      </div>

      {/* Foto Illustrativa - Caricamento Immagine */}
      <div className="space-y-1.5">
        <label className="block text-xs font-bold text-gray-700 ml-1">
          Foto Illustrativa Ristorante
        </label>

        <div className="flex flex-col gap-3">
          {/* Anteprima della foto attuale o placeholder grigio se non c'è */}
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 overflow-hidden flex items-center justify-center flex-shrink-0">
              {defaults?.foto_url ? (
                <img src={defaults.foto_url} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <ImageIcon size={24} className="text-gray-300" />
              )}
            </div>

            <div className="flex-1">
              <input
                name="foto"
                type="file" // Questo type=file fa comparire il bottone "Scegli file" del browser
                accept=".jpg,.jpeg,.png"
                className="block w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-[#fdf1e9] file:text-[#D35400] hover:file:bg-[#fae5d3] transition-all"
              />
              <p className="mt-1 text-[10px] text-gray-400">Formati accettati: JPG, PNG. Max 5MB.</p>
            </div>
          </div>

          {/* Logica per rimuovere la foto esistente. 
              Appare solo se il ristorante ha già una foto salvata. */}
          {defaults?.foto_url && (
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-2 text-xs text-red-600 font-medium cursor-pointer hover:bg-red-50 px-2 py-1 rounded-lg transition-colors">
                {/* Se questo checkbox è cliccato, il server saprà che deve cancellare l'immagine vecchia */}
                <input type="checkbox" name="removeFoto" value="true" className="rounded text-red-600 focus:ring-red-500" />
                <Trash2 size={14} />
                Rimuovi foto attuale
              </label>
            </div>
          )}
        </div>
      </div>

      {/* Telefono + Email (Messi su due colonne con grid-cols-2) */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-gray-700 ml-1">Telefono</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
              <Phone size={15} />
            </div>
            <input
              name="telefono"
              type="tel"
              defaultValue={defaults?.telefono ?? ''}
              placeholder="+39 02 0000000"
              className="w-full bg-white border border-gray-200 rounded-xl py-2.5 pl-10 pr-3 focus:outline-none focus:ring-2 focus:ring-[#D35400] transition-shadow text-gray-900 text-sm"
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-gray-700 ml-1">Email</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
              <Mail size={15} />
            </div>
            <input
              name="email"
              type="email"
              defaultValue={defaults?.email ?? ''}
              placeholder="info@ristorante.it"
              className="w-full bg-white border border-gray-200 rounded-xl py-2.5 pl-10 pr-3 focus:outline-none focus:ring-2 focus:ring-[#D35400] transition-shadow text-gray-900 text-sm"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-4">
        {/* Penale No-Show */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-gray-700 ml-1">Penale No-Show (€)</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
              <ShieldAlert size={15} />
            </div>
            <input
              type="number"
              name="penaleNoShow"
              step="0.01" // Importante per permettere di inserire i centesimi di euro!
              defaultValue={defaults?.penaleNoShow ?? 0}
              placeholder="0.00"
              className="w-full bg-white border border-gray-200 rounded-xl py-2.5 pl-10 pr-3 focus:outline-none focus:ring-2 focus:ring-[#D35400] transition-shadow text-gray-900 text-sm"
            />
          </div>
        </div>

        {/* PIN di Sicurezza (Il codice per "blindare" il ristorante) */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-[#781D2D] ml-1">PIN di Sicurezza Ristorante</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#781D2D]/60">
              <KeyRound size={15} />
            </div>
            <input
              name="pin"
              type="text"
              pattern="[0-9]*" // Serve per far aprire il tastierino numerico sui cellulari
              inputMode="numeric"
              maxLength={6}
              defaultValue={defaults?.pin ?? ''}
              placeholder="Es: 1234 (Opzionale)"
              className="w-full bg-white border border-gray-200 rounded-xl py-2.5 pl-10 pr-3 focus:outline-none focus:ring-2 focus:ring-[#781D2D] transition-shadow text-gray-900 text-sm font-mono tracking-widest"
            />
          </div>
        </div>
      </div>

      {/* Caparra */}
      <div className="space-y-1.5">
        <label className="block text-xs font-bold text-gray-700 ml-1">Caparra Richiesta (€)</label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
            <Banknote size={15} />
          </div>
          <input
            name="caparraRichiesta"
            type="number"
            min="0"
            step="0.01"
            defaultValue={defaults?.caparraRichiesta ?? ''}
            placeholder="0.00"
            className="w-full bg-white border border-gray-200 rounded-xl py-2.5 pl-10 pr-3 focus:outline-none focus:ring-2 focus:ring-[#D35400] transition-shadow text-gray-900 text-sm"
          />
        </div>
      </div>

      {/* Messaggio Penale (Area di testo per le regole) */}
      <div className="space-y-1.5">
        <label className="block text-xs font-bold text-gray-700 ml-1">Note Penale No-Show</label>
        <div className="relative">
          <div className="absolute top-3 left-0 pl-3.5 flex items-start pointer-events-none text-gray-400">
            <AlertTriangle size={15} />
          </div>
          <textarea
            name="messaggioPenale"
            rows={2}
            defaultValue={defaults?.messaggioPenale ?? ''}
            placeholder="Es: La penale viene applicata solo per prenotazioni nel weekend."
            className="w-full bg-white border border-gray-200 rounded-xl py-2.5 pl-10 pr-3 focus:outline-none focus:ring-2 focus:ring-[#D35400] transition-shadow text-gray-900 text-sm resize-none"
          />
        </div>
      </div>

      {/* Tipologia (Menù a tendina classico) */}
      <div className="space-y-1.5">
        <label className="block text-xs font-bold text-gray-700 ml-1">Tipologia Cucina</label>
        <select
          name="tipologia"
          defaultValue={defaults?.tipologia ?? 'Italiano'}
          className="w-full bg-white border border-gray-200 rounded-xl py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-[#D35400] transition-shadow text-gray-900 text-sm appearance-none"
        >
          <option value="Italiano">Italiano</option>
          <option value="Giapponese">Giapponese</option>
          <option value="Francese">Francese</option>
          <option value="Messicano">Messicano</option>
          <option value="Cinese">Cinese</option>
          <option value="Altro">Altro</option>
        </select>
      </div>
    </div>
  );
}

// ─── IL CONTENITORE DELLE MODALI (Wrapper) ────────────────────────────────────
// Questo è il "guscio" visivo dei pop-up (quello col vetro smerigliato dietro).
// Prende i children (i campi del form visti sopra) e li incapsula mettendoci un header e dei bottoni sotto.
function RistoranteModal({
  title,
  icon,
  submitLabel,
  isPending,
  error,
  onClose,
  onSubmit,
  formRef,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  submitLabel: string;
  isPending: boolean;
  error: string | null;
  onClose: () => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  formRef: React.RefObject<HTMLFormElement | null>;
  children: React.ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
      // Questo piccolo trick serve per chiudere la modale se l'utente clicca FUORI dal rettangolo bianco
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in slide-in-from-bottom-4 duration-300">

        {/* Header della Modale */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#fdf1e9] flex items-center justify-center">
              {icon}
            </div>
            <h2 className="text-lg font-extrabold text-gray-900">{title}</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 transition-colors text-gray-500">
            <X size={20} />
          </button>
        </div>

        {/* Banner di Errore. Compare solo se c'è un problema di rete o validazione dal server */}
        {error && (
          <div className="mx-6 mt-4 flex items-center gap-2 p-3.5 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm font-medium">
            <AlertCircle size={16} className="flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Corpo della form e i Children */}
        <form ref={formRef} onSubmit={onSubmit} className="flex flex-col flex-1 overflow-hidden">
          {children}

          {/* Footer coi Bottoni */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50/50">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-semibold text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors"
            >
              Annulla
            </button>
            <button
              type="submit"
              disabled={isPending} // Se sta caricando, spengo il bottone
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#D35400] to-[#781D2D] text-white text-sm font-bold rounded-xl hover:shadow-lg transition-all disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {/* Se sta caricando (isPending) mostro la rotellina che gira, altrimenti il testo normale */}
              {isPending && <Loader2 size={15} className="animate-spin" />}
              <span>{isPending ? 'Salvataggio...' : submitLabel}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── MODALE PER CREARE UN NUOVO RISTORANTE ────────────────────────────────────
function AddRistoranteModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  // DOMANDA DA ESAME: useTransition serve per fare operazioni asincrone (chiamate al server) 
  // senza bloccare la reattività di React. "isPending" ci dice se sta ancora caricando[cite: 4].
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); // Blocco il ricaricamento automatico della pagina che farebbe l'HTML base[cite: 4]

    // TRUCCO: Invece di creare mille variabili useState per ogni singolo input (nome, indirizzo, ecc.), 
    // "FormData" prende in automatico tutti i valori compilati nel form in un colpo solo![cite: 4]
    const formData = new FormData(e.currentTarget);
    setError(null);

    startTransition(async () => {
      // Chiamo la Server Action passandole tutto il pacchetto di dati[cite: 4]
      const result = await addRistorante(formData);
      if (!result.success) {
        setError(result.error ?? 'Errore sconosciuto.'); // Se va male, mostro l'errore[cite: 4]
      } else {
        formRef.current?.reset(); // Svuoto i campi se è andata bene
        onSuccess(); // Chiamo la funzione per chiudere la modale[cite: 4]
      }
    });
  }

  return (
    // Richiamo il "guscio" che abbiamo definito prima e ci inietto i campi vuoti
    <RistoranteModal
      title="Nuovo Ristorante"
      icon={<Store size={18} className="text-[#D35400]" />}
      submitLabel="Salva Ristorante"
      isPending={isPending}
      error={error}
      onClose={onClose}
      onSubmit={handleSubmit}
      formRef={formRef}
    >
      <RistoranteFormFields />
    </RistoranteModal>
  );
}

// ─── MODALE PER MODIFICARE UN RISTORANTE ESISTENTE ────────────────────────────
function EditRistoranteModal({
  ristorante,
  onClose,
  onSuccess,
}: {
  ristorante: Ristorante;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setError(null);
    startTransition(async () => {
      // Stessa logica di prima, ma questa volta chiamo l'azione updateRistorante
      // e le devo passare per forza anche l'ID del ristorante da modificare![cite: 4]
      const result = await updateRistorante(ristorante.idRistorante, formData);
      if (!result.success) {
        setError(result.error ?? 'Errore sconosciuto.');
      } else {
        onSuccess();
      }
    });
  }

  return (
    <RistoranteModal
      title="Modifica Ristorante"
      icon={<Pencil size={18} className="text-[#D35400]" />}
      submitLabel="Salva Modifiche"
      isPending={isPending}
      error={error}
      onClose={onClose}
      onSubmit={handleSubmit}
      formRef={formRef}
    >
      {/* Passo i vecchi dati alla form tramite "defaults" così i campi sono già compilati[cite: 4] */}
      <RistoranteFormFields defaults={ristorante} />
    </RistoranteModal>
  );
}

// ─── MODALE DI SICUREZZA (La richiesta del PIN) ────────────────────────────────
function PinPromptModal({
  idRistorante,
  onClose,
  onSuccess,
  error: initialError,
}: {
  idRistorante: number;
  onClose: () => void;
  onSuccess: () => void;
  error?: string | null;
}) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(initialError || null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // Protezione base: se il PIN è troppo corto, non faccio neanche la chiamata al server[cite: 4]
    if (pin.length < 4) {
      setError('Il PIN deve essere di almeno 4 cifre.');
      return;
    }

    setError(null);
    startTransition(async () => {
      // Chiamo il server per vedere se il PIN che ho scritto combacia col database[cite: 4]
      const result = await verifyRestaurantPinAction(idRistorante, pin);
      if (result.success) {
        onSuccess(); // Se combacia, chiamo onSuccess per farti passare![cite: 4]
      } else {
        setError(result.error || 'PIN non corretto.');
      }
    });
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl p-8 animate-in zoom-in-95 duration-300">
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#fdf1e9] flex items-center justify-center mb-6 text-[#781D2D]">
            <KeyRound size={32} />
          </div>
          <h2 className="text-2xl font-extrabold text-gray-900 mb-2">Inserisci il PIN</h2>
          <p className="text-gray-500 text-sm mb-8">
            Per accedere alla gestione del ristorante è richiesto il PIN di sicurezza.
          </p>

          {/* Effetto vibrazione (animate-shake) se sbagli il PIN[cite: 4] */}
          {error && (
            <div className="w-full mb-6 p-3 bg-red-50 border border-red-100 text-red-600 rounded-xl text-xs font-bold flex items-center gap-2 animate-shake">
              <AlertCircle size={14} />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="w-full space-y-6">
            <div className="flex justify-center gap-2">
              <input
                type="text"
                value={pin}
                // TRUCCO: Filtro "al volo" le lettere. Se l'utente digita delle lettere, 
                // la Regular Expression (/\D/g) le cancella all'istante, accettando solo numeri![cite: 4]
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                maxLength={6}
                placeholder="0000"
                autoFocus // Fa comparire subito la tastiera appena si apre la modale[cite: 4]
                className="w-full text-center text-4xl font-mono tracking-[0.3em] py-5 bg-white border-4 border-gray-900 rounded-2xl text-gray-900 focus:outline-none focus:ring-8 focus:ring-gray-100 transition-all shadow-lg"
              />
            </div>

            <div className="flex flex-col gap-3">
              <button
                type="submit"
                disabled={isPending || pin.length < 4}
                className="w-full py-4 bg-gradient-to-r from-[#D35400] to-[#781D2D] text-white font-bold rounded-2xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:transform-none"
              >
                {isPending ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Verifica e Accedi'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="w-full py-3 text-sm font-bold text-gray-400 hover:text-gray-600 transition-colors"
              >
                Annulla
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// ─── LA CARD DEL RISTORANTE ───────────────────────────────────────────────────
// Disegna fisicamente il "rettangolo" del singolo ristorante per metterlo nella griglia[cite: 4]
function RistoranteCard({
  ristorante,
  onEdit,
  onEnter,
}: {
  ristorante: Ristorante;
  onEdit: (r: Ristorante) => void;
  onEnter: (id: number) => void;
}) {
  return (
    <div className="group relative bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col">
      <div className="h-2 bg-gradient-to-r from-[#D35400] to-[#781D2D]" />
      <div className="p-6 flex flex-col flex-1">

        {/* Nome del ristorante e bottone matita */}
        <div className="flex items-start gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-[#fdf1e9] flex items-center justify-center flex-shrink-0">
            <Store size={22} className="text-[#D35400]" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-extrabold text-gray-900 leading-tight truncate">
              {ristorante.nome}
            </h2>
          </div>
          {/* Bottone per modificare (chiama la funzione onEdit passata dal padre)[cite: 4] */}
          <button
            onClick={() => onEdit(ristorante)}
            title="Modifica ristorante"
            className="p-2 rounded-xl text-gray-400 hover:text-[#D35400] hover:bg-[#fdf1e9] transition-colors flex-shrink-0"
          >
            <Pencil size={16} />
          </button>
        </div>

        {/* Dati vari: Indirizzo, Telefono, Email[cite: 4] */}
        <div className="space-y-2.5 flex-1">
          <div className="flex items-start gap-2.5 text-sm text-gray-600">
            <MapPin size={15} className="text-[#D35400] mt-0.5 flex-shrink-0" />
            <span>{ristorante.indirizzo}</span>
          </div>
          {ristorante.telefono && (
            <div className="flex items-center gap-2.5 text-sm text-gray-600">
              <Phone size={15} className="text-[#D35400] flex-shrink-0" />
              <span>{ristorante.telefono}</span>
            </div>
          )}
          {ristorante.email && (
            <div className="flex items-center gap-2.5 text-sm text-gray-600">
              <Mail size={15} className="text-[#D35400] flex-shrink-0" />
              <span className="truncate">{ristorante.email}</span>
            </div>
          )}
          {ristorante.caparraRichiesta != null && ristorante.caparraRichiesta > 0 && (
            <div className="flex items-center gap-2.5 text-sm text-gray-600">
              <Banknote size={15} className="text-[#D35400] flex-shrink-0" />
              <span>Caparra: €{ristorante.caparraRichiesta.toFixed(2)}</span>
            </div>
          )}
        </div>

        {/* Bottone CTA per Entrare nella Gestione (la Dashboard vera e propria)[cite: 4] */}
        <button
          onClick={() => onEnter(ristorante.idRistorante)}
          className="mt-6 w-full inline-flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-[#D35400] to-[#781D2D] text-white text-sm font-bold rounded-xl hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
        >
          Entra nella Gestione
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}

// ─── COMPONENTE PRINCIPALE (La Pagina che mette tutto assieme) ────────────────
export default function RistorantiClient({ initialData }: { initialData: Ristorante[] }) {
  // STATI: La memoria della pagina
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingRistorante, setEditingRistorante] = useState<Ristorante | null>(null);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);

  // Questo stato è importantissimo! Serve a ricordarsi l'Azione in Sospeso (pendingAction).
  // Se provo ad entrare ma mi blocca il PIN, mi salvo qui che volevo "entrare" ('enter')[cite: 4].
  const [pendingAction, setPendingAction] = useState<{ type: 'edit' | 'enter' | 'add', ristorante: Ristorante | null } | null>(null);

  const [isCheckingPin, setIsCheckingPin] = useState(false);
  const router = useRouter();

  function handleSuccess() {
    setShowAddModal(false);
    setEditingRistorante(null);
    router.refresh(); // Ricarico la pagina per vedere i dati aggiornati[cite: 4]
  }

  // Quando clicco su "Entra nella Gestione"
  async function handleEnterRequest(idRistorante: number) {
    const targetRes = initialData.find(r => r.idRistorante === idRistorante);
    if (!targetRes) return;

    // LA LOGICA DEL PIN: Se NON ha il pin, mi manda dritto alla dashboard[cite: 4].
    // Se ha il PIN, si segna che volevo "entrare" (pendingAction) e mi apre la modale del PIN![cite: 4]
    if (!targetRes.pin) {
      router.push(`/gestore/dashboard?ristorante=${idRistorante}`);
    } else {
      setPendingAction({ type: 'enter', ristorante: targetRes });
      setIsPinModalOpen(true);
    }
  }

  // Quando clicco la matita per modificare
  async function handleEditRequest(ristorante: Ristorante) {
    if (!ristorante.pin) {
      setEditingRistorante(ristorante);
    } else {
      // Come sopra, se c'è il PIN mi blocco e apro la modale[cite: 4]
      setPendingAction({ type: 'edit', ristorante });
      setIsPinModalOpen(true);
    }
  }

  async function handleAddRequest() {
    // Per aggiungere un nuovo ristorante apro la modale direttamente[cite: 4]
    setShowAddModal(true);
  }

  // Se l'utente inserisce il PIN corretto...
  function handlePinSuccess() {
    if (!pendingAction) return;

    // ...vado a guardare cosa voleva fare prima di essere bloccato e glielo lascio fare![cite: 4]
    if (pendingAction.type === 'enter' && pendingAction.ristorante) {
      router.push(`/gestore/dashboard?ristorante=${pendingAction.ristorante.idRistorante}`);
    } else if (pendingAction.type === 'edit' && pendingAction.ristorante) {
      setEditingRistorante(pendingAction.ristorante);
    } else if (pendingAction.type === 'add') {
      setShowAddModal(true);
    }

    setIsPinModalOpen(false);
    setPendingAction(null); // Svuoto la memoria dell'azione in sospeso[cite: 4]
  }

  return (
    <>
      {/* Intestazione Alta e Bottone per aggiungere un nuovo ristorante[cite: 4] */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 mb-10 border-b-2 border-[#F5CBA7] pb-6">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#781D2D] tracking-tight">
            I Miei Ristoranti
          </h1>
          <p className="mt-2 text-[#D35400] font-medium text-base">
            Seleziona un ristorante per accedere alla sua area di gestione.
          </p>
        </div>
        <button
          onClick={handleAddRequest}
          className="inline-flex items-center gap-2 px-6 py-3.5 bg-gradient-to-r from-[#D35400] to-[#781D2D] text-white text-sm font-bold rounded-xl shadow-md hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 whitespace-nowrap self-start sm:self-auto"
        >
          <Plus size={18} />
          Aggiungi Nuovo Ristorante
        </button>
      </div>

      {/* Condizione: Se l'utente non ha nessun ristorante (initialData.length è 0), gli mostro uno "Stato Vuoto"[cite: 4] */}
      {initialData.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-20 h-20 rounded-full bg-[#fae5d3] flex items-center justify-center mb-6">
            <Store size={36} className="text-[#D35400]" />
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Nessun ristorante trovato</h2>
          <p className="text-gray-500 max-w-sm mb-6">
            Non hai ancora registrato nessun ristorante. Inizia aggiungendone uno!
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-[#D35400] to-[#781D2D] text-white text-sm font-bold rounded-xl shadow-md hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200"
          >
            <Plus size={18} />
            Aggiungi il tuo primo ristorante
          </button>
        </div>
      ) : (
        // Altrimenti, stampo una Griglia e ci butto dentro le Card con un ciclo .map()[cite: 4]
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {initialData.map((r) => (
            <RistoranteCard
              key={r.idRistorante}
              ristorante={r}
              onEdit={handleEditRequest}
              onEnter={handleEnterRequest}
            />
          ))}
        </div>
      )}

      {/* Elenco delle modali (nascoste finché il loro stato non diventa True)[cite: 4] */}
      {showAddModal && (
        <AddRistoranteModal
          onClose={() => setShowAddModal(false)}
          onSuccess={handleSuccess}
        />
      )}

      {editingRistorante && (
        <EditRistoranteModal
          ristorante={editingRistorante}
          onClose={() => setEditingRistorante(null)}
          onSuccess={handleSuccess}
        />
      )}

      {isPinModalOpen && pendingAction?.ristorante && (
        <PinPromptModal
          idRistorante={pendingAction.ristorante.idRistorante}
          onClose={() => {
            setIsPinModalOpen(false);
            setPendingAction(null);
          }}
          onSuccess={handlePinSuccess}
        />
      )}

      {/* Overlay di caricamento mentre il server verifica il PIN[cite: 4] */}
      {isCheckingPin && (
        <div className="fixed inset-0 z-[100] bg-white/20 backdrop-blur-[2px] flex items-center justify-center">
          <Loader2 className="w-10 h-10 text-[#D35400] animate-spin" />
        </div>
      )}
    </>
  );
}
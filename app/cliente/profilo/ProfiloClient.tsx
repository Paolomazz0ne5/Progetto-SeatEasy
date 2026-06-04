"use client"; // Specifica che il componente viene renderizzato e idratato sul browser, abilitando hook e interattività

import React, { useState } from "react"; // Importa React e lo hook useState per la gestione degli stati locali
import { updateClientProfile, deleteClientAccount } from "@/app/actions/cliente"; // Importa le Server Actions per aggiornare o eliminare l'account nel DB
import { useRouter } from "next/navigation"; // Importa lo hook di Next.js per gestire la navigazione e il refresh programmatico delle rotte

// Dichiarazione dell'interfaccia TypeScript che definisce la struttura rigida dell'oggetto profilo cliente
export interface Profile {
  idAccount: number;
  nome: string;
  cognome: string;
  email: string;
  telefono: string | null;
  metodoPagamentoPredefinito: string | null;
  dataCreazione: string;
}

// Componente principale che accetta come proprietà (prop) l'oggetto 'profile' ereditato dal Server Component padre
export default function ProfiloClient({ profile }: { profile: Profile }) {
  const [isEditing, setIsEditing] = useState(false); // Stato booleano per alternare la visualizzazione tra testo fisso e campi di input
  const [loading, setLoading] = useState(false); // Stato booleano per tracciare il caricamento durante le chiamate asincrone (mostra lo spinner)
  const [message, setMessage] = useState({ type: "", text: "" }); // Stato per gestire i banner di notifica di successo o errore
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false); // Stato booleano per controllare l'apertura/chiusura del pop-up di eliminazione account
  const router = useRouter(); // Inizializza l'istanza del router di Next.js

  // Stato oggetto che memorizza i dati temporanei digitati dall'utente all'interno del form, inizializzato con i dati attuali del profilo
  const [formData, setFormData] = useState({
    nome: profile.nome,
    cognome: profile.cognome,
    email: profile.email,
    telefono: profile.telefono || "",
    metodoPagamentoPredefinito: profile.metodoPagamentoPredefinito || "",
  });

  // Funzione universale per gestire i cambiamenti nei campi di testo (input e textarea), aggiornando dinamicamente lo stato locale formData
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Funzione asincrona scatenata dall'invio (submit) del form di aggiornamento profilo
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // Impedisce il comportamento predefinito del browser di ricaricare l'intera pagina
    setLoading(true); // Attiva lo stato di caricamento per disabilitare i pulsanti ed evitare click multipli
    setMessage({ type: "", text: "" }); // Resetta eventuali messaggi di errore o successo precedenti

    const res = await updateClientProfile(formData); // Invia i dati aggregati alla Server Action che scrive sul database
    if (res.success) {
      setMessage({ type: "success", text: "Profilo aggiornato con successo!" }); // Mostra il banner verde di successo
      setIsEditing(false); // Chiude la modalità di modifica tornando alla visualizzazione testuale
      router.refresh(); // Forza Next.js a rivalidare i Server Components per mostrare i dati aggiornati nella Navbar o altrove
    } else {
      setMessage({ type: "error", text: res.error || "Errore durante l'aggiornamento." }); // Mostra il banner rosso di errore
    }
    setLoading(false); // Disattiva lo stato di caricamento al termine dell'operazione
  };

  // Funzione asincrona associata al pulsante finale del modal per cancellare definitivamente l'account
  const handleDeleteAccount = async () => {
    setLoading(true); // Attiva lo spinner sul pulsante di cancellazione
    const res = await deleteClientAccount(); // Esegue la Server Action che cancella la riga dal DB e distrugge la sessione
    if (res.success) {
      router.push("/auth"); // Se ha successo, reindirizza l'utente alla schermata di login/registrazione
    } else {
      setMessage({ type: "error", text: res.error || "Impossibile eliminare l'account." }); // Gestisce l'anomalia mostrando l'errore
      setShowDeleteConfirm(false); // Chiude il modal di conferma per rimettere in primo piano la schermata
    }
    setLoading(false); // Spegne lo stato di loading
  };

  return (
    <div className="max-w-4xl mx-auto px-4">
      <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-[#F5CBA7]/30">

        {/* Header superiore del profilo: mostra le iniziali del nome/cognome e la data di iscrizione */}
        <div className="bg-gradient-to-r from-[#781D2D] to-[#A0283D] p-8 md:p-12 text-white relative">
          <div className="flex flex-col md:flex-row items-center md:items-end gap-6">
            {/* Avatar circolare generato combinando i primi caratteri dell'oggetto profile */}
            <div className="w-24 h-24 md:w-32 md:h-32 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border-4 border-white/30 text-4xl font-bold">
              {profile.nome[0]}{profile.cognome[0]}
            </div>
            <div className="text-center md:text-left">
              <h1 className="text-3xl md:text-4xl font-bold">{profile.nome} {profile.cognome}</h1>
              <p className="text-white/80 mt-2">Membro dal {new Date(profile.dataCreazione).toLocaleDateString('it-IT', { year: 'numeric', month: 'long' })}</p>
            </div>
          </div>
          {/* Pulsante assoluto che inverte lo stato booleano isEditing per attivare/disattivare i campi di testo */}
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="absolute top-8 right-8 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/30 px-6 py-2 rounded-full transition-all flex items-center gap-2 font-semibold"
          >
            {isEditing ? (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                Annulla
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /><path d="m15 5 4 4" /></svg>
                Modifica
              </>
            )}
          </button>
        </div>

        {/* Corpo principale del modulo */}
        <div className="p-8 md:p-12">
          {/* Rendering condizionale delle notifiche: mostra il banner informativo solo se contiene del testo */}
          {message.text && (
            <div className={`mb-8 p-4 rounded-xl flex items-center gap-3 ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
              {message.type === 'success' ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" x2="12" y1="8" y2="12" /><line x1="12" x2="12.01" y1="16" y2="16" /></svg>
              )}
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid md:grid-cols-2 gap-8">

              {/* Campo Nome: se isEditing è vero mostra l'input modificabile legato allo stato locale, altrimenti mostra testo statico */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-[#781D2D]/60 uppercase tracking-wider">Nome</label>
                {isEditing ? (
                  <input
                    type="text"
                    name="nome"
                    value={formData.nome}
                    onChange={handleChange}
                    className="w-full bg-[#FFFDFB] border border-[#F5CBA7] rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#781D2D] focus:border-transparent transition-all outline-none"
                    required
                  />
                ) : (
                  <p className="text-lg font-medium text-[#2D1B1E]">{profile.nome}</p>
                )}
              </div>

              {/* Campo Cognome */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-[#781D2D]/60 uppercase tracking-wider">Cognome</label>
                {isEditing ? (
                  <input
                    type="text"
                    name="cognome"
                    value={formData.cognome}
                    onChange={handleChange}
                    className="w-full bg-[#FFFDFB] border border-[#F5CBA7] rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#781D2D] focus:border-transparent transition-all outline-none"
                    required
                  />
                ) : (
                  <p className="text-lg font-medium text-[#2D1B1E]">{profile.cognome}</p>
                )}
              </div>

              {/* Campo Email */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-[#781D2D]/60 uppercase tracking-wider">Email</label>
                {isEditing ? (
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full bg-[#FFFDFB] border border-[#F5CBA7] rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#781D2D] focus:border-transparent transition-all outline-none"
                    required
                  />
                ) : (
                  <p className="text-lg font-medium text-[#2D1B1E]">{profile.email}</p>
                )}
              </div>

              {/* Campo Telefono */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-[#781D2D]/60 uppercase tracking-wider">Telefono</label>
                {isEditing ? (
                  <input
                    type="tel"
                    name="telefono"
                    value={formData.telefono}
                    onChange={handleChange}
                    className="w-full bg-[#FFFDFB] border border-[#F5CBA7] rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#781D2D] focus:border-transparent transition-all outline-none"
                  />
                ) : (
                  <p className="text-lg font-medium text-[#2D1B1E]">{profile.telefono || "Non specificato"}</p>
                )}
              </div>
            </div>

            {/* Sezione di selezione del metodo di pagamento preferito */}
            <div className="space-y-4">
              <label className="text-sm font-bold text-[#781D2D]/60 uppercase tracking-wider">Metodo di Pagamento Predefinito</label>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {[
                  { id: 'Apple Pay', name: 'Apple Pay', icon: '🍎' },
                  { id: 'Google Pay', name: 'Google Pay', icon: '🔍' },
                  { id: 'Revolut', name: 'Revolut', icon: 'R' },
                  { id: 'PayPal', name: 'PayPal', icon: 'P' },
                  { id: 'Card', name: 'Carta', icon: '💳' }
                ].map((method) => (
                  <button
                    key={method.id}
                    type="button"
                    // Permette il click e l'aggiornamento dello stato solo se la pagina si trova in modalità di modifica attiva
                    onClick={() => {
                      if (isEditing) {
                        setFormData({ ...formData, metodoPagamentoPredefinito: method.id });
                      }
                    }}
                    // Disabilita il bottone visivamente se non siamo in modifica e questo elemento non è la scelta salvata
                    disabled={!isEditing && formData.metodoPagamentoPredefinito !== method.id}
                    className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all ${formData.metodoPagamentoPredefinito === method.id
                        ? 'border-[#781D2D] bg-[#781D2D]/5 text-[#781D2D] shadow-inner'
                        : isEditing
                          ? 'border-[#F5CBA7]/30 bg-white text-gray-400 hover:border-[#F5CBA7]'
                          : 'hidden' // Nasconde completamente i pulsanti non selezionati se la schermata è in modalità di sola lettura
                      }`}
                  >
                    <span className="text-2xl mb-2">{method.icon}</span>
                    <span className="text-[10px] font-bold uppercase tracking-tight">{method.name}</span>
                  </button>
                ))}
              </div>
              {/* Messaggio di avviso visibile se l'utente non ha impostato alcuna preferenza finanziaria */}
              {!isEditing && !formData.metodoPagamentoPredefinito && (
                <p className="text-lg font-medium text-[#2D1B1E] leading-relaxed bg-[#F5CBA7]/10 p-6 rounded-2xl border border-[#F5CBA7]/20 italic">
                  Nessun metodo di pagamento predefinito selezionato.
                </p>
              )}
            </div>

            {/* Pulsante di salvataggio visibile solo in modalità modifica */}
            {isEditing && (
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full md:w-auto bg-[#781D2D] text-white px-10 py-4 rounded-full font-bold hover:bg-[#5f1723] transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {/* Icona circolare animata (spinner) visibile solo durante l'attesa asincrona del server */}
                  {loading && <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>}
                  Salva Modifiche
                </button>
              </div>
            )}
          </form>

          {/* Area ad alto rischio (Danger Zone) per l'eliminazione permanente del profilo */}
          <div className="mt-16 pt-8 border-t border-[#F5CBA7]/30">
            <h2 className="text-xl font-bold text-[#781D2D] mb-4">Attenzione!</h2>
            <p className="text-[#2D1B1E]/60 mb-6">Una volta eliminato il tuo account, non potrai più recuperare le tue prenotazioni e i tuoi dati.</p>
            <button
              onClick={() => setShowDeleteConfirm(true)} // Apre il modal di conferma impostando a true lo stato dedicato
              className="text-[#781D2D] font-bold hover:text-red-700 transition-colors flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /><line x1="10" x2="10" y1="11" y2="17" /><line x1="14" x2="14" y1="11" y2="17" /></svg>
              Elimina il mio account definitivamente
            </button>
          </div>
        </div>
      </div>

      {/* Modal di Conferma Eliminazione (Pop-up bloccante a schermo intero renderizzato condizionalmente) */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl scale-in-center border border-[#F5CBA7]/30">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 9-6 6" /><path d="m9 9 6 6" /><circle cx="12" cy="12" r="10" /></svg>
            </div>
            <h3 className="text-2xl font-bold text-center text-[#2D1B1E] mb-2">Sei assolutamente sicuro?</h3>
            <p className="text-center text-[#2D1B1E]/60 mb-8">
              Questa azione è irreversibile. Tutte le tue prenotazioni future verranno cancellate.
            </p>
            <div className="flex flex-col gap-3">
              {/* Bottone distruttivo finale */}
              <button
                onClick={handleDeleteAccount}
                disabled={loading}
                className="w-full bg-red-600 text-white py-4 rounded-full font-bold hover:bg-red-700 transition-all flex items-center justify-center gap-2"
              >
                {loading && <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>}
                Sì, elimina definitivamente
              </button>
              {/* Bottone di annullamento: chiude il modal resettando lo stato booleano a false */}
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="w-full bg-[#F5CBA7]/20 text-[#781D2D] py-4 rounded-full font-bold hover:bg-[#F5CBA7]/30 transition-all"
              >
                Annulla
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
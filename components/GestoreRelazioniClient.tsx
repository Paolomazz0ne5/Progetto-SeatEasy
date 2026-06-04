/**
 * DESCRIZIONE PRELIMINARE:
 * Il componente `GestoreRelazioniClient` funge da mini-CRM per il ristoratore.
 * È diviso in due schede: "Recensioni" per leggere i feedback storici dei 
 * clienti (con il calcolo matematico dinamico del voto medio) e "Automazioni", 
 * che offre un'interfaccia a interruttori per configurare l'invio automatico 
 * di email o SMS (es. conferme, promemoria anti No-Show, richieste feedback).
 * Il suo scopo è gestire la comunicazione col cliente per fidelizzarlo.
 */
'use client';
import React, { useState } from 'react';

import { Star, Settings, ToggleLeft, ToggleRight, Mail, MessageSquare, BellRing } from 'lucide-react';

// Spiego a TypeScript com'è fatta una Recensione che arriva dal database
export type Review = {
  idRecensione: number;
  punteggio: number; // Le classiche stelline (da 1 a 5)
  testo: string; // Quello che ha scritto il cliente
  dataCreazione: string;
  clienteNome: string;
  clienteCognome: string;
};

// Qui inizia il componente vero e proprio. Come "prop" riceve la lista delle recensioni dal server.
export default function GestoreRelazioniClient({
  reviews
}: {
  reviews: Review[]; // Ricevo la lista delle recensioni dal server
}) {

  // --- STATI (LA MEMORIA DELLA PAGINA) ---

  // Mi salvo su quale scheda mi trovo: 'recensioni' (la home di questa pagina) oppure 'automazioni'
  const [activeTab, setActiveTab] = useState<'automazioni' | 'recensioni'>('recensioni');

  // Questi sono gli stati per gli "Interruttori" delle automazioni (MOCKUP / Simulazione)
  // Per l'esame: per ora sono solo interruttori visivi finti (non salvano nel DB), 
  // servono a far vedere come sarà la grafica finale dell'invio automatico!
  const [autoConf, setAutoConf] = useState(true); // Interruttore per l'email di conferma
  const [autoRemind, setAutoRemind] = useState(true); // Interruttore per il promemoria
  const [autoReview, setAutoReview] = useState(false); // Interruttore per chiedere recensioni

  // Interruttori per scegliere da dove mandare i messaggi
  const [useEmail, setUseEmail] = useState(true);
  const [useSMS, setUseSMS] = useState(false);

  // ==========================================
  // INIZIO DELLA GRAFICA DELLA PAGINA (JSX)
  // ==========================================
  return (
    <div className="w-full flex flex-col min-h-[60vh]">

      {/* LA BARRA IN ALTO (I due pulsanti per cambiare scheda) */}
      <div className="flex bg-white/60 p-2 rounded-2xl shadow-sm border border-[#F5CBA7]/50 mb-8 mx-auto w-full max-w-md backdrop-blur-md">

        {/* Pulsante RECENSIONI */}
        <button
          onClick={() => setActiveTab('recensioni')} // Se ci clicco, cambio lo stato e vado alle recensioni
          // Se activeTab è 'recensioni', lo coloro di rosso, altrimenti lo lascio bianco (trasparente)
          className={`flex-1 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${activeTab === 'recensioni' ? 'bg-[#781D2D] text-white shadow-md' : 'text-[#781D2D] hover:bg-[#FDF1E9]'
            }`}
        >
          <Star size={18} /> Recensioni {/* Uso un approccio "declarative". Decido solo come appariranno i pulsanti in base allo stato (activeTab), e lascio al sistema di rendering (React) il compito di mostrarli a schermo */}
        </button>

        {/* Pulsante AUTOMAZIONI */}
        <button
          onClick={() => setActiveTab('automazioni')} // Se ci clicco, vado alle automazioni
          className={`flex-1 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${activeTab === 'automazioni' ? 'bg-[#D35400] text-white shadow-md' : 'text-[#D35400] hover:bg-[#FDF1E9]'
            }`}
        >
          <Settings size={18} /> Automazioni
        </button>
      </div>

      {/* ---------------------------------------------------- */}
      {/* SCHEDA 1: AUTOMAZIONI (La vedo solo se ho cliccato su Automazioni) */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'automazioni' && (
        <div className="max-w-4xl mx-auto w-full grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

          {/* BOX DI SINISTRA: Configurazione dei messaggi */}
          <div className="bg-white/80 rounded-3xl border border-[#F5CBA7]/50 shadow-sm p-8 flex flex-col">
            <h3 className="font-extrabold text-[#781D2D] text-xl flex items-center gap-2 mb-8">
              <BellRing size={22} className="text-[#D35400]" /> Notifiche Automatiche
            </h3>

            <div className="space-y-8 flex-1">

              {/* Interruttore 1: Conferma Prenotazione */}
              <div className="flex items-start justify-between gap-6 p-4 rounded-2xl hover:bg-[#FDF1E9]/30 transition-colors">
                <div className="flex-1">
                  <h4 className="font-bold text-gray-800 text-base">Conferma Prenotazione</h4>
                  <p className="text-sm text-gray-500 mt-1">Invia automaticamente una notifica via Email appena il tavolo viene confermato.</p>
                </div>
                {/* Quando clicco l'interruttore, inverto il valore dello stato (da vero a falso e viceversa) usando !autoConf */}
                <button onClick={() => setAutoConf(!autoConf)} className={`transition-colors flex-shrink-0 ${autoConf ? 'text-green-500' : 'text-gray-300'}`}>
                  {autoConf ? <ToggleRight size={44} /> : <ToggleLeft size={44} />}
                </button>
              </div>

              {/* Interruttore 2: Promemoria contro i No-Show */}
              <div className="flex items-start justify-between gap-6 p-4 rounded-2xl hover:bg-[#FDF1E9]/30 transition-colors">
                <div className="flex-1">
                  <h4 className="font-bold text-gray-800 text-base">Promemoria 24h prima</h4>
                  <p className="text-sm text-gray-500 mt-1">Invia un avviso per ricordare l'appuntamento e ridurre i No-Show.</p>
                </div>
                <button onClick={() => setAutoRemind(!autoRemind)} className={`transition-colors flex-shrink-0 ${autoRemind ? 'text-green-500' : 'text-gray-300'}`}>
                  {autoRemind ? <ToggleRight size={44} /> : <ToggleLeft size={44} />}
                </button>
              </div>

              {/* Interruttore 3: Richiesta Recensione (Feedback) */}
              <div className="flex items-start justify-between gap-6 p-4 rounded-2xl hover:bg-[#FDF1E9]/30 transition-colors">
                <div className="flex-1">
                  <h4 className="font-bold text-gray-800 text-base">Richiesta Feedback</h4>
                  <p className="text-sm text-gray-500 mt-1">Invia un invito a lasciare una recensione 12 ore dopo la fine del servizio.</p>
                </div>
                <button onClick={() => setAutoReview(!autoReview)} className={`transition-colors flex-shrink-0 ${autoReview ? 'text-green-500' : 'text-gray-300'}`}>
                  {autoReview ? <ToggleRight size={44} /> : <ToggleLeft size={44} />}
                </button>
              </div>
            </div>
          </div>

          {/* BOX DI DESTRA: Scegliere se mandare Email o SMS */}
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-[#781D2D] to-[#5f1723] rounded-3xl p-8 text-white shadow-xl">
              <h3 className="font-extrabold text-xl mb-6">Canali di Invio</h3>

              <div className="space-y-6">
                {/* Sezione EMAIL */}
                {/* Se useEmail è vero, coloro il bordo di bianco, sennò lo faccio scuro e mezzo trasparente */}
                <div className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${useEmail ? 'bg-white/20 border-white/30' : 'bg-black/10 border-white/5 opacity-60'}`}>
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                    <Mail size={20} />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold">Email Standard</p>
                    <p className="text-xs text-white/60">Sempre attiva, inclusa nel piano.</p>
                  </div>
                  <button onClick={() => setUseEmail(!useEmail)} className={`transition-colors ${useEmail ? 'text-green-400' : 'text-white/40'}`}>
                    {useEmail ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
                  </button>
                </div>

                {/* Sezione SMS */}
                <div className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${useSMS ? 'bg-white/20 border-white/30' : 'bg-black/10 border-white/5 opacity-60'}`}>
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                    <MessageSquare size={20} />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold">SMS Gateway</p>
                    <p className="text-xs text-white/60">Invia notifiche via SMS ai numeri mobili.</p>
                  </div>
                  <button onClick={() => setUseSMS(!useSMS)} className={`transition-colors ${useSMS ? 'text-green-400' : 'text-white/40'}`}>
                    {useSMS ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
                  </button>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-white/10 text-sm text-white/70 italic">
                I messaggi vengono generati dal sistema usando i dati della prenotazione e inviati senza intervento manuale.
              </div>
            </div>

            {/* Un piccolo banner di suggerimento per abbellire la pagina */}
            <div className="bg-[#FDF1E9] border border-[#F5CBA7] rounded-3xl p-6">
              <h4 className="font-bold text-[#781D2D] mb-2 flex items-center gap-2">
                <Star size={16} className="text-[#D35400]" /> Suggerimento
              </h4>
              <p className="text-sm text-[#781D2D]/80 leading-relaxed font-medium">
                Le automazioni sono il modo migliore per mantenere un rapporto con il cliente senza perdere tempo in chat manuali.
              </p>
            </div>
          </div>

        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* SCHEDA 2: RECENSIONI (La vedo solo se ho cliccato su Recensioni) */}
      {/* ---------------------------------------------------- */}
      {activeTab === 'recensioni' && (
        <div className="bg-white/80 rounded-3xl border border-[#F5CBA7]/50 shadow-sm p-6 md:p-10 flex-1 max-w-4xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500">

          {/* HEADER DELLE RECENSIONI (Titolo e Voto Medio) */}
          <div className="flex justify-between items-end mb-8 border-b border-[#F5CBA7]/30 pb-4">
            <div>
              <h3 className="text-2xl font-extrabold text-[#781D2D]">Recensioni Ottenute</h3>
              <p className="text-[#D35400] text-sm font-medium mt-1">Cosa dicono i tuoi clienti della loro esperienza.</p>
            </div>

            {/* Riquadro col calcolo matematico del Voto Medio */}
            <div className="bg-[#781D2D] text-white px-5 py-3 rounded-2xl flex items-center gap-3 shadow-md">
              {/* TRUCCO MATEMATICO (reduce): 
                     Se ho almeno una recensione, sommo tutti i punteggi (acc + r.punteggio) e divido per il totale delle recensioni. 
                     Poi uso toFixed(1) per tenere solo un numero dopo la virgola (es. 4.5) 
                 */}
              <div className="text-3xl font-black">{reviews.length > 0 ? (reviews.reduce((acc, r) => acc + r.punteggio, 0) / reviews.length).toFixed(1) : 'N/A'}</div>
              <div className="text-xs font-medium opacity-80 uppercase tracking-widest leading-tight">Voto<br />Medio</div>
            </div>
          </div>

          {/* LISTA DELLE RECENSIONI SCORREVOLE (Scrollbar) */}
          <div className="space-y-6 overflow-y-auto max-h-[600px] pr-2 custom-scrollbar">

            {/* Se l'array delle recensioni è vuoto, stampo un messaggio */}
            {reviews.length === 0 ? (
              <div className="text-center py-20 bg-gray-50 rounded-3xl italic text-gray-400">Nessuna recensione ancora registrata nel sistema.</div>
            ) : (
              // Se ci sono recensioni, faccio un ciclo (.map) e per ognuna disegno questo blocco qua sotto
              reviews.map(review => (
                <div key={review.idRecensione} className="bg-[#FFFDFB] border border-gray-100 p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow relative">

                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">

                      {/* PALLINO CON LE INIZIALI: Prendo la primissima lettera (charAt(0)) del nome e del cognome */}
                      <div className="w-12 h-12 bg-gradient-to-tr from-[#D35400] to-[#E74C3C] text-white rounded-full flex items-center justify-center font-bold text-lg shadow-inner">
                        {review.clienteNome.charAt(0)}{review.clienteCognome.charAt(0)}
                      </div>

                      {/* Nome completo e Data Formattata (in italiano) */}
                      <div>
                        <h4 className="font-bold text-[#781D2D] text-lg">{review.clienteNome} {review.clienteCognome}</h4>
                        <span className="text-xs text-gray-400">{new Date(review.dataCreazione).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                      </div>
                    </div>

                    {/* DISEGNO LE STELLINE GIALLLE */}
                    <div className="flex gap-1" title={`${review.punteggio} stelle`}>
                      {/* Creo un array finto di 5 posti per stampare esattamente 5 stelle.
                           Se l'indice (i) è minore del punteggio del cliente, la coloro di giallo, sennò la lascio grigia.
                       */}
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          size={20}
                          className={i < review.punteggio ? 'fill-[#f59e0b] text-[#f59e0b]' : 'fill-gray-200 text-gray-200'}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Testo effettivo della recensione (messo tra virgolette e in corsivo) */}
                  <p className="text-gray-700 leading-relaxed italic font-medium">"{review.testo}"</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}

    </div>
  );
}

'use client';

import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Star, Send, Settings, ToggleLeft, ToggleRight, UserCircle2 } from 'lucide-react';
import { sendChatMessage } from '@/app/actions/relazioni';

export type Review = {
  idRecensione: number;
  punteggio: number;
  testo: string;
  dataCreazione: string;
  clienteNome: string;
  clienteCognome: string;
};

export type ChatContact = {
  idPrenotazione: number;
  clienteNome: string;
  clienteCognome: string;
  messages: ChatMessage[];
};

export type ChatMessage = {
  idNotifica: number;
  messaggio: string;
  statoInvio: string; // 'InviatoDaCliente' | 'InviatoDaGestore'
  dataInvio: string;
};

export default function GestoreRelazioniClient({
  reviews,
  chats
}: {
  reviews: Review[];
  chats: ChatContact[];
}) {
  const [activeTab, setActiveTab] = useState<'messaggi' | 'recensioni'>('messaggi');
  
  // Chat State
  const [activeChatId, setActiveChatId] = useState<number | null>(chats.length > 0 ? chats[0].idPrenotazione : null);
  const [messageInput, setMessageInput] = useState('');
  const [sending, setSending] = useState(false);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // Automation Settings Mocks
  const [autoConf, setAutoConf] = useState(true);
  const [autoRemind, setAutoRemind] = useState(true);
  const [autoReview, setAutoReview] = useState(false);

  const activeChat = chats.find(c => c.idPrenotazione === activeChatId);

  // Scroll to bottom of chat when it changes or a new message arrives
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [activeChatId, chats]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !activeChatId) return;
    
    setSending(true);
    await sendChatMessage(activeChatId, messageInput.trim());
    setMessageInput('');
    setSending(false);
    window.location.reload(); // Using reload for simplicity to trigger Server Action re-fetch
  };

  return (
    <div className="w-full flex flex-col min-h-[70vh]">
      
      {/* TABS HEADER */}
      <div className="flex bg-white/60 p-2 rounded-2xl shadow-sm border border-[#F5CBA7]/50 mb-6 mx-auto w-full max-w-md backdrop-blur-md">
        <button 
          onClick={() => setActiveTab('messaggi')}
          className={`flex-1 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
            activeTab === 'messaggi' ? 'bg-[#781D2D] text-white shadow-md' : 'text-[#781D2D] hover:bg-[#FDF1E9]'
          }`}
        >
          <MessageSquare size={18} /> Messaggi
        </button>
        <button 
          onClick={() => setActiveTab('recensioni')}
          className={`flex-1 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
            activeTab === 'recensioni' ? 'bg-[#D35400] text-white shadow-md' : 'text-[#D35400] hover:bg-[#FDF1E9]'
          }`}
        >
          <Star size={18} /> Recensioni
        </button>
      </div>

      {/* --- TAB: MESSAGGI --- */}
      {activeTab === 'messaggi' && (
        <div className="flex flex-col lg:flex-row gap-6 h-full flex-1 min-h-[600px]">
          
          {/* Contacts List */}
          <div className="w-full lg:w-1/4 bg-white/80 rounded-3xl border border-[#F5CBA7]/50 shadow-sm overflow-hidden flex flex-col">
            <div className="p-5 border-b border-[#F5CBA7]/30 bg-gradient-to-br from-[#FDF1E9]/50 to-white">
              <h3 className="font-extrabold text-[#781D2D] text-lg">Conversazioni</h3>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {chats.length === 0 ? (
                <p className="text-center text-sm text-gray-400 p-4">Nessuna conversazione attiva.</p>
              ) : chats.map(chat => (
                <button
                  key={chat.idPrenotazione}
                  onClick={() => setActiveChatId(chat.idPrenotazione)}
                  className={`w-full text-left p-4 rounded-2xl flex items-center gap-3 transition-colors ${
                    activeChatId === chat.idPrenotazione ? 'bg-[#781D2D] text-white shadow-md' : 'hover:bg-[#FDF1E9] text-[#781D2D]'
                  }`}
                >
                  <UserCircle2 size={36} className={activeChatId === chat.idPrenotazione ? 'text-white/80' : 'text-[#D35400]/60'} />
                  <div className="flex-1 overflow-hidden">
                    <p className="font-bold truncate">{chat.clienteNome} {chat.clienteCognome}</p>
                    <p className={`text-xs truncate ${activeChatId === chat.idPrenotazione ? 'text-white/70' : 'text-gray-500'}`}>
                      {chat.messages.length > 0 ? chat.messages[chat.messages.length-1].messaggio : 'Nessun messaggio'}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Active Chat */}
          <div className="w-full lg:w-2/4 bg-white/80 rounded-3xl border border-[#F5CBA7]/50 shadow-sm flex flex-col overflow-hidden relative">
            {activeChat ? (
              <>
                <div className="p-5 border-b border-[#F5CBA7]/30 bg-white/90 backdrop-blur-md z-10 flex items-center gap-3">
                  <UserCircle2 size={32} className="text-[#D35400]" />
                  <h3 className="font-bold text-[#781D2D] text-lg">{activeChat.clienteNome} {activeChat.clienteCognome}</h3>
                </div>
                
                <div ref={chatScrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#FFFDFB]/60 relative">
                  {/* Watermark bg */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
                    <MessageSquare size={150} />
                  </div>

                  {activeChat.messages.length === 0 ? (
                    <p className="text-center text-gray-400 italic mt-10">Inizia la conversazione...</p>
                  ) : activeChat.messages.map(msg => {
                    const isManager = msg.statoInvio === 'InviatoDaGestore';
                    return (
                      <div key={msg.idNotifica} className={`flex ${isManager ? 'justify-end' : 'justify-start'}`}>
                        <div className={`relative max-w-[75%] px-5 py-3 rounded-2xl shadow-sm ${
                          isManager 
                          ? 'bg-gradient-to-br from-[#781D2D] to-[#5f1723] text-white rounded-tr-sm' 
                          : 'bg-white border border-gray-200 text-gray-800 rounded-tl-sm'
                        }`}>
                          <p className="text-sm leading-relaxed">{msg.messaggio}</p>
                          <span className={`text-[10px] mt-1 block text-right ${isManager ? 'text-white/60' : 'text-gray-400'}`}>
                            {new Date(msg.dataInvio).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>

                <form onSubmit={handleSendMessage} className="p-4 border-t border-[#F5CBA7]/30 bg-white flex gap-3 items-end">
                  <textarea 
                     value={messageInput}
                     onChange={(e) => setMessageInput(e.target.value)}
                     placeholder="Scrivi un messaggio al cliente..."
                     className="flex-1 bg-gray-50 border border-gray-200 rounded-2xl p-4 focus:outline-none focus:ring-2 focus:ring-[#D35400] resize-none text-sm"
                     rows={2}
                     onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(e); } }}
                  />
                  <button 
                    disabled={sending || !messageInput.trim()}
                    className="p-4 bg-[#D35400] text-white rounded-2xl hover:bg-[#ba4a00] transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                  >
                    <Send size={20} />
                  </button>
                </form>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                <Settings size={64} className="opacity-20 mb-4" />
                <p>Seleziona una conversazione per iniziare</p>
              </div>
            )}
          </div>

          {/* Automations Config */}
          <div className="w-full lg:w-1/4 bg-[#FFFDFB]/80 rounded-3xl border border-[#F5CBA7]/50 shadow-sm p-6">
            <h3 className="font-extrabold text-[#781D2D] text-lg flex items-center gap-2 mb-6">
              <Settings size={20} /> Automazioni
            </h3>
            
            <div className="space-y-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h4 className="font-bold text-gray-800 text-sm">Conferma Immediata</h4>
                  <p className="text-xs text-gray-500 mt-1">Invia ricevuta alla prenotazione.</p>
                </div>
                <button onClick={() => setAutoConf(!autoConf)} className={`transition-colors ${autoConf ? 'text-green-500' : 'text-gray-300'}`}>
                  {autoConf ? <ToggleRight size={36} /> : <ToggleLeft size={36} />}
                </button>
              </div>

              <div className="flex items-start justify-between gap-4">
                <div>
                  <h4 className="font-bold text-gray-800 text-sm">Promemoria 24h</h4>
                  <p className="text-xs text-gray-500 mt-1">Abbassa i No-Show ricordando i tavoli.</p>
                </div>
                <button onClick={() => setAutoRemind(!autoRemind)} className={`transition-colors ${autoRemind ? 'text-green-500' : 'text-gray-300'}`}>
                  {autoRemind ? <ToggleRight size={36} /> : <ToggleLeft size={36} />}
                </button>
              </div>

              <div className="flex items-start justify-between gap-4">
                <div>
                  <h4 className="font-bold text-gray-800 text-sm">Richiesta Recensione</h4>
                  <p className="text-xs text-gray-500 mt-1">Invia link feedback a 12h dalla cena.</p>
                </div>
                <button onClick={() => setAutoReview(!autoReview)} className={`transition-colors ${autoReview ? 'text-green-500' : 'text-gray-300'}`}>
                  {autoReview ? <ToggleRight size={36} /> : <ToggleLeft size={36} />}
                </button>
              </div>
            </div>

            <div className="mt-8 p-4 bg-[#FDF1E9] rounded-xl border border-[#F5CBA7]/50 text-xs text-[#D35400] font-medium leading-relaxed">
              I messaggi automatici vengono veicolati via Email e SMS in base alle preferenze lasciate dal cliente.
            </div>
          </div>

        </div>
      )}

      {/* --- TAB: RECENSIONI --- */}
      {activeTab === 'recensioni' && (
        <div className="bg-white/80 rounded-3xl border border-[#F5CBA7]/50 shadow-sm p-6 md:p-10 flex-1 max-w-4xl mx-auto w-full">
           <div className="flex justify-between items-end mb-8 border-b border-[#F5CBA7]/30 pb-4">
              <div>
                <h3 className="text-2xl font-extrabold text-[#781D2D]">Recensioni Ottenute</h3>
                <p className="text-[#D35400] text-sm font-medium mt-1">Il feedback diretto della tua clientela.</p>
              </div>
              
              <div className="bg-[#781D2D] text-white px-5 py-3 rounded-2xl flex items-center gap-3 shadow-md">
                 <div className="text-3xl font-black">{reviews.length > 0 ? (reviews.reduce((acc, r) => acc + r.punteggio, 0) / reviews.length).toFixed(1) : 'N/A'}</div>
                 <div className="text-xs font-medium opacity-80 uppercase tracking-widest leading-tight">Voto<br/>Medio</div>
              </div>
           </div>

           <div className="space-y-6 overflow-y-auto max-h-[600px] pr-2 custom-scrollbar">
             {reviews.length === 0 ? (
               <div className="text-center py-10 bg-gray-50 rounded-2xl italic text-gray-400">Nessuna recensione ancora registrata.</div>
             ) : (
               reviews.map(review => (
                 <div key={review.idRecensione} className="bg-[#FFFDFB] border border-gray-100 p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow relative group">
                   
                   <div className="flex justify-between items-start mb-4">
                     <div className="flex items-center gap-3">
                       <div className="w-12 h-12 bg-gradient-to-tr from-[#D35400] to-[#E74C3C] text-white rounded-full flex items-center justify-center font-bold text-lg shadow-inner">
                         {review.clienteNome.charAt(0)}{review.clienteCognome.charAt(0)}
                       </div>
                       <div>
                         <h4 className="font-bold text-[#781D2D] text-lg">{review.clienteNome} {review.clienteCognome}</h4>
                         <span className="text-xs text-gray-400">{new Date(review.dataCreazione).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric'})}</span>
                       </div>
                     </div>
                     
                     <div className="flex gap-1" title={`${review.punteggio} stelle`}>
                       {[...Array(5)].map((_, i) => (
                         <Star 
                           key={i} 
                           size={20} 
                           className={i < review.punteggio ? 'fill-[#f59e0b] text-[#f59e0b]' : 'fill-gray-200 text-gray-200'} 
                         />
                       ))}
                     </div>
                   </div>

                   <p className="text-gray-700 leading-relaxed pl-15 italic font-medium">"{review.testo}"</p>
                 </div>
               ))
             )}
           </div>
        </div>
      )}

    </div>
  );
}

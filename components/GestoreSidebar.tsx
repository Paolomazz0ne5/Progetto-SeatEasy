// Diciamo a Next.js che questo componente deve girare sul browser (Client).
// Senza questo, Next proverebbe a renderizzarlo sul Server e andrebbe in errore 
// appena vede roba interattiva o hook come useSearchParams.
'use client';

import React, { Suspense, useState } from 'react';
import Link from 'next/link';
// Ci servono per leggere l'URL e i parametri (es: ?ristorante=1)
import { usePathname, useSearchParams } from 'next/navigation';
import { LayoutDashboard, Grid, Clock, MessageSquareHeart, User, LogOut, Image as ImageIcon, Menu, X } from 'lucide-react';
// Importiamo la funzione di backend per il logout (Server Action)
import { logoutAction } from '@/app/actions/auth';
import Logo from '@/components/Logo';

function SidebarContent() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Leggiamo dove ci troviamo (pathname) e i parametri dell'URL
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Peschiamo l'ID del ristorante direttamente dall'URL.
  // È un trucchetto geniale per non dover usare Redux o Context complessi.
  const ristoranteId = searchParams.get('ristorante');

  // Prepariamo il pezzettino di URL da attaccare ai link. 
  // Se c'è un ID, creiamo "?ristorante=X", altrimenti lo lasciamo vuoto.
  const qs = ristoranteId ? `?ristorante=${ristoranteId}` : '';

  // Quando l'utente clicca su Esci, chiamiamo la funzione del server.
  const handleLogout = async () => {
    await logoutAction();
  };

  // La lista dei bottoni del menu. 
  // Nota come usiamo "qs" per assicurarci che cliccando su "Orari", 
  // l'ID del ristorante venga passato alla nuova pagina.
  const navItems = [
    { name: 'Dashboard', href: `/gestore/dashboard${qs}`, icon: LayoutDashboard },
    { name: 'Gestione Layout', href: `/gestore/sala-layout${qs}`, icon: Grid },
    { name: 'Orari e Turni', href: `/gestore/orari${qs}`, icon: Clock },
    { name: 'Galleria Immagini', href: `/gestore/galleria${qs}`, icon: ImageIcon },
    { name: 'Relazioni Clienti', href: `/gestore/relazioni${qs}`, icon: MessageSquareHeart },
  ];

  // Contenitore principale della sidebar: larghezza fissa, altezza minima tutto schermo,
  // sfondo bianco e una leggera ombra per staccarla dal resto della pagina.
  return (
    <>
      {/* --- MOBILE TOPBAR (Visibile solo su schermi piccoli) --- */}
      <div className="lg:hidden flex items-center justify-between p-4 bg-white border-b border-[#F5CBA7]/40 z-40 shrink-0">
        <Link href="/gestore/ristoranti" className="block">
          <Logo className="scale-75 origin-left" />
        </Link>
        <button 
          onClick={() => setIsMobileMenuOpen(true)}
          className="p-2 text-gray-600 hover:bg-gray-100 rounded-md"
        >
          <Menu size={24} />
        </button>
      </div>

      {/* Sfondo scuro in overlay per chiudere il menu su mobile */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden" 
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <div className={`
        w-64 min-h-screen bg-white shadow-xl border-r border-[#F5CBA7]/40 flex flex-col z-50
        fixed inset-y-0 left-0 transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:relative lg:translate-x-0
      `}>
        
        {/* Bottone X per chiudere su mobile */}
        <button 
          onClick={() => setIsMobileMenuOpen(false)}
          className="absolute top-4 right-4 p-2 text-gray-500 hover:bg-gray-100 rounded-md lg:hidden"
        >
          <X size={24} />
        </button>

      {/* Brand Header: qui mostriamo il logo e la label di stato "Gestore Beta" */}
      <div className="p-6 pb-2 border-b border-[#F5CBA7]/30">
        <Link href="/gestore/ristoranti" className="block">
          <Logo className="mb-2 scale-75 origin-left" />
        </Link>
        <div className="mt-4">
          <span className="bg-[#F5CBA7]/30 text-[#D35400] text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded">Gestore Beta</span>
        </div>
      </div>

      {/* Navigazione Principale: qui mappo l'array 'navItems' per generare i link */}
      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto custom-scrollbar">
        <span className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 ml-2">Menu Principale</span>

        {navItems.map(item => {
          // Logica per evidenziare il bottone della pagina in cui mi trovo.
          // Ignoro la query string (?ristorante=X) per fare il check corretto del path.
          const isActive = pathname.startsWith(item.href.split('?')[0]);
          const Icon = item.icon;

          // Se l'utente non ha selezionato un ristorante, questi link sono inutili,
          // quindi li rendo visivamente disabilitati.
          const isDisabled = !ristoranteId;

          if (isDisabled) {
            return (
              <div
                key={item.name}
                className="flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-gray-300 cursor-not-allowed opacity-50 select-none"
                title="Seleziona un ristorante per sbloccare questa sezione"
              >
                <Icon size={20} />
                {item.name}
              </div>
            );
          }

          // Se tutto ok, stampo il link attivo o in stato hover.
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => setIsMobileMenuOpen(false)}
              // Tailwind dinamico: se è attivo uso il gradiente "SeatEasy style", altrimenti hover leggero.
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${isActive
                ? 'bg-gradient-to-r from-[#781D2D] to-[#5f1723] text-white shadow-md transform scale-[1.02]'
                : 'text-gray-500 hover:bg-[#FDF1E9] hover:text-[#781D2D]'
                }`}
            >
              <Icon size={20} className={isActive ? 'text-[#F5CBA7]' : ''} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Sezione Bassa: Profilo utente e bottone di logout */}
      <div className="p-4 border-t border-[#F5CBA7]/30 bg-gray-50/50">
        <span className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 ml-2">Account</span>

        {/* Link diretto alla gestione profilo */}
        <Link
          href="/gestore/profilo"
          onClick={() => setIsMobileMenuOpen(false)}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all mb-2 ${pathname.startsWith('/gestore/profilo')
              ? 'bg-gray-200 text-gray-800 shadow-inner'
              : 'text-gray-500 hover:bg-white hover:shadow-sm'
            }`}
        >
          <User size={20} />
          Il mio Profilo
        </Link>

        {/* Bottone Logout: richiama la Server Action 'handleLogout' definita sopra */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-start gap-3 px-4 py-3 rounded-xl font-bold text-red-500 hover:bg-red-50 hover:text-red-700 transition-colors"
        >
          <LogOut size={20} />
          Disconnetti
        </button>
      </div>
    </div>
    </>
  );
}

// Esporto il componente avvolto in Suspense, essenziale perché useSearchParams 
// richiede un limite di rendering (boundary) quando si usa in client components.
export default function GestoreSidebar() {
  return (
    <Suspense fallback={<div className="w-64 min-h-screen bg-white shadow-xl border-r border-[#F5CBA7]/40 z-50 relative animate-pulse"></div>}>
      <SidebarContent />
    </Suspense>
  );
}
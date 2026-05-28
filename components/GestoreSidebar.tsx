// Diciamo a Next.js che questo componente deve girare sul browser (Client).
// Senza questo, Next proverebbe a renderizzarlo sul Server e andrebbe in errore 
// appena vede roba interattiva o hook come useSearchParams.
'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
// Ci servono per leggere l'URL e i parametri (es: ?ristorante=1)
import { usePathname, useSearchParams } from 'next/navigation';
import { LayoutDashboard, Grid, Clock, MessageSquareHeart, User, LogOut, Image as ImageIcon } from 'lucide-react';
// Importiamo la funzione di backend per il logout (Server Action)
import { logoutAction } from '@/app/actions/auth';
import Logo from '@/components/Logo';

function SidebarContent() {
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
  {/* Usiamo .map() per scorrere l'array di link creato prima e stamparli a schermo */ }
  {
    navItems.map(item => {
      // Controlliamo se la pagina in cui siamo (pathname) corrisponde al link del bottone.
      // Il .split('?')[0] serve a ignorare la query string per fare il confronto pulito.
      const isActive = pathname.startsWith(item.href.split('?')[0]);
      const Icon = item.icon;

      // Se non c'è un ristorante selezionato, blocchiamo i bottoni.
      const isDisabled = !ristoranteId;

      // RENDERING CONDIZIONALE: Se manca l'ID, stampiamo un finto bottone grigio non cliccabile
      if (isDisabled) {
        return (
          // La 'key' è obbligatoria in React quando si usa .map()
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

      // Se invece c'è l'ID, stampiamo il vero Link di Next.js
      return (
        <Link
          key={item.name}
          href={item.href}
          // Qui usiamo i backtick (`) per iniettare le classi Tailwind in modo dinamico.
          // Se è attivo (isActive = true) mettiamo il colore scuro col gradiente, altrimenti grigio chiaro.
          className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${isActive
              ? 'bg-gradient-to-r from-[#781D2D] to-[#5f1723] text-white shadow-md transform scale-[1.02]'
              : 'text-gray-500 hover:bg-[#FDF1E9] hover:text-[#781D2D]'
            }`}
        >
          {/* Cambiamo colore anche all'iconina se il bottone è attivo */}
          <Icon size={20} className={isActive ? 'text-[#F5CBA7]' : ''} />
          {item.name}
        </Link>
      );
    })
  }
      </nav >

    {/* BLOCCO ACCOUNT E LOGOUT */ }
  {/* ... (Codice dei bottoni profilo e logout, usa la stessa logica vista sopra) ... */ }

    </div >
  );
}

// IL VERO COMPONENTE CHE ESPORTIAMO
export default function GestoreSidebar() {
  return (
    // Avvolgiamo tutto dentro Suspense. Se non lo facciamo, Next.js dà errore durante 
    // la build perché stiamo leggendo l'URL (con useSearchParams) in un componente.
    // Nel 'fallback' mettiamo un rettangolo grigio che lampeggia (animate-pulse) mentre carica.
    <Suspense fallback={<div className="w-64 min-h-screen bg-white shadow-xl border-r border-[#F5CBA7]/40 z-50 relative animate-pulse"></div>}>
      <SidebarContent />
    </Suspense>
  );
}
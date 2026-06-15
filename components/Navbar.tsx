
// Diciamo a Next.js che questo è un Client Component.
// È necessario perché usiamo gli Hook (useState, useEffect) 
// e gestiamo l'evento onClick del bottone di logout.
"use client";
import Link from "next/link";
import React, { useState, useEffect } from "react";
import Logo from "@/components/Logo";
// Importiamo la funzione dal backend per distruggere la sessione
import { logoutAction } from "@/app/actions/auth";

// IL COMPONENTE: Riceve come "prop" dal componente padre (il Layout) 
// una variabile booleana per sapere se l'utente è loggato. Di base è false.
export default function Navbar({ isLoggedIn: initialIsLoggedIn = false }: { isLoggedIn?: boolean }) {

  // STATO LOCALE: Creiamo una variabile di stato e la inizializziamo col valore passato dal padre.
  const [isLoggedIn, setIsLoggedIn] = useState(initialIsLoggedIn);

  // SINCRONIZZAZIONE: Se per qualche motivo il componente padre cambia idea 
  // e passa un nuovo valore di 'initialIsLoggedIn' (magari la sessione scade), 
  // questo useEffect scatta e aggiorna lo stato locale, facendo ridisegnare la Navbar.
  useEffect(() => {
    setIsLoggedIn(initialIsLoggedIn);
  }, [initialIsLoggedIn]);

  // Quando l'utente clicca su logout, chiamiamo la Server Action asincrona
  const handleLogout = async () => {
    await logoutAction();
  };

  return (
    // 'fixed top-0 w-full z-50' incolla la navbar in cima allo schermo 
    // e la tiene sopra agli altri elementi (z-index 50) mentre fai scroll.
    <nav className="fixed top-0 w-full z-50 bg-[#F5CBA7] shadow-md border-b border-[#e2b793]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 items-center">

          {/* SEZIONE SINISTRA: Il Logo che riporta alla Home ("/") */}
          <Link href="/" className="flex items-center space-x-2">
            <Logo className="scale-[0.8] origin-left" />
          </Link>

          {/* SEZIONE DESTRA: I bottoni dinamici */}
          <div className="flex items-center space-x-6">

            {/* RENDERING CONDIZIONALE: Operatore ternario (condizione ? vero : falso) */}
            {!isLoggedIn ? (
              // SE NON È LOGGATO (Falso): Mostriamo il bottone rosso per andare alla pagina /auth
              <>
                <Link
                  href="/auth"
                  className="bg-[#781D2D] text-white px-5 py-2 rounded-full font-semibold hover:bg-[#5f1723] transition-colors shadow-sm"
                >
                  Login / Registrati
                </Link>
              </>
            ) : (
              // SE È LOGGATO (Vero): Mostriamo il menu del cliente (Prenotazioni, Logout, Profilo)
              <>
                <Link
                  href="/cliente/prenotazioni"
                  className="font-bold text-[#781D2D] hover:text-[#5f1723] transition-colors text-sm uppercase tracking-wider"
                >
                  Le Mie Prenotazioni
                </Link>

                <button
                  onClick={handleLogout}
                  className="font-bold text-[#781D2D] hover:text-[#5f1723] transition-colors text-sm uppercase tracking-wider border-l border-[#781D2D]/20 pl-6"
                >
                  Logout
                </button>

                <Link
                  href="/cliente/profilo"
                  className="p-2 rounded-full bg-white/40 text-[#781D2D] hover:bg-white/60 transition-colors relative cursor-pointer"
                  title="Il Mio Profilo"
                >
                  {/* Icona SVG dell'omino del profilo */}
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </Link>
              </>
            )}

          </div>
        </div>
      </div>
    </nav>
  );
}
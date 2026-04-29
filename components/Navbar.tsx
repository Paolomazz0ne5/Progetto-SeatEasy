"use client";

import Link from "next/link";
import React, { useState, useEffect } from "react";
import Logo from "@/components/Logo";
import { logoutAction } from "@/app/actions/auth";

export default function Navbar({ isLoggedIn: initialIsLoggedIn = false }: { isLoggedIn?: boolean }) {
  const [isLoggedIn, setIsLoggedIn] = useState(initialIsLoggedIn);

  useEffect(() => {
    setIsLoggedIn(initialIsLoggedIn);
  }, [initialIsLoggedIn]);

  const handleLogout = async () => {
    await logoutAction();
  };

  return (
    <nav className="fixed top-0 w-full z-50 bg-[#F5CBA7] shadow-md border-b border-[#e2b793]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 items-center">
          {/* Logo Section */}
          <Link href="/" className="flex items-center space-x-2">
            <Logo className="scale-[0.8] origin-left" />
          </Link>

          {/* Right Actions */}
          <div className="flex items-center space-x-6">
            {!isLoggedIn ? (
              <>
                <Link
                  href="/auth"
                  className="bg-[#781D2D] text-white px-5 py-2 rounded-full font-semibold hover:bg-[#5f1723] transition-colors shadow-sm"
                >
                  Login / Registrati
                </Link>
              </>

            ) : (
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
                <div
                  className="p-2 rounded-full bg-white/40 text-[#781D2D] relative cursor-default"
                  title="Profilo"
                >
                  {/* Profile Icon */}
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}


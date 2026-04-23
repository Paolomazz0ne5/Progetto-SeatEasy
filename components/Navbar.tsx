"use client";

import Link from "next/link";
import React, { useState } from "react";

export default function Navbar() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  return (
    <nav className="fixed top-0 w-full z-50 bg-[#F5CBA7] shadow-md border-b border-[#e2b793]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 items-center">
          {/* Logo Section */}
          <Link href="/" className="flex items-center space-x-2">
            <img 
              src="/logo.png" 
              alt="SeatEasy Logo" 
              className="object-contain" 
              style={{ maxHeight: '60px' }} 
            />
          </Link>

          {/* Right Actions */}
          <div className="flex items-center space-x-6">
            {!isLoggedIn ? (
              <>
                <button 
                  onClick={() => setIsLoggedIn(true)}
                  className="font-medium text-[#781D2D] hover:text-[#5f1723] transition-colors"
                >
                  Login
                </button>
                <button 
                  className="bg-[#781D2D] text-white px-5 py-2 rounded-full font-medium hover:bg-[#5f1723] transition-colors shadow-sm"
                >
                  Create Account
                </button>
              </>
            ) : (
              <>
                <button 
                  onClick={() => setIsLoggedIn(false)}
                  className="font-medium text-[#781D2D] hover:text-[#5f1723] transition-colors"
                >
                  Logout
                </button>
                <Link 
                  href="/profile" 
                  className="p-2 rounded-full bg-white/40 hover:bg-white/60 transition-colors text-[#781D2D] relative group"
                  title="Profile & Bookings"
                >
                  {/* Profile / History Icon */}
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  {/* Notification dot to match the vibe */}
                  <span className="absolute top-1 right-1 block w-2 h-2 rounded-full bg-[#E74C3C] ring-2 ring-[#F5CBA7]"></span>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

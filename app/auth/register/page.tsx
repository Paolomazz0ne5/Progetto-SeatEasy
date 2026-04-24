'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Lock, Mail, AlertTriangle, User as UserIcon } from 'lucide-react';
import { registerAction } from '@/app/actions/auth';
import Logo from '@/components/Logo';

export default function RegisterPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const formData = new FormData(e.currentTarget);
    const result = await registerAction(formData);
    
    if (result && !result.success) {
      setError(result.error || 'Errore di registrazione');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFDFB] flex items-center justify-center py-10 px-4 relative overflow-hidden">
      
      {/* Decorative Blob */}
      <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-[#fdf1e9] blur-3xl opacity-70"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] rounded-full bg-[#fae5d3] blur-3xl opacity-70"></div>
      
      <div className="relative z-10 w-full max-w-lg bg-white/80 backdrop-blur-xl border border-[#F5CBA7]/60 rounded-[2rem] p-10 shadow-2xl">
        
        <Link href="/auth/login" className="inline-flex items-center gap-2 text-gray-500 hover:text-[#781D2D] mb-8 transition-colors">
           <ArrowLeft size={18} /> Torna al Login
        </Link>
        
        <div className="text-center mb-10">
           <Logo className="mb-6 scale-90" />
           <h1 className="text-3xl font-extrabold text-[#781D2D]">Inizia Ora</h1>
           <p className="text-[#D35400] font-medium mt-2">Registra il tuo ristorante e gestisci le prenotazioni.</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
            <AlertTriangle size={20} className="flex-shrink-0" />
            <span className="font-medium text-sm">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5 ml-1">Nome</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                   <UserIcon size={16} />
                </div>
                <input 
                   name="nome" type="text" required
                   className="w-full bg-white border border-gray-200 rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-[#D35400] transition-shadow text-[#781D2D] font-medium"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5 ml-1">Cognome</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                   <UserIcon size={16} />
                </div>
                <input 
                   name="cognome" type="text" required
                   className="w-full bg-white border border-gray-200 rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-[#D35400] transition-shadow text-[#781D2D] font-medium"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5 ml-1">Indirizzo Email</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                 <Mail size={18} />
              </div>
              <input 
                 name="email" type="email" required
                 className="w-full bg-white border border-gray-200 rounded-xl py-3 pl-11 pr-4 focus:outline-none focus:ring-2 focus:ring-[#D35400] transition-shadow text-[#781D2D] font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5 ml-1">Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                 <Lock size={18} />
              </div>
              <input 
                 name="password" type="password" required minLength={6}
                 className="w-full bg-white border border-gray-200 rounded-xl py-3 pl-11 pr-4 focus:outline-none focus:ring-2 focus:ring-[#D35400] transition-shadow text-[#781D2D] font-medium"
              />
            </div>
          </div>

          <button 
             type="submit" 
             disabled={loading}
             className="w-full py-3.5 bg-gradient-to-r from-[#D35400] to-[#E74C3C] text-white font-bold rounded-xl hover:shadow-lg transition-all transform hover:-translate-y-0.5 mt-4 flex justify-center items-center gap-2 disabled:opacity-70 disabled:transform-none"
          >
             {loading ? 'Preparazione...' : 'Crea Account Gestore'}
          </button>
        </form>

        <div className="mt-8 p-4 bg-[#FDF1E9]/50 border border-[#F5CBA7]/50 rounded-xl text-center text-xs text-gray-500 font-medium">
          Procedendo con la registrazione accetti i Termini e le Condizioni dei servizi B2B SeatEasy.
        </div>

      </div>
    </div>
  );
}

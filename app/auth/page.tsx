'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Lock, Mail, User, Phone, KeyRound } from 'lucide-react';
import Logo from '@/components/Logo';
import { loginAction, registerAction } from '@/app/actions/auth';

export default function UnifiedAuthPage() {
  const [role, setRole] = useState<'cliente' | 'gestore'>('cliente');
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    const formData = new FormData(e.currentTarget);
    formData.append('role', role); // Assicuriamoci che il ruolo sia nel FormData
    
    let result;
    if (mode === 'login') {
      result = await loginAction(formData);
    } else {
      result = await registerAction(formData);
    }

    if (result && !result.success) {
      setError(result.error || 'Operazione fallita');
      setLoading(false);
    } else if (result && result.success) {
      // Reindirizzamento in base al ruolo
      if (role === 'gestore') {
        router.push('/gestore/ristoranti');
      } else {
        router.push('/');
      }
    }
  };


  return (
    <div className="min-h-screen bg-[#FFFDFB] flex items-center justify-center p-4 relative overflow-hidden font-sans">
      
      {/* Decorative Blobs */}
      <div className="absolute top-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-[#fdf1e9] blur-3xl opacity-70 pointer-events-none"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[40vw] h-[40vw] rounded-full bg-[#fae5d3] blur-3xl opacity-70 pointer-events-none"></div>
      
      <div className="relative z-10 w-full max-w-md bg-white/85 backdrop-blur-xl border border-[#F5CBA7]/60 rounded-[2rem] p-8 sm:p-10 shadow-2xl flex flex-col transition-all duration-300">
        
        <div className="text-center mb-8">
           <div className="flex justify-center mb-6">
             <Logo />
           </div>

           {error && (
             <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2 text-sm font-medium">
               <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
               </svg>
               {error}
             </div>
           )}
           
           {/* Selettore Ruolo */}

           <div className="bg-gray-100 p-1 rounded-2xl inline-flex gap-1 mb-2 shadow-inner">
             <button
               type="button"
               onClick={() => setRole('cliente')}
               className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                 role === 'cliente' 
                   ? 'bg-white text-[#D35400] shadow-md' 
                   : 'text-gray-500 hover:text-gray-800'
               }`}
             >
               👨‍🍳 Sono un Cliente
             </button>
             <button
               type="button"
               onClick={() => setRole('gestore')}
               className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                 role === 'gestore' 
                   ? 'bg-white text-[#781D2D] shadow-md' 
                   : 'text-gray-500 hover:text-gray-800'
               }`}
             >
               🏬 Sono un Gestore
             </button>
           </div>
        </div>

        {/* Tabs Login/Registrati */}
        <div className="flex border-b border-gray-200 mb-8 relative">
          <button
            type="button"
            onClick={() => setMode('login')}
            className={`flex-1 pb-4 text-center text-sm font-bold transition-colors ${
              mode === 'login' ? 'text-gray-900' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            Accedi
          </button>
          <button
            type="button"
            onClick={() => setMode('register')}
            className={`flex-1 pb-4 text-center text-sm font-bold transition-colors ${
              mode === 'register' ? 'text-gray-900' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            Registrati
          </button>
          
          {/* Indicatore animato */}
          <div 
            className="absolute bottom-0 h-0.5 bg-gradient-to-r from-[#D35400] to-[#781D2D] transition-all duration-300 ease-in-out"
            style={{ width: '50%', left: mode === 'login' ? '0%' : '50%' }}
          />
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5 animate-in fade-in slide-in-from-bottom-2 duration-500">
          
          {/* Campi comuni / Registrazione */}
          {mode === 'register' && (
            <div className="flex gap-4">
              <div className="flex-1 space-y-1.5">
                <label className="block text-xs font-bold text-gray-700 ml-1">Nome</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                     <User size={16} />
                  </div>
                  <input 
                     name="nome" 
                     type="text" 
                     required 
                     placeholder="Mario"
                     className="w-full bg-white border border-gray-200 rounded-xl py-2.5 pl-10 pr-3 focus:outline-none focus:ring-2 focus:ring-[#D35400] transition-shadow text-gray-900 text-sm"
                  />
                </div>
              </div>
              <div className="flex-1 space-y-1.5">
                <label className="block text-xs font-bold text-gray-700 ml-1">Cognome</label>
                <div className="relative">
                  <input 
                     name="cognome" 
                     type="text" 
                     required 
                     placeholder="Rossi"
                     className="w-full bg-white border border-gray-200 rounded-xl py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-[#D35400] transition-shadow text-gray-900 text-sm"
                  />
                </div>
              </div>
            </div>
          )}

          {mode === 'register' && (
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-700 ml-1">Telefono</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                   <Phone size={16} />
                </div>
                <input 
                   name="telefono" 
                   type="tel" 
                   required={mode === 'register'} 
                   placeholder="+39 000 000 0000"
                   className="w-full bg-white border border-gray-200 rounded-xl py-2.5 pl-10 pr-3 focus:outline-none focus:ring-2 focus:ring-[#D35400] transition-shadow text-gray-900 text-sm"
                />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-gray-700 ml-1">Indirizzo Email</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                 <Mail size={16} />
              </div>
              <input 
                 name="email" 
                 type="email" 
                 required 
                 placeholder="tua@email.it"
                 className="w-full bg-white border border-gray-200 rounded-xl py-2.5 pl-10 pr-3 focus:outline-none focus:ring-2 focus:ring-[#D35400] transition-shadow text-gray-900 text-sm"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-gray-700 ml-1">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                 <Lock size={16} />
              </div>
              <input 
                 name="password" 
                 type="password" 
                 required 
                 placeholder="••••••••"
                 className="w-full bg-white border border-gray-200 rounded-xl py-2.5 pl-10 pr-3 focus:outline-none focus:ring-2 focus:ring-[#D35400] transition-shadow text-gray-900 text-sm"
              />
            </div>
          </div>

          {/* Campo Condizionale: PIN Sicurezza per Gestore (Solo in Registrazione) */}
          {mode === 'register' && role === 'gestore' && (
            <div className="space-y-1.5 bg-red-50/50 p-3 rounded-xl border border-red-100 mt-2 animate-in fade-in slide-in-from-top-2">
              <label className="block text-xs font-bold text-[#781D2D] ml-1">
                PIN di Sicurezza Ristorante
              </label>
              <p className="text-xs text-gray-500 mb-2 ml-1">Codice a 4-6 cifre richiesto per creare il tuo profilo gestore.</p>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#781D2D]/60">
                   <KeyRound size={16} />
                </div>
                <input 
                   name="pin" 
                   type="password" 
                   required={mode === 'register' && role === 'gestore'}
                   maxLength={6}
                   placeholder="Es: 1234"
                   className="w-full bg-white border border-red-200 rounded-xl py-2.5 pl-10 pr-3 focus:outline-none focus:ring-2 focus:ring-[#781D2D] transition-shadow text-gray-900 text-sm font-mono tracking-widest"
                />
              </div>
            </div>
          )}

          <button 
             type="submit" 
             disabled={loading}
             className="w-full py-3.5 bg-gradient-to-r from-[#D35400] to-[#781D2D] text-white font-bold rounded-xl hover:shadow-lg transition-all transform hover:-translate-y-0.5 mt-4 disabled:opacity-70 disabled:transform-none"
          >
             {loading 
                ? 'Elaborazione...' 
                : mode === 'login' 
                  ? 'Accedi' 
                  : (role === 'cliente' ? 'Registrati come Cliente' : 'Registra la tua Attività')}
          </button>
        </form>

        <div className="mt-8 text-center text-xs text-gray-400">
           Proseguendo, accetti i <Link href="#" className="underline hover:text-gray-600">Termini di Servizio</Link> e la <Link href="#" className="underline hover:text-gray-600">Privacy Policy</Link> di SeatEasy.
        </div>

      </div>
    </div>
  );
}

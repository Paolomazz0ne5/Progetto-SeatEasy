'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { LayoutDashboard, ArrowLeft, Grid, Clock, MessageSquareHeart, User, LogOut, Image as ImageIcon } from 'lucide-react';
import { logoutAction } from '@/app/actions/auth';
import Logo from '@/components/Logo';

function SidebarContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const ristoranteId = searchParams.get('ristorante');
  const qs = ristoranteId ? `?ristorante=${ristoranteId}` : '';

  const handleLogout = async () => {
    await logoutAction();
  };

  const navItems = [
    { name: 'Dashboard', href: `/gestore/dashboard${qs}`, icon: LayoutDashboard },
    { name: 'Gestione Layout', href: `/gestore/sala-layout${qs}`, icon: Grid },
    { name: 'Orari e Turni', href: `/gestore/orari${qs}`, icon: Clock },
    { name: 'Galleria Immagini', href: `/gestore/galleria${qs}`, icon: ImageIcon },
    { name: 'Relazioni Clienti', href: `/gestore/relazioni${qs}`, icon: MessageSquareHeart },
  ];

  return (
    <div className="w-64 min-h-screen bg-white shadow-xl border-r border-[#F5CBA7]/40 flex flex-col z-50 relative">
      
      {/* Brand Header */}
      <div className="p-6 pb-2 border-b border-[#F5CBA7]/30">
        <Link href="/gestore/ristoranti" className="block">
          <Logo className="mb-2 scale-75 origin-left" />
        </Link>
        <div className="mt-4">
          <span className="bg-[#F5CBA7]/30 text-[#D35400] text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded">Gestore Beta</span>
        </div>
      </div>

      {/* Primary Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        <span className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 ml-2">Menu Principale</span>
        
        {navItems.map(item => {
          const isActive = pathname.startsWith(item.href.split('?')[0]);
          const Icon = item.icon;
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

          return (
            <Link 
              key={item.name} 
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${
                isActive 
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

      {/* Account Bottom Block */}
      <div className="p-4 border-t border-[#F5CBA7]/30 bg-gray-50/50">
        <span className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 ml-2">Account</span>
        
        <Link 
          href="/gestore/profilo"
          className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all mb-2 ${
            pathname.startsWith('/gestore/profilo') 
              ? 'bg-gray-200 text-gray-800 shadow-inner' 
              : 'text-gray-500 hover:bg-white hover:shadow-sm'
          }`}
        >
          <User size={20} />
          Il mio Profilo
        </Link>

        {/* LOGOUT BUTTON - ALWAYS VISIBLE */}
        <button 
          onClick={handleLogout}
          className="w-full flex items-center justify-start gap-3 px-4 py-3 rounded-xl font-bold text-red-500 hover:bg-red-50 hover:text-red-700 transition-colors"
        >
          <LogOut size={20} />
          Disconnetti
        </button>
      </div>

    </div>
  );
}

export default function GestoreSidebar() {
  return (
    <Suspense fallback={<div className="w-64 min-h-screen bg-white shadow-xl border-r border-[#F5CBA7]/40 z-50 relative animate-pulse"></div>}>
      <SidebarContent />
    </Suspense>
  );
}

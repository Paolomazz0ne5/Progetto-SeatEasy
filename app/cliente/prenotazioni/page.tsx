import Navbar from '@/components/Navbar';
import { getMyReservations } from '@/app/actions/cliente';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { Calendar, Clock, MapPin, Users, Edit, Trash2 } from 'lucide-react';
import CancelButton from './CancelButton';

export default async function MiePrenotazioni() {
  const cookieStore = await cookies();
  const isLoggedIn = cookieStore.has('seateasy_session');
  const allPrenotazioni = await getMyReservations();

  const attive = allPrenotazioni.filter(p => p.stato !== 'Annullata');
  const annullate = allPrenotazioni.filter(p => p.stato === 'Annullata');

  const renderPrenotazione = (pre: any) => (
    <div 
      key={pre.idPrenotazione}
      className={`bg-white border border-[#F5CBA7]/40 rounded-[2rem] p-6 sm:p-8 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row gap-8 items-center ${pre.stato === 'Annullata' ? 'opacity-60 grayscale-[0.5]' : ''}`}
    >
      <div className={`w-full md:w-48 h-32 rounded-2xl flex items-center justify-center overflow-hidden shrink-0 ${pre.stato === 'Annullata' ? 'bg-gray-100' : 'bg-[#FDF1E9]'}`}>
         <div className="text-center">
            <p className={`font-black text-2xl ${pre.stato === 'Annullata' ? 'text-gray-400' : 'text-[#781D2D]'}`}>T{pre.numeroTavolo}</p>
            <p className={`text-[10px] font-bold uppercase tracking-widest ${pre.stato === 'Annullata' ? 'text-gray-400' : 'text-[#D35400]'}`}>Tavolo</p>
         </div>
      </div>

      <div className="flex-1 space-y-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-tighter ${pre.stato === 'Confermata' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {pre.stato}
            </span>
            <span className="text-xs text-gray-400 font-medium">#{pre.idPrenotazione}</span>
          </div>
          <h3 className="text-2xl font-black text-[#781D2D]">{pre.ristoranteNome}</h3>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex items-center gap-2 text-gray-600 font-medium text-sm">
            <Calendar size={16} className="text-[#D35400]" />
            {pre.dataPrenotazione}
          </div>
          <div className="flex items-center gap-2 text-gray-600 font-medium text-sm">
            <Clock size={16} className="text-[#D35400]" />
            {pre.oraInizio}
          </div>
          <div className="flex items-center gap-2 text-gray-600 font-medium text-sm">
            <Users size={16} className="text-[#D35400]" />
            {pre.numeroPersone} {pre.numeroPersone === 1 ? 'Persona' : 'Persone'}
          </div>
          <div className="flex items-center gap-2 text-gray-600 font-medium text-sm">
            <MapPin size={16} className="text-[#D35400]" />
            <span className="truncate">{pre.ristoranteIndirizzo}</span>
          </div>
        </div>

        {pre.noteCliente && (
          <div className="bg-[#FFFDFB] border border-gray-100 p-3 rounded-xl text-xs text-gray-500 italic">
            " {pre.noteCliente} "
          </div>
        )}
      </div>

      {pre.stato !== 'Annullata' && (
        <div className="flex md:flex-col gap-2 w-full md:w-auto">
          <Link 
            href={`/cliente/prenotazioni/modifica/${pre.idPrenotazione}`}
            className="flex-1 md:w-32 flex items-center justify-center gap-2 py-3 bg-[#FDF1E9] text-[#781D2D] font-bold rounded-xl hover:bg-[#F5CBA7]/30 transition-colors text-sm"
          >
            <Edit size={16} /> Modifica
          </Link>
          <CancelButton 
            idPrenotazione={pre.idPrenotazione} 
            ristoranteNome={pre.ristoranteNome}
            politica={pre.politicaNoShow}
            caparra={pre.caparraRichiesta}
          />
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FFFDFB] font-sans">
      <Navbar isLoggedIn={isLoggedIn} />
      
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20">
        <div className="mb-12">
          <h1 className="text-4xl font-black text-[#781D2D] tracking-tight">
            Le Mie Prenotazioni
          </h1>
          <p className="text-[#D35400] font-medium mt-2">
            Gestisci i tuoi tavoli e le tue esperienze culinarie.
          </p>
        </div>

        {allPrenotazioni.length === 0 ? (
          <div className="bg-white border-2 border-dashed border-[#F5CBA7] rounded-[2rem] p-20 text-center">
            <div className="w-20 h-20 bg-[#FDF1E9] rounded-full flex items-center justify-center mx-auto mb-6">
              <Calendar className="text-[#D35400] w-10 h-10" />
            </div>
            <h3 className="text-xl font-bold text-[#781D2D] mb-2">Ancora nessuna prenotazione</h3>
            <p className="text-gray-500 mb-8">Inizia subito a scoprire i migliori ristoranti della città.</p>
            <Link 
              href="/cliente" 
              className="inline-flex items-center px-8 py-3 bg-gradient-to-r from-[#D35400] to-[#E74C3C] text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all"
            >
              Esplora Ristoranti
            </Link>
          </div>
        ) : (
          <div className="space-y-16">
            {attive.length > 0 && (
              <div className="space-y-6">
                <h2 className="text-xl font-black text-[#781D2D] uppercase tracking-widest flex items-center gap-3">
                  <span className="w-8 h-1 bg-[#D35400] rounded-full"></span>
                  In Corso
                </h2>
                <div className="grid gap-6">
                  {attive.map(renderPrenotazione)}
                </div>
              </div>
            )}

            {annullate.length > 0 && (
              <div className="space-y-6">
                <h2 className="text-xl font-black text-gray-400 uppercase tracking-widest flex items-center gap-3">
                  <span className="w-8 h-1 bg-gray-200 rounded-full"></span>
                  Storico Annullate
                </h2>
                <div className="grid gap-6">
                  {annullate.map(renderPrenotazione)}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

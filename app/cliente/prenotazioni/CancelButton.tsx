'use client';

import React, { useState } from 'react';
import { cancelReservation } from '@/app/actions/cliente';
// Importa le icone SVG da lucide-react per rendere l'interfaccia più parlante e accessibile
import { Trash2, AlertTriangle, X } from 'lucide-react';

// Definizione delle proprietà (Props) accettate dal componente, tipizzate in TypeScript
export default function CancelButton({
  idPrenotazione,
  ristoranteNome,
  politica,
  caparra
}: {
  idPrenotazione: number,
  ristoranteNome: string,
  politica?: string, // Proprietà opzionale 
  caparra?: number   // Proprietà opzionale
}) {
  // Stato booleano per controllare l'apertura (true) o la chiusura (false) del Pop-up di conferma
  const [showConfirm, setShowConfirm] = useState(false);
  // Stato booleano di caricamento per gestire l'asincronia durante la chiamata al server
  const [loading, setLoading] = useState(false);

  // Funzione asincrona che lancia l'effettivo annullamento della prenotazione
  const handleCancel = async () => {
    setLoading(true);

    const result = await cancelReservation(idPrenotazione);

    if (result.success) {
      setShowConfirm(false); // In caso di successo, chiude il modal smontandolo dal DOM
    } else {
      alert(result.error); // In caso di errore (es. vincoli temporali saltati), mostra un alert con il motivo
    }
    setLoading(false);
  };

  return (
    <>
      {/* PULSANTE PRINCIPALE: Sempre visibile nella card della prenotazione attiva */}
      <button
        onClick={() => setShowConfirm(true)} // Al click imposta lo stato a true facendo montare il modal
        className="flex-1 md:w-32 flex items-center justify-center gap-2 py-3 border border-red-100 text-red-500 font-bold rounded-xl hover:bg-red-50 transition-colors text-sm"
      >
        <Trash2 size={16} /> Annulla
      </button>

      {/* RENDERING CONDIZIONALE: Il modal viene iniettato nel DOM solo se showConfirm è TRUE */}
      {showConfirm && (
        /* Sfondo scuro semitrasparente a tutto schermo (Overlay) con effetto sfocatura */
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          {/* Finestra di dialogo (Card del Modal) con animazione di zoom-in fluida all'apertura */}
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">

            {/* HEADER DEL MODAL: Contiene l'icona di avviso, il titolo e la "X" di chiusura rapida */}
            <div className="bg-red-50 p-8 flex items-center gap-4 border-b border-red-100">
              <div className="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center text-red-600 shrink-0">
                <AlertTriangle size={30} />
              </div>
              <div>
                <h3 className="text-xl font-black text-[#781D2D]">Annulla Prenotazione</h3>
                <p className="text-red-600/80 font-medium text-sm">{ristoranteNome}</p>
              </div>
              {/* Pulsante "X" per chiudere il modal senza effettuare nessuna azione */}
              <button
                onClick={() => setShowConfirm(false)}
                className="ml-auto p-2 hover:bg-red-100 rounded-full text-red-400 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* CORPO DEL MODAL: Sezione informativa e messaggi di allerta */}
            <div className="p-8 space-y-6">
              {/* Box dedicato alla trasparenza contrattuale: mostra le regole del locale */}
              <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Politica del Ristorante</h4>
                {/* Operatore di cortesia logica short-circuit: se la stringa della politica manca, mostra un testo di fallback */}
                <p className="text-[#781D2D] font-bold leading-relaxed italic">
                  "{politica || "Nessuna politica specifica fornita. Contatta il ristorante per i dettagli."}"
                </p>

                {/* Rendering condizionale della penale: si attiva solo se esiste una caparra maggiore di zero */}
                {caparra && caparra > 0 && (
                  <div className="mt-4 flex items-center gap-2 text-red-600 font-black text-sm">
                    {/* Pallino rosso animato con effetto pulsazione per catturare l'attenzione visiva dell'utente */}
                    <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></div>
                    Attenzione: Caparra di €{caparra.toFixed(2)} non rimborsabile.
                  </div>
                )}
              </div>

              <p className="text-gray-500 text-sm font-medium px-2">
                Sei sicuro di voler procedere? Questa azione non può essere annullata e lo stato della prenotazione diventerà "Annullata".
              </p>

              {/* FOOTER DEL MODAL: I due pulsanti d'azione finale per confermare o ritirarsi */}
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                {/* Pulsante distruttivo di conferma: esegue la Server Action */}
                <button
                  onClick={handleCancel}
                  disabled={loading} // Se loading è vero, disabilita l'elemento a livello nativo HTML
                  className="flex-1 py-4 bg-red-600 hover:bg-red-700 text-white font-black rounded-2xl shadow-lg shadow-red-200 transition-all transform active:scale-95 disabled:opacity-50 flex items-center justify-center min-h-[56px]"
                >
                  {/* Operatore ternario che scambia il testo con lo stato di avanzamento */}
                  <span className="block">{loading ? 'Annullamento...' : 'Sì, Annulla ora'}</span>
                </button>
                {/* Pulsante di salvaguardia: chiude il pop-up lasciando intatta la prenotazione */}
                <button
                  onClick={() => setShowConfirm(false)}
                  className="flex-1 py-4 bg-gray-100 text-gray-500 font-bold rounded-2xl hover:bg-gray-200 transition-all"
                >
                  No, Mantieni
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
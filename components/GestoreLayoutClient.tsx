/**
 * DESCRIZIONE PRELIMINARE:
 * `GestoreLayoutClient` è il "builder" amministrativo per la planimetria del locale.
 * Permette al ristoratore di creare sale, aggiungere, modificare o eliminare tavoli.
 * La sua funzionalità più avanzata è la "Modalità Collega", che permette di unire 
 * più tavoli in comitive assegnando loro un identificativo di gruppo. Il layout 
 * non usa coordinate fisse, ma si adatta dinamicamente tramite CSS Grid, colorando 
 * in automatico i tavoli uniti tramite un calcolo matematico sull'ID del gruppo.
 */
'use client';

import React, { useState } from 'react';
import { Plus, Edit3, Trash2, Save, Grid, LayoutDashboard, Link2, Unlink } from 'lucide-react';
// Importo le mie azioni per parlare col database (creare, cancellare tavoli ecc.)
import { createSala, deleteSala, createTavolo, updateTavolo, deleteTavolo, linkTavoli, unlinkTavolo } from '@/app/actions/layoutActions';

type Tavolo = {
  idTavolo: number;
  idSala: number;
  numero: number;
  posti: number;
  postiMinimi: number;
  stato: string;
  idGruppo?: string | null; // Il punto interrogativo significa che può anche non esserci (se il tavolo non è in gruppo)
};

type Sala = {
  idSala: number;
  nome: string;
  capacita: number;
  tavoli: Tavolo[];
};

export default function GestoreLayoutClient({ initialSale, idRistorante }: { initialSale: Sala[], idRistorante: number }) {
  // --- LE MIE VARIABILI DI STATO (la "memoria" della pagina) ---
  const [sale] = useState<Sala[]>(initialSale); // Salvo le sale che mi arrivano all'inizio

  // Scelgo la prima sala di default da mostrare a schermo, se ce n'è almeno una
  const [activeSalaId, setActiveSalaId] = useState<number | null>(initialSale.length > 0 ? initialSale[0].idSala : null);

  // Interruttori per capire in che modalità mi trovo
  const [isEditMode, setIsEditMode] = useState(false); // Sono in modalità modifica? (Vero/Falso) è settata su falso inizialemente 
  const [isLinkMode, setIsLinkMode] = useState(false); // Sto unendo i tavoli? (Vero/Falso) anche qui settata su falso

  // Un array dove mi salvo temporaneamente gli ID dei tavoli che sto cliccando per unirli
  const [selectedTavoliIds, setSelectedTavoliIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(false); // Mi serve per far girare la rotellina di caricamento

  // --- STATI PER I POP-UP (Modali) ---
  const [newSalaModal, setNewSalaModal] = useState(false); // Mostra/nascondi la finestrella per creare la sala
  const [newSalaName, setNewSalaName] = useState(''); // Qui ci scrivo dentro il nome della nuova sala

  // Una sola finestrella (modale) che riciclo sia per creare che per modificare i tavoli
  const [tavoloModal, setTavoloModal] = useState<{ isOpen: boolean; mode: 'create' | 'edit'; data: Partial<Tavolo> | null }>({
    isOpen: false, // All'inizio è chiusa
    mode: 'create', // Di base è su "crea"
    data: null // Nessun dato dentro all'inizio
  });

  // Cerco la sala intera (con tutti i suoi dati) in base all'ID che ho selezionato
  const activeSala = sale.find(s => s.idSala === activeSalaId) || null;

  // --------------------------------------------------------
  // AZIONI PER LE SALE
  // --------------------------------------------------------

  // Funzione per salvare una nuova sala nel database
  const handleCreateSala = async () => {
    if (!newSalaName.trim()) return; // Se il nome è vuoto o solo spazi, mi blocco e non faccio niente
    setLoading(true); // Blocco i bottoni
    await createSala(newSalaName, idRistorante); // Chiamo il server per crearla
    window.location.reload(); // Ricarico brutalmente la pagina per vedere le modifiche
  };

  // Funzione per cancellare una sala
  const handleDeleteSala = async () => {
    if (!activeSala) return; // Se non ho una sala attiva, non faccio niente
    // Chiedo conferma all'utente col classico alert di JavaScript
    if (confirm(`Sei sicuro di voler eliminare la sala "${activeSala.nome}" e tutti i suoi tavoli?`)) {
      setLoading(true);
      await deleteSala(activeSala.idSala); // Cancello dal server
      window.location.reload(); // Ricarico la pagina
    }
  };

  // --------------------------------------------------------
  // AZIONI PER I TAVOLI
  // --------------------------------------------------------

  // Quando clicco su "Aggiungi Tavolo" apro la finestrella
  const openAddTavolo = () => {
    // Trucchetto: guardo i numeri dei tavoli che ho già, così propongo in automatico il prossimo numero libero
    const takenNumbers = activeSala?.tavoli.map(t => t.numero) || [];
    let nextNum = 1;
    while (takenNumbers.includes(nextNum)) nextNum++; // Se l'1 è preso provo il 2, ecc.

    // Apro il pop-up dicendo che voglio creare un tavolo, suggerisco il numero e metto 4 posti di base
    setTavoloModal({ isOpen: true, mode: 'create', data: { numero: nextNum, posti: 4, postiMinimi: 1 } });
  };

  // Quando clicco su un tavolo per modificarlo
  const openEditTavolo = (tavolo: Tavolo) => {
    if (!isEditMode) return; // Se non ho cliccato su "Modifica Layout" prima, mi blocco (non puoi toccare per sbaglio)
    // Apro il pop-up in modalità "edit" e ci butto dentro tutti i dati del tavolo cliccato
    setTavoloModal({ isOpen: true, mode: 'edit', data: { ...tavolo } });
  };

  // Salva il tavolo (sia che lo sto creando, sia che lo sto modificando)
  const saveTavolo = async () => {
    if (!activeSala || !tavoloModal.data) return; // Controlli di sicurezza
    setLoading(true);

    const { idTavolo, numero, posti, postiMinimi } = tavoloModal.data;

    // Faccio un conto per assicurarmi che i posti minimi non siano una cavolata (tipo minori di 1 o maggiori dei posti massimi)
    const postiMin = Math.max(1, Math.min(Number(postiMinimi) || 1, Number(posti)));

    // Guardo in che modalità ero e decido se creare o aggiornare
    if (tavoloModal.mode === 'create') {
      await createTavolo(activeSala.idSala, Number(numero), Number(posti), postiMin); //await per la creazione
    } else if (tavoloModal.mode === 'edit' && idTavolo) {
      await updateTavolo(idTavolo, Number(numero), Number(posti), postiMin); //await per l'aggiornamento
    }

    window.location.reload(); // Ricarico la pagina
  };

  // Elimina il singolo tavolo
  const removeTavolo = async () => {
    if (!tavoloModal.data?.idTavolo) return; // Controllo di sicurezza per eliminare il tavolo
    setLoading(true); // Attendo che il server elimini il tavolo
    await deleteTavolo(tavoloModal.data.idTavolo); // Chiamo l'azione del server per eliminare
    window.location.reload(); // Ricarico la pagina per vedere le modifiche
  };

  // Cosa succede quando faccio click proprio sopra al quadratino/tondino di un tavolo?
  const handleTavoloClick = (tavolo: Tavolo) => {
    if (!isEditMode) return; // Se non sono in modalità edit, non fa assolutamente niente

    // Se sto cercando di unire dei tavoli (modalità Link)
    if (isLinkMode) {
      // Se l'avevo già cliccato, lo tolgo dalla lista (deseleziona)
      if (selectedTavoliIds.includes(tavolo.idTavolo)) {
        setSelectedTavoliIds(selectedTavoliIds.filter(id => id !== tavolo.idTavolo));
      } else {
        // Se è un tavolo nuovo, lo aggiungo alla lista di quelli selezionati
        setSelectedTavoliIds([...selectedTavoliIds, tavolo.idTavolo]);
      }
    } else {
      // Se non sto unendo tavoli, vuol dire che voglio solo modificare questo singolo tavolo
      openEditTavolo(tavolo);
    }
  };

  // Conferma per unire i tavoli che ho appena selezionato
  const handleLinkTavoli = async () => {
    if (selectedTavoliIds.length < 2) return; // Mi servono almeno 2 tavoli per fare una tavolata!
    setLoading(true);
    await linkTavoli(selectedTavoliIds); // Mando l'array degli ID al server
    setIsLinkMode(false); // Esco dalla modalità unione
    setSelectedTavoliIds([]); // Svuoto il carrello delle selezioni
    window.location.reload();
  };

  // Stacca un tavolo dal suo gruppo
  const handleUnlinkTavolo = async (idTavolo: number) => {
    setLoading(true);
    await unlinkTavolo(idTavolo);
    setTavoloModal({ isOpen: false, mode: 'create', data: null }); // Chiudo il pop-up
    window.location.reload();
  };

  // ============================================================================
  // DA QUI IN POI INIZIA LA PARTE GRAFICA (L'HTML DELLA PAGINA FATTO CON REACT)
  // ============================================================================
  return (
    <div className="w-full flex flex-col md:flex-row text-[#781D2D]">

      {/* BARRA LATERALE A SINISTRA - Dove ci sono le sale e i bottoni grandi */}
      <div className="w-full md:w-1/4 md:min-w-[250px] bg-white/60 backdrop-blur-xl border-b md:border-b-0 md:border-r border-white/40 shadow-sm md:min-h-[70vh] p-4 md:p-6 rounded-t-3xl md:rounded-tr-none md:rounded-l-3xl flex flex-col">

        <h2 className="text-xl font-bold mb-4 md:mb-6 flex items-center gap-2">
          <LayoutDashboard className="text-[#D35400]" size={22} /> Sale
        </h2>

        {/* Qui stampo l'elenco di tutte le sale a mo' di bottoni */}
        <div className="flex overflow-x-auto md:flex-col gap-3 md:gap-0 md:space-y-2 flex-1 pb-4 md:pb-0 hide-scrollbar">
          {sale.map(s => (
            <button
              key={s.idSala}
              // Quando clicco una sala, la imposto come attiva e azzero tutte le modifiche per sicurezza
              onClick={() => { setActiveSalaId(s.idSala); setIsEditMode(false); setIsLinkMode(false); setSelectedTavoliIds([]); }}
              // Se è la sala attiva le metto lo sfondo rosso, altrimenti è bianca
              className={`min-w-max md:w-full text-left px-4 py-3 rounded-xl font-bold transition-all shrink-0 ${activeSalaId === s.idSala
                ? 'bg-[#781D2D] text-white shadow-md'
                : 'bg-white/80 text-gray-600 hover:bg-[#FDF1E9] hover:text-[#781D2D]'
                }`}
            >
              <div className="flex items-center justify-between gap-4">
                <span>{s.nome}</span>
                {/* Stampo quanti tavoli ha dentro questa sala */}
                <span className={`text-xs px-2 py-1 rounded-full ${activeSalaId === s.idSala ? 'bg-white/20' : 'bg-gray-100'}`}>
                  {s.tavoli.length} tavoli
                </span>
              </div>
            </button>
          ))}
          {/* Se non ho neanche una sala, mostro questo testo */}
          {sale.length === 0 && (
            <div className="text-sm text-gray-400 italic text-center p-4">Nessuna sala configurata.</div>
          )}
        </div>

        {/* Pannello dei bottoni di azione (in basso a sinistra) */}
        <div className="pt-4 md:pt-6 border-t border-[#F5CBA7]/40 space-y-3">

          {/* Bottone per creare nuova sala */}
          <button
            onClick={() => setNewSalaModal(true)}
            disabled={loading}
            className="w-full py-2.5 rounded-xl border-2 border-dashed border-[#D35400] text-[#D35400] font-bold hover:bg-[#D35400] hover:text-white transition-colors flex justify-center items-center gap-2"
          >
            <Plus size={18} /> Crea Nuova Sala
          </button>

          {/* Bottone principale "Modifica Layout" / "Fatto" */}
          <button
            onClick={() => {
              if (activeSala) {
                const newMode = !isEditMode;
                setIsEditMode(newMode); // Accendo/spengo la modifica
                if (!newMode) {
                  // Se sto spegnendo la modifica, chiudo per sicurezza anche l'unione tavoli
                  setIsLinkMode(false);
                  setSelectedTavoliIds([]);
                }
              }
            }}
            disabled={loading || !activeSala}
            // Cambio colore al bottone se sto modificando o no
            className={`w-full py-2.5 rounded-xl font-bold transition-colors flex justify-center items-center gap-2 ${!activeSala ? 'opacity-50 cursor-not-allowed bg-gray-200 text-gray-400' :
              isEditMode ? 'bg-[#D35400] text-white shadow-md' : 'bg-[#e2b793]/30 text-[#781D2D] hover:bg-[#e2b793]/50'
              }`}
          >
            {isEditMode ? <><Save size={18} /> Fatto</> : <><Edit3 size={18} /> Modifica Layout</>}
          </button>

          {/* Questi bottoni per l'unione tavoli appaiono SOLO se sono in Edit Mode */}
          {isEditMode && activeSala && (
            <div className="pt-2 border-t border-[#F5CBA7]/40 space-y-2 animate-in fade-in slide-in-from-top-2">

              {/* Bottone Collega Tavoli */}
              <button
                onClick={() => {
                  setIsLinkMode(!isLinkMode);
                  if (isLinkMode) setSelectedTavoliIds([]); // Se annullo, svuoto i selezionati
                }}
                className={`w-full py-2.5 rounded-xl font-bold transition-colors flex justify-center items-center gap-2 ${isLinkMode ? 'bg-indigo-600 text-white shadow-md' : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                  }`}
              >
                <Link2 size={18} /> {isLinkMode ? 'Annulla Collega' : 'Collega Tavoli'}
              </button>

              {/* Bottone "Crea Gruppo" che compare magicanemte solo se ho selezionato almeno un tavolo in Link Mode */}
              {isLinkMode && selectedTavoliIds.length > 0 && (
                <button
                  onClick={handleLinkTavoli}
                  disabled={selectedTavoliIds.length < 2 || loading} // Lo disabilito se ho cliccato solo 1 tavolo (non ha senso unirlo da solo)
                  className="w-full py-2.5 rounded-xl bg-indigo-500 text-white font-bold disabled:opacity-50 hover:bg-indigo-600 transition flex justify-center items-center gap-2 shadow-md"
                >
                  Crea Gruppo ({selectedTavoliIds.length})
                </button>
              )}
            </div>
          )}

          {/* Bottone per eliminare la sala (tutto rosso) */}
          <button
            onClick={handleDeleteSala}
            disabled={loading || !activeSala}
            className="w-full py-2.5 rounded-xl text-red-500 font-bold hover:bg-red-50 transition-colors flex justify-center items-center gap-2"
          >
            <Trash2 size={18} /> Elimina Sala
          </button>
        </div>
      </div>


      {/* ZONA CENTRALE - LA MAPPA DOVE VEDO FISICAMENTE I TAVOLI */}
      <div className="flex-1 w-full bg-[#FFFDFB]/60 backdrop-blur-sm p-4 md:p-8 rounded-b-3xl md:rounded-bl-none md:rounded-r-3xl border border-[#F5CBA7]/30 shadow-sm relative">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-2xl font-extrabold text-[#781D2D] flex items-center gap-3">
            {activeSala ? activeSala.nome : 'Seleziona o crea una sala'}
            {/* Questa è la tichetta lampeggiante (animate-pulse) se sono in modifica */}
            {isEditMode && <span className="bg-[#D35400] text-white text-xs px-3 py-1 rounded-full uppercase tracking-widest font-black animate-pulse">Builder Attivo</span>}
          </h3>

          {isEditMode && activeSala && (
            <button
              onClick={openAddTavolo}
              className="bg-green-600 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-green-700 transition shadow-md"
            >
              <Plus size={18} /> Aggiungi Tavolo
            </button>
          )}
        </div>

        {/* Se ho una sala selezionata, disegno la griglia dei tavoli */}
        {activeSala ? (
          // Questa è la CSS GRID: i tavoli si mettono in fila da soli. Niente coordinate complicate sul DB!
          <div className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 place-items-center bg-white/50 p-4 md:p-8 rounded-3xl min-h-[400px] border-2 ${isEditMode ? 'border-dashed border-[#D35400] bg-slate-50' : 'border-solid border-[#F5CBA7]/50'}`}>

            {/* Faccio un ciclo (map) su tutti i tavoli della sala e li stampo a schermo uno ad uno */}
            {activeSala.tavoli.map(tavolo => {

              const isSelected = selectedTavoliIds.includes(tavolo.idTavolo); // Controllo se è uno di quelli che sto unendo
              const isGrouped = !!tavolo.idGruppo; // Il doppio "!" mi trasforma la variabile in un VERO o FALSO

              // TRUCCO GENIALE: Prendo la stringa dell'idGruppo e le faccio fare una formula matematica per farmi dare un colore fisso. 
              // Così tutti i tavoli dello stesso gruppo avranno sempre lo stesso colore in automatico, senza salvarlo nel database!
              const groupColor = isGrouped ? `hsl(${tavolo.idGruppo!.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % 360}, 70%, 50%)` : '';

              return (
                <div
                  key={tavolo.idTavolo}
                  onClick={() => handleTavoloClick(tavolo)} // Quando ci clicco sopra, chiamo la mia funzione
                  // Qui metto una marea di classi CSS condizionali (se sono in edit, se è selezionato, ecc.)
                  className={`relative flex flex-col items-center justify-center w-24 h-24 rounded-full border-4 shadow-sm transition-all duration-300
                    ${isEditMode && !isLinkMode ? 'cursor-pointer hover:border-[#D35400] hover:scale-110 bg-[#FDF1E9] border-[#e2b793]' :
                      isLinkMode ? 'cursor-pointer hover:scale-105' : 'bg-white opacity-90'}
                    ${!isEditMode && !isGrouped ? 'border-green-400' : ''}
                    ${isLinkMode && isSelected ? 'border-indigo-600 bg-indigo-50 scale-110 ring-4 ring-indigo-200' : ''}
                  `}
                  // Applico il colore del gruppo ai bordi (tratteggiati) se fa parte di una comitiva
                  style={isGrouped ? {
                    borderColor: isLinkMode && isSelected ? undefined : groupColor,
                    borderStyle: isGrouped ? 'dashed' : 'solid',
                    borderWidth: '4px'
                  } : undefined}
                >
                  <span className="block font-black text-xl text-[#781D2D]">T{tavolo.numero}</span>
                  <span className="block text-xs font-semibold text-gray-500">{tavolo.posti} pax</span>

                  {/* Etichetta in alto col nome "Gruppo" del colore giusto */}
                  {isGrouped && !isLinkMode && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-black uppercase text-white px-2 py-0.5 rounded-full shadow-sm whitespace-nowrap" style={{ backgroundColor: groupColor }}>
                      Gruppo
                    </div>
                  )}

                  {/* Piccola icona della matita che compare in alto a destra quando passo col mouse per modificarlo */}
                  {isEditMode && !isLinkMode && (
                    <div className="absolute -top-2 -right-2 bg-[#D35400] text-white rounded-full p-1 shadow-md opacity-0 hover:opacity-100 transition-opacity">
                      <Edit3 size={12} />
                    </div>
                  )}

                  {/* Icona della catena se sto in modalità Link e ho selezionato questo tavolo */}
                  {isLinkMode && isSelected && (
                    <div className="absolute -top-2 -right-2 bg-indigo-600 text-white rounded-full p-1 shadow-md">
                      <Link2 size={12} />
                    </div>
                  )}
                </div>
              );
            })}

            {/* Questo è il cerchio "fantasma" col Più in mezzo per aggiungere velocemente un tavolo in fondo */}
            {isEditMode && (
              <button
                onClick={openAddTavolo}
                className="flex flex-col items-center justify-center w-24 h-24 rounded-full border-4 border-dashed border-gray-300 text-gray-400 hover:border-green-500 hover:text-green-500 hover:bg-green-50 transition-all duration-300"
              >
                <Plus size={24} />
              </button>
            )}

            {/* Scritta di aiuto se la sala è vuota */}
            {!isEditMode && activeSala.tavoli.length === 0 && (
              <div className="col-span-full text-gray-400 italic font-medium">
                Questa sala non ha ancora nessun tavolo. Clicca su "Modifica Layout" per aggiungerli.
              </div>
            )}

          </div>
        ) : (
          /* Schermata che vedo se non ho ancora cliccato su nessuna sala a sinistra */
          <div className="flex flex-col items-center justify-center h-full text-gray-400 opacity-50">
            <Grid size={64} className="mb-4" />
            <p className="text-lg font-medium">Canvas Layout Layout Vuoto</p>
          </div>
        )}
      </div>

      {/* --- DA QUI INIZIANO I POP-UP (MODALS) CHE COMPAIONO IN OVERLAY --- */}

      {/* Finestrella per creare la sala */}
      {newSalaModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          {/* Box bianco al centro */}
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold text-[#781D2D] mb-4">Crea Nuova Sala</h3>
            <input
              type="text"
              placeholder="Es. Veranda Esterna"
              value={newSalaName}
              onChange={e => setNewSalaName(e.target.value)} // Salvo quello che scrivo nello stato
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#D35400] focus:outline-none mb-6 font-medium text-[#781D2D]"
              autoFocus
            />
            {/* Bottoni Annulla e Crea */}
            <div className="flex justify-end gap-3">
              <button onClick={() => { setNewSalaModal(false); setNewSalaName(''); }} className="px-5 py-2.5 text-gray-500 font-medium hover:bg-gray-100 rounded-xl">Annulla</button>
              <button onClick={handleCreateSala} disabled={loading || !newSalaName} className="px-5 py-2.5 bg-[#D35400] text-white font-bold rounded-xl hover:bg-[#ba4a00] disabled:opacity-50">Crea Sala</button>
            </div>
          </div>
        </div>
      )}

      {/* Finestrella grossa per creare o modificare un Tavolo */}
      {tavoloModal.isOpen && tavoloModal.data && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">

            <h3 className="text-xl font-bold text-[#781D2D] mb-6 flex items-center gap-2">
              {/* Se mode è create stampo "Aggiungi", sennò "Modifica" */}
              <Grid className="text-[#D35400]" size={24} /> {tavoloModal.mode === 'create' ? 'Aggiungi Tavolo' : 'Modifica Tavolo'}
            </h3>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Input per il numero del tavolo */}
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-1">Numero Identificativo</label>
                  <input
                    type="number" min={1}
                    value={tavoloModal.data.numero}
                    // Qui uso lo spread operator (...prev) per aggiornare solo il numero senza perdere gli altri dati del tavolo!
                    onChange={e => setTavoloModal(prev => ({ ...prev, data: { ...prev.data!, numero: Number(e.target.value) } }))}
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#D35400] font-bold text-lg"
                  />
                </div>
                {/* Input per la capienza totale (posti) */}
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-1">Capacità Max (Posti)</label>
                  <input
                    type="number" min={1}
                    value={tavoloModal.data.posti}
                    onChange={e => {
                      const newPosti = Number(e.target.value);
                      setTavoloModal(prev => ({
                        ...prev,
                        data: {
                          ...prev.data!,
                          posti: newPosti,
                          // Se abbasso i posti totali, abbasso in automatico anche i posti minimi (non possono mai essere più dei totali)
                          postiMinimi: Math.min(prev.data!.postiMinimi ?? 1, newPosti)
                        }
                      }));
                    }}
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#D35400] font-bold text-lg"
                  />
                </div>
              </div>

              {/* Input per la capacità minima */}
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1">
                  Capacità Minima (Posti)
                  <span className="ml-2 text-xs text-gray-400 font-normal">Min accettabile per una prenotazione</span>
                </label>
                <input
                  type="number"
                  min={1}
                  max={tavoloModal.data.posti || 99} // Non ti faccio superare i posti massimi
                  value={tavoloModal.data.postiMinimi ?? 1}
                  onChange={e => {
                    const val = Number(e.target.value);
                    setTavoloModal(prev => ({
                      ...prev,
                      data: { ...prev.data!, postiMinimi: val }
                    }));
                  }}
                  // Se l'utente scrive una cavolata a mano (minimi > massimi), faccio diventare l'input rosso!
                  className={`w-full p-3 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-[#D35400] font-bold text-lg ${(tavoloModal.data.postiMinimi ?? 1) > (tavoloModal.data.posti || 99)
                    ? 'border-red-400 bg-red-50'
                    : 'border-gray-200'
                    }`}
                />

                {/* Mostro gli errori scritti in rosso sotto all'input */}
                {(tavoloModal.data.postiMinimi ?? 1) > (tavoloModal.data.posti || 99) && (
                  <p className="text-red-500 text-xs font-semibold mt-1">
                    ⚠ La capacità minima non può superare quella massima ({tavoloModal.data.posti}).
                  </p>
                )}
                {(tavoloModal.data.postiMinimi ?? 1) < 1 && (
                  <p className="text-red-500 text-xs font-semibold mt-1">
                    ⚠ La capacità minima deve essere almeno 1.
                  </p>
                )}
              </div>
            </div>

            {/* Pulsanti in basso nella finestrella */}
            <div className="mt-8 flex justify-between items-center">

              <div className="flex flex-col gap-2">
                {/* Mostro i bottoni di eliminazione/separazione SOLO se sto modificando un tavolo già esistente */}
                {tavoloModal.mode === 'edit' ? (
                  <>
                    <button onClick={removeTavolo} disabled={loading} className="px-4 py-2 text-red-500 font-bold hover:bg-red-50 focus:bg-red-50 rounded-xl transition flex items-center gap-2 text-sm">
                      <Trash2 size={16} /> Elimina Tavolo
                    </button>
                    {/* Se il tavolo fa parte di un gruppo, mostro il bottone per staccarlo */}
                    {tavoloModal.data?.idGruppo && (
                      <button onClick={() => handleUnlinkTavolo(tavoloModal.data!.idTavolo!)} disabled={loading} className="px-4 py-2 text-orange-500 font-bold hover:bg-orange-50 focus:bg-orange-50 rounded-xl transition flex items-center gap-2 text-sm">
                        <Unlink size={16} /> Separa dal Gruppo
                      </button>
                    )}
                  </>
                ) : <div></div>}
              </div>

              <div className="flex gap-2 self-end">
                <button onClick={() => setTavoloModal({ isOpen: false, mode: 'create', data: null })} className="px-5 py-2.5 text-gray-500 font-medium hover:bg-gray-100 rounded-xl transition-colors">Annulla</button>
                {/* Disabilito il tasto Salva se ci sono errori logici nei posti */}
                <button
                  onClick={saveTavolo}
                  disabled={loading || (tavoloModal.data.postiMinimi ?? 1) > (tavoloModal.data.posti || 99) || (tavoloModal.data.postiMinimi ?? 1) < 1}
                  className="px-5 py-2.5 bg-[#781D2D] text-white font-bold rounded-xl hover:bg-[#5f1723] transition-colors shadow-md disabled:opacity-50"
                >Salva</button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
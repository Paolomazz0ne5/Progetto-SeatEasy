import Database from 'better-sqlite3';
import path from 'path';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import nextDynamic from 'next/dynamic';
import { ReservationData } from '@/components/GestoreDashboardClient';
// Importiamo il componente visivo (quello della tabella)
const GestoreDashboardClient = nextDynamic(() => import('@/components/GestoreDashboardClient'));
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

// Diciamo a Next.js: "Non salvare questa pagina in cache (memoria)". 
// Vogliamo che ricarichi i dati freschi dal database ad ogni singolo refresh, 
// altrimenti il gestore non vedrebbe le nuove prenotazioni arrivate all'istante.
export const dynamic = 'force-dynamic';

// IL SERVER COMPONENT
// Gira ESCLUSIVAMENTE sul server Node.js, mai sul browser.
export default async function GestoreDashboard({
  searchParams,
}: {
  searchParams: Promise<{ ristorante?: string }>;
}) {
  // 1. CONTROLLO AUTENTICAZIONE
  // Leggiamo i cookie in arrivo dalla richiesta HTTP. 
  // Se non c'è l'ID di sessione, usiamo redirect() per sbattere l'utente alla pagina di login.
  const cookieStore = await cookies();
  const sessionId = cookieStore.get('seateasy_session')?.value;
  if (!sessionId) redirect('/auth');

  // 2. LETTURA DEI PARAMETRI DALL'URL
  // In Next.js 15 i parametri di ricerca sono asincroni, quindi usiamo await.
  // Peschiamo "?ristorante=1" e lo trasformiamo in un numero intero.
  const params = await searchParams;
  const ristoranteId = params.ristorante ? parseInt(params.ristorante, 10) : NaN;

  // Se nell'URL hanno scritto una cavolata o manca l'ID, li rimandiamo alla lista dei ristoranti
  if (isNaN(ristoranteId)) redirect('/gestore/ristoranti');

  const dbPath = path.resolve(process.cwd(), 'database.db');
  const db = new Database(dbPath);

  // 3. CONTROLLO DI SICUREZZA (OWNERSHIP)
  // Non mi fido dell'ID nell'URL. Interrogo il DB per assicurarmi che il ristorante
  // richiesto appartenga EFFETTIVAMENTE alla persona loggata (sessionId).
  const ownership = db
    .prepare(
      'SELECT idRistorante, nome, penaleNoShow, messaggioPenale FROM Ristorante WHERE idRistorante = ? AND idGestoreRistorante = ?'
    )
    .get(ristoranteId, Number(sessionId)) as { idRistorante: number; nome: string; penaleNoShow: number; messaggioPenale: string | null } | undefined;

  // Se provi a spiare il ristorante di un altro, la query fallisce e ti caccio via.
  if (!ownership) {
    db.close();
    redirect('/gestore/ristoranti');
  }

  const ristoranteNome = ownership.nome;

  // 4. ESTRAZIONE DELLE PRENOTAZIONI (LA MEGA-QUERY)
  // Facciamo una catena di JOIN per risalire da Prenotazione -> Turno -> Orario -> Ristorante.
  const rawReservations = db
    .prepare(
      `SELECT 
        P.idPrenotazione,
        P.idCliente,
        A.nome   AS clienteNome,
        A.cognome AS clienteCognome,
        A.telefono,
        P.dataPrenotazione,
        P.numeroPersone,
        P.stato,
        P.noteCliente,
        P.caparraPagata,
        (
          -- SUBQUERY: Conto quante volte QUESTO cliente ha saltato una prenotazione in passato.
          -- È il "bollino nero" del cliente.
          SELECT COUNT(*) 
          FROM Prenotazione P2 
          WHERE P2.idCliente = P.idCliente AND P2.stato = 'noShow'
        ) AS noShowCount
      FROM Prenotazione P
      JOIN Cliente    C ON P.idCliente  = C.idAccount
      JOIN Account    A ON C.idAccount  = A.idAccount
      JOIN Turno      T ON P.idTurno    = T.idTurno
      JOIN Orario     O ON T.idOrario   = O.idOrario
      WHERE O.idRistorante = ?
      ORDER BY P.dataPrenotazione ASC`
    )
    .all(ristoranteId) as ReservationData[];

  // Chiudo sempre il database dopo aver estratto quello che mi serve
  db.close();

  // Calcolo al volo due statistiche filtrando l'array appena scaricato
  const attive = rawReservations.filter(r => r.stato !== 'noShow' && r.stato !== 'Annullata').length;
  const noShows = rawReservations.filter(r => r.stato === 'noShow').length;

  return (
    <>
      {/* ... (Codice grafico dello sfondo omesso nei commenti per brevità, non fa calcoli) ... */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[10%] left-[-5%] w-[40vw] h-[40vw] rounded-full bg-[#e2b793]/20 blur-3xl opacity-50 mix-blend-multiply"></div>
      </div>

      <div className="flex flex-col py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full relative z-10 min-h-full">

        <div className="mb-10 border-b-2 border-[#F5CBA7] pb-6">
          <div className="flex items-center gap-4 mb-2">
            <Link href="/gestore/ristoranti" className="p-2 bg-gray-100 hover:bg-[#FDF1E9] text-gray-500 hover:text-[#D35400] rounded-xl transition-colors">
              <ArrowLeft size={20} />
            </Link>
            <h1 className="text-4xl font-extrabold text-[#781D2D] tracking-tight">
              {ristoranteNome}
            </h1>
          </div>
          <p className="text-[#D35400] font-medium mt-2 pl-14">
            Panoramica operativa e gestione delle prenotazioni.
          </p>
        </div>

        {/* IL PASSAGGIO DI CONSEGNE: 
          Chiamo il componente Client che disegna l'interfaccia e gli "inietto" 
          le variabili caricate dal database tramite le "Props" (reservations, stats...).
        */}
        <GestoreDashboardClient
          reservations={rawReservations}
          stats={{ attive, noShows }}
          penaleInfo={{ amount: ownership.penaleNoShow, message: ownership.messaggioPenale }}
        />
      </div>
    </>
  );
}

import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import { getRestaurants } from '@/app/actions/cliente';
import { cookies } from 'next/headers';
import RestaurantList from './RestaurantList';

// Definisce e esporta come default una funzione asincrona che rappresenta il componente della Dashboard Cliente.
// Accetta come parametro 'props', che contiene 'searchParams' (i parametri di query nell'URL, es. ?pax=2&data=2026-05-13).
// In Next.js recente, 'searchParams' è una Promise, quindi va tipizzata come Promise e risolta con 'await'.
export default async function ClienteDashboard(props: { searchParams: Promise<{ pax?: string; data?: string }> }) {

  // Attende la risoluzione della funzione cookies() per accedere allo store dei cookie sul server
  const cookieStore = await cookies();
  const isLoggedIn = cookieStore.has('seateasy_session');
  const searchParams = await props.searchParams;
  const pax = parseInt(searchParams?.pax || '1', 10);

  // Prende la data passata nell'URL. Se non c'è, genera la data odierna in formato ISO (YYYY-MM-DD) prendendo solo la parte prima della 'T'
  const data = searchParams?.data || new Date().toISOString().split('T')[0];
  const ristoranti = await getRestaurants(pax);


  return (
    // Contenitore principale con altezza minima pari allo schermo, sfondo personalizzato bianco panna e font sans-serif
    <div className="min-h-screen bg-[#FFFDFB] font-sans">

      {/* Renderizza la Navbar passando lo stato di login (true/false) come prop per mostrare "Accedi" o il profilo utente */}
      <Navbar isLoggedIn={isLoggedIn} />

      {/* Tag semantico main per il contenuto principale della pagina */}
      <main>
        {/* Renderizza la sezione Hero passando i valori iniziali di pax e data recuperati dall'URL per pre-popolare i campi di ricerca */}
        <Hero initialPax={pax} initialDate={data} />

        {/* Renderizza la lista dei ristoranti passando l'array dei ristoranti trovati sul server, più i filtri attuali */}
        <RestaurantList initialRestaurants={ristoranti} pax={pax} date={data} />
      </main>

      {/* Footer semantico con sfondo bordeaux, testo color crema e padding verticale (py-16) */}
      <footer className="bg-[#781D2D] text-[#F5CBA7] py-16">
        {/* Contenitore per centrare il testo e gestire la larghezza massima responsive */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Paragrafo del copyright con opacità al 60% sul testo */}
          <p className="text-[#F5CBA7]/60 font-medium">
            {/* Genera dinamicamente l'anno corrente sul server per evitare di doverlo aggiornare a mano */}
            &copy; {new Date().getFullYear()} SeatEasy - Semplifica la tua esperienza culinaria.
          </p>
        </div>
      </footer>
    </div>
  );
}
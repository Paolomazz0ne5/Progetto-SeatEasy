// Importa l'azione server-side che si occupa di recuperare i dati anagrafici e le impostazioni del cliente dal database
import { getClientProfile } from "@/app/actions/cliente";

// Importa il Client Component grafico che si occuperà di renderizzare il form e i dettagli del profilo sullo schermo
import ProfiloClient, { Profile } from "@/app/cliente/profilo/ProfiloClient";

// Importa la barra di navigazione superiore dell'applicazione
import Navbar from "@/components/Navbar";

// Importa l'utility nativa di Next.js per accedere e leggere i cookie di sessione memorizzati nel server
import { cookies } from "next/headers";

// Importa la funzione di Next.js per interrompere l'esecuzione e reindirizzare forzatamente l'utente su un altro URL
import { redirect } from "next/navigation";

// Definizione del componente Server principale asincrono per la pagina del profilo
export default async function ProfiloPage() {

  // Recupera in modo asincrono lo store dei cookie inviati dal browser del client
  const cookieStore = await cookies();

  // Controlla se tra i cookie esiste quello chiamato "seateasy_session", salvando il risultato booleano (true/false)
  const isLoggedIn = cookieStore.has("seateasy_session");

  // PRIMO CONTROLLO DI SICUREZZA: Se il cookie di sessione NON esiste, l'utente non è autenticato
  if (!isLoggedIn) {
    // Interrompe immediatamente la pagina e reindirizza l'utente alla schermata di autenticazione
    redirect("/auth");
  }

  // Esegue l'azione server-side per estrarre i dati del profilo dal DB, applicando il casting del tipo TypeScript (Profile o null)
  const profile = await getClientProfile() as Profile | null;

  // SECONDO CONTROLLO DI SICUREZZA: Se il cookie c'era ma il profilo non è stato trovato nel database (es. account eliminato)
  if (!profile) {
    // Reindirizza di nuovo l'utente alla pagina di login per sicurezza
    redirect("/auth");
  }

  // Se tutti i controlli di sicurezza vanno a buon fine, ritorna l'interfaccia grafica (JSX) della pagina
  return (
    <div className="min-h-screen bg-[#FFFDFB]">
      {/* Inserisce la Navbar passando lo stato di login attivo */}
      <Navbar isLoggedIn={isLoggedIn} />

      {/* Contenitore principale della pagina con spaziatura superiore per non finire sotto la Navbar */}
      <main className="pt-28 pb-12">
        {/* Renderizza il componente interattivo del profilo, passandogli come "prop" i dati puliti estratti dal database */}
        <ProfiloClient profile={profile} />
      </main>
    </div>
  );
}
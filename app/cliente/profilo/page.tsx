
import { getClientProfile } from "@/app/actions/cliente";
import ProfiloClient, { Profile } from "@/app/cliente/profilo/ProfiloClient";
import Navbar from "@/components/Navbar";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

// Definizione del componente Server principale asincrono per la pagina del profilo
export default async function ProfiloPage() {

  const cookieStore = await cookies();
  const isLoggedIn = cookieStore.has("seateasy_session");

  // PRIMO CONTROLLO DI SICUREZZA: Se il cookie di sessione NON esiste, l'utente non è autenticato
  if (!isLoggedIn) {
    // Interrompe immediatamente la pagina e reindirizza l'utente alla schermata di autenticazione
    redirect("/auth");
  }

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
import { getClientProfile } from "@/app/actions/cliente";
import ProfiloClient, { Profile } from "@/app/cliente/profilo/ProfiloClient";
import Navbar from "@/components/Navbar";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function ProfiloPage() {
  const cookieStore = await cookies();
  const isLoggedIn = cookieStore.has("seateasy_session");

  if (!isLoggedIn) {
    redirect("/auth");
  }

  const profile = await getClientProfile() as Profile | null;

  if (!profile) {
    redirect("/auth");
  }

  return (
    <div className="min-h-screen bg-[#FFFDFB]">
      <Navbar isLoggedIn={isLoggedIn} />
      <main className="pt-28 pb-12">
        <ProfiloClient profile={profile} />
      </main>
    </div>
  );
}

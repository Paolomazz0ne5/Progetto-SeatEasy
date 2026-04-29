import Navbar from '@/components/Navbar';
import Hero from '@/components/Hero';
import { getRestaurants } from '@/app/actions/cliente';
import { cookies } from 'next/headers';
import RestaurantList from './RestaurantList';

export default async function ClienteDashboard() {
  const cookieStore = await cookies();
  const isLoggedIn = cookieStore.has('seateasy_session');
  const ristoranti = await getRestaurants();

  return (
    <div className="min-h-screen bg-[#FFFDFB] font-sans">
      <Navbar isLoggedIn={isLoggedIn} />
      
      <main>
        <Hero />
        <RestaurantList initialRestaurants={ristoranti} />
      </main>

      <footer className="bg-[#781D2D] text-[#F5CBA7] py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-[#F5CBA7]/60 font-medium">
            &copy; {new Date().getFullYear()} SeatEasy - Semplifica la tua esperienza culinaria.
          </p>
        </div>
      </footer>
    </div>
  );
}

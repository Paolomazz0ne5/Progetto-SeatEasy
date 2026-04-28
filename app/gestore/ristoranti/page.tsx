import { getMyRistoranti } from '@/app/actions/ristoranti';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import RistorantiClient from './RistorantiClient';

export const metadata = {
  title: 'I Miei Ristoranti – SeatEasy',
  description: 'Gestisci i tuoi ristoranti su SeatEasy.',
};

export default async function MieiRistorantiPage() {
  const cookieStore = await cookies();
  const session = cookieStore.get('seateasy_session');
  if (!session) redirect('/auth');

  const result = await getMyRistoranti();
  const ristoranti = result.data ?? [];

  return (
    <>
      {/* Decorative Background Elements */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[10%] left-[-5%] w-[40vw] h-[40vw] rounded-full bg-[#e2b793]/20 blur-3xl opacity-50 mix-blend-multiply"></div>
      </div>

      <div className="flex flex-col py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full relative z-10 min-h-full">
        <RistorantiClient initialData={ristoranti} />
      </div>
    </>
  );
}

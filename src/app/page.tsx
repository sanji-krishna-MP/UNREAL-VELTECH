import { redirect } from 'next/navigation';
import { getAuthenticatedSession } from '@/lib/auth';

export default async function HomePage() {
  const session = await getAuthenticatedSession();

  if (!session) {
    redirect('/login');
  }

  if (session.profile.role === 'officer') {
    redirect('/dashboard');
  } else {
    redirect('/inbox');
  }
}

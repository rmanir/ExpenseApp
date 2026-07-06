import { cookies } from 'next/headers';
import HomeClient from './client-page';

export default async function Page() {
  const cookieStore = await cookies();
  const user = cookieStore.get('expense_user')?.value || '';
  
  return <HomeClient initialUser={user} />;
}

import { NextResponse } from 'next/server';
import { getRecentTransactions, getSummaries } from '@/lib/sheets';
import { cookies } from 'next/headers';

export async function GET() {
  const cookieStore = await cookies();
  const session = cookieStore.get('expense_session');
  const user = cookieStore.get('expense_user');

  if (session?.value !== process.env.APP_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const recent = await getRecentTransactions(7);
    const summary = await getSummaries();

    return NextResponse.json({ recent, summary, user: user?.value || 'User' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message, user: user?.value || 'User' }, { status: 500 });
  }
}

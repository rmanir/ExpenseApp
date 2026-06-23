import { NextResponse } from 'next/server';
import { getRecentTransactions, getTodaySummary } from '@/lib/sheets';
import { cookies } from 'next/headers';

export async function GET() {
  const cookieStore = await cookies();
  const session = cookieStore.get('expense_session');

  if (session?.value !== process.env.APP_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const recent = await getRecentTransactions(7);
    const summary = await getTodaySummary();

    return NextResponse.json({ recent, summary });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

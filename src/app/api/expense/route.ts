import { NextResponse } from 'next/server';
import { parseTransaction } from '@/lib/parser';
import { saveTransaction } from '@/lib/sheets';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  const cookieStore = await cookies();
  const session = cookieStore.get('expense_session');

  if (session?.value !== process.env.APP_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { text } = body;
    if (!text) {
      return NextResponse.json({ error: 'Missing text' }, { status: 400 });
    }

    const tx = parseTransaction(text);
    const sheetName = await saveTransaction(tx);

    return NextResponse.json({ success: true, transaction: tx, sheetName });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

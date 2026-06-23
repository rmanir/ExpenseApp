import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  try {
    const { password } = await req.json();
    
    if (password === process.env.APP_PASSWORD) {
      const cookieStore = await cookies();
      cookieStore.set('expense_session', password, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 30 * 24 * 60 * 60, // 30 days
        path: '/',
      });
      return NextResponse.json({ success: true });
    }
    
    return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to login' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';

export async function GET(req: NextRequest) {
  const session = await getSession();
  
  const type = req.nextUrl.searchParams.get('type');
  const nextUrl = req.nextUrl.searchParams.get('next');
  
  if (type === 'ums') {
    session.umsCookies = undefined;
    session.enrollment = undefined;
  } else if (type === 'accsoft') {
    session.accsoftCookies = undefined;
    session.isLoggedIn = false;
  } else {
    session.destroy();
  }

  await session.save();
  
  const redirectUrl = new URL('/', req.url);
  if (type === 'ums' || type === 'accsoft') {
    redirectUrl.searchParams.set('tab', type);
  }
  
  if (nextUrl) {
    redirectUrl.searchParams.set('next', nextUrl);
  }
  
  return NextResponse.redirect(redirectUrl);
}

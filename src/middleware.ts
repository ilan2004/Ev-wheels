import { NextResponse } from 'next/server';

export default function middleware() {
  // No-op middleware now that Clerk is removed.
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)']
};

import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';

const isProtectedRouteCheck = createRouteMatcher(['/dashboard(.*)']);
const isPublicRoute = createRouteMatcher(['/sign-in(.*)', '/sign-up(.*)', '/auth/assign-role']);

export default clerkMiddleware(async (auth, req: NextRequest) => {
  const pathname = req.nextUrl.pathname;

  // Allow public routes
  if (isPublicRoute(req)) {
    return NextResponse.next();
  }

  // Protect dashboard routes - just ensure user is authenticated
  if (isProtectedRouteCheck(req)) {
    await auth.protect();
  }

  return NextResponse.next();
});
export const config = {
  matcher: [
    // Only run middleware for dashboard routes to minimize overhead
    '/dashboard/:path*'
  ]
};

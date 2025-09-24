import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { getUserRole } from '@/lib/auth/utils';
import { UserRole } from '@/lib/auth/roles';
import { isAdminOnlyRoute, isProtectedRoute } from '@/lib/auth/utils';

const isProtectedRouteCheck = createRouteMatcher(['/dashboard(.*)']);
const isPublicRoute = createRouteMatcher(['/sign-in(.*)', '/sign-up(.*)']);

export default clerkMiddleware(async (auth, req: NextRequest) => {
  const { userId, sessionClaims } = await auth();
  const pathname = req.nextUrl.pathname;

  // Allow public routes
  if (isPublicRoute(req)) {
    return NextResponse.next();
  }

  // Protect dashboard routes
  if (isProtectedRouteCheck(req)) {
    await auth.protect();
    
    // If user is authenticated, check role-based access
    if (userId && sessionClaims) {
      const user = sessionClaims as any;
      const userRole = getUserRole(user);
      
      // If user has no role assigned, redirect to role assignment
      if (!userRole) {
        return NextResponse.redirect(new URL('/auth/assign-role', req.url));
      }
      
      // Check admin-only routes
      if (isAdminOnlyRoute(pathname) && userRole !== UserRole.ADMIN) {
        return NextResponse.redirect(new URL('/dashboard?error=unauthorized', req.url));
      }
    }
  }

  return NextResponse.next();
});
export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)'
  ]
};

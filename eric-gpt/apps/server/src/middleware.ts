import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { rateLimitMiddleware, sensitiveRouteRateLimit } from './middleware/rateLimit';

export async function middleware(request: NextRequest) {
  // Check if the requested path doesn't match any existing routes
  // This is a simplified check. In a real app, you'd need a more comprehensive route check.
  const path = request.nextUrl.pathname;
  
  // List of known API routes - expand this based on your app's routes
  const knownApiRoutes = [
    '/api/worksheets',
    '/api/submissions',
    '/api/stripe/create-checkout-session',
    '/api/stripe/webhook',
    '/api/stripe/customer-portal',
    // Add other known API routes here
  ];
  
  // Check if the path starts with /api/ but doesn't match known routes
  if (path.startsWith('/api/') && !knownApiRoutes.some(route => path.startsWith(route))) {
    return NextResponse.redirect(new URL('/page-not-found', request.url));
  }

  // Apply rate limiting to specific routes
  if (request.nextUrl.pathname.startsWith('/api/submissions')) {
    // Apply stricter rate limiting to submission endpoints (OpenAI calls)
    const rateLimitResponse = await sensitiveRouteRateLimit(request);
    if (rateLimitResponse) return rateLimitResponse;
  } else if (
    request.nextUrl.pathname.includes('/pdf') ||
    request.nextUrl.pathname.startsWith('/api/stripe')
  ) {
    // Apply standard rate limiting to PDF and Stripe endpoints
    const rateLimitResponse = await rateLimitMiddleware(request);
    if (rateLimitResponse) return rateLimitResponse;
  }
  
  // Apply CORS headers to all responses
  const res = NextResponse.next();
  res.headers.append('Access-Control-Allow-Credentials', "true");
  res.headers.append('Access-Control-Allow-Origin', process.env.NEXT_PUBLIC_APP_URL || "");
  res.headers.append('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.headers.append(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization'
  );
  return res;
}

export const config = {
  matcher: '/:path*',
}

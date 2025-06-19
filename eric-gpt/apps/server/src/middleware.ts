import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { rateLimitMiddleware, sensitiveRouteRateLimit } from './middleware/rateLimit';

export async function middleware(request: NextRequest) {
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

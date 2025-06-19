import { NextRequest, NextResponse } from 'next/server';

/**
 * Rate limiting configuration
 * Uses a token bucket algorithm to limit requests
 */
const rateLimit = {
  tokenBucket: new Map<string, { tokens: number; lastRefill: number }>(),
  refillRate: 10, // tokens per minute
  maxTokens: 20, // maximum tokens per bucket
  interval: 60 * 1000, // 1 minute in milliseconds
};

/**
 * Rate limiting middleware for API routes
 * Limits requests based on IP address
 * 
 * @param request - The incoming request
 * @returns NextResponse or undefined to continue
 */
export async function rateLimitMiddleware(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') || 'anonymous';
  const now = Date.now();
  
  let bucket = rateLimit.tokenBucket.get(ip);
  if (!bucket) {
    bucket = { tokens: rateLimit.maxTokens, lastRefill: now };
    rateLimit.tokenBucket.set(ip, bucket);
  }
  
  // Refill tokens based on time elapsed
  const timeElapsed = now - bucket.lastRefill;
  const tokensToAdd = Math.floor((timeElapsed / rateLimit.interval) * rateLimit.refillRate);
  if (tokensToAdd > 0) {
    bucket.tokens = Math.min(bucket.tokens + tokensToAdd, rateLimit.maxTokens);
    bucket.lastRefill = now;
  }
  
  if (bucket.tokens <= 0) {
    console.warn(`Rate limit exceeded for IP: ${ip}`);
    return NextResponse.json(
      { error: 'Too many requests, please try again later' },
      { status: 429 }
    );
  }
  
  bucket.tokens--;
  return NextResponse.next();
}

/**
 * Stricter rate limiting for sensitive endpoints like OpenAI calls
 * Uses a more restrictive token bucket
 */
export async function sensitiveRouteRateLimit(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') || 'anonymous';
  const now = Date.now();
  
  // Use a separate bucket for sensitive routes with stricter limits
  const bucketKey = `sensitive:${ip}`;
  let bucket = rateLimit.tokenBucket.get(bucketKey);
  if (!bucket) {
    bucket = { tokens: 5, lastRefill: now }; // Lower initial tokens
    rateLimit.tokenBucket.set(bucketKey, bucket);
  }
  
  // Refill tokens more slowly for sensitive routes
  const timeElapsed = now - bucket.lastRefill;
  const tokensToAdd = Math.floor((timeElapsed / rateLimit.interval) * 3); // Lower refill rate
  if (tokensToAdd > 0) {
    bucket.tokens = Math.min(bucket.tokens + tokensToAdd, 5); // Lower max tokens
    bucket.lastRefill = now;
  }
  
  if (bucket.tokens <= 0) {
    console.warn(`Sensitive route rate limit exceeded for IP: ${ip}`);
    return NextResponse.json(
      { error: 'Too many requests for this service, please try again later' },
      { status: 429 }
    );
  }
  
  bucket.tokens--;
  return NextResponse.next();
}

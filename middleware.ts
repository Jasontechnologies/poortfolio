import { NextRequest, NextResponse } from 'next/server';

type Bucket = {
  count: number;
  resetAt: number;
};

declare global {
  // eslint-disable-next-line no-var
  var __jwotGatewayRateStore: Map<string, Bucket> | undefined;
}

const gatewayStore = globalThis.__jwotGatewayRateStore ?? new Map<string, Bucket>();
if (!globalThis.__jwotGatewayRateStore) {
  globalThis.__jwotGatewayRateStore = gatewayStore;
}

const gatewayRules: Record<string, { limit: number; windowMs: number }> = {
  '/auth/register': { limit: 30, windowMs: 10 * 60 * 1000 },
  '/auth/login': { limit: 60, windowMs: 10 * 60 * 1000 },
  '/auth/refresh': { limit: 120, windowMs: 10 * 60 * 1000 },
  '/chat/message': { limit: 120, windowMs: 60 * 1000 },
  '/support/complaints': { limit: 40, windowMs: 60 * 60 * 1000 },
  '/api/contact': { limit: 20, windowMs: 60 * 60 * 1000 }
};

function getIpAddress(request: NextRequest) {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0]?.trim() || 'unknown';
  return request.headers.get('x-real-ip') ?? 'unknown';
}

function getRequestId(request: NextRequest) {
  return request.headers.get('x-request-id') ?? crypto.randomUUID();
}

function withRequestId(response: NextResponse, requestId: string) {
  response.headers.set('x-request-id', requestId);
  return response;
}

function nextWithRequestId(request: NextRequest, requestId: string) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-request-id', requestId);
  const response = NextResponse.next({
    request: {
      headers: requestHeaders
    }
  });
  return withRequestId(response, requestId);
}

function gatewayAllow(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const existing = gatewayStore.get(key);

  if (!existing || now >= existing.resetAt) {
    gatewayStore.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfter: Math.ceil(windowMs / 1000) };
  }

  existing.count += 1;
  gatewayStore.set(key, existing);

  if (existing.count > limit) {
    return {
      allowed: false,
      retryAfter: Math.max(1, Math.ceil((existing.resetAt - now) / 1000))
    };
  }

  return { allowed: true, retryAfter: 0 };
}

export function middleware(request: NextRequest) {
  const requestId = getRequestId(request);

  if (request.method !== 'POST') {
    return nextWithRequestId(request, requestId);
  }

  const rule = gatewayRules[request.nextUrl.pathname];
  if (!rule) {
    return nextWithRequestId(request, requestId);
  }

  const ip = getIpAddress(request);
  const key = `${request.nextUrl.pathname}:${ip}`;
  const check = gatewayAllow(key, rule.limit, rule.windowMs);

  if (!check.allowed) {
    return withRequestId(
      NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        {
          status: 429,
          headers: {
            'Retry-After': String(check.retryAfter)
          }
        }
      ),
      requestId
    );
  }

  return nextWithRequestId(request, requestId);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)']
};

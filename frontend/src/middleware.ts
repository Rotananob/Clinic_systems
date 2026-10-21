import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { extractTenantSubdomain } from './lib/subdomain';

export function middleware(request: NextRequest) {
  const host = request.headers.get('host') || '';

  // Extract tenant from subdomain if present
  let tenantSlug = extractTenantSubdomain(host);

  // If not from subdomain, check query param (?tenant=...) or existing cookie
  if (!tenantSlug) {
    tenantSlug = request.nextUrl.searchParams.get('tenant') ||
                 request.cookies.get('clinicos_tenant_slug')?.value ||
                 null;
  }

  // Clone the request headers so we can append custom headers
  const requestHeaders = new Headers(request.headers);
  if (tenantSlug) {
    requestHeaders.set('x-tenant-slug', tenantSlug);
  }

  // All root "/" requests ALWAYS render the Home / Landing Page directly
  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  // Persist tenant cookie if detected
  if (tenantSlug) {
    response.cookies.set('clinicos_tenant_slug', tenantSlug, {
      path: '/',
      sameSite: 'lax',
      httpOnly: false, // accessible to client API helpers
    });
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public assets (.png, .jpg, .svg, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};

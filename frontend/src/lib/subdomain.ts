export interface SubdomainResolution {
  subdomain: string | null;
  isTenant: boolean;
  isSystemOrApex: boolean;
  cleanHostname: string;
}

const RESERVED_SUBDOMAINS = new Set([
  'www',
  'api',
  'admin',
  'superadmin',
  'super-admin',
  'app',
  'assets',
  'static',
  'cdn',
  'mail',
  'auth',
  'docs',
  'status',
]);

export const DEFAULT_APEX_DOMAIN =
  (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_APP_DOMAIN) || 'clinic.com';

export function sanitizeHostname(rawHost: string | null | undefined): string {
  if (!rawHost) return '';
  return rawHost.split(':')[0].trim().toLowerCase();
}

export function extractTenantSubdomain(
  rawHost: string | null | undefined,
  apexDomain = DEFAULT_APEX_DOMAIN
): string | null {
  const host = sanitizeHostname(rawHost);
  if (!host) return null;

  // Exact apex domains, loopback addresses, or general deployment platforms
  if (
    host === 'localhost' ||
    host === '127.0.0.1' ||
    host === '0.0.0.0' ||
    host === apexDomain ||
    host === `www.${apexDomain}` ||
    host === 'clinic.com' ||
    host === 'www.clinic.com' ||
    host === 'clinicos.app' ||
    host === 'www.clinicos.app' ||
    host.endsWith('.vercel.app') ||
    host === 'vercel.app' ||
    host.endsWith('.web.app') ||
    host === 'web.app' ||
    host.endsWith('.firebaseapp.com') ||
    host === 'firebaseapp.com' ||
    host.endsWith('.github.io') ||
    host === 'github.io' ||
    host.endsWith('.railway.app') ||
    host.endsWith('.onrender.com')
  ) {
    return null;
  }

  // Handle local development subdomain: e.g. rotana.localhost
  if (host.endsWith('.localhost')) {
    const parts = host.split('.');
    const candidate = parts[0]?.trim();
    if (candidate && !RESERVED_SUBDOMAINS.has(candidate)) {
      return candidate;
    }
    return null;
  }

  // Handle production or staging wildcard: e.g. rotana.clinic.com or vannda.clinic.com
  const candidateDomains = Array.from(new Set([apexDomain, 'clinic.com', 'clinicos.app']));
  for (const domain of candidateDomains) {
    if (host.endsWith(`.${domain}`)) {
      const prefix = host.slice(0, host.length - domain.length - 1);
      const parts = prefix.split('.');
      const candidate = parts[0]?.trim();
      if (candidate && !RESERVED_SUBDOMAINS.has(candidate)) {
        return candidate;
      }
      return null;
    }
  }

  return null;
}

export function resolveTenantDomain(
  rawHost: string | null | undefined,
  apexDomain = DEFAULT_APEX_DOMAIN
): SubdomainResolution {
  const cleanHostname = sanitizeHostname(rawHost);
  const subdomain = extractTenantSubdomain(rawHost, apexDomain);
  const isTenant = subdomain !== null;
  const isSystemOrApex = !isTenant;

  return {
    subdomain,
    isTenant,
    isSystemOrApex,
    cleanHostname,
  };
}

export function buildTenantUrl(
  tenantSlug: string,
  path = '/',
  protocol = 'https',
  baseDomain = DEFAULT_APEX_DOMAIN
): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const cleanSlug = tenantSlug.toLowerCase().trim();

  if (baseDomain === 'localhost' || baseDomain.includes('localhost:')) {
    const port = baseDomain.includes(':') ? `:${baseDomain.split(':')[1]}` : ':3000';
    return `http://${cleanSlug}.localhost${port}${normalizedPath}`;
  }

  return `${protocol}://${cleanSlug}.${baseDomain}${normalizedPath}`;
}

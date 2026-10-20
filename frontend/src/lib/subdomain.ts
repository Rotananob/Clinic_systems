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

const DEFAULT_APEX_DOMAIN = 'clinicos.app';

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

  // Exact apex domains or loopback addresses
  if (
    host === 'localhost' ||
    host === '127.0.0.1' ||
    host === '0.0.0.0' ||
    host === apexDomain ||
    host === `www.${apexDomain}`
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

  // Handle production or staging wildcard: e.g. rotana.clinicos.app or rotana.staging.clinicos.app
  if (host.endsWith(`.${apexDomain}`)) {
    const prefix = host.slice(0, host.length - apexDomain.length - 1);
    const parts = prefix.split('.');
    const candidate = parts[0]?.trim();
    if (candidate && !RESERVED_SUBDOMAINS.has(candidate)) {
      return candidate;
    }
    return null;
  }

  // Fallback for custom or multi-level domains
  const parts = host.split('.');
  if (parts.length >= 3) {
    const candidate = parts[0]?.trim();
    if (candidate && !RESERVED_SUBDOMAINS.has(candidate)) {
      return candidate;
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

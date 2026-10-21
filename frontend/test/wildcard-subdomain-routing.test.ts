import { describe, it } from 'node:test';
import * as assert from 'node:assert';
import {
  extractTenantSubdomain,
  resolveTenantDomain,
  buildTenantUrl,
  sanitizeHostname,
} from '../src/lib/subdomain.ts';

describe('Step 25: Wildcard Subdomain and Multi-Tenant Routing Suite', () => {
  it('should clean and normalize raw hostnames', () => {
    assert.strictEqual(sanitizeHostname('ROTANA.clinic.com:443'), 'rotana.clinic.com');
    assert.strictEqual(sanitizeHostname('VANNDA.clinic.com:443'), 'vannda.clinic.com');
    assert.strictEqual(sanitizeHostname('localhost:3000'), 'localhost');
    assert.strictEqual(sanitizeHostname(null), '');
    assert.strictEqual(sanitizeHostname(undefined), '');
  });

  it('should extract tenant slug from production wildcard subdomains (rotana.clinic.com & vannda.clinic.com)', () => {
    assert.strictEqual(extractTenantSubdomain('rotana.clinic.com'), 'rotana');
    assert.strictEqual(extractTenantSubdomain('vannda.clinic.com'), 'vannda');
    assert.strictEqual(extractTenantSubdomain('angkor-medical.clinic.com:443'), 'angkor-medical');
    assert.strictEqual(extractTenantSubdomain('phnompenh-clinic.clinic.com'), 'phnompenh-clinic');
    assert.strictEqual(extractTenantSubdomain('rotana.clinicos.app'), 'rotana');
  });

  it('should extract tenant slug in local development environment', () => {
    assert.strictEqual(extractTenantSubdomain('rotana.localhost:3000'), 'rotana');
    assert.strictEqual(extractTenantSubdomain('vannda.localhost:3000'), 'vannda');
    assert.strictEqual(extractTenantSubdomain('demo.localhost'), 'demo');
  });

  it('should reject apex domain and loopback addresses as tenants', () => {
    assert.strictEqual(extractTenantSubdomain('clinic.com'), null);
    assert.strictEqual(extractTenantSubdomain('www.clinic.com'), null);
    assert.strictEqual(extractTenantSubdomain('clinicos.app'), null);
    assert.strictEqual(extractTenantSubdomain('www.clinicos.app'), null);
    assert.strictEqual(extractTenantSubdomain('localhost'), null);
    assert.strictEqual(extractTenantSubdomain('127.0.0.1:3000'), null);
    assert.strictEqual(extractTenantSubdomain('clinic-systems.vercel.app'), null);
    assert.strictEqual(extractTenantSubdomain('nobrotana.web.app'), null);
    assert.strictEqual(extractTenantSubdomain('my-app.railway.app'), null);
    assert.strictEqual(extractTenantSubdomain('clinic.onrender.com'), null);
  });

  it('should reject system and reserved subdomains', () => {
    assert.strictEqual(extractTenantSubdomain('api.clinic.com'), null);
    assert.strictEqual(extractTenantSubdomain('admin.clinic.com'), null);
    assert.strictEqual(extractTenantSubdomain('superadmin.clinic.com'), null);
    assert.strictEqual(extractTenantSubdomain('docs.clinic.com'), null);
    assert.strictEqual(extractTenantSubdomain('status.clinic.com'), null);
  });

  it('should resolve full domain object correctly', () => {
    const resRotana = resolveTenantDomain('rotana.clinic.com');
    assert.strictEqual(resRotana.isTenant, true);
    assert.strictEqual(resRotana.isSystemOrApex, false);
    assert.strictEqual(resRotana.subdomain, 'rotana');

    const resVannda = resolveTenantDomain('vannda.clinic.com');
    assert.strictEqual(resVannda.isTenant, true);
    assert.strictEqual(resVannda.isSystemOrApex, false);
    assert.strictEqual(resVannda.subdomain, 'vannda');

    const resApex = resolveTenantDomain('clinic.com');
    assert.strictEqual(resApex.isTenant, false);
    assert.strictEqual(resApex.isSystemOrApex, true);
    assert.strictEqual(resApex.subdomain, null);
  });

  it('should generate valid tenant URLs for redirects and links', () => {
    assert.strictEqual(
      buildTenantUrl('rotana', '/queue', 'https', 'clinic.com'),
      'https://rotana.clinic.com/queue'
    );
    assert.strictEqual(
      buildTenantUrl('vannda', '/dashboard', 'https', 'clinic.com'),
      'https://vannda.clinic.com/dashboard'
    );
    assert.strictEqual(
      buildTenantUrl('demo', 'billing', 'http', 'localhost:3000'),
      'http://demo.localhost:3000/billing'
    );
  });
});

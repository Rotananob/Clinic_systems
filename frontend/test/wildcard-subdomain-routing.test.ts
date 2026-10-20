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
    assert.strictEqual(sanitizeHostname('ROTANA.clinicos.app:443'), 'rotana.clinicos.app');
    assert.strictEqual(sanitizeHostname('localhost:3000'), 'localhost');
    assert.strictEqual(sanitizeHostname(null), '');
    assert.strictEqual(sanitizeHostname(undefined), '');
  });

  it('should extract tenant slug from production wildcard subdomains', () => {
    assert.strictEqual(extractTenantSubdomain('rotana.clinicos.app'), 'rotana');
    assert.strictEqual(extractTenantSubdomain('angkor-medical.clinicos.app:443'), 'angkor-medical');
    assert.strictEqual(extractTenantSubdomain('phnompenh-clinic.clinicos.app'), 'phnompenh-clinic');
  });

  it('should extract tenant slug in local development environment', () => {
    assert.strictEqual(extractTenantSubdomain('rotana.localhost:3000'), 'rotana');
    assert.strictEqual(extractTenantSubdomain('demo.localhost'), 'demo');
  });

  it('should reject apex domain and loopback addresses as tenants', () => {
    assert.strictEqual(extractTenantSubdomain('clinicos.app'), null);
    assert.strictEqual(extractTenantSubdomain('www.clinicos.app'), null);
    assert.strictEqual(extractTenantSubdomain('localhost'), null);
    assert.strictEqual(extractTenantSubdomain('127.0.0.1:3000'), null);
  });

  it('should reject system and reserved subdomains', () => {
    assert.strictEqual(extractTenantSubdomain('api.clinicos.app'), null);
    assert.strictEqual(extractTenantSubdomain('admin.clinicos.app'), null);
    assert.strictEqual(extractTenantSubdomain('superadmin.clinicos.app'), null);
    assert.strictEqual(extractTenantSubdomain('docs.clinicos.app'), null);
    assert.strictEqual(extractTenantSubdomain('status.clinicos.app'), null);
  });

  it('should resolve full domain object correctly', () => {
    const resTenant = resolveTenantDomain('rotana.clinicos.app');
    assert.strictEqual(resTenant.isTenant, true);
    assert.strictEqual(resTenant.isSystemOrApex, false);
    assert.strictEqual(resTenant.subdomain, 'rotana');

    const resApex = resolveTenantDomain('clinicos.app');
    assert.strictEqual(resApex.isTenant, false);
    assert.strictEqual(resApex.isSystemOrApex, true);
    assert.strictEqual(resApex.subdomain, null);
  });

  it('should generate valid tenant URLs for redirects and links', () => {
    assert.strictEqual(
      buildTenantUrl('rotana', '/queue'),
      'https://rotana.clinicos.app/queue'
    );
    assert.strictEqual(
      buildTenantUrl('demo', 'billing', 'http', 'localhost:3000'),
      'http://demo.localhost:3000/billing'
    );
  });
});

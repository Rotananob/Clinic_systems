import { describe, it } from 'node:test';
import * as assert from 'node:assert';
import * as fs from 'fs';
import * as path from 'path';

describe('Step 25: Production Deployment and PgBouncer Configuration Suite', () => {
  const rootDir = path.resolve(process.cwd(), '..');

  it('should verify docker-compose.prod.yml contains all essential microservices', () => {
    const composePath = path.join(rootDir, 'docker-compose.prod.yml');
    assert.strictEqual(fs.existsSync(composePath), true, 'docker-compose.prod.yml must exist');

    const content = fs.readFileSync(composePath, 'utf8');
    assert.match(content, /postgres:/, 'Must declare postgres container');
    assert.match(content, /pgbouncer:/, 'Must declare pgbouncer container');
    assert.match(content, /backend:/, 'Must declare backend container');
    assert.match(content, /frontend:/, 'Must declare frontend container');
    assert.match(content, /nginx:/, 'Must declare nginx container');
    assert.match(content, /pgbouncer:6432/, 'Backend must route through PgBouncer on port 6432');
    assert.match(content, /pgbouncer=true/, 'DATABASE_URL must configure Prisma pgbouncer flag');
  });

  it('should verify pgbouncer.ini is tuned for high-concurrency multi-tenant pooling', () => {
    const pgbouncerIniPath = path.join(rootDir, 'docker/pgbouncer/pgbouncer.ini');
    assert.strictEqual(fs.existsSync(pgbouncerIniPath), true, 'pgbouncer.ini must exist');

    const content = fs.readFileSync(pgbouncerIniPath, 'utf8');
    assert.match(content, /pool_mode\s*=\s*transaction/, 'Pool mode must be transaction for multi-tenant SaaS');
    assert.match(content, /max_client_conn\s*=\s*1000/, 'Max client connections must allow scaling');
    assert.match(content, /listen_port\s*=\s*6432/, 'Listen port must be standard 6432');
  });

  it('should verify Nginx wildcard subdomain configuration', () => {
    const nginxConfPath = path.join(rootDir, 'docker/nginx/conf.d/clinic.conf');
    assert.strictEqual(fs.existsSync(nginxConfPath), true, 'clinic.conf must exist');

    const content = fs.readFileSync(nginxConfPath, 'utf8');
    assert.match(content, /tenant_slug/, 'Must extract tenant slug from regex');
    assert.match(content, /proxy_set_header X-Tenant-Slug \$tenant_slug/, 'Must forward X-Tenant-Slug header');
    assert.match(content, /limit_req_zone/, 'Must configure DDoS/abuse rate limiting');
  });

  it('should verify Caddyfile fallback configuration', () => {
    const caddyPath = path.join(rootDir, 'docker/caddy/Caddyfile');
    assert.strictEqual(fs.existsSync(caddyPath), true, 'Caddyfile must exist');

    const content = fs.readFileSync(caddyPath, 'utf8');
    assert.match(content, /\*\.clinicos\.app/, 'Must handle wildcard subdomains');
    assert.match(content, /X-Tenant-Slug/, 'Must set X-Tenant-Slug header');
  });

  it('should verify .env.production.example contains all required multi-tenant parameters', () => {
    const envProdPath = path.join(rootDir, '.env.production.example');
    assert.strictEqual(fs.existsSync(envProdPath), true, '.env.production.example must exist');

    const content = fs.readFileSync(envProdPath, 'utf8');
    assert.match(content, /CLINICAL_PHI_KEY=/, 'Must require clinical encryption key');
    assert.match(content, /MASTER_BOT_TOKEN=/, 'Must require master telegram bot token');
    assert.match(content, /SUPERADMIN_SECRET_KEY=/, 'Must require super admin secret key');
    assert.match(content, /PLATFORM_BANK_ACCOUNT=/, 'Must require billing settlement account');
  });
});

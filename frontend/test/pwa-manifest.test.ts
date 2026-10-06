import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as path from 'node:path';

describe('Frontend PWA Web App Manifest Verification Suite', () => {
  it('should have valid manifest.json with required PWA attributes', () => {
    const manifestPath = path.resolve('public/manifest.json');
    assert.equal(fs.existsSync(manifestPath), true, 'manifest.json must exist');

    const raw = fs.readFileSync(manifestPath, 'utf8');
    const manifest = JSON.parse(raw);

    assert.equal(typeof manifest.name, 'string');
    assert.equal(typeof manifest.short_name, 'string');
    assert.equal(manifest.start_url, '/');
    assert.equal(manifest.display, 'standalone');
    assert.equal(Array.isArray(manifest.icons), true);
    assert.equal(manifest.icons.length >= 2, true);

    const sizes = manifest.icons.map((i: any) => i.sizes);
    assert.equal(sizes.includes('192x192'), true);
    assert.equal(sizes.includes('512x512'), true);
  });
});

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  OPTIONAL_MODULES,
  applyStandardKhmerClinicPreset,
  getHiddenModules,
  setModuleHidden,
  resetAllModulesVisible,
  isModuleHidden,
} from '../src/lib/module-visibility.ts';

describe('Module Visibility & Standard Khmer Clinic Customization Suite', () => {
  it('should list all optional modules with valid metadata and zero emojis', () => {
    assert.ok(OPTIONAL_MODULES.length >= 10);
    const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;

    for (const mod of OPTIONAL_MODULES) {
      assert.ok(mod.path.startsWith('/'));
      assert.ok(mod.id);
      assert.ok(mod.nameKh);
      assert.ok(mod.nameEn);
      assert.ok(mod.descKh);
      assert.ok(mod.descEn);

      // Strict zero emoji verification
      assert.equal(emojiRegex.test(mod.nameKh), false);
      assert.equal(emojiRegex.test(mod.nameEn), false);
      assert.equal(emojiRegex.test(mod.descKh), false);
      assert.equal(emojiRegex.test(mod.descEn), false);

      // Strict no parentheses in Khmer text verification
      assert.equal(mod.nameKh.includes('('), false);
      assert.equal(mod.nameKh.includes(')'), false);
      assert.equal(mod.descKh.includes('('), false);
      assert.equal(mod.descKh.includes(')'), false);
    }
  });

  it('should support toggling module visibility correctly', () => {
    resetAllModulesVisible();
    assert.equal(isModuleHidden('/teleconsult'), false);

    setModuleHidden('/teleconsult', true);
    assert.equal(isModuleHidden('/teleconsult'), true);

    setModuleHidden('/teleconsult', false);
    assert.equal(isModuleHidden('/teleconsult'), false);
  });

  it('should correctly apply Standard Khmer Clinic preset', () => {
    const hidden = applyStandardKhmerClinicPreset();
    assert.ok(hidden.length >= 8);
    assert.ok(hidden.includes('/teleconsult'));
    assert.ok(hidden.includes('/pacs'));
    assert.ok(hidden.includes('/lab'));
    assert.ok(hidden.includes('/ipd'));
    assert.ok(hidden.includes('/dental'));
    assert.ok(hidden.includes('/signage'));

    resetAllModulesVisible();
    assert.equal(getHiddenModules().length, 0);
  });
});

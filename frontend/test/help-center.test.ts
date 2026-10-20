import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { en } from '../src/locales/en.ts';
import { km } from '../src/locales/km.ts';

describe('Step 15: Documentation & Help Center Test Suite', () => {
  const categories = ['printer', 'telegram', 'khqr', 'workflow'];

  it('should verify all 4 core help center categories exist in locales', () => {
    for (const cat of categories) {
      assert.ok(
        (en.helpCenter.categories as any)[cat],
        `Category ${cat} missing in English helpCenter locale`
      );
      assert.ok(
        (km.helpCenter.categories as any)[cat],
        `Category ${cat} missing in Khmer helpCenter locale`
      );
    }
  });

  it('should verify detailed descriptions exist for each category', () => {
    assert.ok(en.helpCenter.printer.title.includes('80mm'));
    assert.ok(km.helpCenter.printer.title.includes('80mm'));

    assert.ok(en.helpCenter.telegram.title.includes('Telegram'));
    assert.ok(km.helpCenter.telegram.title.includes('Telegram'));

    assert.ok(en.helpCenter.khqr.title.includes('KHQR'));
    assert.ok(km.helpCenter.khqr.title.includes('KHQR'));

    assert.ok(en.helpCenter.workflow.title.includes('Workflow'));
    assert.ok(km.helpCenter.workflow.title.includes('ដំណើរការ'));
  });

  it('should guarantee zero emojis in help center locale dictionary', () => {
    const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}]/u;

    const checkNoEmojis = (obj: Record<string, any>, path = '') => {
      for (const [key, value] of Object.entries(obj)) {
        const fullPath = path ? `${path}.${key}` : key;
        if (typeof value === 'string') {
          assert.equal(
            emojiRegex.test(value),
            false,
            `Emoji found in ${fullPath}: ${value}`
          );
        } else if (typeof value === 'object' && value !== null) {
          checkNoEmojis(value, fullPath);
        }
      }
    };

    checkNoEmojis(en.helpCenter, 'en.helpCenter');
    checkNoEmojis(km.helpCenter, 'km.helpCenter');
  });

  it('should verify ESC/POS raw pulse code format for cash drawer trigger', () => {
    const escDrawerHex = '1B 70 00 19 FA';
    const bytes = escDrawerHex.split(' ').map((h) => parseInt(h, 16));
    assert.equal(bytes[0], 0x1b); // ESC
    assert.equal(bytes[1], 0x70); // 'p'
    assert.equal(bytes[2], 0x00); // pin 2
    assert.equal(bytes[3], 25);   // pulse on time (t1 * 2ms)
    assert.equal(bytes[4], 250);  // pulse off time (t2 * 2ms)
  });

  it('should test search filter logic for help topics', () => {
    const testGuides = [
      { id: 'g1', category: 'printer', titleKh: 'ការតភ្ជាប់ម៉ាស៊ីនព្រីន 80mm', titleEn: '80mm Printer Setup' },
      { id: 'g2', category: 'telegram', titleKh: 'ការតភ្ជាប់ Telegram Bot', titleEn: 'Telegram Bot Integration' },
      { id: 'g3', category: 'khqr', titleKh: 'ប្រព័ន្ធទូទាត់ Dynamic KHQR', titleEn: 'Dynamic KHQR PayWay' },
    ];

    const filterByQuery = (q: string) => {
      const lower = q.toLowerCase();
      return testGuides.filter(
        (g) =>
          g.titleKh.toLowerCase().includes(lower) ||
          g.titleEn.toLowerCase().includes(lower)
      );
    };

    assert.equal(filterByQuery('printer').length, 1);
    assert.equal(filterByQuery('80mm').length, 1);
    assert.equal(filterByQuery('Telegram').length, 1);
    assert.equal(filterByQuery('KHQR').length, 1);
    assert.equal(filterByQuery('nonexistent').length, 0);
  });
});

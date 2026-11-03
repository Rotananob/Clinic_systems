const assert = require('assert');

// Fast Clinical Search Engine Node.js Test Verification
console.log('Running Fast Clinical Search Engine Verification Suite...');

const patientCatalog = [
  { hn: 'HN-10492', nameEn: 'Sokha Rath', nameKh: 'រ័ត្ន សុខា', bed: 'Bed 01 ICU', diag: 'Acute Appendicitis' },
  { hn: 'HN-10501', nameEn: 'Bopha Chann', nameKh: 'ចាន់ បុប្ផា', bed: 'Bed 04 ICU', diag: 'Dengue Hemorrhagic Fever' },
  { hn: 'HN-10515', nameEn: 'Dara Khem', nameKh: 'ខឹម ដារ៉ា', bed: 'Bed 07 ER', diag: 'NSTEMI Troponin 4.8' },
  { hn: 'HN-10522', nameEn: 'Vanna Seng', nameKh: 'សេង វណ្ណា', bed: 'Bed 12 Ward', diag: 'Community Acquired Pneumonia' }
];

const icd10Catalog = [
  { code: 'K35.80', descEn: 'Acute appendicitis', descKh: 'រលាកខ្នែងពោះវៀនស្រួចស្រាវ' },
  { code: 'A91', descEn: 'Dengue hemorrhagic fever', descKh: 'ជំងឺគ្រុនឈាមដង់ហ្គាធ្ងន់ធ្ងរ' },
  { code: 'I21.4', descEn: 'NSTEMI myocardial infarction', descKh: 'ជំងឺគាំងបេះដូងស្រួចស្រាវ NSTEMI' },
  { code: 'S06.0', descEn: 'Concussion', descKh: 'ប៉ះទង្គិចខួរក្បាលដោយគ្រោះថ្នាក់' }
];

const medCatalog = [
  { generic: 'Ceftriaxone', brand: 'Rocephin', tier: 'WATCH', highAlert: false },
  { generic: 'Meropenem', brand: 'Merrem', tier: 'RESERVE', highAlert: true },
  { generic: 'Vancomycin', brand: 'Vancocin', tier: 'RESERVE', highAlert: true },
  { generic: 'Heparin Sodium', brand: 'Liquaemin', tier: 'ACCESS', highAlert: true }
];

function search(query) {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const hits = [];

  patientCatalog.forEach(p => {
    if (p.hn.toLowerCase().includes(q) || p.nameEn.toLowerCase().includes(q) || p.nameKh.toLowerCase().includes(q)) {
      hits.push({ type: 'PATIENT', item: p });
    }
  });

  icd10Catalog.forEach(icd => {
    if (icd.code.toLowerCase().includes(q) || icd.descEn.toLowerCase().includes(q) || icd.descKh.toLowerCase().includes(q)) {
      hits.push({ type: 'ICD10', item: icd });
    }
  });

  medCatalog.forEach(m => {
    if (m.generic.toLowerCase().includes(q) || m.brand.toLowerCase().includes(q)) {
      hits.push({ type: 'MEDICATION', item: m });
    }
  });

  return hits;
}

// 1. Test HN exact match
const hnResults = search('HN-10492');
assert.strictEqual(hnResults.length, 1);
assert.strictEqual(hnResults[0].item.nameEn, 'Sokha Rath');
console.log('Passed: HN exact search verified');

// 2. Test Khmer patient name
const khNameResults = search('សុខា');
assert.strictEqual(khNameResults.length, 1);
assert.strictEqual(khNameResults[0].item.hn, 'HN-10492');
console.log('Passed: Khmer patient name search verified');

// 3. Test ICD-10 code prefix
const icdResults = search('K35');
assert.strictEqual(icdResults.length, 1);
assert.strictEqual(icdResults[0].item.code, 'K35.80');
console.log('Passed: ICD-10 prefix search verified');

// 4. Test Medication brand and generic
const medResults = search('Rocephin');
assert.strictEqual(medResults.length, 1);
assert.strictEqual(medResults[0].item.generic, 'Ceftriaxone');
console.log('Passed: Medication brand search verified');

// 5. Test High-Alert drug discovery
const vancoResults = search('Vancomycin');
assert.strictEqual(vancoResults[0].item.highAlert, true);
assert.strictEqual(vancoResults[0].item.tier, 'RESERVE');
console.log('Passed: High-Alert ISMP Reserve drug search verified');

// 6. Test Zero Emojis and Zero Parentheses in Khmer descriptions
const allKhmerStrings = [
  ...patientCatalog.map(p => p.nameKh),
  ...icd10Catalog.map(i => i.descKh)
];
const emojiRegex = /[\uD800-\uDBFF][\uDC00-\uDFFF]|\p{Extended_Pictographic}/u;
const khmerParenRegex = /[\u1780-\u17FF].*[()]/;

allKhmerStrings.forEach(s => {
  assert.strictEqual(emojiRegex.test(s), false, 'Found emoji in string: ' + s);
  assert.strictEqual(khmerParenRegex.test(s), false, 'Found parenthesis in Khmer string: ' + s);
});
console.log('Passed: Zero emojis and zero Khmer parentheses verified across all search entities');

console.log('All 6 Fast Clinical Search test suites passed successfully');

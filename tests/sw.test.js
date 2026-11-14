import { test, assertEqual } from './runner.js';

// The offline list in sw.js must contain every game file (FR-026). Node only: it reads the folders.
const isNode = typeof process !== 'undefined' && !!process.versions?.node;

test('offline: sw.js caches every game file (run node tools/update-sw.mjs if this fails)', async () => {
  if (!isNode) return;
  const { offlineFiles, currentList } = await import('../tools/update-sw.mjs');
  assertEqual(currentList(), offlineFiles());
});

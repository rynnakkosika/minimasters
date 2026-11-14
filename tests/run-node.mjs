// Runs every test suite in Node: node tests/run-node.mjs
import { run } from './runner.js';
import { SUITES } from './suites.js';

for (const file of SUITES) {
  await import(new URL(file, import.meta.url));
}

const { pass, fail, reports } = await run((r) => {
  if (r.ok) console.log(`  ok  ${r.name}`);
  else console.log(`FAIL  ${r.name}\n${r.error}`);
});
for (const text of reports) console.log(text);
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);

// Regenerates the offline file list in sw.js from the files the game actually uses:
// node tools/update-sw.mjs   (tests/sw.test.js fails if the list is out of date)
import { readdirSync, readFileSync, writeFileSync, statSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(fileURLToPath(import.meta.url), '..', '..');
const TOP = ['index.html', 'styles.css', 'manifest.webmanifest', 'privacy.html'];
const DIRS = ['src', 'data', 'icons', 'assets'];
const SKIP = /(^|\/)\.|\.md$/;

function walk(dir) {
  const out = [];
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else out.push(full);
  }
  return out;
}

export function offlineFiles() {
  const files = [...TOP];
  for (const d of DIRS) files.push(...walk(join(root, d)).map((f) => relative(root, f).split('\\').join('/')));
  return ['./', ...files.filter((f) => !SKIP.test(f)).sort()];
}

export function currentList(sw = readFileSync(join(root, 'sw.js'), 'utf8')) {
  const m = sw.match(/const FILES = (\[[\s\S]*?\]);/);
  return m ? JSON.parse(m[1].replace(/'/g, '"').replace(/,\s*\]/, ']')) : [];
}

if (process.argv[1] && process.argv[1].endsWith('update-sw.mjs')) {
  const path = join(root, 'sw.js');
  const sw = readFileSync(path, 'utf8');
  const list = offlineFiles();
  const body = `const FILES = [\n${list.map((f) => `  '${f}',`).join('\n')}\n];`;
  const version = Number((sw.match(/minimasters-v(\d+)/) || [0, 0])[1]) + 1;
  writeFileSync(path, sw.replace(/const FILES = \[[\s\S]*?\];/, body).replace(/minimasters-v\d+/, `minimasters-v${version}`));
  console.log(`sw.js: ${list.length} files, cache minimasters-v${version}`);
}

// Regenerates the offline file list in sw.js from the game files in git (the index, so staged
// files count): node tools/update-sw.mjs   (tests/sw.test.js fails if the list is out of date)
// Only files git knows are published, so untracked work in progress never ends up in the list.
import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(fileURLToPath(import.meta.url), '..', '..');
const TOP = ['index.html', 'styles.css', 'manifest.webmanifest', 'privacy.html'];
const DIRS = ['src', 'data', 'icons', 'assets'];
const SKIP = /(^|\/)\.|\.md$/;

function tracked() {
  return execFileSync('git', ['ls-files', '--cached', '-z'], { cwd: root, encoding: 'utf8' }).split('\0').filter(Boolean);
}

export function offlineFiles() {
  const files = tracked().filter((f) => TOP.includes(f) || DIRS.some((d) => f.startsWith(`${d}/`)));
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

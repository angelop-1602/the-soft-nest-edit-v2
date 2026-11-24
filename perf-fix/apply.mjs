import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const checkOnly = process.argv.includes('--check');
if (!existsSync(join(root, 'package.json')) || !existsSync(join(root, 'src/layouts/Base.astro'))) {
  console.error('Run from the repository after expanding the ZIP at its root.');
  process.exit(1);
}
const patches = JSON.parse(readFileSync(join(here, 'edits.json'), 'utf8'));
const writes = new Map();
const errors = [];
const normalize = text => text.replace(/\r\n/g, "\n");
const endings = new Map();
for (const { path, find, replace } of patches) {
  const file = join(root, path);
  if (!existsSync(file)) { errors.push(`Missing ${path}`); continue; }
  if (!endings.has(file)) {
    const original = readFileSync(file, 'utf8');
    const crlf = original.includes('\r\n');
    if (crlf && normalize(original).includes('\r')) {
      errors.push(`${path}: unsupported line endings`); continue;
    }
    if (crlf && /(^|[^\r])\n/.test(original)) {
      errors.push(`${path}: mixed LF and CRLF; normalize this file before applying`); continue;
    }
    endings.set(file, crlf ? '\r\n' : '\n');
    console.log(`${path}: ${crlf ? 'CRLF' : 'LF'} line endings`);
  }
  let content = writes.get(file) ?? normalize(readFileSync(file, 'utf8'));
  const count = content.split(find).length - 1;
  if (content.includes(replace)) { /* already applied */ }
  else if (count === 1) content = content.replace(find, replace);
  else errors.push(`${path}: expected anchor ${count === 0 ? 'not found' : 'occurs more than once'}: ${JSON.stringify(find.trim().split('\n')[0])}`);
  writes.set(file, content);
}
for (const [source, destination] of [
  ['templates/activate-members.js', 'src/scripts/activate-members.js'],
  ['templates/performance-first-paint.css', 'src/styles/performance-first-paint.css']
]) {
  const file = join(root, destination);
  const expected = readFileSync(join(here, source), 'utf8');
  if (existsSync(file) && normalize(readFileSync(file, 'utf8')) !== normalize(expected)) {
    errors.push(`${destination} already exists with different content; will not overwrite`);
  } else if (!existsSync(file)) writes.set(file, expected);
}
if (errors.length) {
  for (const error of errors) console.error(`ERROR: ${error}`);
  console.error('Nothing changed. The checked files may differ from the inspected main branch.');
  process.exit(1);
}
if (checkOnly) {
  console.log('Preflight passed: all source anchors match. No files written.');
  process.exit(0);
}
let written = 0;
for (const [file, normalized] of writes) {
  const content = endings.get(file) === "\r\n" ? normalized.replace(/\n/g, "\r\n") : normalized;
  if (existsSync(file) && readFileSync(file, 'utf8') === content) continue;
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, content);
  console.log('Updated', file.slice(root.length + 1));
  written++;
}
console.log(written ? `Patched ${written} files. Run npm run validate.` : 'Already applied. No changes needed.');

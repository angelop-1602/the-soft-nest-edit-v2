import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const path = join(root, 'src/layouts/Base.astro');
const norm = s => s.replace(/\r\n/g, '\n');
const fail = message => { console.error('ERROR: ' + message + '\nNo files written during preflight.'); process.exit(1); };
if (!existsSync(path)) fail('Base.astro missing; extract at repository root.');
const original = readFileSync(path, 'utf8');
let content = norm(original);
const edits = JSON.parse(readFileSync(join(here, 'edits.json'), 'utf8'));
for (const { find, replace, label } of edits) {
  if (content.includes(replace)) continue;
  if (content.split(find).length !== 2) fail('Base.astro anchor missing or ambiguous: ' + label);
  content = content.replace(find, replace);
}
const files = [['mobile-navigation.js', 'src/scripts/mobile-navigation.js'], ['mobile-navigation.css', 'src/styles/mobile-navigation.css']];
const writes = [];
for (const [source, dest] of files) {
  const target = join(root, dest), expected = readFileSync(join(here, 'templates', source), 'utf8');
  if (existsSync(target)) { if (norm(readFileSync(target, 'utf8')) !== norm(expected)) fail(dest + ' already contains different code'); }
  else writes.push([target, expected]);
}
if (content !== norm(original)) {
  const uniformCRLF = original.includes('\r\n') && !/(^|[^\r])\n/.test(original);
  writes.push([path, uniformCRLF ? content.replace(/\n/g, '\r\n') : content]);
}
if (process.argv.includes('--check')) { console.log('Preflight passed. No files written.'); process.exit(0); }
for (const [target, value] of writes) { mkdirSync(dirname(target), {recursive:true}); writeFileSync(target,value); console.log('Updated ' + target); }
console.log(writes.length ? 'Patch applied. Run npm run validate.' : 'Already applied.');

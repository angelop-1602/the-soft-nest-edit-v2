import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const here=dirname(fileURLToPath(import.meta.url));
const target=resolve(here,'../src/styles/mobile-navigation.css');
const fail=msg=>{console.error('ERROR: '+msg);process.exit(1)};
if(!existsSync(target))fail('Existing mobile-navigation.css not found. Extract at the repository root.');
const original=readFileSync(target,'utf8');
if(!original.includes('.mobile-navigation .site-nav') || !original.includes('mobile-drawer-in'))fail('Original drawer CSS not recognized. No files changed.');
const marker='/* softnest-mobile-nav-polish-v1:';
const css=readFileSync(resolve(here,'override.css'),'utf8').replace(/\r\n/g,'\n');
if(original.includes(marker)) {
  if(!original.replace(/\r\n/g,'\n').includes(css.trimEnd()))fail('Existing polish differs; review manually.');
  console.log('Already applied.');process.exit(0);
}
if(process.argv.includes('--check')) {console.log('Preflight passed. No files changed.');process.exit(0);}
const eol=original.includes('\r\n')&&!/(^|[^\r])\n/.test(original)?'\r\n':'\n';
writeFileSync(target,original+eol+css.replace(/\n/g,eol),'utf8');
console.log('Updated src/styles/mobile-navigation.css. Run npm run validate.');

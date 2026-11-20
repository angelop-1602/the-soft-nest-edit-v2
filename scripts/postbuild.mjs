import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
const dist=join(process.cwd(),'dist');
const files=['index.html','shop/index.html','journal/index.html','sitemap.xml','rss.xml','404.html','robots.txt','_redirects'];
const missing=files.filter(f=>!existsSync(join(dist,f)));
if(missing.length){console.error('Missing build files:',missing);process.exit(1);}
const sitemap=readFileSync(join(dist,'sitemap.xml'),'utf8');
if(!sitemap.includes('<urlset')||!sitemap.includes('/shop/')){console.error('Sitemap incomplete');process.exit(1);}
const shop=readFileSync(join(dist,'shop/index.html'),'utf8');
if(!shop.includes('As an Amazon Associate I earn from qualifying purchases.')){console.error('Required disclosure missing from Shop');process.exit(1);}
if(shop.includes('data-available="true"')||shop.includes('Add to cart')){console.error('Old commerce markup found');process.exit(1);}
console.log('Post-build smoke checks passed.');

import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import YAML from 'yaml';
import { publishableProduct, validAffiliateLink } from '../src/lib/affiliate-rules.js';
let draft=0,live=0;let problems=0;
for(const name of readdirSync('src/content/products').filter(x=>x.endsWith('.md'))){
 const raw=readFileSync(join('src/content/products',name),'utf8');
 const found=/^---\r?\n([\s\S]*?)\r?\n---/.exec(raw);if(!found){console.error(name,'missing frontmatter');problems++;continue;}
 const meta=YAML.parse(found[1]);const ok=publishableProduct(meta);
 if(ok)live++;else draft++;
 if(meta.published && !ok){console.warn('BLOCKED product:',name,'(link/status/image approval incomplete)');}
 if(meta.link_verified&&!validAffiliateLink(meta.affiliate_url)){console.error('Verified flag but invalid link:',name);problems++;}
}
console.log(`Affiliate content audit: ${live} public products; ${draft} unpublished or blocked records; ${problems} invalid records.`);
if(problems)process.exit(1);

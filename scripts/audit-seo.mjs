import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
const dist=process.argv[2] || 'dist';
const site='https://thesoftnestedit.online';
const read=p=>readFileSync(join(dist,p),'utf8');
const errors=[];
const sitemap=read('sitemap.xml');
const urls=[...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m=>m[1]);
if(!sitemap.includes('<urlset') || !urls.length) errors.push('Missing or invalid sitemap URL set');
const seen=new Set();
const redirects=read('_redirects').split(/\r?\n/).map(l=>l.trim()).filter(l=>l&&!l.startsWith('#')).map(l=>l.split(/\s+/)[0]);
function attribute(tag,name){return tag.match(new RegExp(`(?:^|\\s)${name}\\s*=\\s*["']([^"']*)["']`,'i'))?.[1];}
function noindex(html){return [...html.matchAll(/<meta\b[^>]*>/gi)].some(([tag])=>/^(robots|googlebot)$/i.test(attribute(tag,'name')||'') && /\bnoindex\b/i.test(attribute(tag,'content')||''));}
for(const loc of urls){
  let url;try{url=new URL(loc);}catch{errors.push(`Invalid URL: ${loc}`);continue;}
  if(seen.has(loc))errors.push(`Duplicate URL: ${loc}`);seen.add(loc);
  if(url.origin!==site||url.search||url.hash||!url.pathname.endsWith('/')){errors.push(`Noncanonical sitemap URL: ${loc}`);continue;}
  if(redirects.includes(url.pathname))errors.push(`Redirect in sitemap: ${loc}`);
  if(url.pathname==='/shop/saved/'||url.pathname.startsWith('/shop/category/')||url.pathname==='/shop/bedsure-sherpa-throw/') errors.push(`Excluded route in sitemap: ${loc}`);
  const path=join(dist,url.pathname.slice(1),'index.html');
  if(!existsSync(path)){errors.push(`Missing generated HTML: ${loc}`);continue;}
  const html=readFileSync(path,'utf8');
  if(noindex(html))errors.push(`Noindex sitemap URL: ${loc}`);
  const canonical=[...html.matchAll(/<link\b[^>]*>/gi)].map(m=>m[0]).filter(tag=>(attribute(tag,'rel')||'').toLowerCase()==='canonical');
  if(canonical.length!==1||attribute(canonical[0],'href')!==loc)errors.push(`Canonical mismatch: ${loc}`);
  if(/href\s*=\s*["'](?:https:\/\/thesoftnestedit\.online)?\/shop\/bedsure-sherpa-throw\/?(?:[?#][^"']*)?["']/i.test(html))errors.push(`Stale Bedsure link on ${loc}`);
}
for(const path of ['/','/journal/','/shop/','/terms/'])if(!seen.has(site+path))errors.push(`Missing core sitemap URL: ${path}`);
const robots=read('robots.txt');
if(/^\s*Disallow:\s*\/shop\/saved\/?\s*$/im.test(robots))errors.push('Saved page blocks crawler from reading noindex');
if(!noindex(read('shop/saved/index.html')))errors.push('Saved page missing noindex');
if(errors.length){console.error(errors.join('\n'));process.exitCode=1;}else console.log(`SEO audit passed: ${urls.length} sitemap URLs, local HTML/canonical checks and saved-page policy.`);

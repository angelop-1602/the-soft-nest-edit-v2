// Audit generated static HTML, not live HTTP responses or Google indexing decisions.
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, resolve, relative, sep } from 'node:path';
const dist=resolve(process.argv[2] || 'dist');
const site='https://thesoftnestedit.online';
const errors=[];
const read=p=>readFileSync(join(dist,p),'utf8');
const fail=message=>errors.push(message);
const decode=s=>s.replace(/&(?:amp|lt|gt|quot|apos|#\d+|#x[\da-f]+);/gi,m=>{
 const k=m.slice(1,-1).toLowerCase();
 if(k[0]==='#'){const n=k[1]==='x'?parseInt(k.slice(2),16):parseInt(k.slice(1),10);return n>=0&&n<=0x10ffff?String.fromCodePoint(n):m;}
 return ({amp:'&',lt:'<',gt:'>',quot:'"',apos:"'"})[k]??m;
});
const attr=(tag,name)=>{const m=tag.match(new RegExp(`(?:^|\\s)${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`,'i'));return m?decode(m[1]??m[2]??m[3]):'';};
const tags=(html,name)=>[...html.matchAll(new RegExp(`<${name}\\b(?:"[^"]*"|'[^']*'|[^'">])*?>`,'gi'))].map(m=>m[0]);
const htmlOnly=html=>html.replace(/<!--[\s\S]*?-->/g,'').replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1\s*>/gi,'');
const noindex=html=>tags(html,'meta').some(tag=>/^(robots|googlebot)$/i.test(attr(tag,'name'))&&/\bnoindex\b/i.test(attr(tag,'content')));
const normalize=s=>decode(s).replace(/\s+/g,' ').trim().toLowerCase();
const sitemap=read('sitemap.xml');
const urls=[...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m=>decode(m[1].trim()));
if(!sitemap.includes('<urlset')||!urls.length)fail('Missing or invalid sitemap URL set');
const seen=new Set();
const redirectMap=new Map(read('_redirects').split(/\r?\n/).map(l=>l.trim()).filter(l=>l&&!l.startsWith('#')).map(l=>l.split(/\s+/)).filter(a=>a.length>=2&&!/[*:]/.test(a[0])&&a[0].startsWith('/')).map(([from,to])=>[from,to]));
const retired='/shop/bedsure-sherpa-throw/';
const saved='/shop/saved/';
const excluded=p=>p===saved||p.startsWith('/shop/category/')||p===retired;
function fileFor(path){
 let decoded;try{decoded=decodeURIComponent(path);}catch{return false;}
 const target=resolve(dist,'.'+decoded);
 if(target!==dist&&!target.startsWith(dist+sep))return false;
 const file=p=>existsSync(p)&&statSync(p).isFile();
 return file(target)||file(join(target,'index.html'));
}
function walk(dir){return readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(join(dir,e.name)):e.isFile()&&e.name==='index.html'?[join(dir,e.name)]:[]);}
const pages=new Map(walk(dist).map(file=>{const path='/'+relative(dist,file).split(sep).join('/').replace(/index\.html$/,'');return [path,htmlOnly(readFileSync(file,'utf8'))];}));
for(const loc of urls){
 let url;try{url=new URL(loc);}catch{fail(`Invalid sitemap URL: ${loc}`);continue;}
 if(seen.has(loc))fail(`Duplicate sitemap URL: ${loc}`);seen.add(loc);
 if(url.origin!==site||url.search||url.hash||!url.pathname.endsWith('/')||url.href!==loc){fail(`Noncanonical sitemap URL: ${loc}`);continue;}
 if(redirectMap.has(url.pathname)||excluded(url.pathname))fail(`Excluded or redirected sitemap URL: ${loc}`);
 if(!pages.has(url.pathname))fail(`Missing generated HTML: ${loc}`);
 else if(noindex(pages.get(url.pathname)))fail(`Noindex sitemap URL: ${loc}`);
}
for(const p of ['/','/journal/','/shop/','/about/','/contact/','/affiliate-disclosure/','/privacy/','/terms/'])if(!seen.has(site+p))fail(`Missing core sitemap URL: ${p}`);
const titles=new Map(),descriptions=new Map();
function unique(map,value,path,label){const key=normalize(value);if(!key){fail(`Missing ${label}: ${path}`);return;}if(map.has(key))fail(`Duplicate ${label}: ${map.get(key)} and ${path}`);else map.set(key,path);}
let links=0,indexable=0;
for(const [path,html] of pages){
 const head=html.match(/<head\b[^>]*>([\s\S]*?)<\/head>/i)?.[1]||'';
 const canonical=tags(head,'link').filter(tag=>attr(tag,'rel').toLowerCase().split(/\s+/).includes('canonical'));
 const blocked=noindex(html);
 if(canonical.length!==1||attr(canonical[0]||'','href')!==site+path)fail(`Canonical mismatch: ${path}`);
 if(excluded(path)&&!blocked&&path!==retired)fail(`Intentional exclusion missing noindex: ${path}`);
 if(path===retired)fail(`Retired product unexpectedly generated: ${path}`);
 if(!blocked&&!redirectMap.has(path)){
  indexable++;
  if(!seen.has(site+path))fail(`Indexable generated page missing from sitemap: ${path}`);
  const title=[...head.matchAll(/<title\b[^>]*>([\s\S]*?)<\/title>/gi)];
  const meta=tags(head,'meta').filter(tag=>attr(tag,'name').toLowerCase()==='description');
  if(title.length!==1)fail(`Expected one title: ${path}`);
  if(meta.length!==1)fail(`Expected one description: ${path}`);
  unique(titles,title[0]?.[1]||'',path,'title');unique(descriptions,attr(meta[0]||'','content'),path,'description');
 }
 for(const tag of tags(html,'a')){
  const href=attr(tag,'href').trim();if(!href||href.startsWith('#'))continue;
  let url;try{url=new URL(href,site+path);}catch{fail(`Invalid link on ${path}: ${href}`);continue;}
  if(!['http:','https:'].includes(url.protocol)||url.hostname!==new URL(site).hostname)continue;
  links++;
  const p=url.pathname;
  if(p===retired||p===retired.slice(0,-1)){fail(`Stale Bedsure link on ${path}: ${href}`);continue;}
  // Allow known exact legacy redirects only if their same-site target exists.
  const target=redirectMap.get(p);
  if(target){let dest;try{dest=new URL(target,site);}catch{fail(`Invalid redirect target ${target}`);continue;}
   if(dest.origin===site&&!fileFor(dest.pathname))fail(`Broken redirect destination on ${path}: ${href} -> ${target}`);
   continue;}
  if(!fileFor(p))fail(`Broken internal link on ${path}: ${href}`);
 }
}
const robots=read('robots.txt');
if(/^\s*Disallow:\s*\/shop\/saved\/?\s*$/im.test(robots))fail('Saved page blocks crawler from reading noindex');
if(!/^\s*Sitemap:\s*https:\/\/thesoftnestedit\.online\/sitemap\.xml\s*$/im.test(robots))fail('Missing canonical sitemap declaration in robots.txt');
if(!pages.has(saved)||!noindex(pages.get(saved)))fail('Saved page missing noindex');
if(errors.length){console.error([...new Set(errors)].join('\n'));console.error(`SEO audit failed: ${new Set(errors).size} issue(s).`);process.exitCode=1;}
else console.log(`SEO audit passed: ${urls.length} sitemap URLs, ${indexable} indexable pages, ${pages.size} generated pages, ${links} internal links checked.`);

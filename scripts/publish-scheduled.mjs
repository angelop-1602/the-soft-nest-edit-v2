import { readdirSync, readFileSync, writeFileSync, statSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import YAML from 'yaml';
import { isScheduled, validPublishAt, publicProduct, publicPost, releaseQueue, due } from '../src/lib/publication-rules.js';
const now = new Date();
const mode = process.argv[2] ?? '--list';
const imageExists = path => { try {return statSync(join('public',path.slice(1))).isFile();} catch {return false;} };
const records = ['products','posts'].flatMap(kind => readdirSync(`src/content/${kind}`).filter(f=>f.endsWith('.md')).map(f=>{
  const file = `src/content/${kind}/${f}`, raw=readFileSync(file,'utf8');
  const m = /^(\uFEFF?---\r?\n)([\s\S]*?)(\r?\n---(?:\r?\n|$))/.exec(raw);
  // Astro and the existing audit use YAML frontmatter. Fail closed if missing or malformed.
  const match = m ?? /^(---\r?\n)([\s\S]*?)(\r?\n---(?:\r?\n|$))/.exec(raw);
  if (!match) throw new Error(`Missing frontmatter: ${file}`);
  const doc=YAML.parseDocument(match[2]); if(doc.errors.length) throw new Error(`Invalid YAML: ${file}`);
  const data=doc.toJS(); if(!data || typeof data!=='object' || Array.isArray(data)) throw new Error(`Invalid record: ${file}`);
  return {kind,id:f.slice(0,-3),file,data,doc,raw,match};
}));
function save(record, fields) {
  for (const [key,value] of Object.entries(fields)) record.doc.set(key,value);
  const newline=record.match[1].endsWith('\r\n')?'\r\n':'\n';
  const fm=record.doc.toString().trimEnd().replace(/\r?\n/g,newline);
  writeFileSync(record.file,record.match[1]+fm+record.match[3]+record.raw.slice(record.match[0].length));
}
const route = r => `/${r.kind==='posts'?'journal':'shop'}/${r.id}/`;
const plan = releaseQueue(records,now,imageExists);
const ids = new Set(records.filter(r=>r.kind==='products'&&publicProduct(r.data,now,imageExists)).map(r=>r.id));
const visible = r=>r.kind==='products'?publicProduct(r.data,now,imageExists):publicPost(r.data,now,imageExists,ids);
const state = r=>!isScheduled(r.data)?(r.data.published?'Manual publication':'Draft'):!validPublishAt(r.data.publish_at)?'Invalid date':r.data.publication_approved!==true?'Awaiting approval / canceled':visible(r)?'Released in source':r.data.published?'Blocked release':plan.release.includes(r)?'Due / ready':due(r.data,now)?'Due / blocked':'Scheduled';
const fmt = (value,zone)=> validPublishAt(value)?new Intl.DateTimeFormat('en-US',{dateStyle:'medium',timeStyle:'short',timeZone:zone}).format(new Date(value)):'—';
function list(){ console.table(records.filter(r=>isScheduled(r.data)).map(r=>({type:r.kind,slug:r.id,campaign:r.data.campaign_id??'',Eastern:fmt(r.data.publish_at,'America/New_York'),Manila:fmt(r.data.publish_at,'Asia/Manila'),state:state(r)})));console.log(`${plan.release.length} ready; ${plan.blocked.length} due but blocked.`); }
function calendar(){
  const esc=v=>String(v??'').replace(/[&<>"']/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]));
  const rows=records.filter(r=>isScheduled(r.data)).sort((a,b)=>String(a.data.publish_at).localeCompare(String(b.data.publish_at))).map(r=>`<tr><td>${esc(fmt(r.data.publish_at,'America/New_York'))}</td><td>${esc(fmt(r.data.publish_at,'Asia/Manila'))}</td><td>${esc(r.kind)}</td><td>${esc(r.data.title)}<small>${esc(r.id)}</small></td><td>${esc(r.data.campaign_id)}</td><td>${esc(state(r))}</td></tr>`).join('');
  mkdirSync('.scheduler-local',{recursive:true});writeFileSync('.scheduler-local/calendar.html',`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Soft Nest · Publication calendar</title><style>body{background:#f7f4ed;color:#35382e;font:15px system-ui;margin:5vw}h1{font:42px Georgia}table{width:100%;border-collapse:collapse;background:#fff}th,td{text-align:left;padding:14px;border-bottom:1px solid #e4e0d6}th{background:#e4e8d9}small{display:block;color:#666;margin-top:4px}.scroll{overflow:auto}</style><h1>Publication calendar</h1><p>Local source snapshot · ${esc(now.toISOString())} · not live deployment status.</p><div class="scroll"><table><thead><tr><th>US Eastern</th><th>Manila</th><th>Type</th><th>Content</th><th>Campaign</th><th>Status</th></tr></thead><tbody>${rows||'<tr><td colspan="6">No scheduled content.</td></tr>'}</tbody></table></div></html>`);console.log('Created .scheduler-local/calendar.html (local only).');
}
function bulk(){
  const file=process.argv[3];if(!file)throw new Error('Provide a plan JSON path.');
  const p=JSON.parse(readFileSync(file,'utf8'));if(!/^[a-z0-9][a-z0-9-]{0,79}$/.test(p.campaign_id)||!Array.isArray(p.items)||!p.items.length)throw new Error('Invalid campaign plan.');
  const seen=new Set();const changes=p.items.map(item=>{
    if(!['products','posts'].includes(item.kind)||typeof item.slug!=='string'||!validPublishAt(item.publish_at)||Date.parse(item.publish_at)<=now.getTime())throw new Error('Every item needs a valid future UTC time, kind and slug.');
    const r=records.find(r=>r.kind===item.kind&&r.id===item.slug);if(!r||r.data.published===true||seen.has(r.file))throw new Error('Missing, already released, or duplicate item: '+item.slug);seen.add(r.file);
    const fields={campaign_id:p.campaign_id,publish_at:item.publish_at,publication_approved:false,published:false};
    if(r.kind==='posts'){const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'America/New_York',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date(item.publish_at)); const get=t=>parts.find(x=>x.type===t).value;fields.date=`${get('year')}-${get('month')}-${get('day')}`;}
    return {r,fields};
  });
  console.table(changes.map(({r,fields})=>({file:r.file,...fields})));if(!process.argv.includes('--apply')){console.log('Preview only. Add --apply to save drafts; approve each in Pages CMS afterward.');return;}
  for(const {r,fields} of changes)save(r,fields);console.log('Draft schedule saved; approval reset.');
}
async function sitemap(){
  const res=await fetch('https://thesoftnestedit.online/sitemap.xml?check='+Date.now(),{redirect:'error',cache:'no-store',signal:AbortSignal.timeout(20000)});
  if(!res.ok)throw new Error('Live sitemap request failed: '+res.status);const xml=await res.text();if(!xml.includes('<urlset')||!xml.includes('</urlset>')||!xml.includes('https://thesoftnestedit.online/shop/'))throw new Error('Unexpected sitemap content; refusing to deploy.');return new Set([...xml.matchAll(/<loc>\s*([^<]+)\s*<\/loc>/g)].map(x=>x[1].trim()));
}
async function deploy(){
  if(process.env.SCHEDULER_ENABLED!=='true')throw new Error('Scheduler disabled.');
  const hook=process.env.CLOUDFLARE_DEPLOY_HOOK_URL;
  if(!hook||!/^https:\/\/api\.cloudflare\.com\/client\/v4\/workers\/builds\/deploy_hooks\/[a-zA-Z0-9_-]+$/.test(hook))throw new Error('Missing or invalid Workers Builds hook secret.');
  const targets=records.filter(r=>isScheduled(r.data)&&visible(r));if(!targets.length){console.log('No released scheduled content.');return;}
  const missing=async()=>{const urls=await sitemap();return targets.filter(r=>!urls.has('https://thesoftnestedit.online'+route(r)));};
  const verifyRoutes=async()=>{for(const r of targets){const res=await fetch('https://thesoftnestedit.online'+route(r),{redirect:'error',signal:AbortSignal.timeout(20000)});if(!res.ok)throw new Error('Published route check failed: '+route(r));}};
  let pending=await missing();if(!pending.length){await verifyRoutes();console.log('All released schedules present in live sitemap and HTTP checks passed; no deploy.');return;}
  console.log(`${pending.length} released routes missing; requesting production build.`);
  let response;try{response=await fetch(hook,{method:'POST',redirect:'error',signal:AbortSignal.timeout(20000)});}catch{throw new Error('Deploy hook request failed.');}
  if(!response.ok)throw new Error('Deploy hook rejected request: '+response.status);
  const result=await response.json().catch(()=>null);if(result?.success!==true)throw new Error('Cloudflare did not confirm hook acceptance.');
  for(let i=0;i<20;i++){await new Promise(r=>setTimeout(r,30000));pending=await missing();if(!pending.length){await verifyRoutes();console.log('Verified sitemap and HTTP success for released routes.');return;}}
  throw new Error('Deployment not verified within polling window. Review Workers Builds; next enabled run can retry.');
}
if(mode==='--list')list();else if(mode==='--calendar')calendar();else if(mode==='--bulk')bulk();else if(mode==='--activate'){
  if(process.env.SCHEDULER_ENABLED!=='true')throw new Error('Scheduler disabled.');
  if(!process.env.CLOUDFLARE_DEPLOY_HOOK_URL||!/^https:\/\/api\.cloudflare\.com\/client\/v4\/workers\/builds\/deploy_hooks\/[a-zA-Z0-9_-]+$/.test(process.env.CLOUDFLARE_DEPLOY_HOOK_URL))throw new Error('Configure Workers Builds hook before releasing.');
  list();for(const r of plan.release)save(r,{published:true});console.log(`Activated ${plan.release.length} records locally.`);
}else if(mode==='--deploy')await deploy();else throw new Error('Unknown scheduler mode.');

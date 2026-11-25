import { readdirSync, readFileSync, writeFileSync, mkdirSync, lstatSync, realpathSync, renameSync, unlinkSync } from 'node:fs';
import { join, resolve, dirname, relative, isAbsolute } from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import YAML from 'yaml';
const hash=raw=>createHash('sha256').update(raw).digest('hex');
function contained(base,file){const rel=relative(base,file);return rel!==''&&!rel.startsWith('..')&&!isAbsolute(rel);}
export function readRecords(root){
  const base=realpathSync(root);
  return ['products','posts'].flatMap(kind=>{
    const dir=join(base,'src','content',kind);
    if(realpathSync(dir)!==dir)throw Error('Content directory must not be redirected.');
    return readdirSync(dir,{withFileTypes:true}).filter(e=>e.isFile()&&e.name.endsWith('.md')).map(e=>{
      const id=e.name.slice(0,-3);if(!/^[a-z0-9][a-z0-9_-]*$/i.test(id))throw Error('Unsupported filename: '+e.name);
      const file=join(dir,e.name),raw=readFileSync(file,'utf8');
      const m=/^(\uFEFF?---\r?\n|---\r?\n)([\s\S]*?)(\r?\n---(?:\r?\n|$))/.exec(raw);
      if(!m)throw Error('Missing frontmatter: '+e.name);
      const doc=YAML.parseDocument(m[2]);if(doc.errors.length)throw Error('Invalid YAML: '+e.name);
      const data=doc.toJS();if(!data||typeof data!=='object'||Array.isArray(data))throw Error('Invalid metadata: '+e.name);
      return {kind,id,file,raw,doc,m,data,revision:hash(raw),body:raw.slice(m[0].length)};
    });
  });
}
export function makeImageExists(root){return path=>{try{if(typeof path!=='string'||!/^\/uploads\/[a-z0-9/_-]+\.(jpg|jpeg|png|webp|avif)$/i.test(path)||path.includes('..'))return false;const base=realpathSync(join(root,'public'));const file=realpathSync(join(base,path.slice(1)));return contained(base,file)&&lstatSync(file).isFile();}catch{return false;}};}
function atomic(file,raw){const tmp=join(dirname(file),`.scheduler-${randomUUID()}.tmp`);try{writeFileSync(tmp,raw,{flag:'wx'});renameSync(tmp,file);}finally{try{unlinkSync(tmp);}catch{}}}
export function saveChanges(root,changes){
  const base=realpathSync(root), backup=join(base,'.scheduler-local','backups',new Date().toISOString().replace(/[:.]/g,'-')+'-'+randomUUID());
  const staged=changes.map(({record:r,fields})=>{
    if(realpathSync(r.file)!==r.file||!contained(base,r.file)||hash(readFileSync(r.file,'utf8'))!==r.revision)throw Error('File changed. Refresh: '+r.id);
    for(const [k,v] of Object.entries(fields)){if(v===null)r.doc.delete(k);else r.doc.set(k,v);}
    const nl=r.m[1].endsWith('\r\n')?'\r\n':'\n';return {r,raw:r.m[1]+r.doc.toString().trimEnd().replace(/\r?\n/g,nl)+r.m[3]+r.body};
  });
  mkdirSync(backup,{recursive:true});if(!contained(base,realpathSync(backup)))throw Error('Backup directory is redirected.');
  for(const {r} of staged){const path=join(backup,r.kind,r.id+'.md');mkdirSync(dirname(path),{recursive:true});writeFileSync(path,r.raw,{flag:'wx'});}
  const written=[];
  try{for(const item of staged){if(hash(readFileSync(item.r.file,'utf8'))!==item.r.revision)throw Error('Concurrent edit: '+item.r.id);atomic(item.r.file,item.raw);written.push(item);}}
  catch(err){for(const item of written.reverse()){try{if(hash(readFileSync(item.r.file,'utf8'))===hash(item.raw))atomic(item.r.file,item.r.raw);}catch{}}throw Error(`${err.message}; review local backups before retrying.`);}
  return {count:written.length,backup:relative(base,backup)};
}

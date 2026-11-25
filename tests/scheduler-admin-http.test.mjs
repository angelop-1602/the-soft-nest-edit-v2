import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync,mkdirSync,writeFileSync,readFileSync,rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createServer } from 'node:http';
import { createSchedulerMiddleware } from '../scripts/scheduler-admin/integration.mjs';
const fixture='---\r\ntitle: Fixture product\r\npublished: false\r\nstatus: draft\r\n---\r\n# Keep this body exactly\r\n';
test('local API guards writes, preserves Markdown body, rejects stale revision and never publishes',async()=>{
  const root=mkdtempSync(join(tmpdir(),'soft-nest-admin-'));for(const p of ['src/content/posts','src/content/products','public/uploads'])mkdirSync(join(root,p),{recursive:true});const file=join(root,'src/content/products/test.md');writeFileSync(file,fixture);
  const handler=createSchedulerMiddleware(root);const server=createServer((req,res)=>handler(req,res,()=>{res.statusCode=404;res.end();}));await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin=`http://127.0.0.1:${server.address().port}`,base=origin+'/admin/scheduler/',header={'X-Scheduler-Request':'1'};
  try{
    assert.equal((await fetch(base)).status,200);assert.equal((await fetch(base+'api')).status,403);assert.equal((await fetch(base+'api',{headers:{...header,Origin:'https://evil.example'}})).status,403);
    const data=await (await fetch(base+'api',{headers:header})).json();const r=data.records[0];const req={action:'schedule',items:[{key:r.key,revision:r.revision}],publish_at:new Date(Date.now()+86400000).toISOString().replace(/\.\d{3}Z$/,'Z'),campaign_id:'test'};
    const options={method:'POST',headers:{...header,Origin:origin,'Content-Type':'application/json','X-Scheduler-Token':data.token},body:JSON.stringify(req)};
    assert.equal((await fetch(base+'api',{...options,headers:{...options.headers,'X-Scheduler-Token':'wrong'}})).status,403);assert.equal(readFileSync(file,'utf8'),fixture);
    const result=await fetch(base+'api',options);assert.equal(result.status,200);const body=await result.json();assert.equal(body.count,1);assert.equal(readFileSync(join(root,body.backup,'products','test.md'),'utf8'),fixture);
    const updated=readFileSync(file,'utf8');assert.match(updated,/published: false/);assert.match(updated,/publication_approved: false/);assert.ok(updated.endsWith('# Keep this body exactly\r\n'));assert.equal((await fetch(base+'api',options)).status,400);
    const next=await (await fetch(base+'api',{headers:header})).json();assert.equal(next.records[0].status,'Awaiting approval');assert.notEqual(next.records[0].revision,r.revision);
    const cancel=await fetch(base+'api',{...options,body:JSON.stringify({action:'cancel',items:[{key:next.records[0].key,revision:next.records[0].revision}]})});assert.equal(cancel.status,200);assert.doesNotMatch(readFileSync(file,'utf8'),/publish_at:/);
  }finally{await new Promise(r=>server.close(r));rmSync(root,{recursive:true,force:true});}
});

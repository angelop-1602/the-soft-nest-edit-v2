import { randomBytes, timingSafeEqual } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { readRecords, makeImageExists, saveChanges } from './store.mjs';
import { keyOf, summarize, planChanges } from './model.mjs';
const here = new URL('./',import.meta.url);
const prefix='/admin/scheduler/';
const loopback = ip=>['127.0.0.1','::1','::ffff:127.0.0.1'].includes(ip);
const allowedHost = host=>/^(localhost|127\.0\.0\.1|\[::1\])(?::[0-9]{1,5})?$/.test(host??'');
function send(res,status,type,body){res.writeHead(status,{'Content-Type':type,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','X-Robots-Tag':'noindex, nofollow','X-Frame-Options':'DENY','Referrer-Policy':'no-referrer','Content-Security-Policy':"default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'"});res.end(body);}
const json=(res,status,data)=>send(res,status,'application/json; charset=utf-8',JSON.stringify(data));
async function body(req){let n=0, chunks=[];for await(const c of req){n+=c.length;if(n>65536)throw Error('Request too large');chunks.push(c);}return JSON.parse(Buffer.concat(chunks).toString('utf8'));}
export function createSchedulerMiddleware(root){
  const token=randomBytes(32).toString('hex'),imageExists=makeImageExists(root);
  return async function scheduler(req,res,next){
    const path=(req.url??'').split('?')[0];if(path!=='/admin/scheduler'&&!path.startsWith(prefix))return next();
    const host=req.headers.host;
    if(!loopback(req.socket.remoteAddress)||!allowedHost(host)||req.headers['x-forwarded-host']||req.headers['x-forwarded-for']||req.headers['forwarded'])return json(res,403,{error:'Local loopback access only.'});
    if(req.headers.origin&&req.headers.origin!==`http://${host}`)return json(res,403,{error:'Cross-origin request denied.'});
    if(req.headers['sec-fetch-site']&&!['same-origin','none'].includes(req.headers['sec-fetch-site']))return json(res,403,{error:'Cross-site request denied.'});
    if(path==='/admin/scheduler'&&req.method==='GET'){res.writeHead(308,{Location:prefix});return res.end();}
    try{
      const assets={'':['dashboard.html','text/html; charset=utf-8'],'app.js':['app.js','text/javascript; charset=utf-8'],'style.css':['style.css','text/css; charset=utf-8']};const rel=path.slice(prefix.length);
      if(req.method==='GET'&&Object.hasOwn(assets,rel)){const [f,type]=assets[rel];return send(res,200,type,readFileSync(new URL(f,here)));}
      if(rel!=='api')return json(res,404,{error:'Not found'});
      if(req.headers['x-scheduler-request']!=='1')return json(res,403,{error:'Missing local scheduler header.'});
      if(req.method==='GET'){const records=readRecords(root);const id=new URL(req.url,`http://${host}`).searchParams.get('preview');if(id){const r=records.find(r=>keyOf(r)===id);return r?json(res,200,{body:r.body.slice(0,100000)}):json(res,404,{error:'Record not found'});}return json(res,200,{token,records:summarize(records,new Date(),imageExists),now:new Date().toISOString()});}
      if(req.method!=='POST')return json(res,405,{error:'Method not allowed'});
      const supplied=req.headers['x-scheduler-token'];if(req.headers.origin!==`http://${host}`||typeof supplied!=='string'||supplied.length!==token.length||!timingSafeEqual(Buffer.from(supplied,'utf8'),Buffer.from(token,'utf8'))||!/^application\/json(?:;|$)/i.test(req.headers['content-type']??''))return json(res,403,{error:'Invalid local write authorization.'});
      const request=await body(req), records=readRecords(root), changes=planChanges(records,request,new Date(),imageExists);return json(res,200,saveChanges(root,changes));
    }catch(e){return json(res,400,{error:e instanceof Error?e.message:'Scheduler request failed.'});}
  };
}
export default function localScheduler(){return {name:'soft-nest-local-scheduler',hooks:{'astro:server:setup':({server})=>{server.middlewares.use(createSchedulerMiddleware(fileURLToPath(new URL('../../',here))));}}};}

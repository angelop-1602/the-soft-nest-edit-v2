import test from 'node:test';import assert from 'node:assert/strict';
import { validPublishAt, publicProduct, publicPost, releaseQueue } from '../src/lib/publication-rules.js';
const now=new Date('2026-12-01T14:00:00Z'), imageExists=()=>true;
const p={status:'approved',published:false,link_verified:true,affiliate_url:'https://www.amazon.com/dp/B0158EQJSY?tag=test-20',image:'/uploads/a.webp',image_alt:'Illustration',image_rights_confirmed:true,publication_approved:true,publish_at:'2026-12-01T14:00:00Z'};
const j={...p,date:'2026-12-01',related_products:['src/content/products/a.md']};
const r=(kind,id,data)=>({kind,id,data});
test('UTC timestamp strict, including leap dates',()=>{for(const x of ['2026-02-29T00:00:00Z','2026-12-01T09:00:00','2026-12-01T09:00:00-05:00','2026-12-01T24:00:00Z',''])assert.equal(validPublishAt(x),false,x);assert.equal(validPublishAt('2028-02-29T00:00:00Z'),true);});
test('manual legacy product and journal remain unchanged',()=>{assert.equal(publicProduct({...p,publish_at:undefined,publication_approved:false,published:true},now,imageExists),true);assert.equal(publicPost({published:true,date:'2026-11-30'},now,imageExists,new Set()),true);});
test('future, draft, canceled, unverified and missing image stay private',()=>{for(const x of [{publish_at:'2026-12-01T14:00:01Z'},{published:false},{publication_approved:false},{link_verified:false},{status:'hidden'},{image_rights_confirmed:false},{image_alt:''},{image:''}])assert.equal(publicProduct({...p,published:true,...x},now,imageExists),false,JSON.stringify(x));assert.equal(publicProduct({...p,published:true},now,()=>false),false);});
test('exact scheduled time, approved and activated',()=>assert.equal(publicProduct({...p,published:true},now,imageExists),true));
test('article requires product and image approvals',()=>{assert.equal(publicPost({...j,published:true},now,imageExists,new Set()),false);assert.equal(publicPost({...j,published:true},now,imageExists,new Set(['a'])),true);assert.equal(publicPost({...j,published:true,image_rights_confirmed:false},now,imageExists,new Set(['a'])),false);});
test('batch releases product before article without mutating source',()=>{const product=r('products','a',p),post=r('posts','b',j);assert.deepEqual(releaseQueue([post,product],now,imageExists).release,[product,post]);assert.equal(p.published,false);});
test('blocked or future product prevents dependent article release',()=>{for(const change of [{link_verified:false},{publish_at:'2026-12-02T14:00:00Z'}])assert.equal(releaseQueue([r('posts','b',j),r('products','a',{...p,...change})],now,imageExists).release.length,0);});
test('released records are not activated again',()=>assert.equal(releaseQueue([r('products','a',{...p,published:true}),r('posts','b',{...j,published:true})],now,imageExists).release.length,0));
const inherited = {...p,publish_at:undefined};
const parent = {...j,auto_release_related_products:true};
test('approved unscheduled product inherits approved parent time in the same batch',()=>{
  const pr=r('products','a',inherited), post=r('posts','b',parent);
  const q=releaseQueue([post,pr],now,imageExists);
  assert.deepEqual(q.release,[pr,post]);
  assert.equal(q.fields.get(pr).publish_at,parent.publish_at);
  assert.equal(q.fields.get(pr).published,true);
  assert.equal(q.fields.get(post).date,'2026-12-01');
  assert.equal(q.fields.get(post).released_at,'2026-12-01T14:00:00Z');
  assert.equal(inherited.publish_at,undefined);
  assert.equal(publicProduct({...inherited,...q.fields.get(pr)},now,imageExists),true);
  assert.equal(publicPost({...parent,...q.fields.get(post)},now,imageExists,new Set(['a'])),true);
});
test('inheritance needs explicit article and product approval; standalone unscheduled remains draft',()=>{
  for(const [pd,jd] of [[inherited,j],[{...inherited,publication_approved:false},parent],[{...inherited,status:'draft'},parent],[{...inherited,status:'hidden'},parent],[{...inherited,link_verified:false},parent],[{...inherited,image_rights_confirmed:false},parent]]) {
    assert.equal(releaseQueue([r('products','a',pd),r('posts','b',jd)],now,imageExists).release.length,0);
  }
  assert.equal(releaseQueue([r('products','a',inherited)],now,imageExists).release.length,0);
});
test('future article or explicit later product date prevents inherited release',()=>{
  assert.equal(releaseQueue([r('products','a',inherited),r('posts','b',{...parent,publish_at:'2026-12-02T14:00:00Z'})],now,imageExists).release.length,0);
  assert.equal(releaseQueue([r('products','a',{...p,publish_at:'2026-12-02T14:00:00Z'}),r('posts','b',parent)],now,imageExists).release.length,0);
});
test('one missing related product prevents all inherited activation',()=>{
  const pr=r('products','a',inherited), post=r('posts','b',{...parent,related_products:['a','missing']});
  const q=releaseQueue([pr,post],now,imageExists);assert.deepEqual(q.release,[]);assert.deepEqual(q.blocked,[post]);assert.equal(q.fields.size,0);
});
test('article approval or image failure does not release inherited products',()=>{
  for(const change of [{publication_approved:false},{image_rights_confirmed:false},{image_alt:''}]) assert.equal(releaseQueue([r('products','a',inherited),r('posts','b',{...parent,...change})],now,imageExists).release.length,0);
});
test('shared inherited product releases only once across due journals',()=>{
  const pr=r('products','a',inherited), a=r('posts','a-post',parent), b=r('posts','b-post',parent);
  assert.deepEqual(releaseQueue([a,b,pr],now,imageExists).release,[pr,a,b]);
});
test('already public related product is reused without changing its metadata',()=>{
  const pr=r('products','a',{...inherited,publication_approved:false,published:true}), post=r('posts','b',parent);
  assert.deepEqual(releaseQueue([pr,post],now,imageExists).release,[post]);
});
test('released marker prevents automatic republication after unpublishing',()=>{
  const mark='2026-12-01T14:00:00Z';
  assert.equal(releaseQueue([r('products','a',{...p,released_at:mark}),r('posts','b',{...parent,released_at:mark})],now,imageExists).release.length,0);
  assert.equal(releaseQueue([r('products','a',{...inherited,released_at:mark}),r('posts','b',parent)],now,imageExists).release.length,0);
});
test('journal release date is derived from scheduled Eastern date; no-products article releases',()=>{
  const post=r('posts','b',{...parent,date:'2030-01-01',publish_at:'2026-12-01T02:00:00Z',related_products:[]});
  const q=releaseQueue([post],now,imageExists);assert.deepEqual(q.release,[post]);assert.equal(q.fields.get(post).date,'2026-11-30');
});

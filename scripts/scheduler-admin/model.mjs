import { validPublishAt, publicProduct, publicPost, due, productSlug, isScheduled, releaseQueue } from '../../src/lib/publication-rules.js';
import { validAffiliateLink } from '../../src/lib/affiliate-rules.js';
export const keyOf = r => `${r.kind}:${r.id}`;
export function easternDate(iso) {const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'America/New_York',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date(iso));const get=t=>parts.find(p=>p.type===t).value;return `${get('year')}-${get('month')}-${get('day')}`;}
export function problems(r, imageExists) {
  const d=r.data, p=[];
  if (!d.image || !/^\/uploads\/[a-z0-9/_-]+\.(jpg|jpeg|png|webp|avif)$/i.test(d.image) || d.image.includes('..') || !imageExists(d.image)) p.push('Missing or invalid local image');
  if (d.image_rights_confirmed!==true) p.push('Image rights / accuracy not confirmed');
  if (typeof d.image_alt!=='string'||!d.image_alt.trim()) p.push('Missing image alt text');
  if (r.kind==='products') {
    if (d.status!=='approved') p.push('Product editorial approval required');
    if (!validAffiliateLink(d.affiliate_url)) p.push('Missing or invalid affiliate URL');
    if (d.link_verified!==true) p.push('Affiliate tracking not confirmed');
  }
  return p;
}
export function summarize(records, now, imageExists) {
  const q=releaseQueue(records,now,imageExists), ready=new Set(q.release.map(keyOf));
  const products=new Set(records.filter(r=>r.kind==='products'&&publicProduct(r.data,now,imageExists)).map(r=>r.id));
  return records.map(r=>{const d=r.data, live=r.kind==='products'?publicProduct(d,now,imageExists):publicPost(d,now,imageExists,products);
    const status=d.published===true?(live?'Released in source':'Blocked release'):!isScheduled(d)?'Draft':d.publication_approved!==true?'Awaiting approval':!validPublishAt(d.publish_at)?'Invalid date':due(d,now)?(ready.has(keyOf(r))?'Due / ready':'Due / blocked'):'Scheduled';
    return {key:keyOf(r),kind:r.kind,id:r.id,revision:r.revision,title:String(d.title??r.id),status,published:d.published===true,publish_at:validPublishAt(d.publish_at)?d.publish_at:'',campaign_id:String(d.campaign_id??''),publication_approved:d.publication_approved===true,image_rights_confirmed:d.image_rights_confirmed===true,link_verified:d.link_verified===true,editorial_approved:d.status==='approved',affiliate_url:typeof d.affiliate_url==='string'?d.affiliate_url:'',image:typeof d.image==='string'&&/^\/uploads\/[a-z0-9/_-]+\.(jpg|jpeg|png|webp|avif)$/i.test(d.image)&&!d.image.includes('..')?d.image:'',image_alt:String(d.image_alt??''),description:String(d.description??d.summary??''),related_products:Array.isArray(d.related_products)?d.related_products.map(productSlug):[],problems:problems(r,imageExists)};
  });
}
export function planChanges(records, request, now, imageExists) {
  const {action,items}=request??{};
  if (!['schedule','cancel','review','approve'].includes(action)||!Array.isArray(items)||items.length<1||items.length>100) throw Error('Invalid action or selection (1–100 records).');
  const byKey=new Map(records.map(r=>[keyOf(r),r])), seen=new Set();
  const selected=items.map(i=>{const r=byKey.get(i?.key);if(!r||seen.has(i.key)||i.revision!==r.revision)throw Error('Selection changed or is invalid. Refresh and retry.');seen.add(i.key);if(r.data.published===true)throw Error('Released records are read-only: '+r.id);return r;});
  const fields=new Map();
  if(action==='schedule') {
    const {publish_at,campaign_id}=request;
    if(!validPublishAt(publish_at)||Date.parse(publish_at)<=now.getTime())throw Error('Choose a valid future release time.');
    if(typeof campaign_id!=='string'||(campaign_id&&!/^[a-z0-9][a-z0-9-]{0,79}$/.test(campaign_id)))throw Error('Campaign ID must be lowercase letters, digits or hyphens.');
    for(const r of selected)fields.set(keyOf(r),{publish_at,campaign_id:campaign_id||null,publication_approved:false,published:false,...(r.kind==='posts'?{date:easternDate(publish_at)}:{})});
  } else if(action==='cancel') {
    for(const r of selected)fields.set(keyOf(r),{publish_at:null,publication_approved:false,published:false});
  } else if(action==='review') {
    if(selected.length!==1)throw Error('Review one record at a time.');
    const r=selected[0], d=r.data, f={publication_approved:false};
    if(typeof request.image_rights_confirmed!=='boolean')throw Error('Confirm image review explicitly.');
    if(request.image_rights_confirmed&&(!d.image||!/^\/uploads\/[a-z0-9/_-]+\.(jpg|jpeg|png|webp|avif)$/i.test(d.image)||d.image.includes('..')||!imageExists(d.image)||!String(d.image_alt??'').trim()))throw Error('An existing local image and alt text are required.');
    f.image_rights_confirmed=request.image_rights_confirmed;
    if(r.kind==='products'){
      if(typeof request.link_verified!=='boolean'||typeof request.editorial_approved!=='boolean')throw Error('Confirm each review explicitly.');
      if(request.link_verified&&!validAffiliateLink(d.affiliate_url))throw Error('Enter a genuine valid affiliate URL in the content editor first.');
      f.link_verified=request.link_verified;f.status=request.editorial_approved?'approved':(d.status==='hidden'?'hidden':'draft');
    }
    fields.set(keyOf(r),f);
  } else {
    if(request.confirm!==true)throw Error('Explicit release approval is required.');
    for(const r of selected){if(!validPublishAt(r.data.publish_at)||Date.parse(r.data.publish_at)<=now.getTime())throw Error('Set a future release time first: '+r.id);fields.set(keyOf(r),{publication_approved:true,published:false});}
    const prospective=records.map(r=>({...r,data:{...r.data,...fields.get(keyOf(r))}}));
    for(const r of prospective.filter(r=>seen.has(keyOf(r)))){
      const at=new Date(r.data.publish_at);const q=releaseQueue(prospective,at,imageExists);
      if(!q.release.some(x=>keyOf(x)===keyOf(r)))throw Error('Cannot approve '+r.id+': '+(problems(r,imageExists).join('; ')||'Related products must be approved and due no later than the article.'));
    }
  }
  return selected.map(r=>({record:r,fields:fields.get(keyOf(r))}));
}

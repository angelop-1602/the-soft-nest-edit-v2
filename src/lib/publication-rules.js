import { publishableProduct } from './affiliate-rules.js';

// UTC timestamps only; reject impossible dates and ambiguous local times.
export function validPublishAt(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\dZ$/.test(value)) return false;
  const ms = Date.parse(value);
  return Number.isFinite(ms) && new Date(ms).toISOString() === value.replace(/Z$/, '.000Z');
}
export const isScheduled = data => Boolean(data.publish_at || data.publication_approved === true || data.released_at);
export const productSlug = ref => typeof ref === 'string' ? ref.replace(/\\/g, '/').split('/').pop().replace(/\.md$/, '') : '';
export const due = (data, now) => validPublishAt(data.publish_at) && Date.parse(data.publish_at) <= now.getTime();
export function scheduleReady(data, now, imageExists) {
  return data.publication_approved === true && due(data, now) &&
    data.image_rights_confirmed === true && typeof data.image_alt === 'string' && !!data.image_alt.trim() &&
    typeof data.image === 'string' && /^\/uploads\/[a-z0-9/_-]+\.(jpg|jpeg|png|webp|avif)$/i.test(data.image) &&
    !data.image.includes('..') && imageExists(data.image);
}
export function publicProduct(data, now, imageExists) {
  return publishableProduct(data) && (!isScheduled(data) || scheduleReady(data, now, imageExists));
}
export function publicPost(data, now, imageExists, productIds) {
  if (data.published !== true || !(new Date(data.date).getTime() <= now.getTime())) return false;
  if (!isScheduled(data)) return true;
  return scheduleReady(data, now, imageExists) && (data.related_products ?? []).every(ref => productIds.has(productSlug(ref)));
}
// Keep the editorial date in US Eastern time, matching the previous bulk tool.
export function editorialDate(timestamp) {
  if (!validPublishAt(timestamp)) throw new Error('Invalid release timestamp');
  const parts = new Intl.DateTimeFormat('en-CA', {timeZone:'America/New_York',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date(timestamp));
  const get = type => parts.find(p => p.type === type).value;
  return `${get('year')}-${get('month')}-${get('day')}`;
}
// Explicit opt-in is required for both article and inherited product. A product
// with its own timestamp always follows that timestamp, never the parent date.
export function releaseQueue(records, now, imageExists) {
  const release = [], blocked = [], fields = new Map(), products = new Set();
  const productRecords = new Map(records.filter(r => r.kind === 'products').map(r => [r.id, r]));
  const released_at = now.toISOString().replace(/\.\d{3}Z$/, 'Z');
  const eligible = d => d.published !== true && !d.released_at;
  const activate = (r, extra = {}) => {
    release.push(r); fields.set(r, { ...extra, published:true, released_at });
    if (r.kind === 'products') products.add(r.id);
  };
  for (const record of productRecords.values()) {
    const d = record.data;
    if (publicProduct(d, now, imageExists)) products.add(record.id);
    if (eligible(d) && due(d, now)) {
      if (publicProduct({...d,published:true}, now,imageExists)) activate(record);
      else blocked.push(record);
    }
  }
  for (const record of records.filter(r => r.kind === 'posts').sort((a,b) => String(a.data.publish_at ?? '').localeCompare(String(b.data.publish_at ?? '')))) {
    const d = record.data;
    if (!eligible(d) || !due(d,now)) continue;
    // Check the article itself before considering any inherited products.
    const date = editorialDate(d.publish_at);
    if (!scheduleReady(d,now,imageExists)) { blocked.push(record); continue; }
    const candidateProducts = new Set(products), inherited = new Map();
    for (const ref of d.related_products ?? []) {
      const id = productSlug(ref);
      if (candidateProducts.has(id)) continue;
      const product = productRecords.get(id);
      if (!product || d.auto_release_related_products !== true) continue;
      const pd = product.data;
      if (!eligible(pd) || pd.publish_at || pd.publication_approved !== true) continue;
      const patch = {publish_at:d.publish_at};
      if (publicProduct({...pd,...patch,published:true},now,imageExists)) {
        inherited.set(product,patch); candidateProducts.add(id);
      }
    }
    // Never activate inherited products from a partially blocked article.
    if (!publicPost({...d,date,published:true},now,imageExists,candidateProducts)) { blocked.push(record); continue; }
    for (const [product,patch] of inherited) activate(product,patch);
    activate(record,{date});
  }
  return {release,blocked,fields};
}

import { publishableProduct } from './affiliate-rules.js';

// UTC timestamps only; reject impossible dates and ambiguous local times.
export function validPublishAt(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\dZ$/.test(value)) return false;
  const ms = Date.parse(value);
  return Number.isFinite(ms) && new Date(ms).toISOString() === value.replace(/Z$/, '.000Z');
}
export const isScheduled = data => Boolean(data.publish_at || data.publication_approved === true);
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
// Determine releases as a batch, products first. Does not mutate source records.
export function releaseQueue(records, now, imageExists) {
  const release = [], blocked = [], products = new Set();
  for (const record of records.filter(r => r.kind === 'products')) {
    const d = record.data;
    if (publicProduct(d, now, imageExists)) products.add(record.id);
    if (isScheduled(d) && due(d, now) && d.published !== true) {
      if (publicProduct({...d, published:true}, now, imageExists)) { release.push(record); products.add(record.id); }
      else blocked.push(record);
    }
  }
  for (const record of records.filter(r => r.kind === 'posts')) {
    const d = record.data;
    if (isScheduled(d) && due(d, now) && d.published !== true) {
      if (publicPost({...d, published:true}, now, imageExists, products)) release.push(record);
      else blocked.push(record);
    }
  }
  return {release, blocked};
}

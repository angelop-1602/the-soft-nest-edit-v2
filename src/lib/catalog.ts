import { getCollection } from 'astro:content';

import { validAffiliateLink, publishableProduct } from './affiliate-rules.js';
export { validAffiliateLink, publishableProduct };
export async function getPublishedProducts() {
  const records = await getCollection('products');
  return records.filter(p => publishableProduct(p.data)).sort((a, b) => Number(b.data.featured) - Number(a.data.featured) || a.data.title.localeCompare(b.data.title));
}
export async function getPublishedPosts() {
  const records = await getCollection('posts');
  const now = new Date();
  return records.filter(p => p.data.published && p.data.date <= now).sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
}
export const dateDisplay = (date: Date) => new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' }).format(date);
export const dateISO = (date: Date) => date.toISOString().slice(0, 10);
export const canonical = (siteUrl: string, path: string) => `${siteUrl.replace(/\/$/, '')}${path.startsWith('/') ? path : '/' + path}`;

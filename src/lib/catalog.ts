import { getCollection } from 'astro:content';
import { statSync } from 'node:fs';
import { join } from 'node:path';
import { publicProduct, publicPost } from './publication-rules.js';
const imageExists = (path: string) => { try { return statSync(join(process.cwd(), 'public', path.slice(1))).isFile(); } catch { return false; } };

import { validAffiliateLink, publishableProduct } from './affiliate-rules.js';
export { validAffiliateLink, publishableProduct };
export async function getPublishedProducts(now = new Date()) {
  const records = await getCollection('products');
  return records.filter(p => publicProduct(p.data, now, imageExists)).sort((a, b) => Number(b.data.featured) - Number(a.data.featured) || a.data.title.localeCompare(b.data.title));
}
export async function getPublishedPosts() {
  const records = await getCollection('posts');
  const now = new Date();
  const products = new Set((await getPublishedProducts(now)).map(p => p.id));
  return records.filter(p => publicPost(p.data, now, imageExists, products)).sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
}
export const dateDisplay = (date: Date) => new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' }).format(date);
export const dateISO = (date: Date) => date.toISOString().slice(0, 10);
export const canonical = (siteUrl: string, path: string) => `${siteUrl.replace(/\/$/, '')}${path.startsWith('/') ? path : '/' + path}`;

import type { APIRoute } from 'astro';
import site from '../data/site.json';
import { getPublishedPosts } from '../lib/catalog';
import { xmlEscape } from '../lib/escapes';
export const prerender = true;
export const GET: APIRoute = async () => {
 const posts=await getPublishedPosts();
 const items=posts.map(p=>`<item><title>${xmlEscape(p.data.title)}</title><link>${xmlEscape(site.url+'/journal/'+p.id+'/')}</link><guid>${xmlEscape(site.url+'/journal/'+p.id+'/')}</guid><description>${xmlEscape(p.data.description)}</description><pubDate>${p.data.date.toUTCString()}</pubDate></item>`).join('\n');
 const xml=`<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>${xmlEscape(site.name+' Journal')}</title><link>${xmlEscape(site.url)}</link><description>${xmlEscape(site.description)}</description>${items}</channel></rss>`;
 return new Response(xml,{headers:{'Content-Type':'application/rss+xml; charset=utf-8'}});
};

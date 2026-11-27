import type { APIRoute } from 'astro';
import site from '../data/site.json';
import { getPublishedPosts,getPublishedProducts,dateISO } from '../lib/catalog';
import { categories } from '../data/categories';
import { rooms } from '../data/rooms';
import { roomsForProduct } from '../lib/shop-taxonomy';
import { xmlEscape } from '../lib/escapes';
export const prerender = true;
export const GET: APIRoute = async () => {
 const posts=await getPublishedPosts(); const products=await getPublishedProducts();
 const links=[
 {url:'/'},{url:'/journal/'},{url:'/shop/'},{url:'/about/'},{url:'/contact/'},{url:'/affiliate-disclosure/'},{url:'/privacy/'},{url:'/terms/'},
 ...posts.map(p=>({url:`/journal/${p.id}/`,lastmod:dateISO(p.data.updated || p.data.date)})),
 ...categories.filter(c=>posts.some(p=>p.data.category===c.name)).map(c=>({url:`/category/${c.slug}/`})),
 ...rooms.filter(room=>products.some(p=>roomsForProduct(p.data).includes(room.name))).map(room=>({url:`/shop/room/${room.slug}/`})),
 ...products.map(p=>({url:`/shop/${p.id}/`,lastmod:p.data.reviewed_at?dateISO(p.data.reviewed_at):undefined}))
 ];
 const xml=`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${links.map(l=>`<url><loc>${xmlEscape(site.url+l.url)}</loc>${'lastmod' in l && l.lastmod?`<lastmod>${l.lastmod}</lastmod>`:''}</url>`).join('\n')}\n</urlset>`;
 return new Response(xml,{headers:{'Content-Type':'application/xml; charset=utf-8'}});
};

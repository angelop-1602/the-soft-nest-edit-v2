#!/usr/bin/env node
/* Reversible, local-only import. Never marks legacy products approved. */
import { existsSync, readdirSync, readFileSync, writeFileSync, mkdirSync, copyFileSync } from 'node:fs';
import { resolve, basename, join } from 'node:path';
import YAML from 'yaml';

const source=resolve(process.argv[2] || '../the-soft-nest-edit');
const destination=resolve(process.cwd());
if(!existsSync(join(source,'content','posts')) || !existsSync(join(source,'content','products'))) {
  console.error('Usage: npm run import:v1 -- "C:/path/to/the-soft-nest-edit"');
  process.exit(1);
}
if(source===destination){console.error('Use a separate v2 directory.');process.exit(1);}
const publishedCategories=new Set(['Living Room','Bedroom','Small Spaces','Home Organization','Lifestyle']);
function frontMatter(content){
  const found=/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(content);
  if(!found)throw new Error('No YAML frontmatter');
  return {metadata:YAML.parse(found[1]),body:content.slice(found[0].length)};
}
function save(target,metadata,body){mkdirSync(resolve(destination,target,'..'),{recursive:true});writeFileSync(resolve(destination,target),`---\n${YAML.stringify(metadata).trimEnd()}\n---\n\n${body.trim()}\n`,'utf8');}
let articles=0;let products=0;const articleUploads=new Set();
for(const name of readdirSync(join(source,'content','posts')).filter(x=>x.endsWith('.md'))){
  const {metadata:m,body}=frontMatter(readFileSync(join(source,'content','posts',name),'utf8'));
  if(!publishedCategories.has(m.category)){console.warn('Skip article with invalid category',name);continue;}
  const refs=Array.isArray(m.products)?m.products:typeof m.products==='string'?[m.products]:[];
  const cleaned={title:m.title,date:String(m.date).slice(0,10),...(m.updated?{updated:String(m.updated).slice(0,10)}:{}),category:m.category,description:m.description,
    ...(m.image?{image:m.image}:{}),...(m.image_alt?{image_alt:m.image_alt}:{}),published:m.published===true,featured:m.featured===true,
    related_products:refs.map(v=>basename(String(v).replace(/\\/g,'/')).replace(/\.md$/,'')).filter(Boolean)};
  if(typeof m.image==='string' && m.image.startsWith('/uploads/'))articleUploads.add(m.image);
  for(const match of body.matchAll(/\/uploads\/[A-Za-z0-9_./-]+/g))articleUploads.add(match[0]);
  save('src/content/posts/'+name,cleaned,body);articles++;
}
for(const name of readdirSync(join(source,'content','products')).filter(x=>x.endsWith('.md'))){
  const {metadata:m,body}=frontMatter(readFileSync(join(source,'content','products',name),'utf8'));
  if(!publishedCategories.has(m.category)){console.warn('Skip product with invalid category',name);continue;}
  const cleaned={title:m.title,category:m.category,summary:m.summary,retailer:'Amazon US',status:'draft',published:false,
    affiliate_url:'',link_verified:false,image:'',image_alt:'',image_rights_confirmed:false,
    best_for:'',considerations:'Verify Amazon listing specifications and photo rights before approving.',highlights:[],featured:m.featured_shop===true};
  save('src/content/products/'+name,cleaned,`LEGACY RESEARCH LINK (not verified): ${m.product_url||'(not provided)'}\nLEGACY PRODUCT IMAGE (not licensed for reuse): ${m.image||'(not provided)'}\n\n${body}`);products++;
}
const originalUploads=join(source,'static','uploads');
for(const relativeUrl of articleUploads){
 const relative=relativeUrl.replace(/^\/uploads\//,'');
 if(relative.includes('..') || relative.startsWith('/'))continue;
 const oldFile=join(originalUploads,relative);const newFile=join(destination,'public','uploads',relative);
 if(existsSync(oldFile)){mkdirSync(resolve(newFile,'..'),{recursive:true});copyFileSync(oldFile,newFile);}
}
console.log(`Copied ${articleUploads.size} locally referenced editorial images if present. Product images were intentionally NOT copied: rights require review.`);
console.log(`Imported ${articles} articles and ${products} unapproved products. Review photo rights, SEO fields, and Amazon Special Links manually before launching.`);
console.log('Articles preserve their slugs and published flags. Existing v2 sample articles with matching slugs are replaced; commit or back them up before importing.');

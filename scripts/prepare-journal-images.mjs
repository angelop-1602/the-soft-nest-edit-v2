import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const uploads = path.resolve('public/uploads');
const out = path.resolve('public/assets/journal-responsive');
// Generated assets are disposable; the original uploaded images remain untouched.
await fs.mkdir(out, {recursive:true});
const index = path.join(out,'manifest.json');
await fs.writeFile(index, '{}\n');
let sharp;
try { sharp = require('sharp'); } catch { console.warn('Journal responsive images: sharp unavailable; original image URLs will be used.'); }
if (sharp) {
  const manifest = {};
  const keep = new Set(['manifest.json']);
  for (const entry of await fs.readdir(uploads,{withFileTypes:true})) {
    if (!entry.isFile() || !/^[a-z0-9-]+-hero\.webp$/.test(entry.name)) continue;
    try {
      const bytes = await fs.readFile(path.join(uploads,entry.name));
      const meta = await sharp(bytes).metadata();
      if (!meta.width || !meta.height || meta.pages > 1 || (meta.orientation && meta.orientation !== 1)) continue;
      const hash = createHash('sha256').update(bytes).digest('hex');
      const stem = entry.name.slice(0,-5);
      const src = `/uploads/${entry.name}`;
      const candidates=[];
      for (const width of [480,800,1200]) {
        if (width >= meta.width) continue;
        const name = `${stem}-${hash.slice(0,16)}-${width}.webp`;
        const dest = path.join(out,name);
        await sharp(bytes).resize({width,withoutEnlargement:true}).webp({quality:88}).toFile(dest);
        keep.add(name);
        candidates.push(`/assets/journal-responsive/${name} ${width}w`);
      }
      candidates.push(`${src} ${meta.width}w`);
      manifest[src] = {width:meta.width,height:meta.height,sha256:hash,srcset:candidates.join(', ')};
    } catch (err) { console.warn(`Journal image ${entry.name}: using original (${err.message})`); }
  }
  await fs.writeFile(index, JSON.stringify(manifest,null,2)+'\n');
  for (const entry of await fs.readdir(out,{withFileTypes:true})) {
    if (entry.isFile() && /^[a-z0-9-]+-[a-f0-9]{16}-(480|800|1200)\.webp$/.test(entry.name) && !keep.has(entry.name)) await fs.unlink(path.join(out,entry.name));
  }
  console.log(`Journal responsive images: ${Object.keys(manifest).length} original images processed; no enlargement.`);
}

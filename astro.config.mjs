import { defineConfig } from 'astro/config';
import localScheduler from './scripts/scheduler-admin/integration.mjs';
import site from './src/data/site.json' with { type: 'json' };

export default defineConfig({
  integrations: [localScheduler()],
  site: site.url,
  trailingSlash: 'always',
  build: { format: 'directory' },
  output: 'static',
  devToolbar: { enabled: false }
});

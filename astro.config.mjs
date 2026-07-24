import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import revedit from './tools/revedit/integration.mjs';

export default defineConfig({
  site: 'https://revaudio.net',
  // RevEdit overlay only exists when launched via `npm run edit` (EDIT=1).
  integrations: [sitemap(), ...(process.env.EDIT ? [revedit()] : [])],
  build: {
    inlineStylesheets: 'auto',
  },
});

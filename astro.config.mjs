import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import revedit from './tools/revedit/integration.mjs';
import bench from './tools/bench/integration.mjs';

export default defineConfig({
  site: 'https://revaudio.net',
  // RevEdit overlay only exists when launched via `npm run edit` (EDIT=1).
  // Bench needs no flag: it self-disables outside `dev` and stays inert until
  // a URL asks for it with ?bench — so plain `npm run dev` is unaffected.
  integrations: [sitemap(), bench(), ...(process.env.EDIT ? [revedit()] : [])],
  build: {
    inlineStylesheets: 'auto',
  },
});

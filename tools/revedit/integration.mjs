/* RevEdit — dev-only visual editor overlay.
   Active only via `npm run edit` (EDIT=1). Never part of the prod build:
   the integration is skipped in astro.config unless EDIT is set, and it
   bails on any command other than `dev` as a second guard. */
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const CLIENT = fileURLToPath(new URL('./revedit.client.js', import.meta.url));

export default function revedit() {
  let overridesPath = '';
  return {
    name: 'revedit',
    hooks: {
      'astro:config:setup': ({ command, updateConfig, injectScript, config }) => {
        if (command !== 'dev') return;
        overridesPath = path.join(fileURLToPath(config.root), 'revedit.overrides.json');
        updateConfig({
          vite: {
            plugins: [
              {
                name: 'revedit-server',
                configureServer(server) {
                  server.middlewares.use(async (req, res, next) => {
                    const url = (req.url || '').split('?')[0];
                    if (!url.startsWith('/__revedit/')) return next();
                    try {
                      if (url === '/__revedit/client.js') {
                        res.setHeader('Content-Type', 'text/javascript');
                        res.end(await readFile(CLIENT, 'utf8'));
                      } else if (url === '/__revedit/load') {
                        let body = '{}';
                        try { body = await readFile(overridesPath, 'utf8'); } catch { /* no file yet */ }
                        res.setHeader('Content-Type', 'application/json');
                        res.end(body);
                      } else if (url === '/__revedit/save' && req.method === 'POST') {
                        const chunks = [];
                        for await (const c of req) chunks.push(c);
                        const json = JSON.parse(Buffer.concat(chunks).toString('utf8'));
                        await writeFile(overridesPath, JSON.stringify(json, null, 2) + '\n');
                        res.end('ok');
                      } else {
                        res.statusCode = 404;
                        res.end('revedit: unknown endpoint');
                      }
                    } catch (e) {
                      res.statusCode = 500;
                      res.end('revedit: ' + (e && e.message));
                    }
                  });
                },
              },
            ],
          },
        });
        injectScript(
          'head-inline',
          `(function(){var s=document.createElement('script');s.src='/__revedit/client.js';s.defer=true;document.head.appendChild(s);})();`
        );
      },
    },
  };
}

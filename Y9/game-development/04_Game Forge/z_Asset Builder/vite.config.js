import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';
import { readFile } from 'node:fs/promises';
// Production files remain outside public/: external builds never copy them to Pages.
export default defineConfig({
  base: './',
  build: { emptyOutDir: true },
  plugins: [react(), { name: 'local-production-assets', configureServer(server) {
    server.middlewares.use('/downloads', async (req,res,next) => {
      try {
        const relative = decodeURIComponent((req.url || '').split('?')[0]);
        const root = resolve('assets'); const path = resolve(root, '.' + relative);
        if (!path.startsWith(root + '/') || !/\.(png|ogg|wav|webp|jpg)$/i.test(path)) {res.statusCode=404;return res.end();}
        res.setHeader('Content-Type',path.endsWith('.png')?'image/png':path.endsWith('.ogg')?'audio/ogg':path.endsWith('.wav')?'audio/wav':'image/webp');
        res.end(await readFile(path));
      } catch {next();}
    });
  }}],
});

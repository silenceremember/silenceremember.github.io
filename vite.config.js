import { resolve } from 'path';
import { defineConfig } from 'vite';
import { promises as fs } from 'fs';
import path from 'path';

export default defineConfig({
  root: 'src',
  plugins: [
    {
      name: 'custom-404-plugin',
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          const cleanUrl = req.url.split('?')[0].split('#')[0];

          // Пропускаем внутренние пути Vite (HMR, клиент и т.д.)
          if (cleanUrl.startsWith('/@') || cleanUrl.startsWith('/node_modules/')) {
            return next();
          }

          // Пропускаем статические ресурсы (файлы с расширениями)
          if (cleanUrl.includes('.') && !cleanUrl.endsWith('.html')) {
            return next();
          }
          
          const rootPath = server.config.root;
          let filePath = path.join(rootPath, cleanUrl);

          if (cleanUrl.endsWith('/') || cleanUrl === '') {
            filePath = path.join(filePath, 'index.html');
          } else if (!path.extname(cleanUrl)) {
            filePath += '.html';
          }

          try {
            await fs.access(filePath);
            next();
          } catch (e) {
            try {
                const notFoundHtml = await fs.readFile(path.join(rootPath, '404.html'), 'utf-8');
                res.statusCode = 404;
                res.setHeader('Content-Type', 'text/html');
                res.end(await server.transformIndexHtml(req.url, notFoundHtml));
            } catch (error) {
                console.error('404.html not found', error);
                next(error);
            }
          }
        });
      },
    },
  ],
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'src/index.html'),
        projects: resolve(__dirname, 'src/projects.html'),
        cv: resolve(__dirname, 'src/cv.html'),
        community: resolve(__dirname, 'src/community.html'),
        research: resolve(__dirname, 'src/research.html'),
        404: resolve(__dirname, 'src/404.html'),
      },
    },
  },
});

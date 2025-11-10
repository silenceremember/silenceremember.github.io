import { resolve } from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  root: 'src',
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

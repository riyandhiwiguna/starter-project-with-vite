import { defineConfig } from 'vite';
import { resolve } from 'path';
import { copyFileSync } from 'fs';

export default defineConfig({

  root: resolve(__dirname, 'src'),

  publicDir: resolve(__dirname, 'public'),

  build: {
    outDir: resolve(__dirname, 'dist'),
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'src', 'index.html'),
      },
    },
  },

  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },

  plugins: [
    {
      name: 'copy-sw-and-manifest',
      closeBundle() {
        try {

          copyFileSync(
            resolve(__dirname, 'public', 'service-worker.js'),
            resolve(__dirname, 'dist', 'service-worker.js')
          );
          console.log('✅ Service worker copied to dist');
        } catch (err) {
          console.error('❌ Failed to copy service worker:', err);
        }

        try {

          copyFileSync(
            resolve(__dirname, 'public', 'manifest.json'),
            resolve(__dirname, 'dist', 'manifest.json')
          );
          console.log('✅ Manifest copied to dist');
        } catch (err) {
          console.error('❌ Failed to copy manifest:', err);
        }
      },
    },
  ],
});

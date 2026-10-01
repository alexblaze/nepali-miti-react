import { copyFileSync } from 'node:fs';
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  clean: true,
  target: 'es2020',
  external: ['react', 'react-dom', 'nepali-miti'],
  // The components use hooks, so mark the bundle as a Client Component for React Server Components / Next.js.
  banner: { js: '"use client";' },
  onSuccess: async () => {
    copyFileSync('src/styles.css', 'dist/styles.css');
  },
});

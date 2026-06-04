#!/usr/bin/env node
/**
 * Standalone production build for a condenser plugin.
 * Produces dist/frontend.js and dist/backend.mjs — both ESM.
 *
 * React imports are aliased to condenser-app's library/react.ts so the plugin
 * uses Steam's webpack-bundled React rather than bundling its own copy.
 * All condenser API calls go through window.condenser (no shims needed).
 */
import { build } from 'esbuild';
import { mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const libraryDir = path.resolve(__dirname, '../../condenser-app/frontend/library');

mkdirSync(path.join(root, 'dist'), { recursive: true });

const reactAlias = {
  'react':                 path.join(libraryDir, 'react.ts'),
  'react/jsx-runtime':     path.join(libraryDir, 'react-jsx.ts'),
  'react/jsx-dev-runtime': path.join(libraryDir, 'react-jsx.ts'),
};

await build({
  entryPoints: [path.join(root, 'frontend.tsx')],
  bundle: true,
  format: 'esm',
  target: 'esnext',
  outfile: path.join(root, 'dist/frontend.js'),
  alias: reactAlias,
});

await build({
  entryPoints: [path.join(root, 'backend.ts')],
  bundle: true,
  platform: 'node',
  target: 'node24',
  format: 'esm',
  outfile: path.join(root, 'dist/backend.mjs'),
});

console.log('Build complete: dist/frontend.js + dist/backend.mjs');

import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
	root: 'tests/browser',
	cacheDir: 'node_modules/.vite-harness',
	plugins: [svelte()],
	server: { fs: { allow: ['.'] } }
});

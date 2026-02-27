// @ts-check
import { defineConfig } from 'astro/config';
import node from '@astrojs/node';

// https://astro.build/config
export default defineConfig({
	output: 'server',
	adapter: node({
		mode: 'standalone'
	}),
	// Pages with 'export const prerender = false' will be server-rendered
	// Static pages will be pre-rendered at build time
});

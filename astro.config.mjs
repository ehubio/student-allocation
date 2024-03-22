import { defineConfig } from 'astro/config';
import vue from '@astrojs/vue';


// https://astro.build/config
export default defineConfig({
	// Enable Vue to support Vue components.
	integrations: [vue()],
	site: 'https://ehubio.github.io',
	base: '/student-allocation',
	vite: {
		server: {
			watch: {
				ignored: ['**/.github', '**/.vscode', '**/.idea']
			}
		}
	}
});

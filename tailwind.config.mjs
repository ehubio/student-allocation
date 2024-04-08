/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
	theme: {
		extend: {
			fontFamily: {
				mono: ["IBM Plex Mono", "monospace"],
			},
		},
		container: {
			center: true,
			padding: '2rem',
		},
	},
	plugins: [require("daisyui")],
}

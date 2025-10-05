import tailwindcss from "@tailwindcss/vite";
import svgLoader from "vite-svg-loader";

export default defineNuxtConfig({
	compatibilityDate: "2025-07-15",
	devtools: { enabled: false },
	css: ["~/assets/css/main.css"],
	modules: [
		[
			"@nuxtjs/google-fonts",
			{
				families: {
					Rajdhani: [300, 400, 500, 600, 700],
				},
			},
		],
	],
	vite: {
		plugins: [tailwindcss(), svgLoader()],
	},
	typescript: {
		tsConfig: {
			compilerOptions: {
				types: ["vite-svg-loader"],
			},
		},
	},
});

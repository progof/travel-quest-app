import type { DehydratedState } from "@tanstack/vue-query";
import {
	VueQueryPlugin,
	QueryClient,
	hydrate,
	dehydrate,
} from "@tanstack/vue-query";
import { useState } from "#app";

export default defineNuxtPlugin((nuxt) => {
	const vueQueryState = useState<DehydratedState | null>("vue-query");

	const queryClient = new QueryClient({
		defaultOptions: { queries: { staleTime: 5000 } },
	});
	nuxt.vueApp.use(VueQueryPlugin, { queryClient });

	if (import.meta.server) {
		nuxt.hooks.hook("app:rendered", () => {
			vueQueryState.value = dehydrate(queryClient);
		});
	}

	if (import.meta.client) {
		nuxt.hooks.hook("app:created", () => {
			hydrate(queryClient, vueQueryState.value);
		});
	}
});

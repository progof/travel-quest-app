import { useLocalStorage, createSharedComposable } from "@vueuse/core";

export const useFoundLocations = createSharedComposable(() => {
	return useLocalStorage<
		Array<{
			index: number;
			date: string;
			imageId: string;
		}>
	>("found_locations", [], {
		serializer: {
			read: (v) => (v ? JSON.parse(v) : []),
			write: (v) => JSON.stringify(v),
		},
	});
});

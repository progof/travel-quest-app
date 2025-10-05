import { useLocalStorage } from "@vueuse/core";

export const useFoundLocations = () => {
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
};

<script setup lang="ts">
import QuestionBlock from "~/assets/icons/question-block.svg?component";
import Star from "~/assets/icons/star.svg?component";

const props = defineProps<{
	location: {
		name: string;
		hint: string;
		index: number;
	};
}>();

const foundLocations = useFoundLocations();
const { getImageById } = useImageStorage();

const found = computed(() => {
	const found = foundLocations.value.find(
		(loc) => loc.index === props.location.index
	);
	if (!found) return null;

	return {
		at: new Date(found.date).toLocaleString(),
		imageId: found.imageId,
	};
});

const imageDataUrl = ref<string | null>(null);

// Load the image data when found changes
watchEffect(async () => {
	if (found.value?.imageId) {
		try {
			const capturedImage = await getImageById(found.value.imageId);
			if (capturedImage?.imageBlob) {
				// Create data URL from blob
				const reader = new FileReader();
				reader.onload = () => {
					imageDataUrl.value = reader.result as string;
				};
				reader.readAsDataURL(capturedImage.imageBlob);
			}
		} catch (error) {
			console.error("Failed to load image:", error);
			imageDataUrl.value = null;
		}
	} else {
		imageDataUrl.value = null;
	}
});
</script>

<template>
	<div class="flex">
		<QuestionBlock v-if="found === null" class="h-28 w-28" />
		<div v-else-if="imageDataUrl" class="relative">
			<img
				:src="imageDataUrl"
				class="h-28 w-28 rounded-xl object-cover border-2 border-[#3C3A2D]"
				alt="Found location"
			/>
			<Star class="absolute -top-2 -right-2 rotate-12 h-8 w-8 drop-shadow-lg" />
		</div>
		<div
			v-else
			class="h-28 w-28 rounded-xl border-2 border-[#3C3A2D] bg-gray-200 flex items-center justify-center"
		>
			<span class="text-gray-500">Loading...</span>
		</div>
		<div class="flex px-5 gap-1 flex-col flex-1 min-w-0">
			<h2 class="text-black text-[17px] leading-[1.25] font-bold">
				{{ location.name }}
			</h2>
			<p class="text-[15px] leading-[1.25] text-[#3C3A2D] font-semibold">
				{{ location.hint }}
			</p>
		</div>
	</div>
</template>

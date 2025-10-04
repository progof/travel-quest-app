<script setup lang="ts">
import CameraIcon from "~/assets/icons/camera.svg";

interface QuestItemType {
	description: string;
	images: string[];
}

const props = defineProps<{
	item: QuestItemType;
	onOpenCamera: (item: QuestItemType) => void;
}>();
</script>

<template>
	<div
		class="bg-white rounded-3xl shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden flex flex-col"
	>
		<!-- Preview image with gradient overlay -->
		<div class="relative w-full h-52 md:h-48">
			<img
				:src="props.item.images[0]"
				class="w-full h-full object-cover"
				alt="Quest preview"
			/>
			<div
				class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-4 text-white text-lg font-semibold"
			>
				{{ props.item.description }}
			</div>
		</div>

		<!-- Bottom actions -->
		<div class="flex justify-between items-center p-4">
			<!-- Thumbnails -->
			<div class="flex -space-x-2">
				<img
					v-for="(img, i) in props.item.images.slice(0, 3)"
					:key="i"
					:src="img"
					class="w-10 h-10 rounded-full border-2 border-white object-cover shadow-sm"
				/>
				<span
					v-if="props.item.images.length > 3"
					class="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-xs text-gray-600 font-semibold shadow-sm"
				>
					+{{ props.item.images.length - 3 }}
				</span>
			</div>

			<button
				@click="props.onOpenCamera(props.item)"
				class="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-xl shadow hover:bg-blue-600 hover:scale-105 active:scale-95 transition-transform duration-200"
				s
			>
				<CameraIcon class="size-5 stroke-2" />
			</button>
		</div>
	</div>
</template>

<style scoped>
/* Optional: subtle zoom on hover for image */
div.relative img {
	transition: transform 0.3s ease;
}
div.relative:hover img {
	transform: scale(1.03);
}
</style>

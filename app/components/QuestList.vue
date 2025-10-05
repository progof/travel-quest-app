<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { questLocations } from "#shared/quest";
import QuestItem from "~/components/QuestItem.vue";

const router = useRouter();
interface QuestItemType {
	description: string;
	images: string[];
}

const selected = ref<QuestItemType | null>(null);

const openCamera = (item: QuestItemType) => {
	selected.value = item;
	router.push({ name: "camera", query: { desc: item.description } });
};
</script>

<template>
	<div class="flex-1 p-4 overflow-y-auto">
		<div class="flex flex-col md:grid md:grid-cols-3 gap-4">
			<QuestItem
				v-for="(item, index) in questLocations"
				:key="index"
				:item="item"
				:onOpenCamera="openCamera"
			/>
		</div>
	</div>
</template>

<style scoped>
.flex-1.overflow-y-auto {
	-webkit-overflow-scrolling: touch;
}

::-webkit-scrollbar {
	width: 6px;
}
::-webkit-scrollbar-thumb {
	background: #ccc;
	border-radius: 4px;
}
</style>

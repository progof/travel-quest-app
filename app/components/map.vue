<script setup lang="ts">
import { questLocations } from "#shared/quest";
import { useRouter } from "vue-router";
import MapPointIcon from "~/assets/icons/map-point.svg";

interface Point {
	id: number;
	description: string;
	x: number;
	y: number;
	images: string[];
}

const router = useRouter();

const points: Point[] = [
	{
		id: 1,
		description: questLocations[0]?.description ?? "Unknown",
		images: questLocations[0]?.images ?? [],
		x: 20,
		y: 30,
	},
	{
		id: 2,
		description: questLocations[1]?.description ?? "Unknown",
		images: questLocations[1]?.images ?? [],
		x: 50,
		y: 20,
	},
	{
		id: 3,
		description: questLocations[2]?.description ?? "Unknown",
		images: questLocations[2]?.images ?? [],
		x: 70,
		y: 40,
	},
	{
		id: 4,
		description: questLocations[3]?.description ?? "Unknown",
		images: questLocations[3]?.images ?? [],
		x: 30,
		y: 60,
	},
	{
		id: 5,
		description: questLocations[4]?.description ?? "Unknown",
		images: questLocations[4]?.images ?? [],
		x: 60,
		y: 70,
	},
];

const openCamera = (point: Point) => {
	router.push({ name: "camera", query: { desc: point.description } });
};
</script>

<template>
	<div class="flex flex-col h-screen bg-gray-100">
		<div class="flex-1 relative overflow-hidden">
			<img
				src="/images/tauron-arena-plan.jpg"
				alt="Tauron Arena Plan"
				class="absolute inset-0 w-full h-full object-cover filter brightness-90 contrast-110"
			/>
			<div
				class="absolute inset-0 bg-gradient-to-b from-transparent via-black/10 to-transparent pointer-events-none"
			></div>

			<div
				v-for="point in points"
				:key="point.id"
				@click="openCamera(point)"
				class="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center cursor-pointer group"
				:style="{ left: point.x + '%', top: point.y + '%' }"
			>
				<div
					class="bg-blue-500 hover:bg-blue-600 text-white rounded-full w-14 h-14 flex items-center justify-center shadow-xl transition-transform transform hover:scale-110 active:scale-95"
				>
					<MapPointIcon class="size-7 stroke-2" />
				</div>

				<div
					class="absolute bottom-full mb-2 w-44 bg-white rounded-2xl shadow-2xl p-3 text-xs opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20"
				>
					<div class="font-semibold mb-2">{{ point.description }}</div>
					<div class="flex -space-x-1">
						<img
							v-for="(img, i) in point.images.slice(0, 3)"
							:key="i"
							:src="img"
							class="w-10 h-10 rounded-md border border-gray-200 object-cover"
						/>
						<span
							v-if="point.images.length > 3"
							class="w-10 h-10 rounded-md bg-gray-200 flex items-center justify-center text-gray-600 text-xs font-semibold"
						>
							+{{ point.images.length - 3 }}
						</span>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>

<style scoped>
div.absolute > div.group:hover div {
	opacity: 1 !important;
	pointer-events: auto;
	transform: translateY(-5px);
	transition: all 0.25s ease-out;
}
</style>

<script setup lang="ts">
import CameraIcon from "~/assets/icons/camera.svg?component";
import { questLocations } from "#shared/quest";
import LocationItem from "~/components/LocationItem.vue";
</script>

<template>
	<div
		class="h-screen overflow-y-auto p-5 gap-5 bg-[#F9F6EA] flex flex-col pb-20"
	>
		<h1 class="text-2xl font-bold text-black">
			Travel Quest - (HackYeah 2025)
		</h1>
		<ClientOnly>
			<div class="flex flex-col gap-5">
				<LocationItem
					v-for="(item, index) in questLocations"
					:key="index"
					:location="{
						name: item.name,
						hint: item.hint,
						index: index,
					}"
				/>
			</div>
		</ClientOnly>
	</div>
	<div class="fixed bottom-0 left-0 right-0 m-4">
		<NuxtLink
			to="/camera"
			class="flex bg-[#039FF9] border border-white/25 rounded-xl text-white font-bold text-base items-center justify-center h-11 w-full px-4 gap-2"
			:style="{
				boxShadow: '0px 2px 0px #247EB3',
			}"
		>
			<CameraIcon class="size-6" />
			<span>SCAN LOCATION</span>
		</NuxtLink>
	</div>
</template>

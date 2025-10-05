<script setup lang="ts">
import { nextTick, watchEffect, ref } from "vue";
import { useRouter } from "vue-router";
import { questLocations } from "#shared/quest";
import { useUserMedia } from "@vueuse/core";
import { useMutation } from "@tanstack/vue-query";
import { useImageStorage } from "~/composables/useImageStorage";
import CompasIcon from "~/assets/icons/compass.svg?component";
import StarIcon from "~/assets/icons/star.svg?component";

const router = useRouter();

const { constraints, stream } = useUserMedia({
	constraints: {
		video: {
			facingMode: "environment",
		},
		audio: false,
	},
	enabled: true,
});

const videoRef = useTemplateRef("videoRef");
const photoRef = useTemplateRef("photoRef");

// Store captured image for overlay
const capturedImageData = ref<string | null>(null);
const currentImageBlob = ref<Blob | null>(null);

// Initialize image storage
const { storeImage, isSupported: isStorageSupported } = useImageStorage();

watchEffect(() => {
	if (videoRef.value && stream.value) {
		videoRef.value.srcObject = stream.value;
	}
});

const toggleFacingMode = async () => {
	const facingMode =
		typeof constraints.value?.video === "object"
			? constraints.value.video.facingMode
			: null;
	const newValue = facingMode === "user" ? "environment" : "user";
	constraints.value = {
		...constraints.value,
		video: {
			...(typeof constraints.value?.video === "object"
				? constraints.value.video
				: {}),
			facingMode: newValue,
		},
	};
};

const foundLocations = useFoundLocations();
const showResultOverlay = ref(false);
const {
	mutate: matchLocation,
	isPending,
	data: matchResult,
	error: matchError,
} = useMutation({
	mutationFn: async (blob: Blob) => {
		const data = new FormData();
		data.append("image", blob);

		const result = await $fetch("/api/match", {
			method: "POST",
			body: data,
		});

		if (result.location_index < 0 || result.confidence !== "high") {
			throw new Error("No match found");
		}

		const alreadyFound = foundLocations.value.find(
			(loc) => loc.index === result.location_index
		);

		return {
			index: result.location_index,
			...questLocations[result.location_index]!,
			status: alreadyFound ? "dublicate" : "new",
		};
	},
	onSuccess: async (location) => {
		if (
			location.status === "new" &&
			isStorageSupported.value &&
			currentImageBlob.value
		) {
			try {
				const imageId = await storeImage({
					questIndex: location.index,
					questName: location.name,
					imageBlob: currentImageBlob.value,
					matchResult: {
						confidence: "high" as const,
						locationIndex: location.index,
						status: location.status,
					},
				});

				foundLocations.value.push({
					index: location.index,
					date: new Date().toISOString(),
					imageId,
				});
			} catch (error) {
				console.error("Failed to store image:", error);
			}
		}

		// Clear captured image after successful match
		// setTimeout(() => {
		// 	capturedImageData.value = null;
		// 	currentImageBlob.value = null;
		// }, 3000); // Show result for 3 seconds before clearing
	},
	onError: async () => {
		// Store image even on error for debugging purposes
		if (isStorageSupported.value && currentImageBlob.value) {
			try {
				await storeImage({
					imageBlob: currentImageBlob.value,
					notes: "No match found",
				});
			} catch (error) {
				console.error("Failed to store image:", error);
			}
		}

		// Clear captured image after error
		// setTimeout(() => {
		// 	capturedImageData.value = null;
		// 	currentImageBlob.value = null;
		// }, 3000); // Show error for 3 seconds before clearing
	},
	onSettled: () => {
		showResultOverlay.value = true;
	},
});

const takePhoto = async () => {
	if (!videoRef.value || !photoRef.value) return;

	const width = videoRef.value.videoWidth;
	const height = videoRef.value.videoHeight;
	const ctx = photoRef.value.getContext("2d");
	if (!ctx) return;

	photoRef.value.width = width;
	photoRef.value.height = height;
	ctx.drawImage(videoRef.value, 0, 0, width, height);
	await nextTick();
	capturedImageData.value = photoRef.value.toDataURL("image/webp");
	await nextTick();

	photoRef.value.toBlob(
		(blob) => {
			if (!blob) return;
			// Store blob for IndexedDB storage
			currentImageBlob.value = blob;
			matchLocation(blob);
		},
		"image/webp",
		0.85
	);
};

const goBack = () => {
	router.push({ name: "index" });
};
</script>

<template>
	<div
		class="relative w-full h-screen bg-black flex flex-col overflow-hidden"
		style="
			overscroll-behavior: none;
			-webkit-overflow-scrolling: auto;
			touch-action: none;
		"
	>
		<video
			ref="videoRef"
			class="absolute inset-0 w-full h-full object-cover"
			autoplay
			playsinline
		></video>

		<div
			class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent"
			style="height: calc(10rem + env(safe-area-inset-bottom))"
		></div>

		<div
			class="absolute left-1/2 transform -translate-x-1/2 flex items-center justify-center"
			style="bottom: calc(2.5rem + env(safe-area-inset-bottom))"
		>
			<button
				@click="takePhoto"
				class="w-16 h-16 rounded-full bg-white shadow-lg text-white text-2xl active:scale-95 transition ring-4 ring-white ring-offset-[3px] ring-offset-black"
			></button>
		</div>

		<button
			@click="goBack"
			class="absolute left-6 z-50 bg-white/10 text-white p-4 rounded-full backdrop-blur-md hover:bg-white/20 hover:text-white transition"
			style="bottom: calc(2.5rem + env(safe-area-inset-bottom))"
		>
			<CompasIcon class="w-6 h-6" />
		</button>

		<button
			@click="toggleFacingMode"
			class="absolute right-6 z-50 bg-white/10 text-white p-4 rounded-full backdrop-blur-md hover:bg-white/20 hover:text-white transition"
			style="bottom: calc(2.5rem + env(safe-area-inset-bottom))"
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="20"
				height="20"
				viewBox="0 0 24 24"
				class="w-6 h-6"
			>
				<path
					fill="none"
					stroke="currentColor"
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M20 11A8.1 8.1 0 0 0 4.5 9M4 5v4h4m-4 4a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4"
				/>
			</svg>
		</button>

		<div
			class="fixed inset-0 w-full h-screen flex items-center justify-center pointer-events-none"
		>
			<transition name="fade">
				<div
					v-if="isPending || showResultOverlay"
					class="bg-black/50 backdrop-blur-2xl fixed w-full h-screen pointer-events-auto z-10"
					@click="
						showResultOverlay === true ? (showResultOverlay = false) : undefined
					"
				></div>
			</transition>
			<div class="p-5 z-50 w-full">
				<transition name="slide-up">
					<div
						v-if="isPending"
						class="absolute inset-0 flex flex-col items-center justify-center m-5"
					>
						<!-- Captured Image Preview -->
						<div
							class="relative mb-6 rounded-xl overflow-hidden shadow-2xl border-[6px] border-white"
						>
							<div v-if="capturedImageData" class="relative">
								<img
									:src="capturedImageData"
									class="h-48 w-48 object-cover"
									alt="Captured photo"
								/>
							</div>
							<div
								v-else
								class="w-full h-48 bg-gray-800 flex items-center justify-center"
							>
								<p class="text-white/70">Processing image...</p>
							</div>

							<div class="absolute inset-0 laser-scanner">
								<div class="laser-line"></div>
							</div>
						</div>

						<div
							class="bg-[#E2DECD] rounded-xl p-5 flex flex-col shadow-lg w-full text-center pointer-events-auto"
							:style="{
								boxShadow:
									'inset 0px 4px 6px rgba(0, 0, 0, 0.1), 0px 2px 0px #3C3A2D',
							}"
						>
							<div class="flex items-center justify-center gap-2.5 mb-1.5">
								<div
									class="animate-spin w-[18px] h-[18px] border-2 border-[#3C3A2D] border-t-transparent rounded-full"
								></div>
								<p class="text-black font-semibold leading-[1.25]">
									Scanning for clues...
								</p>
							</div>
							<p class="text-[#3C3A2D] text-sm font-medium leading-[1.25]">
								Analyzing location details
							</p>
						</div>
					</div>
					<div
						v-else-if="showResultOverlay && matchResult"
						class="flex flex-col w-full items-center justify-center gap-5"
					>
						<div v-if="capturedImageData" class="relative">
							<StarIcon
								class="absolute -top-4 -right-4 rotate-12 w-12 h-12 shrink-0 drop-shadow-lg"
							/>
							<img
								:src="capturedImageData"
								class="w-48 h-48 object-cover rounded-xl border-[6px] border-white shadow-2xl"
								alt="Captured photo"
							/>
						</div>
						<div
							class="bg-[#E2DECD] rounded-xl p-5 flex flex-col shadow-lg w-full text-center pointer-events-auto"
							:style="{
								boxShadow:
									'inset 0px 4px 6px rgba(0, 0, 0, 0.1), 0px 2px 0px #3C3A2D',
							}"
						>
							<h3 class="text-[19px] font-bold text-black mb-1">MATCH FOUND</h3>
							<div
								class="text-[#3C3A2D] text-pretty font-semibold leading-[1.25]"
							>
								{{ matchResult.name }}
							</div>
						</div>
					</div>
					<div
						v-else-if="showResultOverlay && matchError"
						class="bg-[#E2DECD] rounded-xl p-5 flex flex-col shadow-lg w-full text-center pointer-events-auto"
						:style="{
							boxShadow:
								'inset 0px 4px 6px rgba(0, 0, 0, 0.1), 0px 2px 0px #3C3A2D',
						}"
					>
						<h3 class="text-[19px] font-bold text-black mb-1.5">
							NO MATCH FOUND
						</h3>
						<div class="text-gray-700 text-pretty font-semibold leading-[1.25]">
							Sorry, we couldn't identify this location. Please try again.
						</div>
						<button
							type="button"
							@click="showResultOverlay = false"
							class="mt-4 bg-[#AF9F78] border border-white/25 rounded-xl text-white font-bold text-base items-center justify-center h-11 w-full px-4 gap-2"
							:style="{
								boxShadow: '0px 2px 0px #90815D',
							}"
						>
							CONTINUE SCANNING
						</button>
					</div>
				</transition>
			</div>
		</div>

		<!-- Hidden canvas -->
		<canvas ref="photoRef" class="hidden"></canvas>
	</div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
	transition: opacity 0.5s;
}
.fade-enter-from,
.fade-leave-to {
	opacity: 0;
}

.slide-up-enter-active,
.slide-up-leave-active {
	transition: all 0.3s ease;
}
.slide-up-enter-from {
	opacity: 0;
	transform: translateY(15%);
}
.slide-up-leave-to {
	opacity: 0;
	transform: translateY(15%);
}

.laser-scanner {
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	overflow: hidden;
	z-index: 10;
}

.laser-line {
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	height: 3px;
	background: linear-gradient(
		90deg,
		transparent 0%,
		white 50%,
		transparent 100%
	);
	box-shadow: 0 0 15px white, 0 0 30px white, 0 0 45px white;
	animation: laser-scan 1.5s ease infinite;
	z-index: 25;
}

@keyframes laser-scan {
	0% {
		top: 10px;
		opacity: 0;
	}
	10% {
		opacity: 1;
	}
	90% {
		opacity: 1;
	}
	100% {
		top: calc(100% - 12px);
		opacity: 0;
	}
}
</style>

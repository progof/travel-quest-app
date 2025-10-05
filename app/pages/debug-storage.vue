<template>
	<div class="p-4">
		<h1 class="text-2xl font-bold mb-4">Image Storage Debug</h1>

		<ClientOnly>
			<div class="space-y-4">
				<!-- Debug Info -->
				<div class="bg-gray-100 p-4 rounded">
					<h3 class="font-semibold mb-2">Debug Information</h3>
					<div class="text-sm space-y-1">
						<div>IndexedDB Supported: {{ isSupported }}</div>
						<div>Is Loading: {{ isLoading }}</div>
						<div>Error: {{ error || "None" }}</div>
						<div>Images Count: {{ images.length }}</div>
					</div>
				</div>

				<!-- Test Controls -->
				<div class="bg-blue-50 p-4 rounded">
					<h3 class="font-semibold mb-2">Test Controls</h3>
					<div class="flex gap-2">
						<button
							@click="testStoreImage"
							class="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
							:disabled="isLoading"
						>
							Store Test Image
						</button>

						<button
							@click="loadImages"
							class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
							:disabled="isLoading"
						>
							Load Images
						</button>

						<button
							@click="clearAll"
							class="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
							:disabled="isLoading"
						>
							Clear All
						</button>
					</div>
				</div>

				<!-- Images List -->
				<div class="bg-white p-4 rounded border">
					<h3 class="font-semibold mb-2">
						Stored Images ({{ images.length }})
					</h3>
					<div v-if="images.length === 0" class="text-gray-500 text-sm">
						No images stored yet. Click "Store Test Image" to create one.
					</div>
					<div v-else class="space-y-2">
						<div
							v-for="(image, index) in images"
							:key="image.id"
							class="border p-2 rounded text-sm"
						>
							<div><strong>ID:</strong> {{ image.id }}</div>
							<div>
								<strong>Timestamp:</strong> {{ formatDate(image.timestamp) }}
							</div>
							<div><strong>Quest:</strong> {{ image.questName || "None" }}</div>
							<div><strong>Has Blob:</strong> {{ !!image.imageBlob }}</div>
							<div><strong>Has URL:</strong> {{ !!image.imageUrl }}</div>
							<div>
								<strong>Blob Size:</strong>
								{{ image.imageBlob?.size || 0 }} bytes
							</div>

							<div v-if="image.imageUrl" class="mt-2">
								<img
									:src="image.imageUrl"
									:alt="`Test image ${index + 1}`"
									class="w-32 h-24 object-cover rounded border"
								/>
							</div>

							<button
								@click="deleteImageById(image.id)"
								class="mt-2 px-2 py-1 bg-red-500 text-white text-xs rounded"
							>
								Delete
							</button>
						</div>
					</div>
				</div>
			</div>
		</ClientOnly>
	</div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useImageStorage } from "~/composables/useImageStorage";
import type { CapturedImage } from "#shared/image-storage";

const {
	isSupported,
	isLoading,
	error,
	storeImage,
	getAllImages,
	deleteImage,
	clearAllImages,
} = useImageStorage();

const images = ref<CapturedImage[]>([]);

// Create a test blob image
const createTestBlob = (): Blob => {
	// Create a simple colored canvas as test image
	const canvas = document.createElement("canvas");
	canvas.width = 200;
	canvas.height = 150;
	const ctx = canvas.getContext("2d")!;

	// Draw a simple test pattern
	ctx.fillStyle = "#ff6b6b";
	ctx.fillRect(0, 0, 200, 150);
	ctx.fillStyle = "#4ecdc4";
	ctx.fillRect(50, 37, 100, 75);
	ctx.fillStyle = "#45b7d1";
	ctx.fillRect(75, 62, 50, 25);

	// Add text
	ctx.fillStyle = "#ffffff";
	ctx.font = "16px Arial";
	ctx.fillText("Test Image", 60, 90);

	return new Promise<Blob>((resolve) => {
		canvas.toBlob((blob) => {
			resolve(blob!);
		}, "image/png");
	}) as any;
};

// Store a test image
const testStoreImage = async () => {
	try {
		console.log("Creating test image...");
		const testBlob = createTestBlob();

		console.log("Storing test image...");
		const imageId = await storeImage({
			imageBlob: testBlob,
			questName: "Test Quest Location",
			questIndex: 999,
			notes: "This is a test image created for debugging",
		});

		console.log("Test image stored with ID:", imageId);
		await loadImages();
	} catch (err) {
		console.error("Failed to store test image:", err);
	}
};

// Load images from storage
const loadImages = async () => {
	try {
		console.log("Loading images...");

		// Clean up existing object URLs
		images.value.forEach((img) => {
			if (img.imageUrl && img.imageUrl.startsWith("blob:")) {
				URL.revokeObjectURL(img.imageUrl);
			}
		});

		const imageList = await getAllImages();
		console.log("Loaded images:", imageList);

		// Create fresh object URLs for each image
		const processedImages = imageList.map((image) => {
			if (image.imageBlob) {
				image.imageUrl = URL.createObjectURL(image.imageBlob);
				console.log(
					`Created object URL for image ${image.id}:`,
					image.imageUrl
				);
			}
			return image;
		});

		images.value = processedImages.sort(
			(a, b) =>
				new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
		);
	} catch (err) {
		console.error("Failed to load images:", err);
	}
};

// Delete single image
const deleteImageById = async (id: string) => {
	try {
		await deleteImage(id);
		await loadImages();
	} catch (err) {
		console.error("Failed to delete image:", err);
	}
};

// Clear all images
const clearAll = async () => {
	if (confirm("Delete all test images?")) {
		try {
			await clearAllImages();
			await loadImages();
		} catch (err) {
			console.error("Failed to clear images:", err);
		}
	}
};

// Format date
const formatDate = (date: Date | string): string => {
	return new Date(date).toLocaleString();
};

onMounted(() => {
	console.log("Debug page mounted, isSupported:", isSupported.value);
	if (isSupported.value) {
		loadImages();
	}
});
</script>

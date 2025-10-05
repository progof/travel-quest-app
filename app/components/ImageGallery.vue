<template>
  <div class="image-gallery p-4">
    <h2 class="text-2xl font-bold mb-4">Captured Images Gallery</h2>

    <!-- Only render after hydration to prevent SSR mismatch -->
    <ClientOnly>
      <!-- Loading state -->
      <div v-if="isLoading" class="text-center py-8">
        <div
          class="animate-spin w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full mx-auto mb-3"
        ></div>
        <p>Loading images...</p>
      </div>

      <div
        v-else-if="error"
        class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4"
      >
        {{ error }}
      </div>

      <!-- Storage not supported -->
      <div
        v-else-if="!isSupported"
        class="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4"
      >
        <p>Your browser doesn't support image storage.</p>
      </div>

      <!-- Images grid -->
      <div v-else-if="images.length > 0" class="space-y-4">
        <!-- Stats -->
        <div v-if="stats" class="bg-blue-50 p-4 rounded-lg">
          <h3 class="font-semibold mb-2">Storage Statistics</h3>
          <div class="grid grid-cols-2 gap-4 text-sm">
            <div>Total Images: {{ stats.totalImages }}</div>
            <div>Storage Used: {{ formatBytes(stats.totalSize) }}</div>
          </div>
        </div>

        <!-- Image grid -->
        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <div
            v-for="image in images"
            :key="image.id"
            class="bg-white rounded-lg shadow-md overflow-hidden"
          >
            <div
              class="w-full h-32 bg-gray-100 flex items-center justify-center"
            >
              <img
                v-if="image.imageUrl"
                :src="image.imageUrl"
                :alt="`Captured on ${formatDate(image.timestamp)}`"
                class="w-full h-full object-cover"
                @error="handleImageError(image)"
                @load="handleImageLoad(image)"
              />
              <div v-else-if="image.imageBlob" class="text-gray-500 text-xs">
                Image processing...
              </div>
              <div v-else class="text-gray-400 text-xs">No image data</div>
            </div>

            <div class="p-3">
              <div class="text-xs text-gray-500 mb-1">
                {{ formatDate(image.timestamp) }}
              </div>

              <div
                v-if="image.questName"
                class="text-sm font-medium text-blue-600 mb-1"
              >
                {{ image.questName }}
              </div>

              <div v-if="image.matchResult" class="text-xs">
                <span
                  class="inline-block px-2 py-1 rounded text-white text-xs"
                  :class="{
                    'bg-green-500': image.matchResult.confidence === 'high',
                    'bg-yellow-500': image.matchResult.confidence === 'medium',
                    'bg-red-500': image.matchResult.confidence === 'low',
                  }"
                >
                  {{ image.matchResult.confidence }} confidence
                </span>
              </div>

              <button
                @click="deleteImageById(image.id)"
                class="mt-2 text-red-500 text-xs hover:text-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex gap-2 mt-6">
          <button
            @click="loadImages"
            class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Refresh
          </button>

          <button
            @click="clearAll"
            class="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Clear All
          </button>
        </div>
      </div>

      <!-- Empty state -->
      <div v-else class="text-center py-8 text-gray-500">
        <p class="text-xl mb-2">📷</p>
        <p>No images captured yet.</p>
        <p class="text-sm">Take some photos to see them here!</p>
      </div>

      <template #fallback>
        <div class="text-center py-8">
          <div
            class="animate-spin w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full mx-auto mb-3"
          ></div>
          <p>Loading gallery...</p>
        </div>
      </template>
    </ClientOnly>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from "vue";
import { useImageStorage } from "~/composables/useImageStorage";
import type { CapturedImage, ImageStorageStats } from "#shared/image-storage";

const {
  isSupported,
  isLoading,
  error,
  getAllImages,
  deleteImage,
  clearAllImages,
  getStorageStats,
} = useImageStorage();

const images = ref<CapturedImage[]>([]);
const stats = ref<ImageStorageStats | null>(null);

// Load images from storage
const loadImages = async () => {
  if (!isSupported.value) return;

  try {
    // First revoke any existing object URLs to prevent memory leaks
    images.value.forEach((img) => {
      if (img.imageUrl && img.imageUrl.startsWith("blob:")) {
        URL.revokeObjectURL(img.imageUrl);
      }
    });

    const [imageList, storageStats] = await Promise.all([
      getAllImages(),
      getStorageStats(),
    ]);

    // Create fresh object URLs for each image
    const processedImages = imageList.map((image) => {
      if (image.imageBlob && !image.imageUrl) {
        image.imageUrl = URL.createObjectURL(image.imageBlob);
      } else if (
        image.imageBlob &&
        image.imageUrl &&
        !image.imageUrl.startsWith("blob:")
      ) {
        // Replace invalid URL with fresh one
        image.imageUrl = URL.createObjectURL(image.imageBlob);
      }
      return image;
    });

    images.value = processedImages.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    stats.value = storageStats;
  } catch (err) {
    console.error("Failed to load images:", err);
  }
};

// Delete single image
const deleteImageById = async (id: string) => {
  try {
    await deleteImage(id);
    await loadImages(); // Refresh the list
  } catch (err) {
    console.error("Failed to delete image:", err);
  }
};

// Clear all images
const clearAll = async () => {
  if (confirm("Are you sure you want to delete all captured images?")) {
    try {
      await clearAllImages();
      await loadImages(); // Refresh the list
    } catch (err) {
      console.error("Failed to clear images:", err);
    }
  }
};

// Format file size
const formatBytes = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

// Format date
const formatDate = (date: Date | string): string => {
  return new Date(date).toLocaleString();
};

// Handle image loading errors
const handleImageError = (image: CapturedImage) => {
  console.error("Failed to load image:", image.id, image.imageUrl);
  // Try to recreate the object URL
  if (image.imageBlob) {
    if (image.imageUrl && image.imageUrl.startsWith("blob:")) {
      URL.revokeObjectURL(image.imageUrl);
    }
    image.imageUrl = URL.createObjectURL(image.imageBlob);
    console.log("Recreated object URL for image:", image.id, image.imageUrl);
  }
};

// Handle successful image loading
const handleImageLoad = (image: CapturedImage) => {
  console.log("Successfully loaded image:", image.id);
};

onMounted(() => {
  loadImages();
});

// Cleanup object URLs when component is unmounted
onBeforeUnmount(() => {
  images.value.forEach((img) => {
    if (img.imageUrl && img.imageUrl.startsWith("blob:")) {
      URL.revokeObjectURL(img.imageUrl);
    }
  });
});
</script>

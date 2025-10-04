<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, nextTick } from "vue";
import { useRouter } from "vue-router";
import { quest } from "#shared/quest";

const router = useRouter();

const videoRef = ref<HTMLVideoElement | null>(null);
const photoRef = ref<HTMLCanvasElement | null>(null);
const stream = ref<MediaStream | null>(null);
const photoData = ref<string | null>(null);
const diagnostics = ref<string[]>([]);
const usingFrontCamera = ref(false);

const log = (m: string) => {
  diagnostics.value.push(`[${new Date().toLocaleTimeString()}] ${m}`);
  console.log("📋", m);
};

const startCamera = async () => {
  try {
    stream.value = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: usingFrontCamera.value ? "user" : "environment" },
    });
    if (videoRef.value) {
      videoRef.value.srcObject = stream.value;
      await videoRef.value.play();
    }
    log("🎥 Camera started");
  } catch (err: any) {
    log("❌ Camera error: " + err.message);
  }
};

const stopCamera = () => {
  stream.value?.getTracks().forEach((t) => t.stop());
  stream.value = null;
  log("⏹️ Camera stopped");
};

const switchCamera = async () => {
  stopCamera();
  usingFrontCamera.value = !usingFrontCamera.value;
  await startCamera();
  log("🔄 Switched camera");
};

const result = ref<{
  location_index: number;
  confidence: "high" | "medium" | "low";
} | null>(null);
const isLoading = ref(false);
const takePhoto = async () => {
  if (!videoRef.value || !photoRef.value) return;

  const width = videoRef.value.videoWidth;
  const height = videoRef.value.videoHeight;

  if (!width || !height) {
    log("❌ Video not ready");
    return;
  }

  const ctx = photoRef.value.getContext("2d");
  if (!ctx) return;

  photoRef.value.width = width;
  photoRef.value.height = height;
  ctx.drawImage(videoRef.value, 0, 0, width, height);
  photoData.value = photoRef.value.toDataURL("image/png");

  log("📷 Photo captured");
  await nextTick();

  try {
    // Use toBlob to get a real PNG file
    photoRef.value.toBlob(async (blob) => {
      if (!blob) {
        log("❌ Failed to create image blob");
        return;
      }

      isLoading.value = true;
      try {
        const data = new FormData();
        data.append("image", blob, "photo.png");

        result.value = await $fetch("/api/match", {
          method: "POST",
          body: data,
        });
      } catch (matchErr: any) {
        log("❌ Error matching image: " + matchErr.message);
      } finally {
        isLoading.value = false;
      }
    }, "image/png");
  } catch (err: any) {
    log("❌ Error reading photo data: " + err.message);
  }
};

const goBack = () => {
  stopCamera();
  router.push({ name: "index" });
};

onMounted(() => startCamera());
onBeforeUnmount(() => stopCamera());
</script>

<template>
  <div
    class="relative w-full h-screen bg-black flex flex-col overflow-auto md:overflow-hidden"
  >
    <!-- Back button -->
    <button
      @click="goBack"
      class="absolute top-6 left-4 z-50 bg-white/20 text-white px-3 py-1 rounded-xl backdrop-blur-md hover:bg-white/30 transition"
    >
      ⬅️ Back
    </button>

    <!-- Video feed -->
    <video
      ref="videoRef"
      class="absolute inset-0 w-full h-full object-cover"
      autoplay
      playsinline
    ></video>

    <!-- Gradient overlay for visibility -->
    <div
      class="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/80 to-transparent"
    ></div>

    <div
      class="absolute bottom-10 left-1/2 transform -translate-x-1/2 flex items-center gap-6"
    >
      <button
        @click="switchCamera"
        class="bg-white/20 text-white text-2xl p-4 rounded-full backdrop-blur-md hover:bg-white/30 transition"
      >
        🔄
      </button>

      <button
        @click="takePhoto"
        class="w-20 h-20 rounded-full bg-green-500 border-4 border-white shadow-lg text-white text-2xl active:scale-95 transition"
      >
        📸
      </button>

      <button
        @click="stopCamera"
        class="bg-white/20 text-white text-2xl p-4 rounded-full backdrop-blur-md hover:bg-white/30 transition"
      >
        ⏹️
      </button>
    </div>

    <!-- Photo preview (thumbnail) -->
    <transition name="fade">
      <div
        v-if="photoData"
        class="absolute top-6 right-6 w-20 h-20 border-2 border-white rounded-lg overflow-hidden shadow-md"
      >
        <img :src="photoData" class="object-cover w-full h-full" />
      </div>
    </transition>

    <!-- Loading state -->
    <transition name="fade">
      <div
        v-if="isLoading"
        class="absolute inset-0 bg-black/50 backdrop-blur-sm z-40 flex items-center justify-center"
      >
        <div
          class="bg-white/90 backdrop-blur-md rounded-lg p-6 text-center shadow-xl"
        >
          <div
            class="animate-spin w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full mx-auto mb-3"
          ></div>
          <p class="text-gray-800 font-medium">Analyzing image...</p>
          <p class="text-gray-600 text-sm mt-1">Looking for matches</p>
        </div>
      </div>
    </transition>

    <!-- Match result display -->
    <transition name="slide-up">
      <div
        v-if="result && result.location_index >= 0"
        class="absolute bottom-32 left-1/2 transform -translate-x-1/2 bg-white/90 backdrop-blur-md rounded-lg p-4 shadow-lg border border-white/20 min-w-64 text-center"
      >
        <h3 class="text-lg font-bold text-gray-800 mb-2">🎯 Match Found!</h3>
        <div class="space-y-2">
          <div class="text-gray-700">
            <span class="font-medium">Location:</span>
            <span class="text-blue-600">
              {{ quest[result.location_index]!.name }}
            </span>
          </div>
          <div class="text-gray-700">
            <span class="font-medium">Confidence:</span>
            <span
              :class="{
                'text-green-600': result.confidence === 'high',
                'text-yellow-600': result.confidence === 'medium',
                'text-orange-600': result.confidence === 'low',
              }"
              class="font-semibold capitalize ml-1"
            >
              {{ result.confidence }}
            </span>
          </div>
        </div>
        <button
          @click="result = null"
          class="mt-3 text-sm text-gray-500 hover:text-gray-700 transition"
        >
          ✕ Dismiss
        </button>
      </div>
      <div v-else-if="result && result.location_index === -1">
        <div
          class="absolute bottom-32 left-1/2 transform -translate-x-1/2 bg-white/90 backdrop-blur-md rounded-lg p-4 shadow-lg border border-white/20 min-w-64 text-center"
        >
          <h3 class="text-lg font-bold text-gray-800 mb-2">
            ❓ No Match Found
          </h3>
          <div class="text-gray-700">
            Sorry, we couldn't identify this location. Please try again.
          </div>
          <button
            @click="result = null"
            class="mt-3 text-sm text-gray-500 hover:text-gray-700 transition"
          >
            ✕ Dismiss
          </button>
        </div>
      </div>
    </transition>

    <!-- Hidden canvas -->
    <canvas ref="photoRef" class="hidden"></canvas>

    <!-- Diagnostics (debug mode) -->
    <div
      v-if="diagnostics.length"
      class="absolute top-0 left-0 bg-black/50 text-white text-xs p-2 max-h-32 overflow-y-auto rounded-br-lg"
    >
      <div v-for="(msg, i) in diagnostics" :key="i">{{ msg }}</div>
    </div>
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
  transform: translateY(20px) translateX(-50%);
}
.slide-up-leave-to {
  opacity: 0;
  transform: translateY(-20px) translateX(-50%);
}
</style>

<script setup lang="ts">
import { ref, onBeforeUnmount, onMounted, nextTick } from "vue";

const videoRef = ref<HTMLVideoElement | null>(null);
const photoRef = ref<HTMLCanvasElement | null>(null);
const stream = ref<MediaStream | null>(null);
const photoData = ref<string | null>(null);
const photoArray = ref<number[] | null>(null);
const diagnostics = ref<string[]>([]);

const log = (message: string) => {
  diagnostics.value.push(`[${new Date().toLocaleTimeString()}] ${message}`);
  console.log("📋", message);
};

const startCamera = async () => {
  try {
    stream.value = await navigator.mediaDevices.getUserMedia({ video: true });
    if (videoRef.value) {
      videoRef.value.srcObject = stream.value;
      await videoRef.value
        .play()
        .catch((err) => log("❌ Video play error: " + err));
    }
    log("🎥 Camera started");
  } catch (err: any) {
    log("❌ Camera error: " + err.message);
  }
};

const stopCamera = () => {
  if (stream.value) {
    stream.value.getTracks().forEach((t) => t.stop());
    stream.value = null;
    log("⏹️ Camera stopped");
  }
};

const takePhoto = async () => {
  if (!videoRef.value) {
    log("❌ Video element not found");
    return;
  }
  if (!stream.value) {
    log("❌ Camera not started");
    return;
  }
  if (!photoRef.value) {
    log("❌ Canvas element not found");
    return;
  }

  const width = videoRef.value.videoWidth;
  const height = videoRef.value.videoHeight;

  if (width === 0 || height === 0) {
    log("❌ Video not ready yet");
    return;
  }

  photoRef.value.width = width;
  photoRef.value.height = height;

  const ctx = photoRef.value.getContext("2d");
  if (!ctx) {
    log("❌ Cannot get canvas context");
    return;
  }

  ctx.drawImage(videoRef.value, 0, 0, width, height);
  photoData.value = photoRef.value.toDataURL("image/png");
  log("📷 Photo captured");

  await nextTick();

  try {
    const imageData = ctx.getImageData(0, 0, width, height);
    photoArray.value = Array.from(imageData.data);
    log(`🖼 Photo pixels [${photoArray.value.slice(0, 50).join(", ")}...]`);
    log(`📊 Total pixels: ${photoArray.value.length}`);
  } catch (err: any) {
    log("❌ Error reading photo data: " + err.message);
  }
};

onMounted(() => {
  log("🔎 Component initialized");
  if (!window.isSecureContext)
    log("⚠️ Not secure! Camera may not work without HTTPS.");
  startCamera();
});

onBeforeUnmount(() => stopCamera());
</script>

<template>
  <div class="relative w-full h-screen bg-gray-100 flex flex-col">
    <!-- Camera view -->
    <div class="relative flex-1 bg-black">
      <video
        ref="videoRef"
        class="w-full h-full object-cover"
        autoplay
        playsinline
      ></video>
      <div
        v-if="!stream"
        class="absolute inset-0 flex justify-center items-center text-white bg-black/40 text-center p-2"
      >
        Camera not started
      </div>
    </div>

    <!-- Hidden canvas for capturing photo -->
    <canvas ref="photoRef" class="hidden"></canvas>

    <!-- Capture button panel -->
    <div class="flex justify-center items-center py-4 bg-gray-800/80">
      <button
        @click="takePhoto"
        class="w-20 h-20 rounded-full bg-green-500 shadow-lg border-4 border-white text-white text-xl"
      >
        📸
      </button>
    </div>

    <!-- Bottom control panel -->
    <div class="flex justify-around items-center p-2 bg-gray-900 text-white">
      <button
        @click="startCamera"
        class="px-4 py-2 bg-blue-500 rounded-lg shadow"
      >
        Start
      </button>
      <button
        @click="switchCamera"
        class="px-4 py-2 bg-purple-500 rounded-lg shadow"
      >
        Switch
      </button>
      <button
        @click="stopCamera"
        class="px-4 py-2 bg-red-500 rounded-lg shadow"
      >
        Stop
      </button>
    </div>

    <!-- Photo preview -->
    <div
      v-if="photoData"
      class="absolute bottom-32 left-1/2 transform -translate-x-1/2 w-40 h-40 border-4 border-white rounded-lg overflow-hidden shadow-lg"
    >
      <img :src="photoData" class="w-full h-full object-cover" />
    </div>

    <!-- Diagnostics panel -->
    <div
      class="absolute top-2 left-2 bg-gray-700/70 text-white p-2 rounded max-w-xs text-xs"
    >
      <div v-for="(msg, i) in diagnostics" :key="i">{{ msg }}</div>
    </div>
  </div>
</template>

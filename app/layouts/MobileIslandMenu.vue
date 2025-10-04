<script setup lang="ts">
import { useRouter } from "vue-router";
import CompassIcon from "~/assets/icons/compass.svg";
import CameraIcon from "~/assets/icons/camera.svg";
import UserIcon from "~/assets/icons/user.svg";

const router = useRouter();
</script>
<template>
  <footer
    class="h-16 bg-gray-900 text-white flex justify-around items-center text-xl"
  >
    <button
      class="flex flex-col items-center px-2 py-1 rounded-lg opacity-90 hover:bg-blue-400/80 hover:text-white transition-colors gap-1"
    >
      <CompassIcon class="size-6 stroke-1.7" />
      <span class="text-[10px]">Quests</span>
    </button>
    <button
      @click="router.push({ name: 'camera' })"
      class="flex flex-col items-center px-2 py-1 rounded-lg opacity-90 hover:bg-blue-400/80 hover:text-white transition-colors gap-1"
    >
      <CameraIcon class="size-6 stroke-1.7" />
      <span class="text-[10px]">Camera</span>
    </button>
    <button
      class="flex flex-col items-center px-2 py-1 rounded-lg opacity-90 hover:bg-blue-400/80 hover:text-white transition-colors gap-1"
    >
      <UserIcon class="size-6 stroke-1.7" />
      <span class="text-[10px]">Profile</span>
    </button>
  </footer>
</template>

<script setup lang="ts">
import CompassIcon from "~/assets/icons/compass.svg";
import CameraIcon from "~/assets/icons/camera.svg";
import MapIcon from "~/assets/icons/map.svg";
</script>
<template>
  <footer
    class="w-full p-1.5 px-6 bg-gray-900 text-white flex justify-around items-center text-xl"
  >
    <NuxtLink
      to="/quests"
      class="flex flex-col items-center rounded-lg opacity-90 hover: hover:text-blue-400 transition-colors gap-1"
    >
      <CompassIcon class="size-6 stroke-1.7" />
      <span class="text-[10px]">Quests</span>
    </NuxtLink>
    <NuxtLink
      to="/camera"
      class="flex flex-col items-center rounded-lg opacity-90 hover: hover:text-blue-400 transition-colors gap-1"
    >
      <CameraIcon class="size-6 stroke-1.7" />
      <span class="text-[10px]">Camera</span>
    </NuxtLink>
    <NuxtLink
      to="/"
      class="flex flex-col items-center rounded-lg opacity-90 hover: hover:text-blue-400 transition-colors gap-1"
    >
      <MapIcon class="size-6 stroke-1.7" />
      <span class="text-[10px]">Map</span>
    </NuxtLink>
  </footer>
</template>

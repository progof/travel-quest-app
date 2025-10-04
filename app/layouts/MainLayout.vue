<script setup lang="ts">
import TargetIcon from "~/assets/icons/target.svg";
import MobileIslandMenu from "~/layouts/MobileIslandMenu.vue";
</script>

<template>
  <div class="flex flex-col h-screen bg-gray-100 overflow-hidden">
    <header
      class="px-6 py-3 bg-gray-900 text-white flex justify-between items-center shadow-md"
    >
      <h1 class="text-lg font-semibold items-center">
        <TargetIcon class="inline size-6 mr-1" /> Travel Quest
      </h1>
      <div class="text-sm opacity-70">
        Today: {{ new Date().toLocaleDateString() }}
      </div>
    </header>
    <slot />
    <MobileIslandMenu />
  </div>
</template>

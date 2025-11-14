<template>
  <!-- Recording Button -->
  <button
    v-tooltip="'Screen Recording'"
    class="group fixed top-8 right-8 bg-black/60 text-white rounded-full hover:bg-black/80 transition-all duration-300 shadow-lg border-2 p-3 z-50"
    :class="isRecording ? 'border-red-500 animate-pulse' : 'border-white'"
    @click="emit('click')"
  >
    <div
      v-if="!isRecording"
      class="h-6 w-6 bg-white text-white rounded-xl"
    ></div>
    <StopIcon v-else class="h-6 w-6 text-red-500" />
  </button>
</template>

<script setup lang="ts">
import { StopIcon } from "@heroicons/vue/24/solid";

defineProps<{
  isRecording: boolean;
}>();

const emit = defineEmits(["click"]);
</script>

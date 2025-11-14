<template>
  <!-- Recording Indicator -->
  <div
    v-if="isRecording"
    class="fixed top-8 h-20 left-8 bg-red-500/80 text-white px-4 py-2 rounded-full flex items-center gap-2 animate-pulse z-50"
  >
    <div class="w-3 h-3 bg-white rounded-full"></div>
    <span class="font-semibold">Recording {{ recordingTime }}</span>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  isRecording: boolean;
  recordingTime: string;
}>();
</script>

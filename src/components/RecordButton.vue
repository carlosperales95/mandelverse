<template>
  <!-- Recording Button -->
  <div class="w-full flex justify-center p-2">
    <BaseCollapsibleButton
      v-tooltip="'Screen Recording'"
      class="right-10 top-10"
      :class="isRecording ? 'border-red-500 animate-pulse' : 'border-white'"
      @click="emit('click')"
    >
      <div
        v-if="!isRecording"
        class="h-6 w-6 bg-white text-white rounded-xl md:h-0 md:w-0 md:group-hover:h-6 md:group-hover:w-6 transition-all duration-300 ease-in-out"
      ></div>
      <StopIcon
        v-else
        class="h-6 w-6 text-red-500 md:h-0 md:w-0 md:group-hover:h-6 md:group-hover:w-6 transition-all duration-300 ease-in-out"
      />
    </BaseCollapsibleButton>
    <!-- h-7 w-7 md:h-0 md:w-0 md:group-hover:h-7 md:group-hover:w-7 transition-all duration-300 ease-in-out -->
  </div>
</template>

<script setup lang="ts">
import { StopIcon } from "@heroicons/vue/24/solid";
import BaseCollapsibleButton from "./base/BaseCollapsibleButton.vue";

defineProps<{
  isRecording: boolean;
}>();

const emit = defineEmits(["click"]);
</script>

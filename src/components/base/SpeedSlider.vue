<template>
  <div>
    <label class="text-sm font-semibold">
      {{ zoomSpeed }}ms ({{ Math.round(1000 / zoomSpeed) }} fps)
    </label>
    <input
      v-model.number="zoomSpeed"
      type="range"
      min="16"
      max="192"
      step="16"
      class="w-full"
      :disabled="disabled"
    />
    <div class="flex justify-between text-xs opacity-75">
      <span>Fast (60fps)</span>
      <span>Slow (5fps)</span>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  disabled: boolean;
}>();

const emit = defineEmits(["change"]);

const zoomSpeed = defineModel<number>({ required: true });
</script>

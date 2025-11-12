<template>
  <canvas
    ref="canvas"
    :width="width"
    :height="height"
    @mousedown="emit('zoom')"
  ></canvas>
</template>

<script setup lang="ts">
defineProps<{
  width: number;
  height: number;
}>();

const emit = defineEmits(["zoom"]);
</script>

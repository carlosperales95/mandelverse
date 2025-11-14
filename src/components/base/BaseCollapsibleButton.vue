<template>
  <button
    class="group fixed text-white rounded-full bg-black/60 transition-all duration-300 ease-out border-2 border-white p-3 md:hover:p-3 md:p-2 z-50"
    @click="emit('click')"
  >
    <slot></slot>
  </button>
</template>
<script setup lang="ts">
const emit = defineEmits(["click"]);
</script>

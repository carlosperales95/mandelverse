<template>
     <button 
      class="fixed top-4 right-4 z-50 bg-black/50 backdrop-blur-sm text-white p-3 rounded-full hover:bg-black/70 transition-all shadow-lg"
      @click="emit('click')"
    >
      <svg v-if="!showMenu" class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
      </svg>
      <svg v-else class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
      </svg>
    </button>
</template>
<script setup lang="ts">
defineProps<{
    showMenu: boolean
}>();

const emit = defineEmits(['click'])
</script>
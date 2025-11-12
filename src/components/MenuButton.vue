<template>
  <div class="w-full flex justify-center p-2">
    <button
      class="group fixed bottom-8 text-white rounded-full bg-black/60 transition-all duration-300 ease-out border-2 border-white p-3 md:hover:p-3 md:p-2"
      @click="emit('click')"
    >
      <Bars3Icon
        v-if="!open"
        class="h-7 w-7 md:h-0 md:w-0 md:group-hover:h-7 md:group-hover:w-7 transition-all duration-300 ease-in-out"
      />
      <XMarkIcon
        v-else
        class="h-7 w-7 md:h-0 md:w-0 md:group-hover:h-7 md:group-hover:w-7 transition-all duration-300 ease-in-out"
      />
    </button>
  </div>
</template>
<script setup lang="ts">
import { Bars3Icon, XMarkIcon } from "@heroicons/vue/24/solid";

defineProps<{
  open: boolean;
}>();

const emit = defineEmits(["click"]);
</script>

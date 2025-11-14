<template>
  <div class="w-full flex justify-center p-2">
    <BaseCollapsibleButton class="bottom-8" @click="emit('click')">
      <Bars3Icon
        v-if="!open"
        class="h-7 w-7 md:h-0 md:w-0 md:group-hover:h-7 md:group-hover:w-7 transition-all duration-300 ease-in-out"
      />
      <XMarkIcon
        v-else
        class="h-7 w-7 md:h-0 md:w-0 md:group-hover:h-7 md:group-hover:w-7 transition-all duration-300 ease-in-out"
      />
    </BaseCollapsibleButton>
  </div>
</template>
<script setup lang="ts">
import { Bars3Icon, XMarkIcon } from "@heroicons/vue/24/solid";
import BaseCollapsibleButton from "./base/BaseCollapsibleButton.vue";

defineProps<{
  open: boolean;
}>();

const emit = defineEmits(["click"]);
</script>

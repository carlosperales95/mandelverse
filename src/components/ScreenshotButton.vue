<template>
  <!-- Main screenshot button -->
  <BaseCollapsibleButton class="right-10 top-10" @click="emit('click')">
    <CameraIcon
      class="h-6 w-6 stroke-white transition-all duration-300 ease-in-out md:h-0 md:w-0 md:group-hover:h-6 md:group-hover:w-6"
    />
  </BaseCollapsibleButton>
</template>

<script setup>
import { CameraIcon } from "@heroicons/vue/24/solid";
import BaseCollapsibleButton from "./base/BaseCollapsibleButton.vue";

const emit = defineEmits(["click"]);
</script>

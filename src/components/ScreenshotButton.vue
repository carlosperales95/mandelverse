<template>
  <!-- Main screenshot button -->
  <BaseCollapsibleButton
    class="right-10 top-10"
    @click="expandScreenshotOptions = !expandScreenshotOptions"
  >
    <CameraIcon
      class="h-6 w-6 stroke-white transition-all duration-300 ease-in-out"
      :class="
        expandScreenshotOptions
          ? ''
          : 'md:h-0 md:w-0 md:group-hover:h-6 md:group-hover:w-6'
      "
    />
  </BaseCollapsibleButton>
  <div
    v-if="expandScreenshotOptions"
    class="bg-black/40 backdrop-blur-xl border border-white rounded-md text-white flex flex-col md:group-hover:h-fit md:group-hover:w-fit transition-all duration-300 ease-in-out right-5 top-32 fixed z-50 p-2"
  >
    <button
      class="p-2 text-sm text-left hover:bg-emerald-800 transition ease-in"
      @click="emit('screenshot-jpg')"
    >
      📷 JPG
    </button>
    <!-- <button
            @click="emit('screenshot-hq')"
            class="p-2 text-sm text-left hover:bg-emerald-800 transition ease-in"
        >
            ✨ High Quality (2x)
        </button> -->
    <button
      class="p-2 text-sm text-left hover:bg-emerald-800 transition ease-in"
      @click="emit('screenshot-with-info')"
    >
      📋 With Info
    </button>
    <button
      class="p-2 text-sm text-left hover:bg-emerald-800 transition ease-in"
      @click="emit('copy-clipboard')"
    >
      📋 Copy to Clipboard
    </button>
  </div>
  <!-- Options dropdown -->
</template>

<script setup>
import { ref } from "vue";
import { CameraIcon } from "@heroicons/vue/24/solid";
import BaseCollapsibleButton from "./base/BaseCollapsibleButton.vue";

defineProps({
  isCapturing: Boolean,
});

const expandScreenshotOptions = ref(false);

const emit = defineEmits([
  "screenshot",
  "screenshot-jpg",
  "screenshot-hq",
  "screenshot-with-info",
  "copy-clipboard",
]);
</script>

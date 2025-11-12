<template>
  <div
    class="flex flex-col fixed bottom-40 h-64 w-full z-50 md:min-h-72 sm:bottom-24"
  >
    <Transition
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="opacity-0 translate-y-6"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 translate-y-6"
    >
      <div
        v-show="showControlPanel"
        class="min-h-80 w-full flex justify-center overflow-hidden md:min-h-72"
      >
        <ControlPanel
          @change-theme="emit('change-theme')"
          @jump-region="emit('jump-region')"
          @play="emit('play')"
          @reset="emit('reset')"
        ></ControlPanel>
      </div>
    </Transition>
    <MenuButton :open="showControlPanel" @click="settings.togglePanel" />
  </div>
</template>

<script setup lang="ts">
import { useSettingsStore } from "@/stores/settings";
import { storeToRefs } from "pinia";
import MenuButton from "@/components/MenuButton.vue";
import ControlPanel from "@/components/ControlPanel.vue";

const emit = defineEmits(["change-theme", "jump-region", "reset", "play"]);

const settings = useSettingsStore();

const { showControlPanel } = storeToRefs(settings);
</script>

<style scoped>
.slide-right-enter-active,
.slide-right-leave-active {
  transition: all 0.3s ease;
}

.slide-right-enter-from {
  transform: translateX(0);
  opacity: 0;
}
.slide-right-enter-to {
  transform: translateX(80%);
  opacity: 1;
}

.slide-right-leave-from {
  transform: translateX(80%);
  opacity: 1;
}
.slide-right-leave-to {
  transform: translateX(0);
  opacity: 0;
}
</style>

<template>
  <nav aria-label="Tabs">
    <p
      v-for="tab in tabs"
      :id="tab.name"
      :key="tab.name"
      :class="getTabClass(tab)"
      class="hover:cursor-pointer flex items-center justify-center"
      :aria-current="tab.current ? 'page' : undefined"
      @click="emit('selected', tab.name)"
    >
      <component :is="tab.icon" v-if="tab.icon" class="w-6 h-6 fill-white" />
      <span v-else class="text-white">{{ tab.name }}</span>
    </p>
  </nav>
</template>

<script setup lang="ts">
import { type Component } from "vue";

defineProps<{
  tabs: {
    name?: string;
    icon?: Component;
    current: boolean;
    colors: string[];
  }[];
}>();

const emit = defineEmits(["selected"]);

function getTabClass(tab: {
  name?: string;
  current: boolean;
  colors: string[];
}) {
  const activeColor = tab.colors[0];
  const inactiveColor = tab.colors[1] || "opaque";
  return [
    tab.current
      ? `tab-${activeColor} border-black`
      : `tab-${inactiveColor} backdrop-blur-xl border-gray-100`,
    "whitespace-nowrap p-2 rounded-tl-xl rounded-bl-sm border border-r-0 py-3",
  ];
}
</script>

<style scoped>
.tab-blue {
  @apply bg-blue-500;
}
.tab-red {
  @apply bg-red-500;
}
.tab-emerald {
  @apply bg-emerald-500;
}
.tab-purple {
  @apply bg-purple-500;
}
.tab-indigo {
  @apply bg-indigo-500;
}
.tab-gray {
  @apply bg-gray-500;
}

.tab-opaque {
  @apply bg-black/40 hover:bg-gray-400 backdrop-blur-xl;
}
</style>

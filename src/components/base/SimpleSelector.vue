<template>
  <div>
    <slot></slot>
    <select
      v-model="selectedElem"
      class="w-full px-3 py-2 bg-white/10 border border-white/20 rounded focus:outline-none focus:border-emerald-400 text-white"
      @change="emit('change')"
    >
      <option
        v-for="(option, index) in options"
        :key="index"
        :value="isColorTheme(option) ? option.code : index"
      >
        {{ option.name }}
      </option>
    </select>
  </div>
</template>

<script setup lang="ts">
interface ColorTheme {
  code: string;
  name: string;
}

interface Location {
  x: string;
  y: string;
  name: string;
}

defineProps<{
  options: ColorTheme[] | Location[];
}>();

const emit = defineEmits(["change"]);

const selectedElem = defineModel<string | number>({ required: true });

const isColorTheme = (object: any): object is ColorTheme => {
  return "code" in object;
};

const isLocation = (object: any): object is Location => {
  return "x" in object && "y" in object;
};
</script>

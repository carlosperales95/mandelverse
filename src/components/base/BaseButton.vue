<template>
    <div>
        <button 
            :class="[
                'w-full px-4 py-3 rounded-lg font-semibold transition-all',
                defineButtonStyle
            ]"
            @click="emit('click')"
        >
            <slot></slot>
        </button>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
    colors: string[]
    active?: boolean
    
}>();

const emit = defineEmits(['click'])

const defineButtonStyle = computed(() => {
    const activeColor = props.colors[0];

    if(props.active === undefined)
        return `btn-${activeColor}`

    const inactiveColor = props.colors[1] || 'gray';
    return props.active ? `btn-${activeColor}` : `btn-${inactiveColor}`;
});
</script>

<style scoped>
.btn-blue     { @apply bg-blue-500 hover:bg-blue-600; }
.btn-red      { @apply bg-red-500 hover:bg-red-600; }
.btn-emerald  { @apply bg-emerald-500 hover:bg-emerald-600; }
.btn-purple   { @apply bg-purple-500 hover:bg-purple-600; }
.btn-indigo   { @apply bg-indigo-500 hover:bg-indigo-600; }
.btn-gray     { @apply bg-gray-500 hover:bg-gray-600; }
</style>
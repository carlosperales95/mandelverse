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
        return `bg-${activeColor}-500 hover:bg-${activeColor}-600`

    const inactiveColor = props.colors[1] || 'gray';
    return props.active ? `bg-${activeColor}-500 hover:bg-${activeColor}-600` : `bg-${inactiveColor}-600 hover:bg-${inactiveColor}-700`;
});
</script>
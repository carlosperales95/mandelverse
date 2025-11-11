<template>
    <div>
        <label class="text-sm font-semibold">
            <slot name="label">
                {{ rangeValue }}
            </slot>
        </label>
        <input 
            v-model.number="rangeValue" 
            type="range" 
            :min="min"
            :max="max"
            :step="step"
            class="w-full"
            :disabled="disabled"
        />
        <div class="flex justify-between text-xs opacity-75">
            <slot name="min">
                <span>{{min}}</span>
            </slot>
            <slot name="max">
                <span>{{ max }}</span>
            </slot>
        </div>
    </div>
</template>

<script setup lang="ts">
defineProps<{
    disabled: boolean,
    max: string,
    min: string,
    step: string
}>();

const rangeValue = defineModel<number>({ required: true });
</script>
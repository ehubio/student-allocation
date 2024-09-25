<template>
    <div class="space-y-1">
        <!-- Label and Status Icons -->
        <div class="flex flex-row space-x-1 items-center">
            <h3 class="flex-auto">{{ title }}</h3>

            <template v-if="inputStatus === InputStatus.Success">
                <svg xmlns="http://www.w3.org/2000/svg" class="shrink-0 h-6 w-6 stroke-success" fill="none" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L20 7" />
                </svg>
            </template>

            <template v-else-if="inputStatus == InputStatus.Error">
                <div class="relative group py-2 tooltip"
                     :data-tip="`Enter a value between ${min} and ${max}`">
                    <svg xmlns="http://www.w3.org/2000/svg" class="stroke-error shrink-0 h-6 w-6" fill="none"
                         viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                              d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                </div>
            </template>

            <template v-else>
                <svg xmlns="http://www.w3.org/2000/svg" class="stroke-none shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </template>

            <input v-model="inputValue"
                   type="number"
                   step="1"
                   :min="min"
                   :max="max"
                   class="input input-bordered input-md w-full max-w-md"
                   :class="[inputBorderColour]"
                   @keydown="checkDigit">
        </div>
    </div>
</template>

<script setup lang="ts">
import {computed, ref, watch} from 'vue';

const props = defineProps<{
    title: String,
    min: number,
    max: number
}>();

const emit = defineEmits(['update:modelValue']);
const inputValue = ref<number | undefined>()

// Emit value to parent when inputValue changes
watch(inputValue, (newValue) => {
    if (newValue !== undefined && newValue !== null && props.min <= newValue && newValue <= props.max) {
        emit("update:modelValue", newValue);
    } else {
        emit("update:modelValue", null);
    }
});

const checkDigit = (event: KeyboardEvent) => {
    if (event.key.length === 1 && isNaN(Number(event.key))) {
        event.preventDefault();
    }
};

const InputStatus = {
    Success: 'Success',
    Error: 'Error',
    Neutral: 'Neutral',
};

const inputStatus = computed(() => {
    if (inputValue.value === undefined || inputValue.value === "") {
        return InputStatus.Neutral
    } else if (props.min <= inputValue.value && inputValue.value <= props.max) {
        return InputStatus.Success;
    } else {
        return InputStatus.Error;
    }
});

const inputBorderColour = computed(() => {
    return inputStatus.value === InputStatus.Error ? 'border-red-500' : 'border-gray-300';
});
</script>

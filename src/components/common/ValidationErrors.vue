<template>
  <div role="alert" class="alert alert-error">
    <div class="flex flex-row space-x-2">
      <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
      <div>
        <span>Failed to read file:</span>
        <ul class="list-disc list-inside">
          <li v-for="(error, index) in formattedErrors" :key="index">
            {{ error }}
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ValidationError } from '@apideck/better-ajv-errors';
import {computed} from "vue";

const props = defineProps<{
  errors: ValidationError[];
}>();

const formattedErrors = computed(() => {
  const pattern = /\{base\}/g;
  return props.errors.map((e: ValidationError) => {
    let msg = e.message.replace(pattern, "File")
    if (e.suggestion) {
      msg = msg + "\n" + e.suggestion
    }
    return msg
  })
})
</script>

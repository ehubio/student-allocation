<template>
  <div v-if="showComponent && logMessages.length > 0"
       tabindex="0"
       class="collapse"
       @click="logVisible = !logVisible">
    <input type="checkbox" />
    <div class="collapse-title text-m font-small">
      <div v-if="!logVisible" class="flex space-x-2 items-center">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
        </svg>
        <div>Show log</div>
      </div>
      <div v-else class="flex space-x-2 items-center">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
        </svg>
        <div>Hide log</div>
      </div>
    </div>
    <div class="collapse-content">
      <div class="mockup-code max-h-96 overflow-auto table-auto">
    <pre :class="['h-6', 'whitespace-pre-line', 'table-row', style]" v-for="([message, style], index) in logMessages" :key="index" :data-prefix="index + 1">
      <code>{{message}}</code>
    </pre>
      </div>
    </div>
  </div>
</template>

<script setup lang='ts'>
import {onMounted, onUnmounted, ref, watch} from 'vue';
import emitter from "./eventBus.ts"
import type {ValidationError} from "@apideck/better-ajv-errors";

defineProps<{
  showComponent: boolean | undefined ;
}>();

const logMessages = ref<[string, string][]>([]);
const logVisible = ref<boolean>(false);

onMounted(() => {
  emitter.$on("progress", (message: string, style: string) => {
    if (!style) {
      style = ""
    }
    logMessages.value.push([message, style])
  })

  emitter.$on("clear", () => {
    logMessages.value = []
  })
})

onUnmounted(() => {
  emitter.$off("progress")
})
</script>

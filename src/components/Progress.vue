<template>
  <div v-if="show && logMessages.length > 0" tabindex="0" class="collapse collapse-arrow bg-base-200">
    <input type="checkbox" />
    <div class="collapse-title text-m font-medium">
      Show log
    </div>
    <div class="collapse-content">
      <div class="mockup-code max-h-96 overflow-y-scroll">
    <pre :class="['h-6', style]" v-for="([message, style], index) in logMessages" :key="index" :data-prefix="index + 1">
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
  show: boolean;
}>();

const logMessages = ref<[string, string][]>([]);

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

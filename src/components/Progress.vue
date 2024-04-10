<template>
  <div v-if="logMessages.length > 0" class="mockup-code max-h-96 overflow-y-scroll">
    <pre :class="['h-6', style]" v-for="([message, style], index) in logMessages" :key="index" :data-prefix="index + 1">
      <code>{{message}}</code>
    </pre>
  </div>
</template>

<script setup lang='ts'>
import {onMounted, onUnmounted, ref, watch} from 'vue';
import emitter from "./eventBus.ts"

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

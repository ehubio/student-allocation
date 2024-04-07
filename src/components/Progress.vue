<template>
  <div>
    <h1>Log Messages</h1>
    <ul>
      <li v-for="message in logMessages" :key="message">{{ message }}</li>
    </ul>
  </div>
</template>

<script setup lang='ts'>
import {onMounted, onUnmounted, ref} from 'vue';
import emitter from "./eventBus.ts"

const logMessages = ref<string[]>([]);

onMounted(() => {
  emitter.$on("progress", (message: string) => {
    logMessages.value.push(message)
  })
})

onUnmounted(() => {
  emitter.$off("progress")
})
</script>

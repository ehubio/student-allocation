<template>
  <div>
    <h2>Validation Errors</h2>
    <div v-if="errors.length === 0">No errors found.</div>
    <div v-else>
      <div v-for="(error, index) in errors" :key="index" class="error-box">
        <h3>Error {{ index + 1 }}</h3>
        <p>Message: {{ error.message }}</p>
        <p>Path: {{ error.path }}</p>
        <p v-if="error.suggestion">Suggestion: {{ error.suggestion }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ValidationError } from '@apideck/better-ajv-errors';

defineProps<{
  errors: ValidationError[];
}>();
</script>

<style scoped>
.error-box {
  border: 1px solid #ccc;
  padding: 10px;
  margin-bottom: 10px;
}
</style>

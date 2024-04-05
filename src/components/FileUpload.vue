<template>
  <div>
    <input ref='file' v-on:change='handleFileUpload()' type='file' accept='.csv'>
    <validation-errors v-if="errors.length > 0" :errors="errors"></validation-errors>
    <div v-if="data.length > 0">
      <h4>Data successfully uploaded</h4>
    </div>
  </div>
</template>
<script setup lang='ts'>
import {ref} from 'vue'
import * as Papa from 'papaparse'
import {type StudentPreference, type InputData, studentPrefSchema, type SupervisorCapacity, validateData} from "./validateCsv.ts";
import type { ValidationError } from '@apideck/better-ajv-errors';
import ValidationErrors from "./ValidationErrors.vue";

const props = defineProps(['schema']);

const data = defineModel<InputData>('data', {default: []});

const file = ref<HTMLInputElement | null>(null);

type ParseResults = {
  data: any
  errors: any
  meta: any
}

const errors = ref<ValidationError[]>([]);

const handleFileUpload = async() => {
  if (file.value && file.value.files && file.value.files.length > 0) {
    const uploadedFile = file.value.files[0];
    Papa.parse(uploadedFile, {
      header: true,
      skipEmptyLines: true,
      transform: function(val: string) {
        return val.trim();
      },
      complete: function(results: ParseResults, file: File) {
        const { errors: errs, parsedData } = validateData(results.data, props.schema);
        errors.value = errs;
        if (props.schema === studentPrefSchema) {
          data.value = parsedData as StudentPreference[];
        } else {
          data.value = parsedData as SupervisorCapacity[];
        }
      }
    });
  }
}

</script>

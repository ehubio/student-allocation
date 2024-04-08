<template>
  <div class="space-y-1">
    <div class="flex flex-row space-x-1 items-center">
      <h3 class="flex-auto">{{title}}</h3>
      <template v-if="uploadStatus == UploadStatus.Success">
        <svg xmlns="http://www.w3.org/2000/svg" class="shrink-0 h-6 w-6 stroke-success" fill="none" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L20 7" />
        </svg>
      </template>
      <template v-else-if="uploadStatus == UploadStatus.Error">
        <svg xmlns="http://www.w3.org/2000/svg" class="stroke-error shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </template>
      <input ref='file'
             v-on:change='handleFileUpload()'
             type='file'
             accept='.csv'
             :class="[uploadBorderColour, 'file-input', 'file-input-bordered', 'file-input-md', 'w-full', 'max-w-xs']">
      </div>
    <validation-errors v-if="uploadStatus == UploadStatus.Error" :errors="errors"></validation-errors>
  </div>
</template>
<script setup lang='ts'>
import {computed, ref} from 'vue'
import * as Papa from 'papaparse'
import {type InputData, studentPrefSchema, validateData} from "./validateCsv.ts";
import type { ValidationError } from '@apideck/better-ajv-errors';
import ValidationErrors from "./ValidationErrors.vue";
import type {StudentRow, SupervisorRow} from "./types.ts";

const props = defineProps(['schema', 'title']);

const data = defineModel<InputData>('data', {default: []});

const file = ref<HTMLInputElement | null>(null);

type ParseResults = {
  data: any
  errors: any
  meta: any
}

const errors = ref<ValidationError[]>([]);

enum UploadStatus {
  Pending,
  Error,
  Success
}

const uploadStatus = ref<UploadStatus>(UploadStatus.Pending)
const uploadBorderColour = computed(() => {
    if (uploadStatus.value === UploadStatus.Error) {
      return "file-input-error"
    } else if (uploadStatus.value === UploadStatus.Success) {
      return "file-input-success"
    } else {
      return ""
    }
})

const handleFileUpload = async() => {
  if (file.value && file.value.files && file.value.files.length > 0) {
    const uploadedFile = file.value.files[0];
    Papa.parse(uploadedFile, {
      header: true,
      skipEmptyLines: true,
      transform: function(val: string) {
        return val.trim();
      },
      transformHeader: function(val: string) {
        return val.trim();
      },
      complete: function(results: ParseResults, file: File) {
        const { errors: errs, parsedData } = validateData(results.data, props.schema);
        errors.value = errs;
        if (errs.length > 0) {
          uploadStatus.value = UploadStatus.Error
        } else {
          uploadStatus.value = UploadStatus.Success
        }
        if (props.schema === studentPrefSchema) {
          data.value = parsedData as StudentRow[];
        } else {
          data.value = parsedData as SupervisorRow[];
        }
      }
    });
  }
}

</script>

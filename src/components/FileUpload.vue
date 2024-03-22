<template>
  <input ref="file" v-on:change="handleFileUpload()" type="file" accept=".csv">
</template>
<script setup lang="ts">

import { ref } from "vue"
import * as Papa from "papaparse"

const file = ref<HTMLInputElement | null>(null);

type ParseResults = {
  data: any
  errors: any
  meta: any
}

const handleFileUpload = async() => {
  if (file.value && file.value.files && file.value.files.length > 0) {
    const uploadedFile = file.value.files[0];
    const data = Papa.parse(uploadedFile, {
      header: true,
      skipEmptyLines: true,
      transform: function(val: string) {
        return val.trim();
      },
      complete: function(results: ParseResults, file: File) {
        console.log("Parsing complete", results, file);
      }
    });
    // const reader = new FileReader();
    //
    // reader.onload = (event: ProgressEvent<FileReader>) => {
    //   if (event.target && event.target.result) {
    //     const csvContent = event.target.result as string;
    //     // Process csvContent here
    //     console.log(csvContent);
    //   }
    // };
    //
    // reader.readAsText(uploadedFile);
  }
}

</script>

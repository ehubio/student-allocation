<template>
  <div class="flex flex-col items-center mt-10">
    <button @click="download"
            role="button"
            class="btn btn-primary">
      Download results
    </button>
  </div>
</template>
<script setup lang="ts">

import {studentToCsvString} from "./dataToCsv.ts";

const props = defineProps(["studentData"]);

const download = () => {
  const csvContent = studentToCsvString(props.studentData)
  const element = document.createElement("a");
  element.setAttribute("href", "data:text/csv;charset=utf-8," + encodeURIComponent(csvContent));
  element.setAttribute("download", "allocated_students.csv");

  element.style.display = "none";
  document.body.appendChild(element);

  element.click();

  document.body.removeChild(element);
}
</script>

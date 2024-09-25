<template>
  <div class="flex flex-col items-center">
    <button @click="download"
            role="button"
            class="btn btn-primary">
      Download results
    </button>
  </div>
</template>
<script setup lang="ts">

const props = defineProps(["csvData"]);

const download = () => {
  const element = document.createElement("a");
  element.setAttribute("href", "data:text/csv;charset=utf-8," + encodeURIComponent(props.csvData));
  element.setAttribute("download", "allocated_students.csv");

  element.style.display = "none";
  document.body.appendChild(element);

  element.click();

  document.body.removeChild(element);
}
</script>

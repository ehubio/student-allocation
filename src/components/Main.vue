<template>
  <div>
    <h3>Student preferences</h3>
    <FileUpload :schema='studentPrefSchema'
                v-model:data='studentPreferences'></FileUpload>
    <h3>Supervisor capacity</h3>
    <FileUpload :schema='supervisorCapacitySchema'
                v-model:data='supervisorData'></FileUpload>
  </div>
</template>

<script setup lang='ts'>
import FileUpload from './FileUpload.vue';
import {
  supervisorCapacitySchema,
  studentPrefSchema,
  type SupervisorCapacity,
  type StudentPreference
} from './ValidateCsv.ts';
import {ref} from "vue";

const supervisorData = ref<SupervisorCapacity[]>([]);
const studentPreferences = ref<StudentPreference[]>([]);

</script>

<style scoped>

</style>

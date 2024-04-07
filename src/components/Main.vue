<template>
  <div>
    <h3>Student preferences</h3>
    <FileUpload :schema='studentPrefSchema'
                v-model:data='studentData'></FileUpload>
    <h3>Supervisor capacity</h3>
    <FileUpload :schema='supervisorCapacitySchema'
                v-model:data='supervisorData'></FileUpload>
    <button v-if="studentData.length > 0 && supervisorData.length > 0"
            role="button"
            @click="allocate">
      Run allocation
    </button>
    <Progress/>
    <ResultDownload v-if="allocationComplete"
                    :student-data="studentData"/>

  </div>
</template>

<script setup lang='ts'>
import FileUpload from './FileUpload.vue';
import {
  supervisorCapacitySchema,
  studentPrefSchema
} from './validateCsv.ts';
import {ref} from "vue";
import {runAllocation} from "./runAllocation.ts";
import Progress from "./Progress.vue";
import type {StudentRow, SupervisorRow} from "./types.ts";
import ResultDownload from "./ResultDownload.vue";

const supervisorData = ref<SupervisorRow[]>([]);
const studentData = ref<StudentRow[]>([]);

const allocationComplete = ref<boolean>(false);

const allocate = () => {
  allocationComplete.value = runAllocation(studentData.value, supervisorData.value)
}

</script>

<style scoped>

</style>

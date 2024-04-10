<template>
  <div class="px-40">
    <div class="space-y-1">
      <h1 class="mb-5 mt-0 text-5xl font-medium leading-tight text-primary">
        EHU Biology Student-Supervisor Matching
      </h1>
      <FileUpload title='Student preferences'
                  :schema='studentPrefSchema'
                  v-model:data='studentData'/>
      <FileUpload title='Supervisor capacity'
                  :schema='supervisorCapacitySchema'
                  v-model:data='supervisorData'/>
    </div>
    <div class="flex flex-col items-center mt-10">
      <button class="btn btn-primary justify-center"
              v-if="studentData.length > 0 && supervisorData.length > 0"
              role="button"
              @click="allocate">
        Run allocation
      </button>
    </div>
    <div v-if="allocationComplete" role="alert" class="alert alert-success mt-5">
      <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
      <span>Matching completed successfully</span>
    </div>
    <ResultDownload class="mt-5"
                    v-if="allocationComplete"
                    :student-data="allocatedStudentData"/>
  </div>
</template>

<script setup lang='ts'>
import FileUpload from './FileUpload.vue';
import {
  supervisorCapacitySchema,
  studentPrefSchema
} from './validateCsv.ts';
import {ref, toRaw, watch} from "vue";
import {runAllocation} from "./runAllocation.ts";
import Progress from "./Progress.vue";
import type {StudentRow, SupervisorRow} from "./types.ts";
import ResultDownload from "./ResultDownload.vue";
import emitter from "./eventBus.ts";

const supervisorData = ref<SupervisorRow[]>([]);
const studentData = ref<StudentRow[]>([]);
const allocatedSupervisorData = ref<SupervisorRow[]>([]);
const allocatedStudentData = ref<StudentRow[]>([]);

const allocationComplete = ref<boolean>(false);

const allocate = () => {
  emitter.$emit("clear");
  // Copy the data as we don't want to modify original in-case someone re-runs it
  allocatedStudentData.value = structuredClone(toRaw(studentData.value))
  allocatedSupervisorData.value = structuredClone(toRaw(supervisorData.value))
  allocationComplete.value = runAllocation(allocatedStudentData.value, allocatedSupervisorData.value)
}

watch([studentData, supervisorData], () => {
  allocationComplete.value = false;
})

</script>

<style scoped>

</style>

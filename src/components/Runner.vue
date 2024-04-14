<template>
  <div>
    <div class="navbar bg-base-100 mb-10">
      <div class="flex-1">
        <h1 class="text-3xl font-medium leading-tight text-primary">
          EHU Biology Student-Supervisor Matching
        </h1>
      </div>
      <div class="flex-none">
        <a class="btn btn-ghost btn-circle" href="/student-allocation/methods/">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="dimgray">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </a>
      </div>
    </div>
    <div class="px-40">
      <div class="space-y-1">
        <FileUpload title='Student preferences'
                    :schema='studentPrefSchema'
                    link="student_template.csv"
                    v-model:data='studentData'/>
        <FileUpload title='Supervisor capacity'
                    :schema='supervisorCapacitySchema'
                    link="supervisor_template.csv"
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
      <div v-if="allocationResult?.success" role="alert" class="alert alert-success mt-5">
        <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        <span>Matching completed successfully</span>
      </div>
      <div v-if="allocationResult && !allocationResult.success" role="alert" class="alert alert-error mt-5">
        <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        <div>
          <span>Encountered an error while matching</span>
          <ul class="list-disc list-inside">
            <li v-for="error in allocationResult.errors" :key="error">{{error}}</li>
          </ul>
        </div>
      </div>
      <Progress :showComponent="allocationResult?.success"/>
      <ResultDownload class="mt-5"
                      v-if="allocationResult?.success"
                      :student-data="allocatedStudentData"/>
    </div>
  </div>
</template>

<script setup lang='ts'>
import FileUpload from './FileUpload.vue';
import {
  supervisorCapacitySchema,
  studentPrefSchema
} from './validateCsv.ts';
import {ref, toRaw, watch} from "vue";
import {type Result, runAllocation} from "./runAllocation.ts";
import Progress from "./Progress.vue";
import type {StudentRow, SupervisorRow} from "./types.ts";
import ResultDownload from "./ResultDownload.vue";
import emitter from "./eventBus.ts";
import Methods from "./MethodsText.vue";

const supervisorData = ref<SupervisorRow[]>([]);
const studentData = ref<StudentRow[]>([]);
const allocatedSupervisorData = ref<SupervisorRow[]>([]);
const allocatedStudentData = ref<StudentRow[]>([]);

const allocationResult = ref<Result | null>(null);

const allocate = () => {
  emitter.$emit("clear");
  // Copy the data as we don't want to modify original in-case someone re-runs it
  allocatedStudentData.value = structuredClone(toRaw(studentData.value))
  allocatedSupervisorData.value = structuredClone(toRaw(supervisorData.value))
  allocationResult.value = runAllocation(allocatedStudentData.value, allocatedSupervisorData.value)
}

watch([studentData, supervisorData], () => {
  allocationResult.value = null;
})

</script>

<style scoped>

</style>

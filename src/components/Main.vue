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
    <Progress class="mt-5"/>
    <ResultDownload v-if="allocationComplete"
                    :student-data="allocatedStudentData"/>
  </div>
</template>

<script setup lang='ts'>
import FileUpload from './FileUpload.vue';
import {
  supervisorCapacitySchema,
  studentPrefSchema
} from './validateCsv.ts';
import {ref, toRaw} from "vue";
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
  // Copy the data as we don't want to modify original incase someone re-runs it
  allocatedStudentData.value = structuredClone(toRaw(studentData.value))
  allocatedSupervisorData.value = structuredClone(toRaw(supervisorData.value))
  allocationComplete.value = runAllocation(allocatedStudentData.value, allocatedSupervisorData.value)
}

</script>

<style scoped>

</style>

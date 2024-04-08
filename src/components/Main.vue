<template>
  <div class="px-40">
    <div class="space-y-1">
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

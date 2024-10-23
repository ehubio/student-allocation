<template>
    <div>
        <div class="navbar bg-base-100 mb-10">
            <div class="flex-1">
                <h1 class="text-3xl font-medium leading-tight text-primary">
                    EHU Biology Presentation Marker Allocation
                </h1>
            </div>
            <div class="flex-none">
                <a class="btn btn-ghost btn-circle" href="/student-allocation/presentation-marking/about">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="dimgray">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </a>
            </div>
        </div>
        <div class="px-40">
            <div class="space-y-1">
                <FileUpload title='Students'
                            :schema='studentPresentationSchema'
                            link="student_presentation_template.csv"
                            v-model:data='studentData'/>
                <FileUpload title='Markers'
                            :schema='markerSchema'
                            link="marker_template.csv"
                            v-model:data='markerData'/>
                <NumericInput title='Number of rooms'
                              :min=1
                              :max=5000
                              @update:modelValue="(newVal) => noOfRooms = newVal"/>
            </div>
            <div class="flex flex-col items-center mt-10">
                <button class="btn btn-primary justify-center"
                        v-if="studentData.length > 0 && markerData.length > 0 && noOfRooms !== null"
                        role="button"
                        @click="allocate">
                    <span v-if="allocationRunning" class="loading loading-spinner"></span>
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
                            :csv-data="downloadData"/>
        </div>
    </div>
</template>

<script setup lang='ts'>
import FileUpload from '../common/FileUpload.vue';
import {
    markerSchema, studentPresentationSchema
} from '../common/validateCsv.ts';
import {nextTick, ref, watch} from "vue";
import Progress from "../common/Progress.vue";
import emitter from "../common/eventBus.ts";
import {type Marker, type Result, scoreLastYear, type Student} from "./markerAllocation.ts";
import NumericInput from "../common/NumericalInput.vue";
import {markerAllocationToCsv} from "../student-supervisor/dataToCsv.ts";
import ResultDownload from "../student-supervisor/ResultDownload.vue";

const markerData = ref<Marker[]>([]);
const studentData = ref<Student[]>([]);
const noOfRooms = ref<number | null>(null);

const allocationResult = ref<Result | null>(null);
const downloadData = ref<string>()
const allocationRunning = ref<boolean>(false);

const allocate = async () => {
    emitter.$emit("clear");
    allocationRunning.value = true;
    await nextTick();
    if (noOfRooms.value !== null) {
        const worker = new Worker(new URL("./markerAllocationWorker.ts", import.meta.url), {type: "module"})

        const cloneMarkers = JSON.parse(JSON.stringify(markerData.value));
        const cloneStudents = JSON.parse(JSON.stringify(studentData.value));
        try {
            worker.postMessage({
                markerData: cloneMarkers,
                studentData: cloneStudents,
                noOfRooms: noOfRooms.value,
            });
        } catch (error) {
            console.error("Data serialization error:", error);
            allocationRunning.value = false;
            return; // Exit if there's a serialization issue
        }
        // allocationResult.value = allocateRooms(markerData.value, studentData.value, noOfRooms.value);
        worker.onmessage = (event) => {
            const { type, message, data } = event.data;

            if (type === 'progress') {
                emitter.$emit("progress", message); // Emit the progress message
            } else if (type === 'result') {
                allocationResult.value = data;
                allocationRunning.value = false;

                if (allocationResult.value && allocationResult.value.success && allocationResult.value.allocation) {
                    // Uncomment to score last years result, will only work if uploaded the markers and student
                    // input data from last year.
                    // fetch("/student-allocation/files/last_year.csv")
                    //     .then(response => response.text())
                    //     .then(fileContent => {
                    //         scoreLastYear(fileContent, markerData.value, studentData.value);
                    //     });
                    downloadData.value = markerAllocationToCsv(allocationResult.value.allocation);
                }
            }
        }

        worker.onerror = (error) => {
            console.error("Worker error:", error);
            allocationRunning.value = false;
            worker.terminate(); // Clean up the worker
        };
    }
}

watch([studentData, markerData, noOfRooms], () => {
    allocationResult.value = null;
})
</script>

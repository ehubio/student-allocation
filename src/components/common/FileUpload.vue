<template>
    <div class="space-y-1">
        <div class="flex flex-row space-x-1 items-center">
            <h3 class="flex-auto">{{ title }}</h3>
            <a class="btn btn-ghost" :href="'/student-allocation/files/' + link">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24"
                     stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
                </svg>
                Download template
            </a>
            <template v-if="uploadStatus == UploadStatus.Success">
                <svg xmlns="http://www.w3.org/2000/svg" class="shrink-0 h-6 w-6 stroke-success" fill="none"
                     viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L20 7"/>
                </svg>
            </template>
            <template v-else-if="uploadStatus == UploadStatus.Error">
                <div @click="clearUpload()" class="py-2">
                    <svg xmlns="http://www.w3.org/2000/svg" class="stroke-error shrink-0 h-6 w-6" fill="none"
                         viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                </div>
            </template>
            <template v-else>
                <svg xmlns="http://www.w3.org/2000/svg" class="stroke-none shrink-0 h-6 w-6" fill="none"
                     viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
            </template>
            <input ref='file'
                   v-on:change='handleFileUpload()'
                   type='file'
                   accept='.csv'
                   :class="[uploadBorderColour, 'file-input', 'file-input-bordered', 'file-input-md', 'w-full', 'max-w-md']">
        </div>
        <validation-errors v-if="uploadStatus == UploadStatus.Error" :errors="errors"></validation-errors>
    </div>
</template>
<script setup lang='ts'>
import {computed, ref} from 'vue'
import * as Papa from 'papaparse'
import {
    type InputData,
    studentPrefSchema,
    studentPresentationSchema,
    supervisorCapacitySchema,
    validateData
} from "./validateCsv.ts";
import type {ValidationError} from '@apideck/better-ajv-errors';
import ValidationErrors from "./ValidationErrors.vue";
import type {StudentRow, SupervisorRow} from "../student-supervisor/types.ts";
import type {Marker, Student} from "../presentation-marking/markerAllocation.ts";

const props = defineProps(['schema', 'title', 'link']);

const data = defineModel<InputData>('data', {default: []});

const file = ref<HTMLInputElement | null>(null);

type ParseResults = {
    data: any
    errors: any
    meta: any
}

const errors = ref<ValidationError[]>([]);

enum UploadStatus {
    Pending,
    Error,
    Success
}

const uploadStatus = ref<UploadStatus>(UploadStatus.Pending)
const uploadBorderColour = computed(() => {
    if (uploadStatus.value === UploadStatus.Error) {
        return "file-input-error"
    } else if (uploadStatus.value === UploadStatus.Success) {
        return "file-input-success"
    } else {
        return ""
    }
})

const handleFileUpload = async () => {
    if (file.value && file.value.files && file.value.files.length > 0) {
        const uploadedFile = file.value.files[0];
        Papa.parse(uploadedFile, {
            header: true,
            skipEmptyLines: true,
            transform: function (val: string) {
                return val.trim();
            },
            transformHeader: function (val: string) {
                return val.trim();
            },
            complete: function (results: ParseResults, file: File) {
                const {errors: errs, parsedData} = validateData(results.data, props.schema);
                errors.value = errs;
                if (errs.length > 0) {
                    uploadStatus.value = UploadStatus.Error
                } else {
                    uploadStatus.value = UploadStatus.Success
                }
                if (props.schema === studentPrefSchema) {
                    data.value = parsedData as StudentRow[];
                } else if (props.schema === supervisorCapacitySchema) {
                    data.value = parsedData as SupervisorRow[];
                } else if (props.schema === studentPresentationSchema) {
                    data.value = parsedData as Student[];
                } else {
                    data.value = parsedData as Marker[];
                }
            }
        });
    }
}

const clearUpload = () => {
    if (file.value?.value) {
        file.value.value = "";
        data.value = [];
        uploadStatus.value = UploadStatus.Pending;
        errors.value = [];
    }
}

</script>

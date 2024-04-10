import type {StudentRow, SupervisorRow} from "./types.ts";
import emitter from "./eventBus.ts"
import {matchPair, solveStudentOptimal} from "./matching.ts";
import {isEmpty, notEmpty} from "./utils.ts";

export function runAllocation(students: StudentRow[], supervisors: SupervisorRow[]) {
    emitter.$emit("progress", "Starting allocation");
    // Validate the data
    // Remove duplicate picks
    // Check all preferences are a valid supervisor
    // check all projects are valid
    // add 3rd and 4th choice if missing
    // remove resit students
    setSupervisorPreferences(students, supervisors);
    solveStudentOptimal(students, supervisors);
    emitter.$emit("progress", "Completed matching algorithm", "bg-success");
    allocateRemaining(students, supervisors);
    emitter.$emit("progress", "Completed allocating remaining students", "bg-success")
    return true;
}

export function setSupervisorPreferences(students: StudentRow[], supervisors: SupervisorRow[]) {
    const studentRanks = students.map((s: StudentRow) => s.rank)
        .filter(notEmpty)

    if (studentRanks.length != students.length) {
        emitter.$emit("progress", "Randomising rank for any unranked students")
        const maxRank = Math.max(...studentRanks) ? 1 : Math.max(...studentRanks);
        const missingRank = students.filter((s: StudentRow) => s.rank === undefined)
        const ranks = Array.from({length: missingRank.length}, (_v, k) => k + maxRank);
        const randomRanks = shuffle(ranks)
        missingRank.forEach((s: StudentRow, index: number) => s.rank = randomRanks[index])
    }

    const sortedStudents = [...students]
    const supervisorPref = sortedStudents
        .sort((a, b) => a.rank! - b.rank!)
        .map(s => s.id)

    supervisors.forEach(s => s.preference = supervisorPref)
}

function shuffle(array: any[]) {
    let tmp, current, top = array.length;
    if(top) while(--top) {
        current = Math.floor(Math.random() * (top + 1));
        tmp = array[current];
        array[current] = array[top];
        array[top] = tmp;
    }
    return array;
}

function allocateRemaining(students: StudentRow[], supervisors: SupervisorRow[]) {
    const unallocated = students.filter(s => isEmpty(s.allocation))
    emitter.$emit("progress", `Allocating ${unallocated.length} remaining students who did not set preferences`)
    const remainingCapacity = supervisors.filter(s => s.capacity > s.students.length)
    remainingCapacity.forEach(s => {
        emitter.$emit("progress", `${s.id} has ${s.students.length}/${s.capacity} students allocated`)
    })
    const unallocatedByProgramme = groupBy(unallocated, "programme");
    const remainingSupervisorsByProgramme = groupBy(remainingCapacity, "programmes")
    for (const programme in unallocatedByProgramme) {
        if (isEmpty(remainingSupervisorsByProgramme[programme]) ||
            remainingSupervisorsByProgramme[programme].length == 0) {
            emitter.$on("progress", `No supervisors left for programme ${programme}`)
            continue
        }
        allocateRemainingByProgramme(unallocatedByProgramme[programme], remainingSupervisorsByProgramme[programme])
    }
}

function allocateRemainingByProgramme(students: StudentRow[], supervisors: SupervisorRow[]) {
    const freeStudents = [...students];

    let student;
    while (student = freeStudents.pop()) {
        const highestCapacitySupervisor = supervisors.reduce((highestCapacity, s) => {
            const thisCapacity = (s.capacity - s.students.length) / s.capacity;
            const maxCapacity = highestCapacity ?
                (highestCapacity.capacity - highestCapacity.students.length) / highestCapacity.capacity : Infinity;
            if (thisCapacity > maxCapacity) {
                return s
            } else {
                return highestCapacity
            }
        }, supervisors[0])
        matchPair(student, highestCapacitySupervisor)
    }
}

function groupBy(arr: any[], property: string) {
    return arr.reduce((memo, x) => {
        const values = Array.isArray(x[property]) ? x[property] : [x[property]];
        values.forEach((value: any) => {
            if (!memo[value]) {
                memo[value] = [];
            }
            memo[value].push(x);
        });
        return memo;
    }, {});
}

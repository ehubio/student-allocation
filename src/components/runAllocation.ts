import type {StudentRow, SupervisorRow} from "./types.ts";
import emitter from "./eventBus.ts"
import {solveStudentOptimal} from "./matching.ts";
import {notEmpty} from "./utils.ts";

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
    emitter.$emit("progress", "Completed matching algorithm");
    // allocate those with no preferences to remaining supervisor
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

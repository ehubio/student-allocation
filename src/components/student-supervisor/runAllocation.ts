import type {StudentRow, SupervisorRow} from "./types.ts";
import emitter from "../common/eventBus.ts"
import {matchPair, solveStudentOptimal} from "./matching.ts";
import {formatStrings, groupBy, isEmpty, notEmpty} from "../common/utils.ts";

export interface Result {
    success: boolean
    errors: string[]
    students?: StudentRow[]
    supervisors?: SupervisorRow[]
}

export function runAllocation(students: StudentRow[], supervisors: SupervisorRow[]): Result {
    emitter.$emit("progress", "Starting allocation");
    const res = validateStudentSupervisors(students, supervisors);
    if (!res.success) {
        return res
    }
    removeDuplicatePicks(students);

    // In this case we are using randomised ranks for the students, and so any matching won't be stable
    // therefore there is a chance some are better than others, in this case we want to run the matching
    // a few times to get an optimal result.
    const missingRank = students.map((s: StudentRow) => s.rank)
        .filter(isEmpty);
    if (missingRank.length > 0) {
        const allRuns = [...Array(100)].map((_) => {
            const studentsCopy = nestedCopy(students);
            const supervisorsCopy = nestedCopy(supervisors);
            allocateOnce(studentsCopy, supervisorsCopy, true)
            return {
                students: studentsCopy,
                supervisors: supervisorsCopy
            }
        });
        let minScore = Infinity;
        let bestResult = allRuns[0];
        for (const thisResult of allRuns) {
            const thisScore = scoreResult(thisResult.students);
            if (thisScore < minScore) {
                minScore = thisScore;
                bestResult = thisResult;
            }
        }
        res.students = bestResult.students;
        res.supervisors = bestResult.supervisors;
    } else {
        allocateOnce(students, supervisors, false)
        res.students = students;
        res.supervisors = supervisors;
    }

    emitter.$emit("progress", "Completed allocating students", "bg-success");
    summariseResults(res.students, res.supervisors);
    return res;
}

function nestedCopy<Type>(array: Type[]): Type[] {
    return JSON.parse(JSON.stringify(array));
}

function allocateOnce(students: StudentRow[], supervisors: SupervisorRow[], quiet: boolean) {
    randomiseMissingPreferences(students, supervisors, quiet);
    // remove resit students
    setSupervisorPreferences(students, supervisors, quiet);
    solveStudentOptimal(students, supervisors, quiet);
    allocateRemaining(students, supervisors, quiet);
}

export function validateStudentSupervisors(students: StudentRow[], supervisors: SupervisorRow[]): Result {
    const allSupervisors = supervisors.map(s => s.id);
    const allProgrammes = supervisors.reduce((programmes, s) => {
        s.programmes.forEach(programme => programmes.add(programme));
        return programmes
    }, new Set<string>())
    const supervisorsString = formatStrings(allSupervisors);
    const programmesString = formatStrings(allProgrammes);
    const errors = students.reduce((errs, student) => {
        if (!allProgrammes.has(student.programme)) {
            errs.push(`Student '${student.id}' is on programme '${student.programme}' which is not in list of ` +
                      `known programmes. Must be one of ${programmesString}.`)
        }
        student.preference.map(pref => {
            if (!allSupervisors.includes(pref)) {
                errs.push(`Student '${student.id}' submitted preference '${pref}' which is not in list of ` +
                    `known supervisors. Must be one of ${supervisorsString}.`)
            }
        })
        return errs
    }, [] as string[])
    return {
        success: errors.length == 0,
        errors
    }
}

// If a student has entered the same supervisor twice, we remove both choices.
// We want to avoid people trying to game the system by repeating a pick multiple times
export function removeDuplicatePicks(students: StudentRow[]) {
    students.forEach(s => {
        const uniquePrefs = new Set(s.preference);
        const outPrefs = [] as string[];
        uniquePrefs.forEach(pref => {
            const occurrences = countOccurrences(s.preference, pref);
            if (occurrences == 1) {
                outPrefs.push(pref)
            } else {
                emitter.$emit("progress",
                    `Removing preference ${pref} from ${s.id} as they entered it ${occurrences} times`)
            }
        })
        s.preference = outPrefs;
    })
}

function countOccurrences(arr: string[], str: string): number {
    return arr.reduce((counts, current) => {
        if (current === str) {
            counts[str] = (counts[str] || 0) + 1;
        }
        return counts
    }, {} as { [key: string]: number })[str] || 0;
}

// If a student submits only 2 preferences, then the matching algorithm will guarantee pairing with 1 of these.
// This gives them an unfair advantage. If they've not entered the required amount (4) then we assign remaining
// preferences randomly. Unless they have no preference, then we leave this to allocate afterwards.
// So that students who did submit preferences are favored.
export function randomiseMissingPreferences(students: StudentRow[], supervisors: SupervisorRow[], quiet: boolean) {
    const supervisorsByProgramme = groupBy(supervisors, "programmes")
    students.forEach(student => {
        const preferencesToSet = 4 - student.preference.length
        if (preferencesToSet > 0 && preferencesToSet < 4) {
            const programmeSupervisors: SupervisorRow[] = supervisorsByProgramme[student.programme].
                filter((s: SupervisorRow) => !student.preference.includes(s.id));
            const toAssign =  getRandomSupervisors(preferencesToSet, programmeSupervisors)
            if (!quiet) {
                emitter.$emit("progress",
                    `Student '${student.id}' entered ${student.preference.length} preferences. ` +
                    `Randomly adding supervisors ${formatStrings(toAssign)} as additional preferences.`)
            }
            student.preference.push(...toAssign);
        }
    })
}

function getRandomSupervisors(n: number, supervisors: SupervisorRow[]): string[] {
    const supervisorIds = supervisors.map(s => s.id);
    const chooser = randomNoRepeats(supervisorIds);
    const res: string[] = []
    for (let i = 0; i < n; i++) {
        res.push(chooser());
    }
    return res
}

function randomNoRepeats(array: string[]) {
    let copy = array.slice(0);
    return () => {
        if (copy.length < 1) { copy = array.slice(0); }
        const index = Math.floor(Math.random() * copy.length);
        const item = copy[index];
        copy.splice(index, 1);
        return item;
    }
}

export function setSupervisorPreferences(students: StudentRow[], supervisors: SupervisorRow[], quiet: boolean) {
    const studentRanks = students.map((s: StudentRow) => s.rank)
        .filter(notEmpty)

    if (studentRanks.length != students.length) {
        if (!quiet) {
            emitter.$emit("progress", "Randomising rank for any unranked students")
        }
        const maxRank = studentRanks.length > 0 ? Math.max(...studentRanks) : 0;
        const missingRank = students.filter((s: StudentRow) => s.rank === undefined)
        const ranks = Array.from({length: missingRank.length}, (_v, k) => k + maxRank + 1);
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

function allocateRemaining(students: StudentRow[], supervisors: SupervisorRow[], quiet: boolean) {
    const unallocated = students.filter(s => isEmpty(s.allocation) || s.allocation === "");
    const withoutPref = unallocated.filter(s => s["first choice"] === "");

    if (!quiet) {
        emitter.$emit("progress", `Allocating ${unallocated.length} remaining students, ${withoutPref.length} of which did not set preferences`);
    }

    const remainingCapacity = supervisors.filter(s => s.capacity > s.students.length);
    const unallocatedByProgramme = groupBy(unallocated, "programme");
    const remainingSupervisorsByProgramme = groupBy(remainingCapacity, "programmes");
    for (const programme in unallocatedByProgramme) {
        if (isEmpty(remainingSupervisorsByProgramme[programme]) ||
            remainingSupervisorsByProgramme[programme].length == 0) {
            if (!quiet) {
                emitter.$on("progress", `No supervisors left for programme ${programme}`);
            }
            continue
        }
        allocateRemainingByProgramme(unallocatedByProgramme[programme], remainingSupervisorsByProgramme[programme]);
    }
}

function allocateRemainingByProgramme(students: StudentRow[], supervisors: SupervisorRow[]) {
    const freeStudents = [...students];

    let student;
    while (student = freeStudents.pop()) {
        const highestCapacitySupervisor = supervisors.reduce((highestCapacity, s) => {
            const thisCapacity = s.capacity - s.students.length
            const maxCapacity = highestCapacity ?
                highestCapacity.capacity - highestCapacity.students.length : Infinity;
            if (thisCapacity > maxCapacity) {
                return s
            } else {
                return highestCapacity
            }
        }, supervisors[0])
        matchPair(student, highestCapacitySupervisor)
    }
}

export function summariseResults(students: StudentRow[], supervisors: SupervisorRow[]) {
    supervisors.forEach(s => {
        emitter.$emit("progress", `${s.id} has ${s.students.length}/${s.capacity} students allocated`)
    })
    // Print for the students, how many got first choice, second, third etc.
    const choicesCount = countChoices(students);
    choicesCount.forEach((n: number, i: number) => {
        if (i != 4) {
            emitter.$emit("progress", `Choice ${i + 1}: ${n} students`)
        } else {
            emitter.$emit("progress", `None of submitted choices: ${n} students`)
        }
    })
}

function countChoices(students: StudentRow[]) {
    const choicesCount = [0, 0, 0, 0, 0];
    students.forEach(student => {
        if (student["first choice"]) {
            if (student.allocation == student["first choice"]) {
                choicesCount[0]++
            } else if (student.allocation == student["second choice"]) {
                choicesCount[1]++
            } else if (student.allocation == student["third choice"]) {
                choicesCount[2]++
            } else if (student.allocation == student["fourth choice"]) {
                choicesCount[3]++
            } else {
                choicesCount[4]++
            }
        }
    })
    return choicesCount
}

function scoreResult(students: StudentRow[]) {
    const choicesCount = countChoices(students);
    return choicesCount.reduce((score, count, index) => {
        return score + (count * index + 1)
    }, 0)
}

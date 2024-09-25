import emitter from "../common/eventBus.ts"
import type {Student, Supervisor} from "./types.ts";
import {notEmpty} from "../common/utils.ts";

function getWorstMatch(supervisor: Supervisor): string | undefined {
    if (supervisor.students.length === 0) {
        return undefined;
    } else {
        // Assumes matching is in order of preference list
        return supervisor.students[supervisor.students.length - 1]
    }
}

function getSuccessors(supervisor: Supervisor): string[] {
    const worstStudent = getWorstMatch(supervisor);
    if (!worstStudent) {
        return [];
    }
    const idx = supervisor.preference.indexOf(worstStudent);
    if (idx == -1) {
        return [];
    }
    return supervisor.preference.slice(idx + 1);
}

/**
 * Implementation of the Hospital-Resident / Student admission algorithm
 *
 * Implementation of the Gale-Shapely algorithm from Roth 1984 https://doi.org/10.1086/261272
 * adapted from Python version here https://github.com/daffidwilde/matching
 *
 * This works as follows
 * 0. Set all students and supervisors to be unmatched
 * 1. Take any unmatched student with a non-empty preference list r, and consider their most preferred supervisor h,
 *   Match them to one another.
 * 2. If, as a result, h is now over-subscribed, find the worst student currently assigned to h, call them r. Set r
 *   to be unmatched and remove them from h's matching. Otherwise, go to step 3
 * 3. If h is at capacity, then find their worst current match r. Then for each successor, s to r in the preference
 *   list of h, delete the pair (s, h) from the game. Otherwise, go to 4.
 * 4. Go to 1 until there are no such residents left, then end.
 *
 * @param students - Array of students and preferences to allocate
 * @param supervisors - Array of supervisors and preferences
 * @returns List of students with their allocation
 */
export function solveStudentOptimal(students: Student[], supervisors: Supervisor[], quiet: boolean) {
    if (!quiet) {
        emitter.$emit("progress", "Running matching algorithm")
    }

    function findSupervisorById(id: string): Supervisor | undefined {
        return supervisors.find((s: Supervisor) => s.id == id)
    }

    function findStudentById(id: string): Student | undefined {
        return students.find((s: Student) => s.id == id)
    }

    const freeStudents = [...students]
        .filter(s => !s.allocation);

    let student;
    while (student = freeStudents.pop()) {
        const favouriteSupervisor = findSupervisorById(student.preference[0]);

        if (!favouriteSupervisor) {
            continue
        }
        if (favouriteSupervisor.preference.indexOf(student.id) == -1) {
            // Don't pair up is the supervisor does not like the potential match
            continue
        }

        if (favouriteSupervisor.students.length == favouriteSupervisor.capacity) {
            const worstMatchId = getWorstMatch(favouriteSupervisor);
            if (!worstMatchId) {
                continue
            }
            const worstMatch = findStudentById(worstMatchId);
            if (worstMatch) {
                unmatchPair(worstMatch, favouriteSupervisor);
                freeStudents.push(worstMatch);
            }
        }

        matchPair(student, favouriteSupervisor);

        if (favouriteSupervisor.students.length == favouriteSupervisor.capacity) {
            const successors = getSuccessors(favouriteSupervisor)
                .map((s: string) => findStudentById(s))
                .filter(notEmpty);
            for (const successor of successors) {
                deletePair(successor, favouriteSupervisor)
                const successorIdx = freeStudents.indexOf(successor);
                if (successor.preference.length === 0 && successorIdx > -1) {
                    freeStudents.splice(successorIdx, 1);
                }
            }
        }
    }
}

export function matchPair(student: Student, supervisor: Supervisor) {
    supervisor.students.push(student.id);
    // Important to add these in order as when we remove because we're at capacity we do it from the
    // supervisors least-preferred i.e. their last allocated student
    supervisor.students.sort((x, y) => supervisor.preference.indexOf(x) - supervisor.preference.indexOf(y))
    student.allocation = supervisor.id
}

function unmatchPair(student: Student, supervisor: Supervisor) {
    student.allocation = undefined;
    supervisor.students = supervisor.students.filter(r => r !== student.id);
}

function deletePair(student: Student, supervisor: Supervisor) {
    student.preference = student.preference.filter((supervisorId: string) => supervisorId !== supervisor.id);
    supervisor.preference = supervisor.preference.filter((studentId: string) => studentId !== student.id);
}

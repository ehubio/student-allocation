export interface Student {
    id: string;
    preference: Supervisor[];
    allocation: Supervisor | null;
}

export interface Supervisor {
    id: string;
    preference: Student[];
    students: Student[];
    capacity: number;
}

function getWorstMatch(supervisor: Supervisor): Student | undefined {
    if (supervisor.students.length === 0) {
        return undefined;
    } else {
        // Assumes matching is in order of preference list
        return supervisor.students[supervisor.students.length - 1]
    }
}

function getSuccessors(supervisor: Supervisor): Student[] {
    const worstStudent = getWorstMatch(supervisor);
    if (!worstStudent) {
        return [];
    }
    const idx = supervisor.preference.indexOf(worstStudent);
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
export function solveStudentOptimal(students: Student[], supervisors: Supervisor[]) {
    const freeStudents = [...students];

    let student;
    while (student = freeStudents.pop()) {
        // const student = freeStudents.pop()!;
        const favouriteSupervisor = student.preference[0];

        if (favouriteSupervisor.students.length == favouriteSupervisor.capacity) {
            const worstMatch = getWorstMatch(favouriteSupervisor)
            if (worstMatch) {
                unmatch_pair(worstMatch, favouriteSupervisor);
                freeStudents.push(worstMatch);
            }
        }

        match_pair(student, favouriteSupervisor);

        if (favouriteSupervisor.students.length == favouriteSupervisor.capacity) {
            const successors = getSuccessors(favouriteSupervisor);
            for (const successor of successors) {
                delete_pair(successor, favouriteSupervisor)
                const successorIdx = freeStudents.indexOf(successor);
                if (successor.preference.length === 0 && successorIdx > -1) {
                    freeStudents.splice(successorIdx, 1);
                }
            }
        }
    }
}

function match_pair(student: Student, supervisor: Supervisor) {
    supervisor.students.push(student);
    // Important to add these in order as when we remove because we're at capacity we do it from the
    // supervisors least-preferred i.e. their last allocated student
    supervisor.students.sort((x, y) => supervisor.preference.indexOf(x) - supervisor.preference.indexOf(y))
    student.allocation = supervisor
}
function unmatch_pair(student: Student, supervisor: Supervisor) {
    student.allocation = null;
    supervisor.students = supervisor.students.filter(r => r.id !== student.id);
}

function delete_pair(student: Student, supervisor: Supervisor) {
    student.preference = student.preference.filter((s: Supervisor) => s.id !== supervisor.id);
    supervisor.preference = supervisor.preference.filter((s: Student) => s.id !== student.id);
}

import { expect, test } from 'vitest';
import type {StudentRow, SupervisorRow} from "../src/components/types.ts";
import {
    randomiseMissingPreferences,
    removeDuplicatePicks,
    setSupervisorPreferences,
    validateStudentSupervisors
} from "../src/components/runAllocation.ts";
import {validateData} from "../src/components/validateCsv.ts";

test('can set supervisor preferences from ranks', () => {
    const testStudents: StudentRow[] = [
        {
            id: "A",
            rank: 2,
            programme: "P1",
            preference: []
        },
        {
            id: "B",
            rank: 1,
            programme: "P1",
            preference: []
        }
    ]

    const testSupervisor: SupervisorRow[] = [
        {
            id: "X",
            preference: [],
            students: [],
            capacity: 1,
            programmes: []
        }
    ]

    setSupervisorPreferences(testStudents, testSupervisor)

    expect(testSupervisor[0].preference).toStrictEqual(["B", "A"])
})

test('can set supervisor preferences randomly', () => {
    const testStudents: StudentRow[] = [
        {
            id: "A",
            programme: "P1",
            preference: []
        },
        {
            id: "B",
            programme: "P1",
            preference: []
        }
    ]

    const testSupervisor: SupervisorRow[] = [
        {
            id: "X",
            preference: [],
            students: [],
            capacity: 1,
            programmes: []
        },
        {
            id: "Y",
            preference: [],
            students: [],
            capacity: 1,
            programmes: []
        }
    ]

    setSupervisorPreferences(testStudents, testSupervisor)

    // We can't set seed for Math.random so who knows what order we will get
    expect(testSupervisor[0].preference).toHaveLength(2)
    expect(testSupervisor[0].preference).toContain("A")
    expect(testSupervisor[0].preference).toContain("B")
    expect(testSupervisor[0].preference).toStrictEqual(testSupervisor[1].preference)

    const ranks = testStudents.map(s => s.rank);
    expect(ranks.sort()).toStrictEqual([0, 1].sort())
})

test('can set supervisor preferences with mix of random and ranked', () => {
    const testStudents: StudentRow[] = [
        {
            id: "A",
            programme: "P1",
            preference: []
        },
        {
            id: "B",
            rank: 1,
            programme: "P1",
            preference: []
        },
        {
            id: "C",
            programme: "P1",
            preference: []
        }
    ]

    const testSupervisor: SupervisorRow[] = [
        {
            id: "X",
            preference: [],
            students: [],
            capacity: 1,
            programmes: []
        }
    ]

    setSupervisorPreferences(testStudents, testSupervisor)

    // We can't set seed for Math.random so who knows what order we will get
    expect(testSupervisor[0].preference).toHaveLength(3)
    expect(testSupervisor[0].preference[0]).toStrictEqual("B")
    expect(testSupervisor[0].preference).toContain("A")
    expect(testSupervisor[0].preference).toContain("C")
})

test('can validate that every student preference is a known supervisor', () => {
    const testStudents: StudentRow[] = [
        {
            id: "A",
            programme: "P1",
            preference: ["X", "Z"]
        },
        {
            id: "B",
            rank: 1,
            programme: "P1",
            preference: ["X"]
        },
    ]

    const testSupervisor: SupervisorRow[] = [
        {
            id: "X",
            preference: [],
            students: [],
            capacity: 1,
            programmes: ["P1"]
        },
        {
            id: "Y",
            preference: [],
            students: [],
            capacity: 1,
            programmes: ["P1"]
        }
    ]

    const res = validateStudentSupervisors(testStudents, testSupervisor)
    expect(res.success).toEqual(false);
    expect(res.errors).toStrictEqual(["Student 'A' submitted preference 'Z' which is not in list of known " +
            "supervisors. Must be one of 'X', 'Y'."]);
});

test('can validate that there is a supervisor for every programme', () => {
    const testStudents: StudentRow[] = [
        {
            id: "A",
            programme: "P1",
            preference: ["X", "Y"]
        },
        {
            id: "B",
            rank: 1,
            programme: "P2",
            preference: ["X"]
        },
    ]

    const testSupervisor: SupervisorRow[] = [
        {
            id: "X",
            preference: [],
            students: [],
            capacity: 1,
            programmes: ["P1"]
        },
        {
            id: "Y",
            preference: [],
            students: [],
            capacity: 1,
            programmes: []
        }
    ]

    const res = validateStudentSupervisors(testStudents, testSupervisor)
    expect(res.success).toEqual(false);
    expect(res.errors).toStrictEqual(["Student 'B' is on programme 'P2' which is not in list of known programmes. " +
            "Must be one of 'P1'."])
});

test('duplicate picks are removed', () => {
    const testStudents: StudentRow[] = [
        {
            id: "A",
            programme: "P1",
            preference: ["X", "Y"]
        },
        {
            id: "B",
            rank: 1,
            programme: "P2",
            preference: ["X", "Y", "X"]
        },
        {
            id: "C",
            rank: 1,
            programme: "P2",
            preference: ["X", "X", "X", "Y", "Y"]
        },
    ]

    removeDuplicatePicks(testStudents)
    expect(testStudents[0].preference).toStrictEqual(["X", "Y"])
    expect(testStudents[1].preference).toStrictEqual(["Y"])
    expect(testStudents[2].preference).toStrictEqual([])
});

test('can randomly add missing preferences from same programme', () => {
    const testStudents: StudentRow[] = [
        {
            id: "A",
            programme: "P1",
            preference: ["X", "Y", "Z", "M"]
        },
        {
            id: "B",
            rank: 1,
            programme: "P2",
            preference: ["X", "Y"]
        },
        {
            id: "C",
            rank: 1,
            programme: "P2",
            preference: []
        },
    ]

    const testSupervisors: SupervisorRow[] = [
        {
            id: "X",
            preference: [],
            students: [],
            capacity: 1,
            programmes: ["P1"]
        },
        {
            id: "Y",
            preference: [],
            students: [],
            capacity: 1,
            programmes: ["P2"]
        },
        {
            id: "Z",
            preference: [],
            students: [],
            capacity: 1,
            programmes: ["P2"]
        },
        {
            id: "M",
            preference: [],
            students: [],
            capacity: 1,
            programmes: ["P2"]
        },
        {
            id: "N",
            preference: [],
            students: [],
            capacity: 1,
            programmes: ["P3"]
        }
    ]

    randomiseMissingPreferences(testStudents, testSupervisors)
    expect(testStudents[0].preference).toStrictEqual(["X", "Y", "Z", "M"])
    expect(testStudents[1].preference.sort()).toStrictEqual(["X", "Y", "Z", "M"].sort())
    expect(testStudents[2].preference).toStrictEqual([])
});

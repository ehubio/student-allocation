import { expect, test } from 'vitest';
import {solveStudentOptimal} from "../src/components/matching.ts";
import testdata from "./testdata/matching_test.json"
import type {Student, Supervisor} from "../src/components/types.ts";

const createFromDict = (studentPrefs: Map<string, string[]>,
                        supervisorPrefs: Map<string, string[]>,
                        supervisorCapacity: Map<string, number>): [Student[], Supervisor[]] => {
    const studentArray: Student[] = []
    const supervisorArray: Supervisor[] = []

    studentPrefs.forEach((preferences: string[], studentId: string) => {
        studentArray.push({
            id: studentId,
            preference: preferences
        });
    })

    supervisorPrefs.forEach((preferences: string[], supervisorId: string) => {
        const capacity = supervisorCapacity.get(supervisorId)
        if (!capacity) {
            throw new Error(`Can't build supervisors and students, missing capacity for ${supervisorId}`)
        }
        supervisorArray.push({
            id: supervisorId,
            preference: preferences,
            students: [],
            capacity: capacity
        })
    })

    return [studentArray, supervisorArray]
}

const getAllocation = (students: Student[], id: string): string | undefined => {
    return students.find((s: Student) => s.id == id)?.allocation
}

const getStudents = (supervisors: Supervisor[], id: string): string[] | undefined => {
    return supervisors.find((s: Supervisor) => s.id == id)?.students
}

test('matching algorithm super simple', () => {
    const studentPrefs = new Map<string, string[]>([
        ["A", ["X"]],
        ["B", ["Y"]],
    ]);

    const supervisorPrefs = new Map<string, string[]>([
        ["X", ["A", "B"]],
        ["Y", ["A", "B"]],
    ]);

    const supervisorCapacity = new Map<string, number>([
        ["X", 2],
        ["Y", 2],
    ])

    const [students, supervisors] = createFromDict(studentPrefs, supervisorPrefs, supervisorCapacity)

    solveStudentOptimal(students, supervisors, true)
    expect(getAllocation(students, "A")).toBe("X")
    expect(getAllocation(students, "B")).toBe("Y")
    expect(getStudents(supervisors, "X")).toStrictEqual(["A"])
    expect(getStudents(supervisors, "Y")).toStrictEqual(["B"])
})

test('matching algorithm on example', () => {
    const studentPrefs = new Map<string, string[]>([
        ["A", ["C"]],
        ["S", ["C", "M"]],
        ["D", ["C", "M", "G"]],
        ["J", ["C", "G", "M"]],
        ["L", ["M", "C", "G"]],
    ]);

    const supervisorPrefs = new Map<string, string[]>([
        ["M", ["D", "L", "S", "J"]],
        ["C", ["D", "A", "S", "L", "J"]],
        ["G", ["D", "J", "L"]],
    ]);

    const supervisorCapacity = new Map<string, number>([
        ["M", 2],
        ["C", 2],
        ["G", 2],
    ])

    const [students, supervisors] = createFromDict(studentPrefs, supervisorPrefs, supervisorCapacity)

    solveStudentOptimal(students, supervisors, true)

    expect(getAllocation(students, "A")).toBe("C")
    expect(getAllocation(students, "S")).toBe("M")
    expect(getAllocation(students, "D")).toBe("C")
    expect(getAllocation(students, "J")).toBe("G")
    expect(getAllocation(students, "L")).toBe("M")

    expect(getStudents(supervisors, "M")).toStrictEqual(["L", "S"])
    expect(getStudents(supervisors, "C")).toStrictEqual(["D", "A"])
    expect(getStudents(supervisors, "G")).toStrictEqual(["J"])
})

test('matching algorithm on example2', () => {
    const studentPrefs = new Map<string, string[]>([
        ["Group 1", ["Intellectual property", "Privacy"]],
        ["Group 2", ["Privacy", "Fairness in AI"]],
        ["Group 3", ["Privacy", "Social media"]],
    ]);

    const supervisorPrefs = new Map<string, string[]>([
        ["Fairness in AI", ["Group 2"]],
        ["Intellectual property", ["Group 1"]],
        ["Privacy", ["Group 3", "Group 2", "Group 1"]],
        ["Social media", ["Group 3"]],
    ]);

    const supervisorCapacity = new Map<string, number>([
        ["Fairness in AI", 2],
        ["Intellectual property", 2],
        ["Privacy", 2],
        ["Social media", 2],
    ])

    const [students, supervisors] = createFromDict(studentPrefs, supervisorPrefs, supervisorCapacity)

    solveStudentOptimal(students, supervisors, true)

    expect(getStudents(supervisors, "Fairness in AI")).toStrictEqual([])
    expect(getStudents(supervisors, "Intellectual property")).toStrictEqual(["Group 1"])
    expect(getStudents(supervisors, "Privacy")).toStrictEqual(["Group 3", "Group 2"])
    expect(getStudents(supervisors, "Social media")).toStrictEqual([])
})

test('student loses all preferences', () => {
    // Test example forces a resident to be removed
    const studentPrefs = new Map<string, string[]>([
        ["A", ["X"]],
        ["B", ["X", "Y"]],
    ]);

    const supervisorPrefs = new Map<string, string[]>([
        ["X", ["B", "A"]],
        ["Y", ["B"]],
    ]);

    const supervisorCapacity = new Map<string, number>([
        ["X", 1],
        ["Y", 1],
    ])

    const [students, supervisors] = createFromDict(studentPrefs, supervisorPrefs, supervisorCapacity)

    solveStudentOptimal(students, supervisors, true)

    expect(getStudents(supervisors, "X")).toStrictEqual(["B"])
    expect(getStudents(supervisors, "Y")).toStrictEqual([])
})

test('student without preference is ignored', () => {
    const studentPrefs = new Map<string, string[]>([
        ["A", ["X"]],
        ["B", []]
    ])

    const supervisorPrefs = new Map<string, string[]>([
        ["X", ["A", "B"]],
        ["Y", ["A", "B"]]
    ])

    const supervisorCapacity = new Map<string, number>([
        ["X", 2],
        ["Y", 2],
    ])

    const [students, supervisors] = createFromDict(studentPrefs, supervisorPrefs, supervisorCapacity)

    solveStudentOptimal(students, supervisors, true)
    expect(getStudents(supervisors, "X")).toStrictEqual(["A"])
    expect(getStudents(supervisors, "Y")).toStrictEqual([])

    expect(getAllocation(students, "B")).toBeUndefined()
})

test('student prefs used if no supervisor pref set', () => {
    const studentPrefs = new Map<string, string[]>([
        ["A", ["X"]],
        ["B", ["Y"]]
    ])

    const supervisorPrefs = new Map<string, string[]>([
        ["X", ["A", "B"]],
        ["Y", []]
    ])

    const supervisorCapacity = new Map<string, number>([
        ["X", 1],
        ["Y", 1],
    ])

    const [students, supervisors] = createFromDict(studentPrefs, supervisorPrefs, supervisorCapacity)

    solveStudentOptimal(students, supervisors, true)
    expect(getStudents(supervisors, "X")).toStrictEqual(["A"])
    expect(getStudents(supervisors, "Y")).toStrictEqual([])
})

test('student prefs taken into account if present', () => {
    const studentPrefs = new Map<string, string[]>([
        ["A", ["X"]],
        ["B", ["Y"]],
        ["C", ["Y"]],
    ])

    const supervisorPrefs = new Map<string, string[]>([
        ["X", ["A", "B"]],
        ["Y", ["B"]]
    ])

    const supervisorCapacity = new Map<string, number>([
        ["X", 1],
        ["Y", 1],
    ])

    const [students, supervisors] = createFromDict(studentPrefs, supervisorPrefs, supervisorCapacity)

    solveStudentOptimal(students, supervisors, true)
    expect(getStudents(supervisors, "X")).toStrictEqual(["A"])
    expect(getStudents(supervisors, "Y")).toStrictEqual(["B"])
})

const jsonToMap = ((json: any): Map<string, string[]> => {
    const res: Map<string, string[]> = new Map();
    for (const [key, value] of Object.entries(json)) {
        res.set(key, (value as number[]).map(String))
    }
    return res
})

test('large data test runs', () => {
    const studentPrefs = jsonToMap(testdata.residents);
    const supervisorPrefs = jsonToMap(testdata.hospitals);

    const supervisorCapacity: Map<string, number> = new Map();

    for (const [key, _] of supervisorPrefs) {
        supervisorCapacity.set(key, 1);
    }

    const [students, supervisors] = createFromDict(studentPrefs, supervisorPrefs, supervisorCapacity)

    solveStudentOptimal(students, supervisors, true)

    expect(getStudents(supervisors, "0")).toStrictEqual(["0"])
    expect(getStudents(supervisors, "3")).toStrictEqual([])
})

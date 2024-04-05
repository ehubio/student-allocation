import { assert, expect, test } from 'vitest';
import type {Student, Supervisor} from "../src/components/matching.ts";
import {solveStudentOptimal} from "../src/components/matching.ts";
import testdata from "./testdata/matching_test.json"

// Edit an assertion and save to see HMR in action

test('Math.sqrt()', () => {
    expect(Math.sqrt(4)).toBe(2);
    expect(Math.sqrt(144)).toBe(12);
    expect(Math.sqrt(2)).toBe(Math.SQRT2);
});

test('JSON', () => {
    const input = {
        foo: 'hello',
        bar: 'world',
    };

    const output = JSON.stringify(input);

    expect(output).eq('{"foo":"hello","bar":"world"}');
    assert.deepEqual(JSON.parse(output), input, 'matches original');
});

const createFromDict = (students_prefs: Map<string, string[]>,
                        supervisors_prefs: Map<string, string[]>,
                        supervisor_capacity: Map<string, number>): [Student[], Supervisor[]] => {
    const studentArray: Student[] = []
    const supervisorArray: Supervisor[] = []

    students_prefs.forEach((_preferences: string[], studentId: string) => {
        studentArray.push({
            id: studentId,
            preference: [],
            allocation: null
        });
    })

    supervisors_prefs.forEach((_preferences: string[], supervisorId: string) => {
        const capacity = supervisor_capacity.get(supervisorId)
        if (!capacity) {
            throw new Error(`Can't build supervisors and students, missing capacity for ${supervisorId}`)
        }
        supervisorArray.push({
            id: supervisorId,
            preference: [],
            students: [],
            capacity: capacity
        })
    })

    studentArray.forEach((student: Student) => {
        const prefs = students_prefs.get(student.id)!
        student.preference = prefs.map((supervisorId: string) => {
            const supervisor = supervisorArray.find((s: Supervisor) => s.id === supervisorId);
            if (!supervisor) {
                throw new Error(`Can't build supervisors and students, unknown supervisor ${supervisorId} specified for student ${student.id}`)
            }
            return supervisor
        })
    })

    supervisorArray.forEach((supervisor: Supervisor) => {
        const prefs = supervisors_prefs.get(supervisor.id)!
        supervisor.preference = prefs.map((studentId: string) => {
            const student = studentArray.find((s: Student) => s.id === studentId);
            if (!student) {
                throw new Error(`Can't build supervisors and students, unknown student ${studentId} specified for supervisor ${supervisor.id}`)
            }
            return student
        })
    })

    return [studentArray, supervisorArray]
}

const getAllocation = (students: Student[], id: string): string | undefined => {
    return students.find((s: Student) => s.id == id)?.allocation?.id
}

const getStudents = (supervisors: Supervisor[], id: string): string[] | undefined => {
    return supervisors.find((s: Supervisor) => s.id == id)?.students.map((stu: Student) => stu.id)
}

test('matching algorithm super simple', () => {
    const student_prefs = new Map<string, string[]>([
        ["A", ["X"]],
        ["B", ["Y"]],
    ]);

    const supervisor_prefs = new Map<string, string[]>([
        ["X", ["A", "B"]],
        ["Y", ["A", "B"]],
    ]);

    const supervisor_capacity = new Map<string, number>([
        ["X", 2],
        ["Y", 2],
    ])

    const [students, supervisors] = createFromDict(student_prefs, supervisor_prefs, supervisor_capacity)

    solveStudentOptimal(students, supervisors)
    expect(getAllocation(students, "A")).toBe("X")
    expect(getAllocation(students, "B")).toBe("Y")
    expect(getStudents(supervisors, "X")).toStrictEqual(["A"])
    expect(getStudents(supervisors, "Y")).toStrictEqual(["B"])
})

test('matching algorithm on example', () => {
    const student_prefs = new Map<string, string[]>([
        ["A", ["C"]],
        ["S", ["C", "M"]],
        ["D", ["C", "M", "G"]],
        ["J", ["C", "G", "M"]],
        ["L", ["M", "C", "G"]],
    ]);

    const supervisor_prefs = new Map<string, string[]>([
        ["M", ["D", "L", "S", "J"]],
        ["C", ["D", "A", "S", "L", "J"]],
        ["G", ["D", "J", "L"]],
    ]);

    const supervisor_capacity = new Map<string, number>([
        ["M", 2],
        ["C", 2],
        ["G", 2],
    ])

    const [students, supervisors] = createFromDict(student_prefs, supervisor_prefs, supervisor_capacity)

    solveStudentOptimal(students, supervisors)

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
    const student_prefs = new Map<string, string[]>([
        ["Group 1", ["Intellectual property", "Privacy"]],
        ["Group 2", ["Privacy", "Fairness in AI"]],
        ["Group 3", ["Privacy", "Social media"]],
    ]);

    const supervisor_prefs = new Map<string, string[]>([
        ["Fairness in AI", ["Group 2"]],
        ["Intellectual property", ["Group 1"]],
        ["Privacy", ["Group 3", "Group 2", "Group 1"]],
        ["Social media", ["Group 3"]],
    ]);

    const supervisor_capacity = new Map<string, number>([
        ["Fairness in AI", 2],
        ["Intellectual property", 2],
        ["Privacy", 2],
        ["Social media", 2],
    ])

    const [students, supervisors] = createFromDict(student_prefs, supervisor_prefs, supervisor_capacity)

    solveStudentOptimal(students, supervisors)

    expect(getStudents(supervisors, "Fairness in AI")).toStrictEqual([])
    expect(getStudents(supervisors, "Intellectual property")).toStrictEqual(["Group 1"])
    expect(getStudents(supervisors, "Privacy")).toStrictEqual(["Group 3", "Group 2"])
    expect(getStudents(supervisors, "Social media")).toStrictEqual([])
})

test('student loses all preferences', () => {
    // Test example forces a resident to be removed
    const student_prefs = new Map<string, string[]>([
        ["A", ["X"]],
        ["B", ["X", "Y"]],
    ]);

    const supervisor_prefs = new Map<string, string[]>([
        ["X", ["B", "A"]],
        ["Y", ["B"]],
    ]);

    const supervisor_capacity = new Map<string, number>([
        ["X", 1],
        ["Y", 1],
    ])

    const [students, supervisors] = createFromDict(student_prefs, supervisor_prefs, supervisor_capacity)

    solveStudentOptimal(students, supervisors)

    expect(getStudents(supervisors, "X")).toStrictEqual(["B"])
    expect(getStudents(supervisors, "Y")).toStrictEqual([])
})

const jsonToMap = ((json: any): Map<string, string[]> => {
    const res: Map<string, string[]> = new Map();
    for (const [key, value] of Object.entries(json)) {
        res.set(key, (value as number[]).map(String))
    }
    return res
    // const entries = Object.entries(json);
    // const value = entries.map(entry => {
    //     const value = JSON.parse(entry[1])
    //     [entry[0], entry[1].map()]
    // })
})

test('large data test', () => {
    const student_prefs = jsonToMap(testdata.residents);
    const supervisor_prefs = jsonToMap(testdata.hospitals);

    const supervisor_capacity: Map<string, number> = new Map();

    for (const [key, _] of supervisor_prefs) {
        supervisor_capacity.set(key, 1);
    }

    console.log(supervisor_capacity)
    const [students, supervisors] = createFromDict(student_prefs, supervisor_prefs, supervisor_capacity)

    console.log(students)
    console.log(supervisors)

    solveStudentOptimal(students, supervisors)

    expect(getStudents(supervisors, "X")).toStrictEqual(["B"])
    expect(getStudents(supervisors, "Y")).toStrictEqual([])
})

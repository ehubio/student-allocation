import { expect, test } from 'vitest';
import type {StudentRow, SupervisorRow} from "../src/components/types.ts";
import {setSupervisorPreferences} from "../src/components/runAllocation.ts";

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

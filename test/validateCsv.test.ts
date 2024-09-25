import { expect, test } from 'vitest';
import * as Papa from 'papaparse'
import type {StudentRow, SupervisorRow} from "../src/components/student-supervisor/types.ts";
import {studentPrefSchema, supervisorCapacitySchema, validateData} from "../src/components/common/validateCsv.ts";
import student from "./testdata/student.csv?raw"
import studentWithRank from "./testdata/student_with_rank.csv?raw"
import supervisor from "./testdata/supervisor.csv?raw"

const readCsv = (data: string): any[] => {
    let csvData = Papa.parse(data, {
        header: true,
        skipEmptyLines: true,
        transform: function(val: string) {
            return val.trim();
        },
    })
    return csvData.data
}

test('can read valid student csv', () => {
    const data = readCsv(student)

    const {errors, parsedData} = validateData(data, studentPrefSchema)
    expect(errors).toHaveLength(0);

    const studentData = parsedData as StudentRow[]

    expect(studentData).toHaveLength(3);
    expect(studentData[0]).toHaveProperty("id", "A")
    expect(studentData[0]).toHaveProperty("programme", "P1")
    expect(studentData[0]).toHaveProperty("preference", ["W", "X", "Y", "Z"])
    expect(studentData[0]).toHaveProperty("rank", undefined)

    expect(studentData[1]).toHaveProperty("id", "B")
    expect(studentData[1]).toHaveProperty("programme", "P2")
    expect(studentData[1]).toHaveProperty("preference", ["Y", "W", "X"])
    expect(studentData[1]).toHaveProperty("rank", undefined)

    expect(studentData[2]).toHaveProperty("id", "C")
    expect(studentData[2]).toHaveProperty("programme", "P1")
    expect(studentData[2]).toHaveProperty("preference", ["X", "Y", "W", "Z"])
    expect(studentData[2]).toHaveProperty("rank", undefined)
})

test('can read valid student csv with rank', () => {
    const data = readCsv(studentWithRank)

    const {errors, parsedData} = validateData(data, studentPrefSchema)
    expect(errors).toHaveLength(0);

    const studentData = parsedData as StudentRow[]

    expect(studentData).toHaveLength(3);
    expect(studentData[0]).toHaveProperty("id", "A")
    expect(studentData[0]).toHaveProperty("programme", "P1")
    expect(studentData[0]).toHaveProperty("preference", ["W", "X", "Y", "Z"])
    expect(studentData[0]).toHaveProperty("rank", 1)

    expect(studentData[1]).toHaveProperty("id", "B")
    expect(studentData[1]).toHaveProperty("programme", "P2")
    expect(studentData[1]).toHaveProperty("preference", ["Y", "W", "X"])
    expect(studentData[1]).toHaveProperty("rank", 3)

    expect(studentData[2]).toHaveProperty("id", "C")
    expect(studentData[2]).toHaveProperty("programme", "P1")
    expect(studentData[2]).toHaveProperty("preference", ["X", "Y", "W", "Z"])
    expect(studentData[2]).toHaveProperty("rank", 2)
})

test('can read valid supervisor csv', () => {
    const data = readCsv(supervisor)

    const {errors, parsedData} = validateData(data, supervisorCapacitySchema)
    expect(errors).toHaveLength(0);

    const supervisorData = parsedData as SupervisorRow[]

    expect(supervisorData).toHaveLength(4);
    expect(supervisorData[0]).toHaveProperty("id", "W")
    expect(supervisorData[0]).toHaveProperty("capacity", 1)
    expect(supervisorData[0]).toHaveProperty("programmes", ["P1"])
    expect(supervisorData[0]).toHaveProperty("preference", [])
    expect(supervisorData[0]).toHaveProperty("students", [])

    expect(supervisorData[1]).toHaveProperty("id", "X")
    expect(supervisorData[1]).toHaveProperty("capacity", 2)
    expect(supervisorData[1]).toHaveProperty("programmes", ["P2"])
    expect(supervisorData[1]).toHaveProperty("preference", [])
    expect(supervisorData[1]).toHaveProperty("students", [])

    expect(supervisorData[2]).toHaveProperty("id", "Y")
    expect(supervisorData[2]).toHaveProperty("capacity", 1)
    expect(supervisorData[2]).toHaveProperty("programmes", ["P1"])
    expect(supervisorData[2]).toHaveProperty("preference", [])
    expect(supervisorData[2]).toHaveProperty("students", [])

    expect(supervisorData[3]).toHaveProperty("id", "Z")
    expect(supervisorData[3]).toHaveProperty("capacity", 2)
    expect(supervisorData[3]).toHaveProperty("programmes", ["P1"])
    expect(supervisorData[3]).toHaveProperty("preference", [])
    expect(supervisorData[3]).toHaveProperty("students", [])
})

import type {StudentRow} from "./types.ts";
import * as Papa from 'papaparse'

export function studentToCsvString(student: StudentRow[]): string {
    const serializeData = student.map((s: StudentRow) => {
        const out = s as any;
        delete out.programmes;
        delete out.students;
        delete out.preference;
        return out
    })
    return Papa.unparse(serializeData)
}

import type {StudentRow} from "./types.ts";
import * as Papa from 'papaparse'

export function studentToCsvString(student: StudentRow[]): string {
    const serializeData = student.map((s: StudentRow) => {
        return {
            id: s.id,
            programme: s.programme,
            rank: s.rank,
            allocation: s.allocation,
            "first choice": s["first choice"],
            "second choice": s["second choice"],
            "third choice": s["third choice"],
            "fourth choice": s["fourth choice"]
        }
    })
    return Papa.unparse(serializeData)
}

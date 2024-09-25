import type {StudentRow} from "./types.ts";
import * as Papa from 'papaparse'
import type {RoomAllocation} from "../presentation-marking/markerAllocation.ts";

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

export function markerAllocationToCsv(rooms: RoomAllocation): string {
    const rows: string[][] = [];

    // Find the maximum number of rows needed (markers + students)
    const maxRows = Math.max(...rooms.rooms.map(room =>
        Math.max(2, room.students.length + 2) // 2 rows for markers, plus students
    ));

    rooms.rooms.forEach(room => {
        const column: string[] = [];

        // Add the two markers (marker IDs)
        if (room.markers[0]) column.push(room.markers[0].id);
        if (room.markers[1]) column.push(room.markers[1].id);

        // Ensure at least 2 rows are filled for markers (empty strings if less than 2 markers)
        while (column.length < 2) {
            column.push('');
        }

        // Add student IDs below the markers
        room.students.forEach(student => {
            column.push(student.id);
        });

        // Ensure the column has the same number of rows as maxRows (fill empty strings)
        while (column.length < maxRows) {
            column.push('');
        }

        // Add this column to the rows array
        rows.push(column);
    });

    // Transpose the rows array so that it's in the correct format for CSV (rows instead of columns)
    const transposedRows = rows[0].map((_, colIndex) => rows.map(row => row[colIndex]));

    // Generate the headers for the CSV
    const headers = rooms.rooms.map((_, roomIndex) => `Room ${roomIndex + 1}`);

    // Unparse to CSV string using Papa.unparse
    return Papa.unparse({
        fields: headers,
        data: transposedRows
    });
}

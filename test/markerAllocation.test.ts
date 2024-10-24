import {expect, test, describe, vi, beforeEach, afterAll, it} from "vitest";
import {
    type Marker,
    type Student,
    type RoomAllocation,
    scoreRoomAllocation,
    type Scores, allocateRooms, summariseRoomAllocation
} from "../src/components/presentation-marking/markerAllocation.ts";
import emitter from "../src/components/common/eventBus.ts";

test('can mark marker allocation', () => {
    const testScores: Scores = {
        supervisorMarkingStudent: -100,
        sameSupervisor: -20,
        subjectAreaMatchFirst: 5,
        subjectAreaMatchSecond: 2,
        roomSize: 2,
    }
    // Setup where we have
    // 2 students with the same supervisor in 1 room -20
    // 1 room of the right size +2
    // 1 student in each room with expertise same as their markers +10
    const roomAllocation: RoomAllocation = {
        rooms: [
            {
                students: [
                    {
                        id: "student1",
                        expertise: ["blue"],
                        supervisor: "marker1",
                        markerAvoid: ["marker3"]
                    },
                    {
                        id: "student2",
                        expertise: ["yellow"],
                        supervisor: "marker1",
                        markerAvoid: []
                    }
                ],
                markers: [
                    {
                        id: "marker2",
                        expertise: ["green", "blue"],
                        phdStudents: ["marker3"],
                        academic: true
                    }
                ]
            },
            {
                students: [
                    {
                        id: "student3",
                        expertise: ["green"],
                        supervisor: "marker2",
                        markerAvoid: []
                    }
                ],
                markers: [
                    {
                        id: "marker1",
                        expertise: ["green", "blue"],
                        phdStudents: [],
                        academic: true
                    },
                    {
                        id: "marker3",
                        expertise: ["yellow"],
                        phdStudents: [],
                        academic: true
                    }
                ]
            }
        ],
        studentsPerRoom: 3
    }
    const score = scoreRoomAllocation(roomAllocation, testScores)
    expect(score).toBe(8);
});

test("can allocate markers", () => {
    const markers: Marker[] = [
        {
            id: "marker1",
            expertise: ["red"],
            phdStudents: [],
            academic: true
        },
        {
            id: "marker2",
            expertise: ["red"],
            phdStudents: ["marker1"],
            academic: false
        },
        {
            id: "marker3",
            expertise: ["green", "blue"],
            phdStudents: [],
            academic: true
        },
        {
            id: "marker4",
            expertise: ["green", "blue"],
            phdStudents: ["marker3"],
            academic: false
        }
    ];
    const students: Student[] = [
        {
            id: "student1",
            expertise: ["red"],
            supervisor: "marker1",
            markerAvoid: []
        },
        {
            id: "student1",
            expertise: ["red"],
            supervisor: "marker1",
            markerAvoid: []
        },
        {
            id: "student1",
            expertise: ["blue"],
            supervisor: "marker3",
            markerAvoid: []
        },
        {
            id: "student1",
            expertise: ["green"],
            supervisor: "marker3",
            markerAvoid: []
        }
    ]
    const allocated = allocateRooms(markers, students, 2);
    expect(allocated.allocation?.rooms).toHaveLength(2);
})

describe('summarizeRoomAllocation', () => {
    const emitMock = vi.spyOn(emitter, '$emit').mockImplementation(() => {});

    beforeEach(() => {
        // Clear emits between tests
        emitMock.mockClear();
    });

    afterAll(() => {
        // Restore emitter mock after all tests
        emitMock.mockRestore();
    });

    it('should correctly log the summary for room allocation', () => {
        const exampleAllocation: RoomAllocation = {
            rooms: [
                {
                    students: [
                        { id: 's1', expertise: ['AI'], supervisor: 'm1', markerAvoid: [] },
                        { id: 's2', expertise: ['ML'], supervisor: 'm2', markerAvoid: [] },
                        { id: 's3', expertise: ['AI'], supervisor: 'm1', markerAvoid: [] }
                    ],
                    markers: [
                        { id: 'm1', expertise: ['AI'], phdStudents: ['s1', 's3'], academic: true },
                        { id: 'm2', expertise: ['ML', 'Data Science'], phdStudents: ['s2'], academic: false }
                    ]
                },
                {
                    students: [
                        { id: 's4', expertise: ['Cybersecurity'], supervisor: 'm3', markerAvoid: [] },
                        { id: 's5', expertise: ['AI'], supervisor: 'm4', markerAvoid: [] }
                    ],
                    markers: [
                        { id: 'm3', expertise: ['Cybersecurity'], phdStudents: ['s4'], academic: true },
                        { id: 'm4', expertise: ['AI'], phdStudents: ['s5'], academic: true }
                    ]
                }
            ],
            studentsPerRoom: 2
        };

        summariseRoomAllocation(exampleAllocation);

        // Check if the correct logs are output for the first room
        expect(emitMock.mock.calls[0][1]).toStrictEqual("Room 1:");
        expect(emitMock.mock.calls[1][1]).toStrictEqual("  - Number of students: 3");
        expect(emitMock.mock.calls[2][1]).toStrictEqual("  - Number of markers: 1/2 (academic/total)");
        expect(emitMock.mock.calls[3][1]).toStrictEqual("  - Students with their supervisor in the room: 3/3");
        expect(emitMock.mock.calls[4][1]).toStrictEqual("  - Students with the same supervisor: 1");
        expect(emitMock.mock.calls[5][1]).toStrictEqual("  - Expertise covered by at least one marker: 3/3");
        expect(emitMock.mock.calls[6][1]).toStrictEqual("  - Expertise covered by both markers: 0/3");

        // Check logs for second room
        expect(emitMock.mock.calls[8][1]).toStrictEqual("Room 2:");
        expect(emitMock.mock.calls[9][1]).toStrictEqual("  - Number of students: 2");
        expect(emitMock.mock.calls[10][1]).toStrictEqual("  - Number of markers: 2/2 (academic/total)");
        expect(emitMock.mock.calls[11][1]).toStrictEqual("  - Students with their supervisor in the room: 2/2");
        expect(emitMock.mock.calls[12][1]).toStrictEqual("  - Students with the same supervisor: 0");
        expect(emitMock.mock.calls[13][1]).toStrictEqual("  - Expertise covered by at least one marker: 2/2");
        expect(emitMock.mock.calls[14][1]).toStrictEqual("  - Expertise covered by both markers: 0/2");

        // Check overall summary
        expect(emitMock.mock.calls[16][1]).toStrictEqual("Overall Summary:");
        expect(emitMock.mock.calls[17][1]).toStrictEqual("  - Total students: 5");
        expect(emitMock.mock.calls[18][1]).toStrictEqual("  - Total rooms: 2");
        expect(emitMock.mock.calls[19][1]).toStrictEqual("  - Total academic markers: 3");
        expect(emitMock.mock.calls[20][1]).toStrictEqual("  - Total students with their supervisor in the room: 5");
        expect(emitMock.mock.calls[21][1]).toStrictEqual("  - Total students with the same supervisor in the room: 1");
        expect(emitMock.mock.calls[22][1]).toStrictEqual("  - Students whose expertise is covered by at least one marker: 100.00%");
        expect(emitMock.mock.calls[23][1]).toStrictEqual("  - Students whose expertise is covered by both markers: 0.00%");
    });

    it('should handle empty room allocation gracefully', () => {
        const emptyAllocation: RoomAllocation = {
            rooms: [],
            studentsPerRoom: 0
        };

        summariseRoomAllocation(emptyAllocation);

        expect(emitMock.mock.calls[0][1]).toStrictEqual('Overall Summary:');
        expect(emitMock.mock.calls[1][1]).toStrictEqual("  - Total students: 0");
        expect(emitMock.mock.calls[2][1]).toStrictEqual("  - Total rooms: 0");
        expect(emitMock.mock.calls[3][1]).toStrictEqual("  - Total academic markers: 0");
        expect(emitMock.mock.calls[4][1]).toStrictEqual("  - Total students with their supervisor in the room: 0");
        expect(emitMock.mock.calls[5][1]).toStrictEqual("  - Total students with the same supervisor in the room: 0");
        expect(emitMock.mock.calls[6][1]).toStrictEqual("  - Students whose expertise is covered by at least one marker: NaN%");
        expect(emitMock.mock.calls[7][1]).toStrictEqual("  - Students whose expertise is covered by both markers: NaN%");
    });
});

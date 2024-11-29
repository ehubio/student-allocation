import {expect, test, describe, vi, beforeEach, afterAll, it} from "vitest";
import {
    type Marker,
    type Student,
    type RoomAllocation,
    scoreRoomAllocation,
    type Scores, allocateRooms, summariseRoomAllocation, validateInput
} from "../src/components/presentation-marking/markerAllocation.ts";
import emitter from "../src/components/common/eventBus.ts";

test('can mark marker allocation', () => {
    const testScores: Scores = {
        supervisorMarkingStudent: -100,
        sameSupervisor: -20,
        subjectAreaMatchFirst: 5,
        subjectAreaMatchSecond: 2,
        roomSize: 2,
        fixedMarker: 10
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
                        markerAvoid: ["marker3"],
                        marker: [],
                    },
                    {
                        id: "student2",
                        expertise: ["yellow"],
                        supervisor: "marker1",
                        markerAvoid: [],
                        marker: [],
                    }
                ],
                markers: [
                    {
                        id: "marker2",
                        expertise: ["green", "blue"],
                        phdStudents: ["marker3"],
                        academic: true,
                        markWith: null,
                        notMarkWith: null,
                        availableToMark: true,
                    }
                ]
            },
            {
                students: [
                    {
                        id: "student3",
                        expertise: ["green"],
                        supervisor: "marker2",
                        markerAvoid: [],
                        marker: [],
                    }
                ],
                markers: [
                    {
                        id: "marker1",
                        expertise: ["green", "blue"],
                        phdStudents: [],
                        academic: true,
                        markWith: null,
                        notMarkWith: null,
                        availableToMark: true,
                    },
                    {
                        id: "marker3",
                        expertise: ["yellow"],
                        phdStudents: [],
                        academic: true,
                        markWith: null,
                        notMarkWith: null,
                        availableToMark: true,
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
            academic: true,
            markWith: null,
            notMarkWith: null,
            availableToMark: true,
        },
        {
            id: "marker2",
            expertise: ["red"],
            phdStudents: ["marker1"],
            academic: false,
            markWith: null,
            notMarkWith: null,
            availableToMark: true,
        },
        {
            id: "marker3",
            expertise: ["green", "blue"],
            phdStudents: [],
            academic: true,
            markWith: null,
            notMarkWith: null,
            availableToMark: true,
        },
        {
            id: "marker4",
            expertise: ["green", "blue"],
            phdStudents: ["marker3"],
            academic: false,
            markWith: null,
            notMarkWith: null,
            availableToMark: true,
        }
    ];
    const students: Student[] = [
        {
            id: "student1",
            expertise: ["red"],
            supervisor: "marker1",
            markerAvoid: [],
            marker: [],
        },
        {
            id: "student1",
            expertise: ["red"],
            supervisor: "marker1",
            markerAvoid: [],
            marker: [],
        },
        {
            id: "student1",
            expertise: ["blue"],
            supervisor: "marker3",
            markerAvoid: [],
            marker: [],
        },
        {
            id: "student1",
            expertise: ["green"],
            supervisor: "marker3",
            markerAvoid: [],
            marker: [],
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
                        { id: 's1', expertise: ['AI'], supervisor: 'm1', markerAvoid: [], marker: [] },
                        { id: 's2', expertise: ['ML'], supervisor: 'm2', markerAvoid: [], marker: [] },
                        { id: 's3', expertise: ['AI'], supervisor: 'm1', markerAvoid: [], marker: [] }
                    ],
                    markers: [
                        { id: 'm1', expertise: ['AI'], phdStudents: ['s1', 's3'], academic: true, markWith: null, notMarkWith: null, availableToMark: true },
                        { id: 'm2', expertise: ['ML', 'Data Science'], phdStudents: ['s2'], academic: false, markWith: null, notMarkWith: null, availableToMark: true }
                    ]
                },
                {
                    students: [
                        { id: 's4', expertise: ['Cybersecurity'], supervisor: 'm3', markerAvoid: [], marker: [] },
                        { id: 's5', expertise: ['AI'], supervisor: 'm4', markerAvoid: [], marker: [] }
                    ],
                    markers: [
                        { id: 'm3', expertise: ['Cybersecurity'], phdStudents: ['s4'], academic: true, markWith: null, notMarkWith: null, availableToMark: true },
                        { id: 'm4', expertise: ['AI'], phdStudents: ['s5'], academic: true, markWith: null, notMarkWith: null, availableToMark: true }
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


describe("can validate input", () => {
    it('should return error when noOfRooms is 0', () => {
        const markers: Marker[] = [];
        const students: Student[] = [];
        const noOfRooms = 0;

        const errors = validateInput(markers, students, noOfRooms);
        expect(errors).toEqual(['Cannot allocate to fewer than 1 room']);
    });

    it('should return error when there are not enough markers for the number of rooms', () => {
        const markers: Marker[] = [{ id: 'm1', expertise: [], phdStudents: [], academic: true, markWith: null, notMarkWith: null, availableToMark: true }];
        const students: Student[] = [];
        const noOfRooms = 2;

        const errors = validateInput(markers, students, noOfRooms);
        expect(errors).toEqual([
            `Cannot allocate to 2 rooms. Only 1 available marker uploaded. There must be at least 4 markers to allocate 2 per room.`,
        ]);
    });

    it('should return error when marker has "mark with" set to unknown marker', () => {
        const markers: Marker[] = [
            { id: 'm1', expertise: [], phdStudents: [], academic: true, markWith: 'm2', notMarkWith: null, availableToMark: true },
            { id: 'm3', expertise: [], phdStudents: [], academic: true, markWith: null, notMarkWith: null, availableToMark: true },
        ];
        const students: Student[] = [];
        const noOfRooms = 1;

        const errors = validateInput(markers, students, noOfRooms);
        expect(errors).toEqual([
            'Cannot start allocation. Marker m1 has "mark with" set to m2 who is not in the list of markers.',
        ]);
    });

    it('should return error when marker has "mark with" which is not pairwise consistent', () => {
        const markers: Marker[] = [
            { id: 'm1', expertise: [], phdStudents: [], academic: true, markWith: 'm2', notMarkWith: null, availableToMark: true },
            { id: 'm2', expertise: [], phdStudents: [], academic: true, markWith: 'm3', notMarkWith: null, availableToMark: true },
            { id: 'm3', expertise: [], phdStudents: [], academic: true, markWith: 'm1', notMarkWith: null, availableToMark: true },
        ];
        const students: Student[] = [];
        const noOfRooms = 1;

        const errors = validateInput(markers, students, noOfRooms);
        expect(errors).toEqual([
            'Cannot start allocation. Marker m1 has "mark with" set to m2 but marker m2 is configured to mark with m3. They must match or one be empty.',
            'Cannot start allocation. Marker m2 has "mark with" set to m3 but marker m3 is configured to mark with m1. They must match or one be empty.',
            'Cannot start allocation. Marker m3 has "mark with" set to m1 but marker m1 is configured to mark with m2. They must match or one be empty.',
        ]);
    });

    it('should return error when marker has "not mark with" set to unknown markers', () => {
        const markers: Marker[] = [
            { id: 'm1', expertise: [], phdStudents: [], academic: true, markWith: null, notMarkWith: ['m2', 'm3', 'm4'], availableToMark: true },
            { id: 'm4', expertise: [], phdStudents: [], academic: true, markWith: null, notMarkWith: null, availableToMark: true },
        ];
        const students: Student[] = [];
        const noOfRooms = 1;

        const errors = validateInput(markers, students, noOfRooms);
        expect(errors).toEqual([
            `Cannot start allocation. Marker m1 has 'm2', 'm3' as "not mark with" who is not in the list of known markers.`,
        ]);
    });

    it('should return no errors for valid input', () => {
        const markers: Marker[] = [
            { id: 'm1', expertise: [], phdStudents: [], academic: true, markWith: null, notMarkWith: null, availableToMark: true },
            { id: 'm2', expertise: [], phdStudents: [], academic: true, markWith: null, notMarkWith: null, availableToMark: true },
        ];
        const students: Student[] = [];
        const noOfRooms = 1;

        const errors = validateInput(markers, students, noOfRooms);
        expect(errors).toEqual([]);
    });
})

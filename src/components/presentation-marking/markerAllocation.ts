import {sample, shuffle} from 'lodash-es';
import emitter from "../common/eventBus.ts";
import * as Papa from "papaparse";

export type Student = {
    id: string;
    expertise: string[];
    supervisor: string,
    markerAvoid: string[],
    [key: string]: any // Allow additional properties
};

export type Marker = {
    id: string,
    expertise: string[],
    phdStudents: string[],
    academic: boolean,
    [key: string]: any // Allow additional properties
};

type Room = {
    students: Student[],
    markers: Marker[]
};

export type RoomAllocation = {
    rooms: Room[],
    studentsPerRoom: number
};

export interface Result {
    success: boolean
    errors: string[]
    allocation: RoomAllocation | null
}

export type Scores = {
    supervisorMarkingStudent: number,
    sameSupervisor: number,
    subjectAreaMatchFirst: number,
    subjectAreaMatchSecond: number,
    roomSize: number
};

// -ve scores to penalise, +ve for reward
const scores: Scores = {
    supervisorMarkingStudent: -10,
    sameSupervisor: -20,
    subjectAreaMatchFirst: 3,
    subjectAreaMatchSecond: 1,
    roomSize: 5
};

export const allocateRooms = (markers: Marker[], students: Student[], noOfRooms: number): Result => {
    emitter.$emit("progress", "Starting allocation");
    const errors = validateInput(markers, students, noOfRooms);
    if (errors.length > 0) {
        return {
            success: false,
            errors,
            allocation: null
        }
    }
    const initialAllocation = setInitialSolution(markers, students, noOfRooms);
    const opts: AnnealingOptions = {
        initialTemp: 1000,
        alpha: 0.99,
        minTemp: 1,
        iterationsPerTemp: 100
    };
    const res = simulatedAnnealing(initialAllocation, scoreRoomAllocation, shuffleSolution, opts);
    summariseRoomAllocation(res);
    return {
        success: true,
        errors: [],
        allocation: res
    }
};

export const validateInput = (markers: Marker[], students: Student[], noOfRooms: number): string[] => {
    const errors: string[] = [];
    if (noOfRooms <= 0) {
        errors.push("Cannot allocate to fewer than 1 room");
        return errors
    }

    if (markers.length < noOfRooms * 2) {
        errors.push(`Cannot allocate to ${noOfRooms} rooms. Only ${markers.length} markers uploaded. ` +
            `There must be at least ${noOfRooms * 2} markers to allocate 2 per room.`)
        return errors
    }

    const markerExpertises = markers.reduce((expertises: Set<string>, marker: Marker) => {
        marker.expertise.forEach(ex => expertises.add(ex))
        return expertises
    }, new Set<string>());

    const studentExpertises = students.reduce((expertises: Set<string>, student: Student) => {
        expertises.add(student.expertise[0]);
        return expertises
    }, new Set<string>());

    emitter.$emit("progress", `Student expertises: ${Array.from(studentExpertises)}`)
    emitter.$emit("progress", `Marker expertises: ${Array.from(markerExpertises)}`)

    studentExpertises.forEach(expertise => {
        if (!markerExpertises.has(expertise)) {
            errors.push(`Student has unknown expertise '${expertise}', check input data`);
        }
    });
    return errors
}

export const scoreRoomAllocation = (rooms: RoomAllocation, sc: Scores = scores): number => {
    // Classic simulated annealing minimises, so find return -ve here so we can use classic form of
    // annealing algorithm.
    return -(rooms.rooms.reduce((total: number, room: Room) => {
        return total + scoreRoom(room, rooms.studentsPerRoom, sc)
    }, 0));
};

const scoreRoom = (room: Room, targetSize: number, sc: Scores): number => {
    let roomTotal = 0

    // Room size score
    if (Math.abs(room.students.length - targetSize) <= 1) {
        roomTotal += sc.roomSize;
    }

    const markerIds = new Set(room.markers.map(marker => marker.id));
    const supervisorCount = new Map<string, number>();

    room.students.forEach((student: Student) => {
        const noMatchingExpertise = room.markers.reduce((count, marker) => {
            if (marker.expertise.includes(student.expertise[0])) {
                count += 1
            }
            return count
        }, 0);
        if (noMatchingExpertise == 1) {
            roomTotal += sc.subjectAreaMatchFirst
        } else if (noMatchingExpertise == 2) {
            roomTotal += sc.subjectAreaMatchFirst + sc.subjectAreaMatchSecond
        }
        if (markerIds.has(student.supervisor)) {
            roomTotal += sc.supervisorMarkingStudent;
        }

        supervisorCount.set(student.supervisor, (supervisorCount.get(student.supervisor) || 0) + 1);
    })

    // Apply penalty for students with the same supervisor
    supervisorCount.forEach((count) => {
        if (count > 1) {
            roomTotal += sc.sameSupervisor * (count - 1);
        }
    })
    return roomTotal
}

const setInitialSolution = (markers: Marker[], students: Student[], noOfRooms: number): RoomAllocation => {
    const studentsPerRoom = students.length / noOfRooms;
    const rooms: Room[] = Array(noOfRooms).fill(null).map(() => ({ students: [], markers: [] }));

    // Shuffle markers and students for random allocation
    const shuffledMarkers = shuffle(markers);
    const shuffledStudents = shuffle(students);

    // Allocate academic markers first
    const academicMarkers = shuffledMarkers.filter(m => m.academic);
    const nonAcademicMarkers = shuffledMarkers.filter(m => !m.academic);

    for (let i = 0; i < rooms.length; i++) {
        if (academicMarkers.length > 0) {
            rooms[i].markers.push(academicMarkers.pop()!);
        }
    }

    // Allocate remaining markers, do we need to be careful with not putting people with their PhD student here?
    let currentRoom = 0;
    const remainingMarkers = shuffle(nonAcademicMarkers.concat(academicMarkers));
    for (let i = 0; i < rooms.length; i++) {
        if (remainingMarkers.length > 0) {
            rooms[i].markers.push(remainingMarkers.pop()!);
        }
    }

    // Initially distribute students in a round-robin manner
    for (let i = 0; i < shuffledStudents.length; i++) {
        const roomIndex = i % noOfRooms;
        rooms[roomIndex].students.push(shuffledStudents[i]);
    }

    return { rooms, studentsPerRoom };
}

const shuffleSolution = (roomAllocation: RoomAllocation): RoomAllocation => {
    const { rooms, studentsPerRoom } = roomAllocation;
    const newRooms = JSON.parse(JSON.stringify(rooms)) as Room[]; // Deep copy

    const shuffleAction = Math.random() < 0.5 ? 'swapMarkers' : 'moveStudent';

    if (shuffleAction === 'swapMarkers') {
        let canSwap = false;
        let attempt = 0;
        while (!canSwap && attempt < 100) {
            const roomIndices = getTwoRandomIndices(newRooms.length);
            const room1 = newRooms[roomIndices[0]];
            const room2 = newRooms[roomIndices[1]];

            const marker1 = sample(room1.markers);
            const marker2 = sample(room2.markers);

            if (marker1 && marker2) {
                canSwap = canSwapMarkers(room1, room2, marker1, marker2);
                if (canSwap) {
                    swapMarkers(room1, room2, marker1, marker2);
                }
            }
            attempt += 1;
        }
    } else {
        let canSwap = false;
        let attempt = 0;
        while (!canSwap && attempt < 100) {
            const roomIndices = getTwoRandomIndices(newRooms.length);
            const room1 = newRooms[roomIndices[0]];
            const room2 = newRooms[roomIndices[1]];

            const student1 = sample(room1.students);
            const student2 = sample(room2.students);

            if (student1 && student2) {
                canSwap = canSwapStudents(room1, room2, student1, student2);
                if (canSwap) {
                    swapStudents(room1, room2, student1, student2);
                }
            }
            attempt += 1;
        }
    }

    return { rooms: newRooms, studentsPerRoom };
};

function xor(a: any, b: any) {
    return !!a !== !!b;
}

const canSwapMarkers = (room1: Room, room2: Room, marker1: Marker, marker2: Marker): boolean => {
    const room1AcademicCount = room1.markers.filter(m => m.academic).length;
    const room2AcademicCount = room2.markers.filter(m => m.academic).length;

    const wouldViolateAcademicConstraint =
        xor((marker1.academic && room1AcademicCount === 1),
            (marker2.academic && room2AcademicCount === 1));

    const wouldViolatePhdConstraint =
        room1.markers.some(m => m.phdStudents.includes(marker2.id)) ||
        room2.markers.some(m => m.phdStudents.includes(marker1.id));

    const room1Supervisors = room1.students.map(s => s.supervisor);
    const room2Supervisors = room2.students.map(s => s.supervisor);
    const wouldViolateNotMarkingStudentConstraint =
        room1Supervisors.includes(marker2.id) || room2Supervisors.includes(marker1.id);

    const room1MarkerAvoid = room1.students.flatMap(s => s.markerAvoid);
    const room2MarkerAvoid = room2.students.flatMap(s => s.markerAvoid);
    const wouldViolateMarkerAvoidConstraint =
        room1MarkerAvoid.includes(marker2.id) || room2MarkerAvoid.includes(marker1.id)

    return !wouldViolateAcademicConstraint && !wouldViolatePhdConstraint && !wouldViolateNotMarkingStudentConstraint
        && !wouldViolateMarkerAvoidConstraint;
};

const canSwapStudents = (room1: Room, room2: Room, student1: Student, student2: Student): boolean => {

    const room1Markers = room1.markers.map(s => s.id);
    const room2Markers = room2.markers.map(s => s.id);
    const wouldViolateNotMarkingStudentConstraint =
        room1Markers.includes(student2.supervisor) || room2Markers.includes(student1.supervisor);

    const wouldViolateMarkerAvoidConstraint =
        student2.markerAvoid.some(m => room1Markers.includes(m)) ||
        student1.markerAvoid.some(m => room2Markers.includes(m))

    return !wouldViolateNotMarkingStudentConstraint && !wouldViolateMarkerAvoidConstraint;
};

const swapMarkers = (room1: Room, room2: Room, marker1: Marker, marker2: Marker) => {
    room1.markers = room1.markers.filter(m => m !== marker1).concat(marker2);
    room2.markers = room2.markers.filter(m => m !== marker2).concat(marker1);
};

const swapStudents = (room1: Room, room2: Room, student1: Student, student2: Student) => {
    room1.students = room1.students.filter(m => m !== student1).concat(student2);
    room2.students = room2.students.filter(m => m !== student2).concat(student1);
};

const canMoveStudent = (fromRoom: Room, toRoom: Room, student: Student, studentsPerRoom: number): boolean => {
    return fromRoom.students.length > Math.floor(studentsPerRoom * 0.5) &&
        toRoom.students.length < Math.ceil(studentsPerRoom * 1.5) &&
        !toRoom.markers.some(m => m.id === student.supervisor);
};

const moveStudent = (fromRoom: Room, toRoom: Room, student: Student) => {
    fromRoom.students = fromRoom.students.filter(s => s !== student);
    toRoom.students.push(student);
};

const getTwoRandomIndices = (max: number): [number, number] => {
    const first = Math.floor(Math.random() * max);
    let second = (first + 1 + Math.floor(Math.random() * (max - 1))) % max;
    return [first, second];
};

type AnnealingOptions = {
    initialTemp: number,
    alpha: number, // cooling rate
    minTemp: number,
    iterationsPerTemp: number
}

type EnergyFunc<T> = (state: T) => number;
type ProposeMoveFunc<T> = (state: T) => T;

const simulatedAnnealing = <T>(initialState: T, energyFunc: EnergyFunc<T>, proposeMove: ProposeMoveFunc<T>, opts: AnnealingOptions): T => {
    let currentState = initialState;
    let currentEnergy = energyFunc(currentState);
    let temperature = opts.initialTemp;

    while (temperature > opts.minTemp) {
        for (let i = 0; i < opts.iterationsPerTemp; i++) {
            // Generate a new neighboring state
            const newState = proposeMove(currentState);
            const newEnergy = energyFunc(newState);

            // emitter.$emit("progress", `Current allocation got score ${currentEnergy}`);
            // emitter.$emit("progress", `New allocation got score ${newEnergy}`);

            // Calculate energy difference
            const deltaEnergy = newEnergy - currentEnergy;

            // If new state is better, accept it
            if (deltaEnergy < 0) {
                // emitter.$emit("progress", `New state is better, accepting it.`);
                currentState = newState;
                currentEnergy = newEnergy;
            } else {
                // If the new state is worse, accept it with some probability
                const acceptanceProb = Math.exp(-deltaEnergy / temperature);
                if (Math.random() < acceptanceProb) {
                    // emitter.$emit("progress", `New state is worse, accepting it anyway.`);
                    currentState = newState;
                    currentEnergy = newEnergy;
                }
            }
        }

        // Decrease the temperature (cooling)
        temperature *= opts.alpha;
    }

    emitter.$emit("progress", `Final score is ${currentEnergy}.`);
    // Return the final state after annealing
    return currentState;
};

export const summariseRoomAllocation = (allocation: RoomAllocation) => {
    let totalRooms = allocation.rooms.length;

    let totalStudents = 0;
    let totalAcademicMarkers = 0;
    let totalStudentsWithSupervisor = 0;
    let totalStudentsWithSameSupervisor = 0;
    let totalExpertiseCoveredByOne = 0;
    let totalExpertiseCoveredByBoth = 0;

    allocation.rooms.forEach((room, index) => {
        const numStudents = room.students.length;
        totalStudents += numStudents;
        const numMarkers = room.markers.length;

        // 1. Count academic markers
        const academicMarkers = room.markers.filter(marker => marker.academic).length;
        totalAcademicMarkers += academicMarkers;

        // 2. Count students whose supervisor is in the room
        const studentsWithSupervisor = room.students.filter(student =>
            room.markers.some(marker => marker.id === student.supervisor)
        ).length;
        totalStudentsWithSupervisor += studentsWithSupervisor;

        // 3. Count students with the same supervisor in the room
        const supervisorCounts: { [supervisor: string]: number } = {};
        room.students.forEach(student => {
            supervisorCounts[student.supervisor] = (supervisorCounts[student.supervisor] || 0) + 1;
        });
        const studentsWithSameSupervisor = Object.values(supervisorCounts).filter(count => count > 1).length;
        totalStudentsWithSameSupervisor += studentsWithSameSupervisor;

        // 4. Count students whose expertise is covered by at least one marker
        const expertiseCoveredByAtLeastOne = room.students.filter(student =>
            room.markers.some(marker => marker.expertise.includes(student.expertise[0]))
        ).length;
        totalExpertiseCoveredByOne += expertiseCoveredByAtLeastOne;

        // 5. Count students whose expertise is covered by both markers
        const expertiseCoveredByBoth = room.students.filter(student =>
            room.markers.every(marker => marker.expertise.includes(student.expertise[0]))
        ).length;
        totalExpertiseCoveredByBoth += expertiseCoveredByBoth;

        // Output room summary
        emitter.$emit("progress", `Room ${index + 1}:`);
        emitter.$emit("progress", `  - Number of students: ${numStudents}`)
        emitter.$emit("progress", `  - Number of markers: ${academicMarkers}/${numMarkers} (academic/total)`);
        emitter.$emit("progress", `  - Students with their supervisor in the room: ${studentsWithSupervisor}/${numStudents}`);
        emitter.$emit("progress", `  - Students with the same supervisor: ${studentsWithSameSupervisor}`);
        emitter.$emit("progress", `  - Expertise covered by at least one marker: ${expertiseCoveredByAtLeastOne}/${numStudents}`);
        emitter.$emit("progress", `  - Expertise covered by both markers: ${expertiseCoveredByBoth}/${numStudents}`);
        emitter.$emit("progress", '');
    });

    // Overall summary
    emitter.$emit("progress", 'Overall Summary:');
    emitter.$emit("progress", `  - Total students: ${totalStudents}`);
    emitter.$emit("progress", `  - Total rooms: ${totalRooms}`);
    emitter.$emit("progress", `  - Total academic markers: ${totalAcademicMarkers}`);
    emitter.$emit("progress", `  - Total students with their supervisor in the room: ${totalStudentsWithSupervisor}`);
    emitter.$emit("progress", `  - Total students with the same supervisor in the room: ${totalStudentsWithSameSupervisor}`);
    emitter.$emit("progress", `  - Students whose expertise is covered by at least one marker: ${Number(totalExpertiseCoveredByOne*100/totalStudents).toFixed(2)}%`);
    emitter.$emit("progress", `  - Students whose expertise is covered by both markers: ${Number(totalExpertiseCoveredByBoth*100/totalStudents).toFixed(2)}%`);
};


export const scoreLastYear = (fileContent: any, markers: Marker[], students: Student[]) => {
    Papa.parse(fileContent, {
        header: true,
        skipEmptyLines: true,
        transform: function (val: string) {
            return val.trim();
        },
        transformHeader: function (val: string) {
            return val.trim();
        },
        complete: function (results: any) {
            doScoreLastYear(results.data, markers, students);
        }
    });
};

const doScoreLastYear = (data: any, markers: Marker[], students: Student[]) => {
    const allocation = buildRoomAllocation(data, markers, students);
    console.log("last year score is ", scoreRoomAllocation(allocation));

    emitter.$emit("progress", 'Last year:');
    summariseRoomAllocation(allocation);
}

function findMarkerByName(markers: Marker[], name: string): Marker | null {
    const marker = markers.find(m => m.id === name);
    if (!marker) {
        console.log(`Marker not found: ${name}`);
    }
    return marker || null;
}

// Helper function to find a student by name (ID)
function findStudentByName(students: Student[], name: string): Student | null {
    const student = students.find(s => s.id === name);
    if (!student) {
        console.log(`Student not found: ${name}`);
    }
    return student || null;
}

export function buildRoomAllocation(data: any[], markers: Marker[], students: Student[]): RoomAllocation {
    const rooms: Room[] = [];
    const studentsPerRoom = data.length > 0 ? Object.keys(data[0]).length : 0; // Number of rooms per row

    // Iterate over the room data
    for (let roomIndex = 0; roomIndex < studentsPerRoom; roomIndex++) {
        const room: Room = { students: [], markers: [] };

        // 1. Process Markers (from first two rows of data)
        for (let i = 0; i < 2; i++) { // The first two rows are markers
            const markerName = data[i][`Room ${roomIndex + 1}`]; // Example: "Room 1", "Room 2", etc.
            if (markerName) {
                const marker = findMarkerByName(markers, markerName);
                if (marker) {
                    room.markers.push(marker);
                }
            }
        }

        // 2. Process Students (from the remaining rows of data)
        for (let i = 2; i < data.length; i++) { // From row 3 onward, these are students
            const studentName = data[i][`Room ${roomIndex + 1}`];
            if (studentName) {
                const student = findStudentByName(students, studentName);
                if (student) {
                    room.students.push(student);
                }
            }
        }

        // Add the room to the list of rooms
        rooms.push(room);
    }

    // Return the RoomAllocation object
    return {
        rooms,
        studentsPerRoom
    };
}

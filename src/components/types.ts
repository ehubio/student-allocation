export interface Student {
    id: string;
    preference: string[];
    allocation?: string;
}

export interface StudentRow extends Student {
    programme: string;
    rank?: number;
    [key: string]: any; // Allow additional properties
}

export interface Supervisor {
    id: string;
    preference: string[];
    students: string[];
    capacity: number;
}

export interface SupervisorRow extends Supervisor {
    programmes: string[];
    [key: string]: any; // Allow additional properties
}

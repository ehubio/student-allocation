import Ajv from 'ajv';
import type { ValidateFunction } from 'ajv';
import {betterAjvErrors} from '@apideck/better-ajv-errors';
import type { ValidationError } from '@apideck/better-ajv-errors';
import type {StudentRow, SupervisorRow} from "../student-supervisor/types.ts";
import type {Marker, Student} from "../presentation-marking/markerAllocation.ts";

export const studentPrefSchema = {
    type: 'object',
    required: ['id', 'programme', 'first choice', 'second choice', 'third choice', 'fourth choice'],
    additionalProperties: true,
    properties: {
        id: { type: 'string' },
        programme: { type: 'string' },
        rank: { type: 'integer' },
        'first choice': {type: 'string'},
        'second choice': {type: 'string'},
        'third choice': {type: 'string'},
        'fourth choice': {type: 'string'},
        allocation: { type: 'string' }
    }
};

export const supervisorCapacitySchema = {
    type: 'object',
    required: ['id', 'capacity', 'programme 1', 'programme 2', 'programme 3', 'programme 4'],
    additionalProperties: true,
    properties: {
        id: { type: 'string' },
        capacity: { type: 'number' },
        'programme 1': {type: 'string'},
        'programme 2': {type: 'string'},
        'programme 3': {type: 'string'},
        'programme 4': {type: 'string'},
    }
};

export const studentPresentationSchema = {
    type: 'object',
    required: ['id', 'supervisor', 'marker avoid'],
    additionalProperties: true,
    properties: {
        id: { type: 'string' },
        supervisor: { type: 'string' },
        "marker avoid": { type: 'string' }
    }
};

export const markerSchema = {
    type: 'object',
    required: ['id', 'expertise', 'phd students', 'academic'],
    additionalProperties: true,
    properties: {
        id: { type: 'string' },
        expertise: { type: 'string' },
        "phd students": { type: 'string' },
        academic: { type: 'boolean' },
        "mark with": { type: 'string' },
        "not mark with": { type: 'string' },
    }
};

export type InputData = StudentRow[] | SupervisorRow[] | Student[] | Marker[]

/**
 * Validates an array of objects against a JSON schema.
 *
 * @param data - The array of objects to validate.
 * @param schema - The JSON schema to validate against.
 * @returns An array of user-friendly error messages if validation fails, otherwise an empty array.
 */
export function validateData<T extends { [key: string]: any }>(data: InputData, schema: object): { errors: ValidationError[]; parsedData: T[] } {
    // TODO: tidy this up a bit, split supervisor and student parts
    const ajv = new Ajv({ allErrors: true });
    const validate: ValidateFunction = ajv.compile(schema);

    const errors: ValidationError[] = [];
    const parsedData: T[] = [];
    const preferenceKeys = ['first choice', 'second choice', 'third choice', 'fourth choice']
    const programmeKeys = ['programme 1', 'programme 2', 'programme 3', 'programme 4']

    data.forEach((obj: StudentRow | SupervisorRow | Student | Marker) => {
        if ("rank" in obj) {
            obj.rank = parseInt(obj.rank)
        } else {
            obj.rank = undefined
        }
        if ("capacity" in obj) {
            obj.capacity = parseInt(obj.capacity)
        }
        if ("academic" in obj) {
            obj.academic = toBoolean(obj.academic)
        }
        const valid = validate(obj);
        if (valid) {
            const parsedObj: any = { ...obj };
            parsedObj.preference = [];
            parsedObj.students = [];

            // Parse choices into an array
            const preferences: string[] = [];
            for (const preference of preferenceKeys) {
                if (preference in obj && obj[preference]) {
                    preferences.push(obj[preference]);
                }
            }
            parsedObj.preference = preferences;

            // Parse programmes into an array
            const programmes: string[] = [];
            for (const programme of programmeKeys) {
                if (programme in obj && obj[programme]) {
                    programmes.push(obj[programme]);
                }
            }
            parsedObj.programmes = programmes;

            // Parse phd students into an array
            if ("phd students" in obj) {
                parsedObj.phdStudents = obj["phd students"] ?
                    obj["phd students"].split(";").map((s: string) => s.trim()) : [];
            }

            // Parse expertise into an array
            if ("expertise" in obj) {
                parsedObj.expertise = obj.expertise.split(";").map((s: string) => s.trim());
            }

            // Parse marker avoid into an array
            if ("marker avoid" in obj) {
                parsedObj.markerAvoid = obj["marker avoid"] ?
                    obj["marker avoid"].split(";").map((s: string) => s.trim()) : [];
            }

            // Parse not mark with into an array
            if ("not mark with" in obj) {
                parsedObj.notMarkWith = obj["not mark with"] ?
                    obj["not mark with"].split(";").map((s: string) => s.trim()) : [];
            }

            if ("mark with" in obj) {
                parsedObj.markWith = obj["mark with"] === "" ? null : obj["mark with"];
            }

            parsedData.push(parsedObj as T);
        } else {
            const betterError = betterAjvErrors({ schema, data, errors: validate.errors });
            errors.push(...betterError);
        }
    });

    return { errors: removeDuplicates(errors), parsedData };
}

const removeDuplicates = (errors: ValidationError[]) => {
    const uniqueErrors = new Map<string, ValidationError>();

    for (const error of errors) {
        const key = `${error.message}:${error.path}`;
        if (!uniqueErrors.has(key)) {
            uniqueErrors.set(key, error);
        }
    }

    return Array.from(uniqueErrors.values());
};

function toBoolean(value: string) {
    switch(value) {
        case "true":
        case "1":
        case "on":
        case "yes":
            return true;
        default:
            return false;
    }
}

import Ajv from 'ajv';
import type { ValidateFunction } from 'ajv';
import {betterAjvErrors} from '@apideck/better-ajv-errors';
import type { ValidationError } from '@apideck/better-ajv-errors';
import type {StudentRow, SupervisorRow} from "./types.ts";

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
}

export type InputData = StudentRow[] | SupervisorRow[]

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

    data.forEach((obj: StudentRow | SupervisorRow) => {
        if ("rank" in obj) {
            obj.rank = parseInt(obj.rank)
        } else {
            obj.rank = undefined
        }
        if ("capacity" in obj) {
            obj.capacity = parseInt(obj.capacity)
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

            parsedData.push(parsedObj as T);
        } else {
            console.log("valid", validate.errors)
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

import Ajv from 'ajv';
import type { ValidateFunction } from 'ajv';
import {betterAjvErrors} from '@apideck/better-ajv-errors';
import type { ValidationError } from '@apideck/better-ajv-errors';

export interface StudentPreference {
    id: string;
    programme: string;
    choices: string[];
    rank: number;
    [key: string]: any; // Allow additional properties
}

export interface StudentAllocation extends StudentPreference {
    allocatedSupervisor: string;
}

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

export interface SupervisorCapacity {
    id: string;
    capacity: string;
    programmes: string[];
    preferences?: string[];
    [key: string]: any; // Allow additional properties
}

export const supervisorCapacitySchema = {
    type: 'object',
    required: ['id', 'capacity', 'programme'],
    additionalProperties: true,
    properties: {
        id: { type: 'string' },
        capacity: { type: 'number' },
        programme: {type: 'string'}
    }
}

export type InputData = StudentPreference[] | SupervisorCapacity[]

/**
 * Validates an array of objects against a JSON schema.
 *
 * @param data - The array of objects to validate.
 * @param schema - The JSON schema to validate against.
 * @returns An array of user-friendly error messages if validation fails, otherwise an empty array.
 */
export function validateData<T extends { [key: string]: any }>(data: InputData, schema: object): { errors: ValidationError[]; parsedData: T[] } {
    const ajv = new Ajv({ allErrors: true });
    const validate: ValidateFunction = ajv.compile(schema);

    const errors: ValidationError[] = [];
    const parsedData: T[] = [];
    const choiceKeys = ['first choice', 'second choice', 'third choice', 'fourth choice']

    data.forEach((obj: StudentPreference | SupervisorCapacity) => {
        const valid = validate(obj);
        if (valid) {
            const parsedObj: any = { ...obj };

            // Parse choices into an array
            const choices: string[] = [];
            for (const choice of choiceKeys) {
                if (choice in obj && obj[choice]) {
                    choices.push(obj[choice]);
                }
            }
            parsedObj.choices = choices;

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

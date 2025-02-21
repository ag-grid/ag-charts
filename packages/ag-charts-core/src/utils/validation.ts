import { joinFormatted, levenshteinDistance, stringifyValue } from './strings';
import { isArray, isBoolean, isDate, isFiniteNumber, isFunction, isObject, isString, isValidDate } from './typeGuards';

const descriptionSymbol = Symbol('description');
const requiredSymbol = Symbol('required');

type ObjectLikeDef<T> = T extends object ? (keyof T extends never ? never : OptionsDefs<T>) : never;

type Singular<T> = T extends any[] ? T[number] : T;

// Definitions for options validation with support for nested structures.
export type OptionsDefs<T> = { [K in keyof Singular<T>]-?: Validator | ObjectLikeDef<Singular<T>[K]> } & {
    [descriptionSymbol]?: string;
    [requiredSymbol]?: boolean;
};

// Validator interface with optional description and required flag for better error messages.
export interface Validator extends Function {
    (value: unknown, context?: any): boolean;
    [descriptionSymbol]?: string;
    [requiredSymbol]?: boolean;
}

export interface ValidationResult<T> {
    valid: Partial<T> | null;
    errors: ValidationError[];
}

export class ValidationError {
    constructor(
        public message: string,
        public required?: boolean,
        public unknown?: boolean
    ) {}

    toString() {
        return this.message;
    }
}

/**
 * Validates the provided options against the specified definitions.
 * @param options The options object to validate.
 * @param optionsDefs The definitions against which to validate the options.
 * @param path The current path in the options object, for nested properties.
 * @returns An object containing valid options and validation errors.
 */
export function validate<T>(options: unknown, optionsDefs: OptionsDefs<T>, path = ''): ValidationResult<T> {
    if (!isObject(options)) {
        const message = validateMessage(path, options, 'an object', true);
        return { valid: null, errors: [new ValidationError(message)] };
    }

    const unusedKeys = [];
    const optionsKeys = new Set(Object.keys(options));
    const errors: ValidationError[] = [];
    const valid: Partial<T> = {};

    function extendPath(key: string) {
        if (isArray(optionsDefs)) {
            return `${path}[${key}]`;
        }
        return path ? `${path}.${key}` : key;
    }

    for (const key of Object.keys(optionsDefs)) {
        const validatorOrDefs: Validator | ObjectLikeDef<any> = (optionsDefs as any)[key];
        const value = options[key as keyof object];
        const required = validatorOrDefs[requiredSymbol];

        optionsKeys.delete(key);
        if (!required && typeof value === 'undefined') {
            unusedKeys.push(key);
            continue;
        }

        if (isFunction(validatorOrDefs)) {
            if (validatorOrDefs(value, options)) {
                valid[key as keyof T] = value;
            } else {
                const message = validateMessage(extendPath(key), value, validatorOrDefs, required);
                errors.push(new ValidationError(message, required));
            }
        } else {
            const nestedResult = validate(value, validatorOrDefs, extendPath(key));
            valid[key as keyof T] = nestedResult.valid as any;
            errors.push(...nestedResult.errors);
        }
    }

    for (const key of optionsKeys) {
        const value = options[key as keyof object];
        if (typeof value === 'undefined') continue;
        const match = findSuggestion(key, unusedKeys);
        const postfix = match ? `; Did you mean \`${match}\`? Ignoring.` : ', ignoring.';
        const message = `Unknown option \`${extendPath(key)}\`${postfix}`;
        errors.push(new ValidationError(message, undefined, true));
    }

    return { valid, errors };
}

/**
 * Finds the closest matching suggestion from a list based on Levenshtein distance.
 *
 * @param {string} value - The input string to compare against suggestions.
 * @param {string[]} suggestions - The list of possible suggestions.
 * @param {number} [maxDistance=2] - The maximum allowed Levenshtein distance for a match.
 * @returns {string | null} - The closest matching suggestion within the allowed distance, or null if none are found.
 */
function findSuggestion(value: string, suggestions: string[], maxDistance: number = 2): string | null {
    let smallestDistance = Infinity;
    return suggestions.reduce<string | null>((res, item) => {
        const d = levenshteinDistance(value, item);
        if (smallestDistance > d && d <= maxDistance) {
            smallestDistance = d;
            return item;
        }
        return res;
    }, null);
}

/**
 * Generates a validation error message based on the path, value, and expected type.
 * @param path The path to the option.
 * @param value The invalid value.
 * @param validatorOrDefs The expected type or validator.
 * @param required
 * @returns A formatted error message.
 */
function validateMessage(
    path: string,
    value: unknown,
    validatorOrDefs: Validator | OptionsDefs<any> | string,
    required?: boolean
): string {
    const description = isString(validatorOrDefs) ? validatorOrDefs : validatorOrDefs[descriptionSymbol];
    const expecting = description ? `; expecting ${description}` : '';
    const prefix = path ? `Option \`${path}\`` : 'Value';
    return required && value == null
        ? `${prefix} is required and has not been provided${expecting}, ignoring.`
        : `${prefix} cannot be set to \`${stringifyValue(value, 50)}\`${expecting}, ignoring.`;
}

/**
 * Attaches a descriptive message to a validator function.
 * @param validator The validator function to which to attach a description.
 * @param description The description to attach.
 * @returns A new validator function with the attached description.
 */
export function attachDescription(validator: Validator, description: string): Validator {
    return Object.assign((value: unknown, context: any) => validator(value, context), {
        [descriptionSymbol]: description,
    });
}

/**
 * Marks a validator or option definitions object as required.
 * @param validatorOrDefs The validator or option definitions to mark as required.
 * @returns The modified validator or option definitions, marked as required.
 */
export function required<T extends OptionsDefs<any>>(validatorOrDefs: T): T;
export function required<T extends OptionsDefs<any>[]>(validatorOrDefs: T): T;
export function required(validatorOrDefs: Validator): Validator;
export function required<T>(validatorOrDefs: T): T {
    return Object.assign(
        isFunction(validatorOrDefs)
            ? (value: unknown, context: any) => validatorOrDefs(value, context)
            : optionsDefs(validatorOrDefs as OptionsDefs<any>),
        { [requiredSymbol]: true }
    ) as T;
}

/**
 * Creates a validator for ensuring an object matches the provided option definitions.
 * @param defs The option definitions against which to validate an object.
 * @param description (Optional) A description for the validator, defaulting to 'an object'.
 * @returns A validator function for the given option definitions.
 */
export const optionsDefs = <T>(defs: OptionsDefs<T>, description = 'an object'): Validator =>
    attachDescription(
        (value) =>
            isObject(value) &&
            Object.keys(defs).every((key) => {
                const validatorOrDefs: Validator | ObjectLikeDef<any> = (defs as any)[key];
                if (!validatorOrDefs[requiredSymbol] && typeof value[key] === 'undefined') return true;
                const validator = isFunction(validatorOrDefs) ? validatorOrDefs : optionsDefs(validatorOrDefs);
                return validator(value[key], value);
            }),
        description
    );

/**
 * Combines multiple validators, requiring all to pass.
 * @param validators An array of validators to combine.
 * @returns A validator that requires all specified validators to pass.
 */
export const and = (...validators: Validator[]) =>
    attachDescription(
        (value, context) => validators.every((validator) => validator(value, context)),
        validators
            .map((v) => v[descriptionSymbol])
            .filter(Boolean)
            .join(' and ')
    );

/**
 * Combines multiple validators, passing if any one of them does.
 * @param validators An array of validators to combine.
 * @returns A validator that passes if any one of the specified validators does.
 */
export const or = (...validators: Validator[]) =>
    attachDescription(
        (value, context) => validators.some((validator) => validator(value, context)),
        validators
            .map((v) => v[descriptionSymbol])
            .filter(Boolean)
            .join(' or ')
    );

// Base type validators with descriptions.
export const array = attachDescription(isArray, 'an array');
export const boolean = attachDescription(isBoolean, 'a boolean');
export const callback = attachDescription(isFunction, 'a function');
export const number = attachDescription(isFiniteNumber, 'a number');
export const object = attachDescription(isObject, 'an object');
export const string = attachDescription(isString, 'a string');
export const date = attachDescription(
    (value) => isDate(value) || ((isFiniteNumber(value) || isString(value)) && isValidDate(new Date(value))),
    'a date'
);

// Numeric type validators with specific conditions.
const numberMin = (min: number, inclusive = true) =>
    attachDescription(
        (value) => isFiniteNumber(value) && (value > min || (inclusive && value === min)),
        `a number greater than ${inclusive ? 'or equal to ' : ''}${min}`
    );

const numberRange = (min: number, max: number) =>
    attachDescription(
        (value) => isFiniteNumber(value) && value >= min && value <= max,
        `a number between ${min} and ${max} inclusive`
    );

export const positiveNumber = numberMin(0);

export const ratio = numberRange(0, 1);

const isComparable = (value: unknown): value is number | Date => isFiniteNumber(value) || isValidDate(value);

export const lessThan = (otherField: string) =>
    attachDescription(
        (value, context) => !isComparable(value) || !isComparable(context[otherField]) || value < context[otherField],
        `to be less than ${otherField}`
    );

export const greaterThan = (otherField: string) =>
    attachDescription(
        (value, context) => !isComparable(value) || !isComparable(context[otherField]) || value > context[otherField],
        `to be greater than ${otherField}`
    );

/**
 * Creates a validator for a union of allowed values.
 * @param allowed An array of allowed values.
 * @returns A validator function that checks if a value is among the allowed ones.
 */
export function union(allowed: object): Validator;
export function union(...allowed: any[]): Validator;
export function union(...allowed: any[]) {
    if (isObject(allowed[0])) {
        allowed = Object.values(allowed[0]);
    }
    const keywords = joinFormatted(allowed, 'or', (value) => `'${value}'`, 6);
    return attachDescription((value) => allowed.includes(value), `a keyword such as ${keywords}`);
}

/**
 * Creates a validator for a single constant value.
 * @param allowed The allowed constant value.
 * @returns A validator function that checks for equality with the allowed value.
 */
export const constant = (allowed: boolean | number | string) =>
    attachDescription((value) => allowed === value, `the value ${JSON.stringify(allowed)}`);

/**
 * Creates a validator for instances of a specific class.
 * @param instanceType The constructor of the class to check instances against.
 * @param description An optional description string.
 * @returns A validator function that checks if a value is an instance of the specified class.
 */
export const instanceOf = (instanceType: Function, description?: string) =>
    attachDescription((value) => value instanceof instanceType, description ?? `an instance of ${instanceType.name}`);

/**
 * Creates a validator for arrays where every element must pass a given validator.
 * @param validator The validator to apply to each array element.
 * @param description An optional description string.
 * @returns A validator function for arrays with elements validated by the specified validator.
 */
export const arrayOf = (validator: Validator, description?: string) =>
    attachDescription(
        (value, context) => isArray(value) && value.every((v) => validator(v, context)),
        description ?? `${validator[descriptionSymbol]} array`
    );

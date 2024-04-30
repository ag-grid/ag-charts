import { Logger } from '../../util/logger';
import { isArray, isBoolean, isFiniteNumber, isFunction, isObject, isString } from '../../util/type-guards';
import { joinFormatted } from './string.util';

const descriptionSymbol = Symbol('description');
const requiredSymbol = Symbol('required');

type ObjectLikeDef<T> = T extends object ? (keyof T extends never ? never : OptionsDefs<T>) : never;

// Definitions for options validation with support for nested structures.
export type OptionsDefs<T> = { [K in keyof T]-?: Validator | ObjectLikeDef<T[K]> } & {
    [descriptionSymbol]?: string;
    [requiredSymbol]?: boolean;
};

// Validator interface with optional description and required flag for better error messages.
export interface Validator extends Function {
    (value: unknown): boolean;
    [descriptionSymbol]?: string;
    [requiredSymbol]?: boolean;
}

export interface ValidationError {
    key: string;
    path: string;
    message: string;
    unknown?: boolean;
    value?: any;
}

/**
 * Validates the provided options object against the specified options definitions. Logs warnings for any invalid options encountered.
 * @param options The options object to validate.
 * @param optionsDefs The definitions against which to validate the options.
 * @param path (Optional) The current path in the options object, for nested properties.
 * @returns A boolean indicating whether the options are valid.
 */
export function isValid<T extends object>(options: T, optionsDefs: OptionsDefs<T>, path?: string) {
    const errors = validate(options, optionsDefs, path);
    for (const { message } of errors) {
        Logger.warn(message);
    }
    return errors.length > 0;
}

export function validate<T extends object>(options: T, optionsDefs: OptionsDefs<T>, path = '') {
    const extendPath = (key: string) => (isArray(optionsDefs) ? `${path}[${key}]` : path ? `${path}.${key}` : key);
    const optionsKeys = new Set(Object.keys(options));
    const errors: ValidationError[] = [];

    for (const [key, validatorOrDefs] of Object.entries<Validator | ObjectLikeDef<any>>(optionsDefs)) {
        optionsKeys.delete(key);
        const value = options[key as keyof T];
        if (!validatorOrDefs[requiredSymbol] && typeof value === 'undefined') continue;
        if (isFunction(validatorOrDefs)) {
            if (validatorOrDefs(value)) continue;

            let description = validatorOrDefs[descriptionSymbol];
            description = description ? `; expecting ${description}` : '';

            errors.push({
                key,
                path,
                value,
                message: `Option ${extendPath(key)} cannot be set to [${stringifyValue(value)}]${description}, ignoring.`,
            });
        } else {
            errors.push(...validate(value, validatorOrDefs, extendPath(key)));
        }
    }

    for (const key of optionsKeys) {
        errors.push({
            key,
            path,
            unknown: true,
            message: `Unknown option ${extendPath(key)}, ignoring.`,
        });
    }

    return errors;
}

export function stringifyValue(value: any, maxLength = Infinity): string {
    if (typeof value === 'number') {
        if (isNaN(value)) return 'NaN';
        if (value === Infinity) return 'Infinity';
        if (value === -Infinity) return '-Infinity';
    }
    value = JSON.stringify(value);
    if (value.length > maxLength) {
        return `${value.slice(0, maxLength)}... (+${value.length - maxLength} characters)`;
    }
    return value;
}

/**
 * Attaches a descriptive message to a validator function.
 * @param validator The validator function to which to attach a description.
 * @param description The description to attach.
 * @returns A new validator function with the attached description.
 */
export function attachDescription(validator: Validator, description: string): Validator {
    return Object.assign((value: unknown) => validator(value), { [descriptionSymbol]: description });
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
            ? (value: any) => (validatorOrDefs as Function)(value)
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
        (value: unknown) =>
            isObject(value) &&
            Object.entries<Validator | ObjectLikeDef<any>>(defs).every(([key, validatorOrDefs]) =>
                isFunction(validatorOrDefs) ? validatorOrDefs(value[key]) : optionsDefs(validatorOrDefs)
            ),
        description
    );

/**
 * Combines multiple validators, requiring all to pass.
 * @param validators An array of validators to combine.
 * @returns A validator that requires all specified validators to pass.
 */
export const and = (...validators: Validator[]) =>
    attachDescription(
        (value: unknown) => validators.every((validator) => validator(value)),
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
        (value: unknown) => validators.some((validator) => validator(value)),
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

// Numeric type validators with specific conditions.
export const numberMin = (min: number, inclusive = true) =>
    attachDescription(
        (value) => isFiniteNumber(value) && (value > min || (inclusive && value === min)),
        `a number greater than ${inclusive ? 'or equal to ' : ''}${min}`
    );
export const numberMax = (max: number, inclusive = true) =>
    attachDescription(
        (value) => isFiniteNumber(value) && (value < max || (inclusive && value === max)),
        `a number less than ${inclusive ? 'or equal to ' : ''}${max}`
    );
export const numberRange = (min: number, max: number) =>
    attachDescription(
        (value) => isFiniteNumber(value) && value >= min && value <= max,
        `a number between ${min} and ${max} inclusive`
    );

export const positiveNumber = numberMin(0);
export const minOneNumber = numberMin(1);
export const ratio = numberRange(0, 1);
export const degree = numberRange(0, 360);

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
    return attachDescription((value: any) => allowed.includes(value), `a keyword such as ${keywords}`);
}

/**
 * Creates a validator for a single constant value.
 * @param allowed The allowed constant value.
 * @returns A validator function that checks for equality with the allowed value.
 */
export const constant = (allowed: boolean | number | string) =>
    attachDescription((value: any) => allowed === value, `the value ${JSON.stringify(allowed)}`);

/**
 * Creates a validator for instances of a specific class.
 * @param instanceType The constructor of the class to check instances against.
 * @returns A validator function that checks if a value is an instance of the specified class.
 */
export const instanceOf = (instanceType: Function) =>
    attachDescription((value) => value instanceof instanceType, `an instance of ${instanceType.name}`);

/**
 * Creates a validator for arrays where every element must pass a given validator.
 * @param validator The validator to apply to each array element.
 * @returns A validator function for arrays with elements validated by the specified validator.
 */
export const arrayOf = (validator: Validator) =>
    attachDescription(
        (value: unknown) => isArray(value) && value.every(validator),
        `${validator[descriptionSymbol]} array`
    );

import { Logger } from '../../util/logger';
import { isArray, isBoolean, isFiniteNumber, isFunction, isObject, isString } from '../../util/type-guards';
import { stringify } from '../../util/validation';
import { joinFormatted } from './string';

const descriptionSymbol = Symbol('description');
const requiredSymbol = Symbol('required');

type ObjectLikeDef<T> = T extends object ? (keyof T extends never ? never : OptionsDefs<T>) : never;

// Definitions for options validation with support for nested structures.
export type OptionsDefs<T> = { [K in keyof T]-?: Validator | ObjectLikeDef<T[K]> };

// Validator interface with optional description and required flag for better error messages.
export interface Validator extends Function {
    (value: unknown): boolean;
    [descriptionSymbol]?: string;
    [requiredSymbol]?: boolean;
}

/**
 * Validates the provided options object against the specified options definitions. Logs warnings for any invalid options encountered.
 * @param options The options object to validate.
 * @param optionsDefs The definitions against which to validate the options.
 * @param path (Optional) The current path in the options object, for nested properties.
 * @returns A boolean indicating whether the options are valid.
 */
export function validation<T>(options: T, optionsDefs: OptionsDefs<T>, path = '') {
    const extendPath = (key: string) => (isArray(optionsDefs) ? `${path}[${key}]` : `${path}.${key}`);
    for (const [key, validatorOrDefs] of Object.entries<Validator | ObjectLikeDef<any>>(optionsDefs)) {
        const value = options[key as keyof T];
        if (isFunction(validatorOrDefs)) {
            if (validatorOrDefs(value)) continue;

            let description = validatorOrDefs[descriptionSymbol];
            description = description ? `; expecting ${description}` : '';

            Logger.warn(
                `Option \`${extendPath(key)}\` cannot be set to [${stringify(value)}]${description}, ignoring.`
            );

            return false;
        } else if (!validation(value, validatorOrDefs, extendPath(key))) {
            return false;
        }
    }
    return true;
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
export const positiveNumber = attachDescription((value) => isFiniteNumber(value) && value >= 0, 'a positive number');
export const ratio = attachDescription(
    (value) => isFiniteNumber(value) && value >= 0 && value <= 1,
    'a number between 0 and 1 inclusive'
);

/**
 * Creates a validator for a union of allowed values.
 * @param allowed An array of allowed values.
 * @returns A validator function that checks if a value is among the allowed ones.
 */
export const union = (...allowed: any[]) =>
    attachDescription(
        (value: any) => allowed.includes(value),
        `a keyword such as ${joinFormatted(allowed, 'or', (value) => `'${value}'`)}`
    );

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

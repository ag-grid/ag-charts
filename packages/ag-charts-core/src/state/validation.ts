import { warnOnce } from '../logging/logger';
import type { AreExact, IsUnion } from '../types/global';
import { joinFormatted, levenshteinDistance, stringifyValue } from '../utils/data/strings';
import { safeCall } from '../utils/functions';
import {
    isArray,
    isBoolean,
    isColor,
    isDate,
    isDefined,
    isFiniteNumber,
    isFunction,
    isObject,
    isString,
    isValidDate,
} from '../utils/types/typeGuards';

const descriptionSymbol = Symbol('description');
const requiredSymbol = Symbol('required');
const markedSymbol = Symbol('marked');
const undocumentedSymbol = Symbol('undocumented');
export const unionSymbol = Symbol('union');

const similarOptionsMap = [
    ['placement', 'position'],
    ['padding', 'spacing', 'gap'],
    ['color', 'fill', 'stroke'],
    ['whisker', 'wick'],
    ['nodeClick', 'seriesNodeClick'],
    ['nodeDoubleClick', 'seriesNodeDoubleClick'],
    ['src', 'url'],
].reduce((map, words) => {
    for (const word of words) {
        map.set(word.toLowerCase(), new Set(words.filter((w) => w !== word)));
    }
    return map;
}, new Map<string, Set<string>>());

type ObjectLikeDef<T> =
    IsUnion<NonNullable<T>> extends true
        ? OptionsDefs<Exclude<T, undefined>>
        : T extends object
          ? keyof T extends never
              ? never
              : OptionsDefs<T>
          : never;

type Singular<T> = T extends any[] ? T[number] : T;

type PrivateSymbols = {
    [descriptionSymbol]?: string;
    [requiredSymbol]?: boolean;
    [undocumentedSymbol]?: boolean;
    [unionSymbol]?: string;
};

// Definitions for options validation with support for nested structures.
export type OptionsDefs<T> = { [K in keyof Singular<T>]-?: Validator | ObjectLikeDef<Singular<T>[K]> } & PrivateSymbols;

export type TypeUnionDefs<T, K extends string | number | symbol> = {
    [P in K]: OptionsDefs<Omit<Extract<T, { type: P }>, 'type'>>;
};

export interface ValidationResult<T> {
    cleared: Partial<T> | null;
    invalid: ValidationError[];
}

export interface ValidatorResult extends ValidationResult<any> {
    valid: boolean;
}

export interface ValidatorContext {
    path: string;
    options: any;
}

export enum ErrorType {
    // Enterprise = 'enterprise',
    Invalid = 'invalid',
    Required = 'required',
    Unknown = 'unknown',
}

// Validator interface with optional description and required flag for better error messages.
export interface Validator extends Function, PrivateSymbols {
    (value: unknown, context: ValidatorContext): ValidatorResult | boolean;
}

function extendPath(path: string, key: string | number) {
    if (isFiniteNumber(key)) {
        return `${path}[${key}]`;
    }
    return path ? `${path}.${key}` : key;
}

export class ValidationError {
    protected altPath?: string;

    constructor(
        public readonly type: ErrorType | `${ErrorType}`,
        public readonly description: string | undefined,
        public readonly value: any,
        public readonly path: string,
        public readonly key?: string
    ) {}

    setUnionType(unionType: string, path: string) {
        if (this.path.startsWith(path)) {
            const suffix = this.path.slice(path.length);
            this.altPath = `${path}[type=${unionType}]${suffix}`;
        }
    }

    getPrefix(): string {
        const { altPath: path = this.path, key } = this;
        if (!path && !key) return 'Value';
        return `Option \`${key ? extendPath(path, key) : path}\``;
    }

    toString() {
        const { description = 'unknown', type, value } = this;
        if (type === ErrorType.Required && value == null) {
            return `${this.getPrefix()} is required and has not been provided; expecting ${description}, ignoring.`;
        }
        return `${this.getPrefix()} cannot be set to \`${stringifyValue(value, 50)}\`; expecting ${description}, ignoring.`;
    }
}

export class UnknownError extends ValidationError {
    constructor(
        public suggestions: string[],
        value: unknown,
        path: string,
        public override key: string
    ) {
        super(ErrorType.Unknown, undefined, value, path, key);
    }

    override getPrefix(): string {
        return `Unknown option \`${extendPath(this.altPath ?? this.path, this.key)}\``;
    }

    getPostfix() {
        const suggestions = joinFormatted(findSuggestions(this.key, this.suggestions), 'or', (val) => `\`${val}\``);
        return suggestions ? `; Did you mean ${suggestions}? Ignoring.` : ', ignoring.';
    }

    override toString() {
        return `${this.getPrefix()}${this.getPostfix()}`;
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
        return { cleared: null, invalid: [new ValidationError(ErrorType.Required, 'an object', options, path)] };
    }

    const cleared: Partial<T> = {};
    const invalid: ValidationError[] = [];
    const optionsKeys = new Set(Object.keys(options));
    const unusedKeys = [];

    if (unionSymbol in optionsDefs) {
        const validTypes = Object.keys(optionsDefs);
        const defaultType = optionsDefs[unionSymbol];
        if (
            (options.type != null && validTypes.includes(options.type)) ||
            (options.type == null && defaultType != null)
        ) {
            const { type = defaultType, ...rest } = options;
            const nestedResult = validate(rest, (optionsDefs as any)[type], path);
            Object.assign(cleared, { type }, nestedResult.cleared);
            for (const error of nestedResult.invalid) {
                error.setUnionType(type, path);
            }
            invalid.push(...nestedResult.invalid);
        } else {
            const keywords = joinFormatted(validTypes, 'or', (val) => `'${val}'`);
            invalid.push(
                new ValidationError(ErrorType.Required, `a keyword such as ${keywords}`, options.type, path, 'type')
            );
        }
        return { cleared, invalid };
    }

    for (const key of Object.keys(optionsDefs)) {
        const validatorOrDefs: Validator | OptionsDefs<any> = optionsDefs[key as keyof T];
        const required = validatorOrDefs[requiredSymbol];
        const value = options[key as keyof object];

        optionsKeys.delete(key);
        if (value === undefined) {
            if (!validatorOrDefs[undocumentedSymbol]) {
                unusedKeys.push(key);
            }
            if (!required) continue;
        }

        const keyPath = extendPath(path, key);
        if (isFunction(validatorOrDefs)) {
            const context: ValidatorContext = { options, path: keyPath };
            const validatorResult = validatorOrDefs(value, context);
            const objectResult = typeof validatorResult === 'object';

            if (objectResult) {
                invalid.push(...validatorResult.invalid);
                if (validatorResult.valid) {
                    cleared[key as keyof T] = validatorResult.cleared as any;
                    continue;
                } else if (hasRequiredInPath(validatorResult.invalid, keyPath)) {
                    continue;
                }
            } else if (validatorResult) {
                cleared[key as keyof T] = value;
                continue;
            }
            invalid.push(
                new ValidationError(
                    required ? ErrorType.Required : ErrorType.Invalid,
                    validatorOrDefs[descriptionSymbol],
                    value,
                    path,
                    key
                )
            );
        } else {
            const nestedResult = validate(value, validatorOrDefs, keyPath);
            if (nestedResult.cleared != null) {
                cleared[key as keyof T] = nestedResult.cleared as any;
            }
            invalid.push(...nestedResult.invalid);
        }
    }

    for (const key of optionsKeys) {
        const value = options[key as keyof object];
        if (value === undefined) continue;
        invalid.push(new UnknownError(unusedKeys, value, path, key));
    }

    return { cleared, invalid };
}

/**
 * Finds the closest matching suggestion from a list based on Levenshtein distance.
 * @param value The input string to compare against suggestions.
 * @param suggestions The list of possible suggestions.
 * @param maxDistance The maximum allowed Levenshtein distance for a match.
 * @returns The closest matching suggestion within the allowed distance, or null if none are found.
 */
function findSuggestions(value: string, suggestions: string[], maxDistance: number = 2): string[] {
    const lowerCaseValue = value.toLowerCase();
    const similarValues = similarOptionsMap.get(lowerCaseValue);
    return suggestions.filter((key) => {
        const lowerCaseKey = key.toLowerCase();
        return (
            similarValues?.has(key) === true ||
            lowerCaseKey.includes(lowerCaseValue) ||
            levenshteinDistance(lowerCaseValue, lowerCaseKey) <= maxDistance
        );
    });
}

/**
 * Attaches a descriptive message to a validator function.
 * @param validator The validator function to which to attach a description.
 * @param description The description to attach.
 * @returns A new validator function with the attached description.
 */
export function attachDescription(validator: Validator, description: string): Validator;
export function attachDescription<T>(optionsDefs: OptionsDefs<T>, description: string): OptionsDefs<T>;
export function attachDescription<T extends Validator | OptionsDefs<any>>(validatorOrDefs: T, description: string): T {
    if (isFunction(validatorOrDefs)) {
        // Create a shallow clone of the function to avoid mutating shared references
        function clonedValidator(value: unknown, context: ValidatorContext) {
            return (validatorOrDefs as Validator)(value, context);
        }
        (clonedValidator as any)[descriptionSymbol] = description;
        return clonedValidator as T;
    } else {
        // Create a shallow clone of the object to avoid mutating shared references
        return { ...validatorOrDefs, [descriptionSymbol]: description };
    }
}

/**
 * Marks a validator or option definitions object as required.
 * @param validatorOrDefs The validator or option definitions to mark as required.
 * @returns The modified validator or option definitions, marked as required.
 */
export function required<T extends OptionsDefs<any>>(validatorOrDefs: T): T;
export function required<T extends OptionsDefs<any>[]>(validatorOrDefs: T): T;
export function required(validatorOrDefs: Validator): Validator;
export function required<T extends Validator | OptionsDefs<any>>(validatorOrDefs: T): T {
    return Object.assign(
        isFunction(validatorOrDefs)
            ? (value: unknown, context: any) => validatorOrDefs(value, context)
            : optionsDefs(validatorOrDefs),
        { [requiredSymbol]: true, [descriptionSymbol]: validatorOrDefs[descriptionSymbol] }
    ) as T;
}

export function undocumented(validatorOrDefs: Validator): Validator;
export function undocumented<T extends OptionsDefs<any>>(validatorOrDefs: T): T;
export function undocumented<T extends Validator | OptionsDefs<any>>(validatorOrDefs: T) {
    return Object.assign(
        isFunction(validatorOrDefs)
            ? (value: unknown, context: any) => validatorOrDefs(value, context)
            : optionsDefs(validatorOrDefs),
        { [undocumentedSymbol]: true, [descriptionSymbol]: validatorOrDefs[descriptionSymbol] }
    ) as T;
}

/**
 * Creates a validator for ensuring an object matches the provided option definitions.
 * @param defs The option definitions against which to validate an object.
 * @param description (Optional) A description for the validator, defaulting to 'an object'.
 * @returns A validator function for the given option definitions.
 */
export const optionsDefs = <T>(defs: OptionsDefs<T>, description = 'an object', failAll = false): Validator =>
    attachDescription((value, context) => {
        const result = validate(value, defs, context.path);
        const valid = !hasRequiredInPath(result.invalid, context.path);
        return { valid, cleared: valid || !failAll ? result.cleared : null, invalid: result.invalid };
    }, description);

export const typeUnion = <T extends { type: string }>(
    defs: TypeUnionDefs<T, T['type']>,
    description: string,
    defaultType?: T['type']
) =>
    ({
        ...defs,
        [descriptionSymbol]: description,
        [unionSymbol]: defaultType,
    }) as OptionsDefs<T>;

/**
 * Combines multiple validators, requiring all to pass.
 * @param validators An array of validators to combine.
 * @returns A validator that requires all specified validators to pass.
 */
export const and = (...validators: Validator[]): Validator =>
    attachDescription(
        (value: any, context) => {
            const invalid: ValidationError[] = [];
            for (const validator of validators) {
                const result = validator(value, context);
                if (typeof result === 'object') {
                    invalid.push(...result.invalid);
                    if (!result.valid) {
                        return { valid: false, cleared: value, invalid };
                    }
                    value = result.cleared;
                } else if (!result) {
                    return false;
                }
            }
            return { valid: true, cleared: value, invalid };
        },
        joinFormatted(
            validators
                .filter((v) => !v[undocumentedSymbol])
                .map((v) => v[descriptionSymbol])
                .filter(isDefined),
            'and'
        )
    );

/**
 * Combines multiple validators, passing if any one of them does.
 * @param validators An array of validators to combine.
 * @returns A validator that passes if any one of the specified validators does.
 */
export const or = (...validators: Validator[]) =>
    attachDescription(
        (value, context) => {
            for (const validator of validators) {
                const result = validator(value, context);
                if (typeof result === 'object' ? result.valid : result) {
                    return result;
                }
            }
            return false;
        },
        joinFormatted(
            validators
                .filter((v) => !v[undocumentedSymbol])
                .map((v) => v[descriptionSymbol])
                .filter(isDefined),
            'or'
        )
    );

// Helpers
const isComparable = (value: unknown): value is number | Date => isFiniteNumber(value) || isValidDate(value);
const isValidDateValue = (value: unknown) =>
    isDate(value) || ((isFiniteNumber(value) || isString(value)) && isValidDate(new Date(value)));

// Base type validators with descriptions.
export const array = attachDescription(isArray, 'an array');
export const boolean = attachDescription(isBoolean, 'a boolean');
export const callback = attachDescription(isFunction, 'a function');
export const color = attachDescription(isColor, 'a color string');
export const date = attachDescription(isValidDateValue, 'a date');
export const defined = attachDescription(isDefined, 'a defined value');
export const number = attachDescription(isFiniteNumber, 'a number');
export const object = attachDescription(isObject, 'an object');
export const string = attachDescription(isString, 'a string');

// Pass validator if HTMLElement doesn't exist, for server-side environments.
export const htmlElement = attachDescription(
    (value) => typeof HTMLElement === 'undefined' || value instanceof HTMLElement,
    'an html element'
);

export const arrayLength = (minLength: number, maxLength = Infinity) => {
    let message: string;
    if (maxLength === Infinity) {
        message = `an array of at least ${minLength} items`;
    } else if (minLength === maxLength) {
        message = `an array of exactly ${minLength} items`;
    } else if (minLength === 0) {
        message = `an array of no more than ${maxLength} items`;
    } else {
        message = `an array of at least ${minLength} and no more than ${maxLength} items`;
    }
    return attachDescription(
        (value) => isArray(value) && value.length >= minLength && value.length <= maxLength,
        message
    );
};

export const stringLength = (minLength: number, maxLength = Infinity) => {
    let message: string;
    if (maxLength === Infinity) {
        message = `a string of at least ${minLength} characters`;
    } else if (minLength === maxLength) {
        message = `an string of exactly ${minLength} characters`;
    } else if (minLength === 0) {
        message = `an string of no more than ${maxLength} characters`;
    } else {
        message = `an string of at least ${minLength} and no more than ${maxLength} characters`;
    }
    return attachDescription(
        (value) => isString(value) && value.length >= minLength && value.length <= maxLength,
        message
    );
};

// Numeric type validators with specific conditions.
export const numberMin = (min: number, inclusive = true) =>
    attachDescription(
        (value) => isFiniteNumber(value) && (value > min || (inclusive && value === min)),
        `a number greater than ${inclusive ? 'or equal to ' : ''}${min}`
    );

export const numberRange = (min: number, max: number) =>
    attachDescription(
        (value) => isFiniteNumber(value) && value >= min && value <= max,
        `a number between ${min} and ${max} inclusive`
    );

export const positiveNumber = numberMin(0);
export const positiveNumberNonZero = numberMin(0, false);

export const ratio = numberRange(0, 1);

export const lessThan = (otherField: string) =>
    attachDescription(
        (value, { options }) =>
            !isComparable(value) || !isComparable(options[otherField]) || value < options[otherField],
        `the value to be less than \`${otherField}\``
    );

export const lessThanOrEqual = (otherField: string) =>
    attachDescription(
        (value, { options }) =>
            !isComparable(value) || !isComparable(options[otherField]) || value <= options[otherField],
        `the value to be less than or equal to \`${otherField}\``
    );

export const greaterThan = (otherField: string) =>
    attachDescription(
        (value, { options }) =>
            !isComparable(value) || !isComparable(options[otherField]) || value > options[otherField],
        `the value to be greater than \`${otherField}\``
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
    const keywords = joinFormatted(allowed, 'or', (value) => `'${value}'`);
    return attachDescription((value) => allowed.includes(value), `a keyword such as ${keywords}`);
}

/**
 * A defensive version of `union` that intentionally breaks compilation if a string union type is changed.
 * @example
 * type U = 'a' | 'b';
 * strictUnion<U>()('a', 'b'); // compilation breaks if U is changed to `'a' | 'b' | 'c'`.
 */
export function strictUnion<T extends string>(): <U extends readonly T[]>(
    ...args: U & (AreExact<T, U[number]> extends true ? U : never)
) => Validator {
    return union;
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
 * @param strict When enabled validator fails on any invalid item, otherwise invalid items are filtered.
 * @returns A validator function for arrays with elements validated by the specified validator.
 */
export const arrayOf = (validator: Validator, description?: string, strict: boolean = true) =>
    attachDescription(
        (value, context) => {
            if (!isArray(value)) return false;

            let valid: boolean = strict;

            const cleared: unknown[] = [];
            const invalid: ValidationError[] = [];
            const updateValidity = (result: boolean) => {
                valid = strict ? valid && result : valid || result;
            };

            if (value.length === 0) {
                return { valid: true, cleared, invalid };
            }

            for (let i = 0; i < value.length; i++) {
                const options = value[i];
                const result = validator(options, { options, path: `${context.path}[${i}]` });
                if (typeof result === 'object') {
                    updateValidity(result.valid);
                    invalid.push(...result.invalid);
                    if (result.cleared != null) {
                        cleared.push(result.cleared);
                    }
                } else {
                    updateValidity(result);
                    if (result) {
                        cleared.push(options);
                    }
                }
            }

            return { valid, cleared: valid || !strict ? cleared : null, invalid };
        },
        description ?? `${validator[descriptionSymbol]} array`
    );

/**
 * Creates a validator for arrays where each element is validated against a given set of definitions.
 * Allows capturing both valid and invalid values while providing detailed validation errors.
 * @param defs The validation definitions to apply to each array element.
 * @param description An optional description string.
 * @returns A validator function for arrays, storing valid elements and collecting errors for invalid ones.
 */
export const arrayOfDefs = <T>(defs: OptionsDefs<T>, description = 'an object array') =>
    attachDescription((value, context) => {
        if (!isArray(value)) return false;

        const cleared: unknown[] = [];
        const invalid: ValidationError[] = [];

        for (let i = 0; i < value.length; i++) {
            const indexPath = `${context.path}[${i}]`;
            const result = validate(value[i], defs, indexPath);
            if (!hasRequiredInPath(result.invalid, indexPath)) {
                cleared.push(result.cleared);
            }
            invalid.push(...result.invalid);
        }

        return { valid: true, cleared, invalid };
    }, description);

export const callbackOf = (validator: Validator, description?: string) =>
    attachDescription((value, context) => {
        if (!isFunction(value)) return false;
        if (markedSymbol in value) return true;

        const validatorDescription = description ?? validator[descriptionSymbol];

        const cbWithValidation = Object.assign(
            (...args: any[]) => {
                const result = safeCall(value, args);
                if (result == null) return;
                const validatorResult = validator(result, { options: result, path: '' });
                if (typeof validatorResult === 'object') {
                    warnCallbackErrors(validatorResult, context, validatorDescription, result);
                    if (validatorResult.valid) {
                        return validatorResult.cleared;
                    }
                } else if (validatorResult) {
                    return result;
                } else {
                    warnOnce(
                        `Callback \`${context.path}\` returned an invalid value \`${stringifyValue(result, 50)}\`; expecting ${validatorDescription}, ignoring.`
                    );
                }
            },
            { [markedSymbol]: true }
        );

        return { valid: true, cleared: cbWithValidation, invalid: [] };
    }, 'a function');

export const callbackDefs = <T>(defs: OptionsDefs<T>, description = 'an object') =>
    attachDescription((value, context) => {
        if (!isFunction(value)) return false;
        if (markedSymbol in value) return true;

        const validatorDescription = description;

        const cbWithValidation = Object.assign(
            (...args: any[]) => {
                const result = safeCall(value, args, context.path);
                if (result == null) return;
                const validatorResult = validate(result, defs);
                warnCallbackErrors(validatorResult, context, validatorDescription, result);
                return validatorResult.cleared;
            },
            { [markedSymbol]: true }
        );

        return { valid: true, cleared: cbWithValidation, invalid: [] };
    }, 'a function');

export function hasRequiredInPath(errors: ValidationError[], rootPath: string) {
    return errors.some((error: ValidationError) => error.type === ErrorType.Required && error.path === rootPath);
}

function warnCallbackErrors(
    validatorResult: Pick<ValidatorResult, 'invalid'>,
    context: ValidatorContext,
    description: string | undefined,
    result: unknown
) {
    if (validatorResult.invalid.length === 0) return;

    if (isArray(result)) {
        const expectedDescription = description ?? validatorResult.invalid[0]?.description ?? 'a valid value';
        return warnOnce(
            `Callback \`${context.path}\` returned an invalid value \`${stringifyValue(result, 50)}\`; expecting ${expectedDescription}, ignoring.`
        );
    }

    for (const error of validatorResult.invalid) {
        if (error instanceof UnknownError) {
            return warnOnce(
                `Callback \`${context.path}\` returned an unknown property \`${extendPath(error.path, error.key)}\`${error.getPostfix()}`
            );
        }
        const errorValue = stringifyValue(error.value, 50);
        warnOnce(
            error.key
                ? `Callback \`${context.path}\` returned an invalid property \`${extendPath(error.path, error.key)}\`: \`${errorValue}\`; expecting ${error.description}, ignoring.`
                : `Callback \`${context.path}\` returned an invalid value \`${errorValue}\`; expecting ${description ?? error.description}, ignoring.`
        );
    }
}

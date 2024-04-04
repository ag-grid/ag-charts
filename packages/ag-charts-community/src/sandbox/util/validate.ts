import { isBoolean, isFiniteNumber, isFunction, isObject, isString } from '../../util/type-guards';

export type OptionsDefs<T extends string | object> = { [K in T extends object ? keyof T : T]: Validator };

export interface Validator {
    (value: unknown): boolean;
    description?: string;
    optional?: boolean;
}

export function validate<T extends object>(options: T, optionsDefs: OptionsDefs<T>) {
    // TODO: should remember normalized path and display it as part of the warnings
    for (const [key, validator] of Object.entries<Validator>(optionsDefs)) {
        if (!validator(options[key as keyof T])) {
            return false;
        }
    }
}

export function attachDescription(validator: Validator, description: string): Validator {
    return Object.assign((value: unknown) => validator(value), { description });
}

export const boolean = attachDescription(isBoolean, 'a boolean');
export const callback = attachDescription(isFunction, 'a function');
export const number = attachDescription(isFiniteNumber, 'a number');
export const string = attachDescription(isString, 'a string');

export const ratio = attachDescription(
    (value) => isFiniteNumber(value) && value >= 0 && value <= 1,
    'a number between 0 and 1 inclusive'
);
export const positiveNumber = attachDescription((value) => isFiniteNumber(value) && value >= 0, 'a positive number');

export const instanceOf = (instanceType: Function) =>
    attachDescription((value) => value instanceof instanceType, `an instance of ${instanceType.name}`);

export const object = (defs: OptionsDefs<string>) =>
    attachDescription(
        (value) => isObject(value) && Object.entries(defs).every(([key, validate]) => validate(value[key])),
        'an object'
    );

export const union =
    (...allowed: any[]) =>
    (value: any) =>
        allowed.includes(value);

export function optional(validatorOrDefs: Validator | OptionsDefs<string>): Validator {
    const validator = typeof validatorOrDefs === 'object' ? object(validatorOrDefs) : validatorOrDefs;
    const optionalValidator = (value?: unknown) => typeof value === 'undefined' || validator(value);
    return Object.assign(optionalValidator, { optional: true });
}

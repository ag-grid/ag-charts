import { beforeEach, describe, expect, jest } from '@jest/globals';

import { reset as resetLogger } from '../globals/logger';
import {
    type OptionsDefs,
    Validator,
    type ValidatorContext,
    ValidatorResult,
    and,
    array,
    arrayLength,
    arrayOf,
    arrayOfDefs,
    attachDescription,
    boolean,
    callback,
    callbackOf,
    constant,
    date,
    greaterThan,
    instanceOf,
    lessThan,
    number,
    object,
    optionsDefs,
    or,
    positiveNumber,
    ratio,
    required,
    string,
    typeUnion,
    union,
    validate,
} from './validation';

function isValid<T extends object>(options: unknown, defs: OptionsDefs<T>, path?: string): options is T {
    const { invalid } = validate(options, defs, path);
    return invalid.length === 0;
}

describe('Validation utils', () => {
    const mockContext = (): ValidatorContext => ({ options: {}, path: 'pathTo' });
    const isValidatorResultValid = (result: ValidatorResult | boolean) =>
        typeof result === 'object' ? result.valid : result;
    const runValidator = (validator: Validator, value: unknown, context: ValidatorContext = mockContext()) =>
        isValidatorResultValid(validator(value, context));

    beforeEach(() => {
        console.warn = jest.fn();
        resetLogger();
    });

    describe('Base Validators', () => {
        describe('Primitive type validators', () => {
            test.each([
                [string, 'hello', true],
                [string, 42, false],
                [number, 42, true],
                [number, '42', false],
                [boolean, true, true],
                [boolean, 'false', false],
                [object, {}, true],
                [object, [], false],
                [array, [], true],
                [array, 'not an array', false],
                [date, new Date(), true],
                [date, 'not a date', false],
                [callback, () => {}, true],
                [callback, 'not a function', false],
            ])('%p validates %p as %p', (validator, input, expected) => {
                expect(runValidator(validator, input)).toBe(expected);
            });
        });

        describe('Specialized type validators', () => {
            test.each([
                [positiveNumber, 1, true],
                [positiveNumber, -1, false],
                [ratio, 0.5, true],
                [ratio, -0.1, false],
                [ratio, 1.1, false],
                [lessThan('contextKey'), 4.2, true],
                [lessThan('contextKey'), 420, false],
            ])('%p validates %p as %p', (validator, input, expected) => {
                expect(runValidator(validator, input, { options: { contextKey: 42 }, path: '' })).toBe(expected);
            });
        });
    });

    describe('Combination Validators', () => {
        const isNonEmptyString = and(string, (value) => value !== '');
        const isStringOrNumber = or(string, number);

        test('and combines validators correctly', () => {
            expect(runValidator(isNonEmptyString, 'hello')).toBe(true);
            expect(runValidator(isNonEmptyString, '')).toBe(false);
            expect(runValidator(isNonEmptyString, 42)).toBe(false);
        });

        test('or combines validators correctly', () => {
            expect(runValidator(isStringOrNumber, 'hello')).toBe(true);
            expect(runValidator(isStringOrNumber, 42)).toBe(true);
            expect(runValidator(isStringOrNumber, true)).toBe(false);
        });
    });

    describe('Complex Validators and Validation Function', () => {
        const isNonEmptyString = and(string, (value) => value !== '');
        const userOptionsDef = {
            name: isNonEmptyString,
            age: positiveNumber,
            hobbies: arrayOf(string),
        };

        test('validates complex objects correctly', () => {
            const validUser = { name: 'John', age: 30, hobbies: ['coding', 'reading'] };
            const invalidUser = { name: '', age: 30, hobbies: ['coding', 42] }; // Invalid name and one invalid hobby

            expect(isValid(validUser, userOptionsDef)).toBe(true);
            expect(isValid(invalidUser, userOptionsDef)).toBe(false);
        });
    });

    describe('Utility Functions', () => {
        test('required marks a validator as required', () => {
            expect(isValid<{ value: string }>({ value: '' }, { value: required(string) })).toBe(true);
            expect(isValid<{ value: string }>({ value: undefined }, { value: required(string) })).toBe(false);
        });

        // should check the description in the logger
        test('attachDescription adds a description to a validator', () => {
            const describedValidator = attachDescription(
                (value: unknown, context) => string(value, context) && value !== '',
                'a non-empty string'
            );
            expect(validate<{ str: string }>({ str: '' }, { str: describedValidator }).invalid).toMatchSnapshot();
        });
    });

    describe('Union Validator', () => {
        const isRedOrBlue = union('red', 'blue');

        test('validates correctly against multiple allowed values', () => {
            expect(runValidator(isRedOrBlue, 'red')).toBe(true);
            expect(runValidator(isRedOrBlue, 'blue')).toBe(true);
            expect(runValidator(isRedOrBlue, 'green')).toBe(false);
        });
    });

    describe('Constant Validator', () => {
        const isTrue = constant(true);

        test('validates only the exact value', () => {
            expect(runValidator(isTrue, true)).toBe(true);
            expect(runValidator(isTrue, false)).toBe(false);
            expect(runValidator(isTrue, 'true')).toBe(false);
        });
    });

    describe('InstanceOf Validator', () => {
        class TestClass {}

        const isInstanceOfTestClass = instanceOf(TestClass);

        test('validates instances of the specified class', () => {
            expect(runValidator(isInstanceOfTestClass, new TestClass())).toBe(true);
            expect(runValidator(isInstanceOfTestClass, {})).toBe(false);
        });
    });

    describe('ArrayOf Validator', () => {
        const isArrayOfStrings = arrayOf(string);

        test('validates arrays where every element passes the given validator', () => {
            expect(runValidator(isArrayOfStrings, ['a', 'b', 'c'])).toBe(true);
            expect(runValidator(isArrayOfStrings, ['a', 1, 'c'])).toBe(false);
            expect(runValidator(isArrayOfStrings, 'not an array')).toBe(false);
        });
    });

    describe('Callback Validators', () => {
        test('callbackOf emits a single warning for invalid array returns', () => {
            const formatterValidator = callbackOf(
                arrayOfDefs<{ text: string }>(
                    {
                        text: required(string),
                    },
                    'text segment'
                ),
                'text segments'
            );
            const formatter = (value: any) => value;
            const context = { options: {}, path: 'formatter' };
            const validatorResult = formatterValidator(formatter, context) as ValidatorResult;
            const wrappedFormatter = validatorResult.cleared as (...args: any[]) => any;

            wrappedFormatter([
                { text: 'ok' },
                { text: 123 }, // invalid
                42, // invalid
            ]);

            expect(console.warn).toHaveBeenCalledTimes(1);
            expect((console.warn as jest.Mock).mock.calls[0][0]).toContain('returned an invalid value');
        });
    });

    describe('OptionsDefs Validator', () => {
        const optionDefsValidator = optionsDefs<{ key1?: string; key2?: number }>({
            key1: string,
            key2: required(number),
        });

        test('validates objects against provided definitions', () => {
            expect(runValidator(optionDefsValidator, { key1: 'value', key2: 42 })).toBe(true);
            expect(runValidator(optionDefsValidator, { key1: 'value', key2: 'not a number' })).toBe(false);
        });
    });

    describe('TypeUnion Validator', () => {
        test('validates an object by the `type` property', () => {
            const isTypeUnionOfFoo = optionsDefs(
                typeUnion<{ type: 'a'; aa?: boolean } | { type: 'b'; bb: number }>(
                    {
                        a: { aa: boolean },
                        b: { bb: required(number) },
                    },
                    'an object'
                )
            );
            expect(runValidator(isTypeUnionOfFoo, { type: 'a', aa: true })).toBe(true);
            expect(runValidator(isTypeUnionOfFoo, { type: 'a' })).toBe(true);
            expect(runValidator(isTypeUnionOfFoo, { type: 'b', bb: 1 })).toBe(true);
            expect(runValidator(isTypeUnionOfFoo, { type: 'b' })).toBe(false);
            expect(runValidator(isTypeUnionOfFoo, { type: 'b', bb: false })).toBe(false);
            expect(runValidator(isTypeUnionOfFoo, { type: 'a', aa: 'not a boolean' })).toBe(true);
            expect(runValidator(isTypeUnionOfFoo, { type: 'a', bb: 1 })).toBe(true);
            expect(runValidator(isTypeUnionOfFoo, { type: 'c', aa: 1 })).toBe(false);
        });

        test('validates an object by the `type` property with a default type', () => {
            const isTypeUnionOfFoo = optionsDefs(
                typeUnion<{ type: 'a'; aa?: boolean } | { type: 'b'; bb: number }>(
                    {
                        a: { aa: boolean },
                        b: { bb: required(number) },
                    },
                    'an object',
                    'b' // Default type.
                )
            );

            // Verify defaulting.
            expect(runValidator(isTypeUnionOfFoo, {})).toBe(false);
            expect(runValidator(isTypeUnionOfFoo, { aa: true })).toBe(false);
            expect(runValidator(isTypeUnionOfFoo, { bb: 1 })).toBe(true);

            // Verify non-defaulting cases too.
            expect(runValidator(isTypeUnionOfFoo, { type: 'a' })).toBe(true);
            expect(runValidator(isTypeUnionOfFoo, { type: 'a', aa: true })).toBe(true);
            expect(runValidator(isTypeUnionOfFoo, { type: 'b', bb: 1 })).toBe(true);
            expect(runValidator(isTypeUnionOfFoo, { type: 'b' })).toBe(false);
            expect(runValidator(isTypeUnionOfFoo, { type: 'b', bb: false })).toBe(false);
            expect(runValidator(isTypeUnionOfFoo, { type: 'a', aa: 'not a boolean' })).toBe(true);
            expect(runValidator(isTypeUnionOfFoo, { type: 'a', bb: 1 })).toBe(true);
            expect(runValidator(isTypeUnionOfFoo, { type: 'c', aa: 1 })).toBe(false);
        });

        test('nested warning messages should attach type to option path', () => {
            const nestedTypeUnionDefs = {
                test: typeUnion<any>(
                    {
                        a: { sub: { value: boolean } },
                        b: { sub: { value: number } },
                    },
                    'a test object'
                ),
            };
            const result = validate({ test: { type: 'b', sub: { value: true } } }, nestedTypeUnionDefs);
            expect(result.invalid.map(String)).toMatchSnapshot();
        });
    });

    describe('Conditional Validators', () => {
        const axisSchema: OptionsDefs<any> = {
            min: and(number, lessThan('max')),
            max: and(number, greaterThan('min')),
        };

        test('validates axis schema with min and max constraints', () => {
            const validAxis = { min: 0, max: 100 };
            const invalidAxis = { min: 100, max: 0 };

            expect(isValid(validAxis, axisSchema)).toBe(true);
            expect(isValid(invalidAxis, axisSchema)).toBe(false);
        });

        test('validates axis schema with optional min/max', () => {
            expect(isValid({ min: 1000 }, axisSchema)).toBe(true);
            expect(isValid({ max: 100 }, axisSchema)).toBe(true);

            const { cleared, invalid } = validate({ min: 1000, max: '100' }, axisSchema);
            expect(cleared).toEqual({ min: 1000 });
            expect(invalid).toMatchSnapshot();
        });
    });

    describe('Main Validation Function', () => {
        const userSchema: OptionsDefs<any> = {
            name: required(string),
            age: and(number, positiveNumber),
            hobbies: arrayOf(string),
            address: {
                street: string,
                city: string,
            },
        };

        test('validates a complex object with nested structures against a schema', () => {
            const validUser = {
                name: 'John Doe',
                age: 30,
                hobbies: ['reading', 'gaming'],
                address: {
                    street: '123 Elm St',
                    city: 'Springfield',
                },
            };

            const invalidUser = {
                age: -5, // positiveNumber failure
                hobbies: ['reading', 123], // arrayOf failure
                address: {
                    street: '123 Elm St',
                },
            };

            expect(isValid(validUser, userSchema)).toBe(true);
            expect(isValid(invalidUser, userSchema)).toBe(false);
        });
    });

    describe('Validate Method', () => {
        const userSchema: OptionsDefs<any> = {
            name: required(string),
            type: string,
            age: positiveNumber,
            hobbies: arrayOf(string),
            address: {
                street: string,
                city: string,
            },
        };

        test('validate returns expected validated object and errors', () => {
            const validUser = {
                name: 'John Doe',
                age: 30,
                hobbies: ['reading', 'gaming'],
                address: {
                    street: '123 Elm St',
                    city: 'Springfield',
                },
            };

            const invalidUser = {
                name: undefined, // Required failure
                age: -5, // positiveNumber failure
                hobbies: ['reading', 123], // arrayOf failure
                address: {
                    street: '123 Elm St',
                    city: '',
                },
                extraField: 'should be ignored', // Unknown option
                typo: 'should suggest fuzzy match', // Unknown option
            };

            const { cleared: validatedValidUser, invalid: errorsValidUser } = validate(validUser, userSchema);
            const { cleared: validatedInvalidUser, invalid: errorsInvalidUser } = validate(invalidUser, userSchema);

            expect(validatedValidUser).toEqual(validUser);
            expect(errorsValidUser).toEqual([]);

            expect(validatedInvalidUser).toEqual({
                address: {
                    street: '123 Elm St',
                    city: '',
                },
            });
            expect(errorsInvalidUser).toMatchSnapshot();
        });

        test('nested validations returns all levels of validation errors', () => {
            const complexOptionsDef = {
                employees: and(
                    arrayOf(
                        or(
                            string,
                            optionsDefs<any>(
                                {
                                    name: required(string),
                                    age: positiveNumber,
                                    salaries: arrayOf(positiveNumber),
                                    employers: arrayOfDefs<any>(
                                        {
                                            name: required(string),
                                            department: union('a', 'b', 'c'),
                                        },
                                        'an employers array'
                                    ),
                                },
                                'person details'
                            )
                        )
                    ),
                    arrayLength(1)
                ),
            };

            const validOptions = {
                employees: [
                    'John Doe',
                    {
                        name: 'John Doe',
                        age: 30,
                        position: 'NA',
                        salaries: [10_000, 22_000, 45_000],
                        employers: [
                            { name: 'Dave', department: 'b' },
                            { name: 'John', department: 'c' },
                        ],
                    },
                ],
            };

            const invalidOptions = {
                employees: [
                    1337,
                    {
                        age: 30,
                        position: 'NA',
                        salaries: [10_000, 22_000, '45_000'],
                        employers: [
                            { name: 'Dave', department: 'd' },
                            { employeeId: 'John', department: 'c' },
                        ],
                    },
                ],
            };

            expect(validate(validOptions, complexOptionsDef)).toMatchSnapshot();
            expect(validate(invalidOptions, complexOptionsDef)).toMatchSnapshot();
            expect(validate({ employees: [] }, complexOptionsDef)).toMatchSnapshot();
        });
    });
});

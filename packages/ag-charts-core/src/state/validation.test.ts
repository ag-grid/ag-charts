import type { Mock } from 'vitest';
import { afterEach, beforeEach, describe, expect, vi } from 'vitest';

import { textOrSegments } from '../config/chartDefaults';
import { colorOrRef, padding } from '../config/optionsDefaults';
import { Logger, reset as resetLogger } from '../logging/logger';
import { RegistryMode, reset as resetRegistry, setRegistryMode } from '../modules/moduleRegistry';
import {
    type OptionsDefs,
    type ValidateParams,
    type Validator,
    type ValidatorContext,
    type ValidatorResult,
    and,
    array,
    arrayLength,
    arrayOf,
    arrayOfDefs,
    attachDescription,
    boolean,
    callback,
    callbackOf,
    color,
    constant,
    date,
    deprecated,
    enterprise,
    greaterThan,
    instanceOf,
    lessThan,
    number,
    numericValue,
    object,
    optionsDefs,
    or,
    positiveNumber,
    ratio,
    required,
    string,
    typeUnion,
    union,
    unionOrArray,
    validate as validateOptions,
} from './validation';

const validationLogger = new Logger();

// Every case validates through the suite's Logger, so advisory output is captured rather than ambient.
const validate = <T>(options: unknown, defs: OptionsDefs<T>, path = '', params: Partial<ValidateParams> = {}) =>
    validateOptions<T>(options, defs, path, { logger: validationLogger, ...params });

function isValid<T extends object>(options: unknown, defs: OptionsDefs<T>, path?: string): options is T {
    const { invalid } = validate(options, defs, path);
    return invalid.length === 0;
}

describe('Validation utils', () => {
    const mockContext = (): ValidatorContext => ({
        options: {},
        path: 'pathTo',
        params: { logger: validationLogger },
    });
    const isValidatorResultValid = (result: ValidatorResult | boolean) =>
        typeof result === 'object' ? result.valid : result;
    const runValidator = (validator: Validator, value: unknown, context: ValidatorContext = mockContext()) =>
        isValidatorResultValid(validator(value, context));

    beforeEach(() => {
        console.warn = vi.fn();
        resetLogger();
        validationLogger.reset();
    });

    describe('Base Validators', () => {
        describe('Primitive type validators', () => {
            test.each([
                [string, 'hello', true],
                [string, 42, false],
                [number, 42, true],
                [number, '42', false],
                [number, 42n, false],
                [numericValue, 42, true],
                [numericValue, 42n, true],
                [numericValue, '42', false],
                [numericValue, Number.NaN, false],
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
                [lessThan('contextKey'), 4n, true],
                [lessThan('contextKey'), 420n, false],
                [greaterThan('contextKey'), 420n, true],
            ])('%p validates %p as %p', (validator, input, expected) => {
                expect(
                    runValidator(validator, input, {
                        options: { contextKey: 42 },
                        path: '',
                        params: { logger: validationLogger },
                    })
                ).toBe(expected);
            });
        });

        test('numericValue rejects an out-of-range bigint cleanly without throwing (AG-16608)', () => {
            // Stringifying a bigint in the error message would otherwise crash.
            const def = { min: numericValue, max: and(numericValue, greaterThan('min')) };
            expect(() => validate({ min: 10n, max: 1n }, def)).not.toThrow();
            expect(isValid<{ min: bigint; max: bigint }>({ min: 10n, max: 1n }, def)).toBe(false);
            expect(isValid<{ min: bigint; max: bigint }>({ min: 1n, max: 10n }, def)).toBe(true);
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

        describe('enterprise wrapper', () => {
            afterEach(() => resetRegistry());

            test('passes values through when enterprise is registered', () => {
                setRegistryMode(RegistryMode.Enterprise);
                const { cleared, invalid } = validate<{ key: string }>({ key: 'x' }, { key: enterprise(string) });
                expect(cleared).toEqual({ key: 'x' });
                expect(invalid).toEqual([]);
            });

            test('strips defined values and fires a single warnOnce when enterprise is not registered', () => {
                const { cleared, invalid } = validate<{ key: string }>(
                    { key: 'x' },
                    { key: enterprise(string) },
                    'series[0]',
                    { logger: validationLogger }
                );
                expect(cleared).toEqual({ key: null });
                // The gate uses warnOnce directly so the error is not propagated through the
                // invalid array (avoids repeat logging across update cycles).
                expect(invalid).toEqual([]);
                expect(console.warn).toHaveBeenCalledTimes(1);
                expect((console.warn as Mock).mock.calls[0][0]).toContain('AG Charts Enterprise');
                expect((console.warn as Mock).mock.calls[0][0]).toContain('series[0].key');
            });

            test('dedupes repeat validations of the same path', () => {
                const defs = { key: enterprise(string) };
                const params = { logger: validationLogger };
                validate<{ key: string }>({ key: 'x' }, defs, 'series[0]', params);
                validate<{ key: string }>({ key: 'x' }, defs, 'series[0]', params);
                validate<{ key: string }>({ key: 'x' }, defs, 'series[0]', params);
                // warnOnce caches by message — the same path logs once.
                expect(console.warn).toHaveBeenCalledTimes(1);
            });

            test('stays silent when the value is undefined', () => {
                const { invalid } = validate<{ key?: string }>({ key: undefined }, { key: enterprise(string) });
                expect(invalid).toEqual([]);
                expect(console.warn).not.toHaveBeenCalled();
            });

            test('strips nested enterprise option defs', () => {
                const { cleared, invalid } = validate<{ scale: { fills: string[] } }>(
                    { scale: { fills: ['#fff'] } },
                    { scale: enterprise({ fills: arrayOf(string) }) },
                    '',
                    { logger: validationLogger }
                );
                expect(cleared).toEqual({ scale: null });
                expect(invalid).toEqual([]);
                expect(console.warn).toHaveBeenCalledTimes(1);
                expect((console.warn as Mock).mock.calls[0][0]).toContain('AG Charts Enterprise');
            });

            test('throws when composed with required() in either order', () => {
                expect(() => enterprise(required(string))).toThrow(/enterprise.*required/);
                expect(() => required(enterprise(string))).toThrow(/required.*enterprise/);
            });
        });
    });

    describe('deprecated wrapper', () => {
        afterEach(() => validationLogger.setLevel('deprecation'));

        test('emits a deprecationOnce notice at the default console level', () => {
            const { cleared, invalid } = validate<{ colorScale: string }>(
                { colorScale: 'red' },
                { colorScale: deprecated(string, 'Use `colorScale.fills` instead.') }
            );
            expect(cleared).toEqual({ colorScale: 'red' });
            expect(invalid).toEqual([]);
            expect(console.warn).toHaveBeenCalledTimes(1);
            expect((console.warn as Mock).mock.calls[0][0]).toContain('is deprecated');
            expect((console.warn as Mock).mock.calls[0][0]).toContain('Use `colorScale.fills` instead.');
        });

        test('silences the notice once the console level is raised to "warning"', () => {
            validationLogger.setLevel('warning');
            // A message distinct from the preceding test's, so the shared logger's do-once cache
            // cannot be what keeps this quiet.
            const { cleared, invalid } = validate<{ colorScale: string }>(
                { colorScale: 'red' },
                { colorScale: deprecated(string, 'Use `colorScale.range` instead.') }
            );
            // The value still passes through to the inner validator during the deprecation window.
            expect(cleared).toEqual({ colorScale: 'red' });
            expect(invalid).toEqual([]);
            expect(console.warn).not.toHaveBeenCalled();
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

    describe('UnionOrArray Validator', () => {
        const isRedOrBlue = unionOrArray('red', 'blue');

        test('validates a single keyword or a non-empty array of keywords', () => {
            expect(runValidator(isRedOrBlue, 'red')).toBe(true);
            expect(runValidator(isRedOrBlue, ['red'])).toBe(true);
            expect(runValidator(isRedOrBlue, ['blue', 'red'])).toBe(true);
            expect(runValidator(isRedOrBlue, 'green')).toBe(false);
            expect(runValidator(isRedOrBlue, ['blue', 'green'])).toBe(false);
        });

        test('rejects an empty array', () => {
            expect(runValidator(isRedOrBlue, [])).toBe(false);

            const { invalid } = validate({ placement: [] }, { placement: isRedOrBlue });
            expect(invalid.map(String)).toEqual([
                "Option `placement` cannot be set to `[]`; expecting a keyword such as 'red' or 'blue' or a non-empty array containing these keywords, ignoring.",
            ]);
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
        const warnings = () => (console.warn as Mock).mock.calls.map((call) => String(call[0]));
        const wrapFormatter = (
            validator: Validator,
            returnValue: unknown,
            path = 'formatter',
            description?: string
        ) => {
            const { cleared } = callbackOf(validator, description)(() => returnValue, {
                options: {},
                path,
                params: { logger: validationLogger },
            }) as ValidatorResult;
            return (cleared as (...args: any[]) => any)();
        };

        test('emits a targeted warning per invalid array element/property', () => {
            const validator = arrayOfDefs<{ text: string }>({ text: required(string) }, 'text segment');
            wrapFormatter(validator, [{ text: 'ok' }, { text: 123 }, 42], 'formatter', 'text segments');

            const msgs = warnings();
            expect(msgs).toHaveLength(2);
            expect(msgs[0]).toContain('invalid property `[1].text`');
            expect(msgs[0]).toContain('expecting a string');
            expect(msgs[1]).toContain('invalid value `42`');
            expect(msgs[1]).toContain('expecting text segments');
        });

        test('reports the offending sub-property for an invalid segment value', () => {
            const result = wrapFormatter(
                textOrSegments,
                [{ type: 'image', url: 'https://example.com/de.png', width: 20, height: 13, verticalAlign: 't0p' }],
                'axes[0].label.formatter'
            );

            const msgs = warnings();
            expect(msgs).toHaveLength(1);
            expect(msgs[0]).toContain('invalid property `[0].verticalAlign`');
            expect(msgs[0]).toContain('"t0p"');
            expect(msgs[0]).toContain("expecting a keyword such as 'baseline', 'top', 'middle' or 'bottom'");
            // The bad property is dropped; the rest of the segment is preserved so the label still renders.
            expect(result).toEqual([{ type: 'image', url: 'https://example.com/de.png', width: 20, height: 13 }]);
        });

        test('warns only about the invalid property and keeps valid sibling segments', () => {
            const result = wrapFormatter(
                textOrSegments,
                [
                    { type: 'text', text: 'Germany' },
                    { type: 'image', url: 'https://example.com/de.png', width: 20, height: 13, verticalAlign: 'nope' },
                ],
                'axes[0].label.formatter'
            );

            const msgs = warnings();
            expect(msgs).toHaveLength(1);
            expect(msgs[0]).toContain('invalid property `[1].verticalAlign`');
            expect(result).toEqual([
                { type: 'text', text: 'Germany' },
                { type: 'image', url: 'https://example.com/de.png', width: 20, height: 13 },
            ]);
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

    describe('Disabled nodes (enabled: false)', () => {
        const defs = { enabled: boolean, value: required(number) };
        const skipDisabled = { skipDisabledNodeValidation: true };

        test('skips required-field enforcement for a disabled node when opted in', () => {
            const { cleared, invalid } = validate({ enabled: false }, defs, '', skipDisabled);
            expect(invalid).toEqual([]);
            expect(cleared).toEqual({ enabled: false });
        });

        test('still enforces required fields on a disabled node without the opt-in', () => {
            expect(validate({ enabled: false }, defs).invalid).not.toEqual([]);
        });

        test('still enforces required fields when the node is not disabled', () => {
            expect(validate({ enabled: true }, defs, '', skipDisabled).invalid).not.toEqual([]);
            expect(validate({}, defs, '', skipDisabled).invalid).not.toEqual([]);
        });

        test('skips the discriminant requirement for a disabled type-union node when opted in', () => {
            const unionDefs = typeUnion<
                { type: 'a'; enabled?: boolean; aa?: boolean } | { type: 'b'; enabled?: boolean; bb: number }
            >({ a: { enabled: boolean, aa: boolean }, b: { enabled: boolean, bb: required(number) } }, 'an object');

            // Disabled with no `type`: no "type is required" error, `enabled` flag preserved.
            const noType = validate({ enabled: false }, unionDefs, '', skipDisabled);
            expect(noType.invalid).toEqual([]);
            expect(noType.cleared).toEqual({ enabled: false });

            // Disabled, matching branch but missing its required field: no error.
            expect(validate({ type: 'b', enabled: false }, unionDefs, '', skipDisabled).invalid).toEqual([]);

            // Without the opt-in, a disabled union node still warns about the missing discriminant.
            expect(validate({ enabled: false }, unionDefs).invalid).not.toEqual([]);

            // Enabled equivalents still warn about the missing discriminant / required field.
            expect(validate({}, unionDefs, '', skipDisabled).invalid).not.toEqual([]);
            expect(validate({ type: 'b' }, unionDefs, '', skipDisabled).invalid).not.toEqual([]);
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

    describe('colorOrRef ontoColor', () => {
        it('accepts a literal color as ontoColor', () => {
            expect(isValid({ c: { ref: 'accentColor', mix: 0.5, ontoColor: '#ff5733' } }, { c: colorOrRef })).toBe(
                true
            );
        });

        it('accepts a var() as ontoColor', () => {
            expect(isValid({ c: { ref: 'accentColor', mix: 0.5, ontoColor: 'var(--brand)' } }, { c: colorOrRef })).toBe(
                true
            );
        });

        it('accepts an oklch() ontoColor the blend engine can render', () => {
            expect(
                isValid({ c: { ref: 'accentColor', mix: 0.5, ontoColor: 'oklch(0.7 0.15 200)' } }, { c: colorOrRef })
            ).toBe(true);
        });

        it('rejects an ontoColor the blend engine cannot render (e.g. lab/color)', () => {
            expect(
                isValid({ c: { ref: 'accentColor', mix: 0.5, ontoColor: 'lab(50% 40 59.5)' } }, { c: colorOrRef })
            ).toBe(false);
            expect(
                isValid(
                    { c: { ref: 'accentColor', mix: 0.5, ontoColor: 'color(display-p3 1 0.5 0)' } },
                    { c: colorOrRef }
                )
            ).toBe(false);
        });

        it('rejects an ontoColor without a mix', () => {
            expect(isValid({ c: { ref: 'accentColor', ontoColor: '#ff5733' } }, { c: colorOrRef })).toBe(false);
        });

        it('accepts a nested var() fallback as ontoColor', () => {
            expect(
                isValid(
                    { c: { ref: 'accentColor', mix: 0.5, ontoColor: 'var(--brand, var(--fallback))' } },
                    { c: colorOrRef }
                )
            ).toBe(true);
        });

        it('rejects a malformed var() (unclosed or trailing text)', () => {
            expect(isValid({ c: { ref: 'accentColor', mix: 0.5, ontoColor: 'var(--brand' } }, { c: colorOrRef })).toBe(
                false
            );
            expect(
                isValid({ c: { ref: 'accentColor', mix: 0.5, ontoColor: 'var(--brand)junk' } }, { c: colorOrRef })
            ).toBe(false);
        });
    });

    describe('padding validator (AG-17973)', () => {
        test('rejects a negative scalar padding and warns', () => {
            const { cleared, invalid } = validate<{ padding?: number }>({ padding: -5 }, { padding });
            expect(cleared).toEqual({});
            const messages = invalid.map(String);
            expect(messages).toHaveLength(1);
            expect(messages[0]).toContain('Option `padding` cannot be set to `-5`');
            expect(messages[0]).toContain('expecting a number greater than or equal to 0');
        });

        test('drops only the invalid side of an object padding, keeping the valid sibling', () => {
            const { cleared, invalid } = validate<{ padding?: any }>({ padding: { top: -5, left: 10 } }, { padding });
            expect(cleared).toEqual({ padding: { left: 10 } });
            const messages = invalid.map(String);
            expect(messages).toHaveLength(1);
            expect(messages[0]).toContain('Option `padding.top` cannot be set to `-5`');
        });

        test('accepts zero for both scalar and object padding', () => {
            expect(isValid({ padding: 0 }, { padding })).toBe(true);
            expect(isValid({ padding: { top: 0, right: 0, bottom: 0, left: 0 } }, { padding })).toBe(true);
        });
    });

    describe('color', () => {
        it('rejects oklab(), lab(), lch() and color()', () => {
            expect(isValid({ c: 'oklab(0.5 0.1 0.1)' }, { c: color })).toBe(false);
            expect(isValid({ c: 'lab(50% 40 59.5)' }, { c: color })).toBe(false);
            expect(isValid({ c: 'lch(50% 70 40)' }, { c: color })).toBe(false);
            expect(isValid({ c: 'color(display-p3 1 0.5 0)' }, { c: color })).toBe(false);
        });

        it('still accepts none, a named color, hex, rgb() and hsl()', () => {
            // var(--brand) is deliberately not pinned here: jsdom's CSSStyleDeclaration (unlike
            // a real browser) rejects an unresolved var() reference as a specified color value
            // outright, so isColor's var()-passthrough can only be observed with the
            // container-based mockCssVarColorSupport shim, which is enterprise-only.
            expect(isValid({ c: 'none' }, { c: color })).toBe(true);
            expect(isValid({ c: 'red' }, { c: color })).toBe(true);
            expect(isValid({ c: '#ff5733' }, { c: color })).toBe(true);
            expect(isValid({ c: 'rgb(72, 120, 208)' }, { c: color })).toBe(true);
            expect(isValid({ c: 'hsl(145, 63%, 42%)' }, { c: color })).toBe(true);
        });

        // D1 guard: this change deliberately rejects only the four named formats via
        // isUnsupportedColorFormat, ahead of the existing browser parse — it must not narrow
        // the validator wholesale. currentColor renders today and must keep validating; the
        // corresponding hwb()/color-mix()/oklch() pins live in color.test.ts against
        // isUnsupportedColorFormat directly, because jsdom's CSS engine here does not
        // implement those functions, so parseColor() rejects them regardless of this change.
        it('still accepts currentColor (D1 guard: not narrowed wholesale)', () => {
            expect(isValid({ c: 'currentColor' }, { c: color })).toBe(true);
        });
    });
});

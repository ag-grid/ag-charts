import {
    and,
    array,
    arrayOf,
    attachDescription,
    boolean,
    callback,
    constant,
    instanceOf,
    number,
    object,
    optionsDefs,
    or,
    positiveNumber,
    ratio,
    required,
    string,
    union,
    validation,
} from './validation';

// Mock the Logger to avoid actual logging during tests
jest.mock('../../util/logger', () => ({
    Logger: { warn: jest.fn() },
}));

describe('Validation', () => {
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
                [object, [], false], // assuming array should not be considered as object
                [array, [], true],
                [array, 'not an array', false],
                [callback, () => {}, true],
                [callback, 'not a function', false],
            ])('%p validates %p as %p', (validator, input, expected) => {
                expect(validator(input)).toBe(expected);
            });
        });

        describe('Specialized type validators', () => {
            test.each([
                [positiveNumber, 1, true],
                [positiveNumber, -1, false],
                [ratio, 0.5, true],
                [ratio, -0.1, false],
                [ratio, 1.1, false],
            ])('%p validates %p as %p', (validator, input, expected) => {
                expect(validator(input)).toBe(expected);
            });
        });
    });

    describe('Combination Validators', () => {
        const isNonEmptyString = and(string, (value) => value !== '');
        const isStringOrNumber = or(string, number);

        test('and combines validators correctly', () => {
            expect(isNonEmptyString('hello')).toBe(true);
            expect(isNonEmptyString('')).toBe(false);
            expect(isNonEmptyString(42)).toBe(false);
        });

        test('or combines validators correctly', () => {
            expect(isStringOrNumber('hello')).toBe(true);
            expect(isStringOrNumber(42)).toBe(true);
            expect(isStringOrNumber(true)).toBe(false);
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

            expect(validation(validUser, userOptionsDef)).toBe(true);
            expect(validation(invalidUser, userOptionsDef)).toBe(false);
        });
    });

    describe('Utility Functions', () => {
        test('required marks a validator as required', () => {
            const requiredString = required(string);
            expect(validation({ value: '' }, { value: requiredString })).toBe(true); // Assuming empty string is valid for `string` validator
            expect(validation({ value: undefined }, { value: requiredString })).toBe(false); // Assuming `required` enforces presence
        });

        // should check the description in the logger
        test.skip('attachDescription adds a description to a validator', () => {
            const describedValidator = attachDescription(string, 'a string');
            expect((describedValidator as any)[Symbol.for('description')]).toBe('a string');
        });
    });

    describe('Union Validator', () => {
        const isRedOrBlue = union('red', 'blue');

        test('validates correctly against multiple allowed values', () => {
            expect(isRedOrBlue('red')).toBe(true);
            expect(isRedOrBlue('blue')).toBe(true);
            expect(isRedOrBlue('green')).toBe(false);
        });
    });

    describe('Constant Validator', () => {
        const isTrue = constant(true);

        test('validates only the exact value', () => {
            expect(isTrue(true)).toBe(true);
            expect(isTrue(false)).toBe(false);
            expect(isTrue('true')).toBe(false);
        });
    });

    describe('InstanceOf Validator', () => {
        class TestClass {}

        const isInstanceOfTestClass = instanceOf(TestClass);

        test('validates instances of the specified class', () => {
            expect(isInstanceOfTestClass(new TestClass())).toBe(true);
            expect(isInstanceOfTestClass({})).toBe(false);
        });
    });

    describe('ArrayOf Validator', () => {
        const isArrayOfStrings = arrayOf(string);

        test('validates arrays where every element passes the given validator', () => {
            expect(isArrayOfStrings(['a', 'b', 'c'])).toBe(true);
            expect(isArrayOfStrings(['a', 1, 'c'])).toBe(false);
            expect(isArrayOfStrings('not an array')).toBe(false);
        });
    });

    // Extending the tests for combination validators: `and`, `or`
    // ...

    describe('OptionsDefs Validator', () => {
        const optionDefsValidator = optionsDefs({
            key1: string,
            key2: number,
        });

        test('validates objects against provided definitions', () => {
            expect(optionDefsValidator({ key1: 'value', key2: 42 })).toBe(true);
            expect(optionDefsValidator({ key1: 'value', key2: 'not a number' })).toBe(false);
        });
    });

    describe('Main Validation Function', () => {
        const userSchema = {
            name: required(string),
            age: and(number, positiveNumber),
            hobbies: arrayOf(string),
            // Adding nested object for comprehensive testing
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
                name: '', // Required failure
                age: -5, // positiveNumber failure
                hobbies: ['reading', 123], // arrayOf failure
                address: {
                    street: '123 Elm St',
                    city: '', // Assuming empty string is invalid for `string` validator
                },
            };

            expect(validation(validUser, userSchema)).toBe(true);
            expect(validation(invalidUser, userSchema)).toBe(false);
        });
    });
});

import { describe, expect, it } from '@jest/globals';

import { jsonResolveOperations } from './jsonOperators';
import { expectWarningMessages, setupMockConsole } from './test/mockConsole';

describe('json operators', () => {
    describe('#jsonResolveOperations', () => {
        setupMockConsole();

        // Location operations
        it('should resolve `$ref` operation with params', () => {
            const source = { a: { $ref: 'key' } };
            jsonResolveOperations(source, { key: 'hello' });
            expect(source).toEqual({ a: 'hello' });
        });

        it('should warn on invalid `$ref` operation', () => {
            const source = { a: { $ref: 'missing' } };
            jsonResolveOperations(source, { key: 'hello', other: 'world' });
            expect(source).toEqual({ a: undefined });
            expectWarningMessages([
                'AG Charts - `$ref` json operation failed on [missing] at [a], expecting one of [key, other].',
            ]);
        });

        it('should resolve `$ref` operation on second `$ref` operation', () => {
            const source = { a: { $ref: 'first' } };
            jsonResolveOperations(source, { first: { $ref: 'second' }, second: 'hello' });
            expect(source).toEqual({ a: 'hello' });
        });

        it('should catch circular references', () => {
            const source = { a: { $ref: 'first' } };
            jsonResolveOperations(source, {
                first: { $ref: 'second' },
                second: { $ref: 'third' },
                third: { $ref: 'first' },
            });
            expect(source).toEqual({ a: undefined });
            expectWarningMessages([
                'AG Charts - `$ref` json operation failed on [first] at [a], circular reference detected with [second, third, first].',
            ]);
        });

        it('should resolve `$path` operation', () => {
            const source = {
                a: 'parent',
                b: {
                    c: 'cousin',
                },
                d: {
                    e: 'sibling',
                    f: { $path: './e' },
                    g: { $path: '../a' },
                    h: { $path: '../b/c' },
                    i: { $path: '/a' },
                },
            };
            jsonResolveOperations(source, {});
            expect(source).toEqual({
                a: 'parent',
                b: { c: 'cousin' },
                d: { e: 'sibling', f: 'sibling', g: 'parent', h: 'cousin', i: 'parent' },
            });
        });

        it('should warn on invalid `$path` operations', () => {
            const source = {
                a: 'parent',
                b: {
                    c: 'cousin',
                },
                d: {
                    e: 'sibling',
                    f: { $path: '../e' },
                },
            };
            jsonResolveOperations(source, {});
            expect(source).toEqual({
                a: 'parent',
                b: { c: 'cousin' },
                d: { e: 'sibling', f: undefined },
            });
            expectWarningMessages([
                'AG Charts - `$path` json operation failed on [../e] at [d.f] resolved to [e], could not find path in object.',
            ]);
        });

        it('should resolve `$path` operations with `$index`', () => {
            const source = {
                a: [{ greeting: 'hello' }, { greeting: 'bonjour' }],
                b: ['other', { $path: '/a/$index/greeting' }],
            };
            jsonResolveOperations(source, {});
            expect(source).toEqual({ a: [{ greeting: 'hello' }, { greeting: 'bonjour' }], b: ['other', 'bonjour'] });
        });

        it('should resolve `$path` operations with `$prevIndex`', () => {
            const source = {
                a: [{ greeting: 'hello' }, { greeting: 'bonjour' }],
                b: [{ $path: ['/a/$prevIndex/greeting', undefined] }, { $path: '/a/$prevIndex/greeting' }],
            };
            jsonResolveOperations(source, {});

            // Requires a default fallback value since `$prevIndex` does not handle circular indices
            expect(source).toEqual({ a: [{ greeting: 'hello' }, { greeting: 'bonjour' }], b: [undefined, 'hello'] });
        });

        it("should resolve `$value: '$1'` operations", () => {
            const source = {
                a: [{ greeting: 'hello' }, { greeting: 'bonjour' }],
                b: ['other', { $value: '$1' }],
            };
            jsonResolveOperations(source, {});

            // Since this is outside a transform operation, `$value: '$1'` points to itself and so correctly resolves to `undefined`
            expect(source).toEqual({ a: [{ greeting: 'hello' }, { greeting: 'bonjour' }], b: ['other', undefined] });
        });

        it("should resolve `$value: '$index'` operations", () => {
            const source = {
                a: [{ greeting: 'hello' }, { greeting: 'bonjour' }],
                b: [{ $value: '$index' }, { $value: '$index' }],
            };
            jsonResolveOperations(source, {});
            expect(source).toEqual({ a: [{ greeting: 'hello' }, { greeting: 'bonjour' }], b: [0, 1] });
        });

        // Logical operations
        it('should resolve `$eq` operation with strict equality', () => {
            const source = { a: { $eq: [1, 1] }, b: { $eq: [1, '1'] }, c: { $eq: ['hello', 'hello'] } };
            jsonResolveOperations(source, {});
            expect(source).toEqual({ a: true, b: false, c: true });
        });

        it('should resolve `$not` operation', () => {
            const source = { a: { $not: [true] }, b: { $not: [false] }, c: { $not: ['hello'] } };
            jsonResolveOperations(source, {});
            expect(source).toEqual({ a: false, b: true, c: false });
        });

        it('should resolve `$or` operation', () => {
            const source = { a: { $or: [true, true] }, b: { $or: [true, false] }, c: { $or: [false, false] } };
            jsonResolveOperations(source, {});
            expect(source).toEqual({ a: true, b: true, c: false });
        });

        it('should resolve `$and` operation', () => {
            const source = { a: { $and: [true, true] }, b: { $and: [true, false] }, c: { $and: [false, false] } };
            jsonResolveOperations(source, {});
            expect(source).toEqual({ a: true, b: false, c: false });
        });

        it('should resolve `$if` operation', () => {
            const source = { a: { $if: [true, 'yes', 'no'] }, b: { $if: [false, 'yes', 'no'] } };
            jsonResolveOperations(source, {});
            expect(source).toEqual({ a: 'yes', b: 'no' });
        });

        it('should resolve `$isOperation` operation', () => {
            const source = { a: { $isOperation: './b' }, b: { $not: [true] }, c: { $isOperation: './b' } };
            jsonResolveOperations(source, {});
            // Note: `a` resolves before `b`, so it considers `b` to be an operation, while `c` resolves after `b` has
            // been resolved to a value.
            expect(source).toEqual({ a: true, b: false, c: false });
        });

        // Numeric operations
        it('should resolve `$isEven` operation', () => {
            const source = { a: { $isEven: [0] }, b: { $isEven: [1] }, c: { $isEven: [2] } };
            jsonResolveOperations(source, {});
            expect(source).toEqual({ a: true, b: false, c: true });
        });

        it('should resolve `$mul` operation', () => {
            const source = { a: { $mul: [2, 4] } };
            jsonResolveOperations(source, {});
            expect(source).toEqual({ a: 8 });
        });

        it('should warn on invalid `$mul` operation', () => {
            const source = { a: { $mul: [2, 'hello'] } };
            jsonResolveOperations(source, {});
            expect(source).toEqual({ a: undefined });
            expectWarningMessages([
                'AG Charts - `$mul` json operation failed on [2] and [hello] at [a], expecting two numbers.',
            ]);
        });

        it('should resolve `$round` operation', () => {
            const source = { a: { $round: [1.234] }, b: { $round: [1.987] } };
            jsonResolveOperations(source, {});
            expect(source).toEqual({ a: 1, b: 2 });
        });

        // Transform operations
        it('should resolve `$map` and `$value` operations', () => {
            const source = { a: ['hello', 'bonjour'], b: { $map: [{ $value: '$1' }, { $path: '/a' }] } };
            jsonResolveOperations(source, {});
            expect(source).toEqual({ a: ['hello', 'bonjour'], b: ['hello', 'bonjour'] });
        });

        it('should resolve `$map` and `$path` operations with `$index`', () => {
            const source = {
                a: [{ greeting: 'hello' }, { greeting: 'bonjour' }],
                b: { $map: [{ $path: '/a/$index/greeting' }, { $path: '/a' }] },
            };
            jsonResolveOperations(source, {});
            expect(source).toEqual({ a: [{ greeting: 'hello' }, { greeting: 'bonjour' }], b: ['hello', 'bonjour'] });
        });

        it('should resolve `$map` and `$path` operations with `$prevIndex`', () => {
            const source = {
                a: [{ greeting: 'hello' }, { greeting: 'bonjour' }],
                b: { $map: [{ $path: ['/a/$prevIndex/greeting', undefined] }, { $path: '/a' }] },
            };
            jsonResolveOperations(source, {});
            expect(source).toEqual({ a: [{ greeting: 'hello' }, { greeting: 'bonjour' }], b: [undefined, 'hello'] });
        });

        it('should resolve `$find` operations', () => {
            const source = {
                a: [{ greeting: 'hello' }, { greeting: 'bonjour' }, { greeting: 'howdy' }],
                b: { $find: [{ $eq: [{ $path: './greeting' }, 'bonjour'] }, { $path: './a' }] },
            };
            jsonResolveOperations(source, {});
            expect(source).toEqual({
                a: [{ greeting: 'hello' }, { greeting: 'bonjour' }, { greeting: 'howdy' }],
                b: { greeting: 'bonjour' },
            });
        });

        it('should resolve `$find` operations wrapped in `$path`', () => {
            const source = {
                a: [{ greeting: 'hello' }, { greeting: 'bonjour' }, { greeting: 'howdy' }],
                b: {
                    $path: [
                        './greeting',
                        'default',
                        { $find: [{ $eq: [{ $path: './greeting' }, 'bonjour'] }, { $path: './a' }] },
                    ],
                },
            };
            jsonResolveOperations(source, {});
            expect(source).toEqual({
                a: [{ greeting: 'hello' }, { greeting: 'bonjour' }, { greeting: 'howdy' }],
                b: 'bonjour',
            });
        });

        it('should resolve `$find` and safely handle circular references with `$isOperation` operation', () => {
            const source = {
                a: [
                    { $find: [{ $not: [{ $isOperation: true }] }, { $path: '../a' }] },
                    { greeting: 'bonjour', lang: 'fr' },
                    { greeting: 'howdy', lang: 'en-US' },
                ],
            };
            jsonResolveOperations(source, {});
            expect(source).toEqual({
                a: [
                    { greeting: 'bonjour', lang: 'fr' },
                    { greeting: 'bonjour', lang: 'fr' },
                    { greeting: 'howdy', lang: 'en-US' },
                ],
            });
        });

        it('should resolve `$find` and safely handle circular references with `$isOperation` operation on child', () => {
            const source = {
                a: [
                    {
                        greeting: {
                            $path: [
                                './greeting',
                                'default value',
                                { $find: [{ $not: [{ $isOperation: './greeting' }] }, { $path: '..' }] },
                            ],
                        },
                        lang: 'en',
                    },
                    { greeting: 'bonjour', lang: 'fr' },
                    { greeting: 'howdy', lang: 'en-US' },
                ],
            };
            jsonResolveOperations(source, {});
            expect(source).toEqual({
                a: [
                    { greeting: 'bonjour', lang: 'en' },
                    { greeting: 'bonjour', lang: 'fr' },
                    { greeting: 'howdy', lang: 'en-US' },
                ],
            });
        });

        it('should resolve `$merge` operation', () => {
            const source = {
                a: { hello: 'world', bonjour: 'monde' },
                b: { $merge: [{ hello: 'test', goodbye: 'test' }, { $path: '/a' }] },
            };
            jsonResolveOperations(source, {});
            expect(source).toEqual({
                a: { hello: 'world', bonjour: 'monde' },
                b: { hello: 'test', goodbye: 'test', bonjour: 'monde' },
            });
        });

        it('should resolve `$omit` operations', () => {
            const source = { a: { $omit: [['b'], { b: 'hello', c: 'world' }] } };
            jsonResolveOperations(source, {});
            expect(source).toEqual({ a: { c: 'world' } });
        });

        // Font operations
        it('should resolve `$rem` operation', () => {
            const source = { a: { $rem: [1.5] } };
            jsonResolveOperations(source, { fontSize: 12 });
            expect(source).toEqual({ a: 18 });
        });

        // Color operations
        it('should resolve `$mix` operation', () => {
            const source = { a: { $mix: ['#ffffff', '#000000', 0.5] } };
            jsonResolveOperations(source, {});
            expect(source).toEqual({ a: '#808080' });
        });

        it('should resolve `$mix` operation with gradients', () => {
            const source = {
                a: {
                    $mix: [
                        {
                            type: 'gradient',
                            colorStops: [{ color: '#ffffff' }, { color: '#ffff00', stop: 0.3 }, { color: '#ff0000' }],
                        },
                        '#000000',
                        0.5,
                    ],
                },
            };
            jsonResolveOperations(source, {});
            expect(source).toEqual({
                a: {
                    type: 'gradient',
                    colorStops: [{ color: '#808080' }, { color: '#808000', stop: 0.3 }, { color: '#800000' }],
                },
            });
        });

        // Combined
        it('should resolve nested operations', () => {
            const source = {
                a: { $ref: 'indirectRelative' },
                b: {
                    c: 'cousin',
                },
                d: {
                    e: 'sibling',
                    f: {
                        $if: [
                            { $or: [{ $eq: [{ $path: '../a' }, 'cousin'] }, { $eq: [{ $path: '../a' }, 'parent'] }] },
                            { $ref: 'key' },
                            'no',
                        ],
                    },
                },
            };
            jsonResolveOperations(source, { key: 'hello', indirectRelative: { $ref: 'relative' }, relative: 'parent' });
            expect(source).toEqual({
                a: 'parent',
                b: { c: 'cousin' },
                d: { e: 'sibling', f: 'hello' },
            });
        });
    });
});

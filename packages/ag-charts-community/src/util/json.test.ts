import { describe, expect, it, jest } from '@jest/globals';

import { PlainObject } from 'ag-charts-core';

import { deepClone, jsonApply, jsonDiff, jsonPropertyCompare, jsonResolveOperations, jsonWalk } from './json';
import { mergeDefaults } from './object';
import { expectWarningMessages, setupMockConsole } from './test/mockConsole';

const FIXED_DATE = new Date('2022-01-27T00:00:00.000+00:00');

class TestApply {
    num?: number = undefined;
    str?: string = undefined;
    date?: Date = undefined;
    array?: number[] = undefined;
    recurse?: TestApply = undefined;
    _declarationOrder?: number = undefined;

    constructor(params: { [K in keyof TestApply]?: TestApply[K] } = {}) {
        Object.assign(this, params);
    }
}

describe('json module', () => {
    describe('#jsonDiff', () => {
        describe('for trivial cases', () => {
            it('should return null for no diff', () => {
                const cases: object[] = [
                    {},
                    { a: 1, b: { c: 'abc', d: () => 'test' } },
                    { a: [{ foo: 'bar' }], b: { c: 'abc', d: () => 'test' } },
                ];

                for (const testCase of cases) {
                    expect(jsonDiff(testCase, testCase)).toBeNull();
                }

                expect(jsonDiff({}, {})).toBeNull();
            });

            it('should correctly diff primitives', () => {
                const source = {};
                const target = {
                    foo: 'bar',
                    hello: 123,
                    alice: FIXED_DATE,
                    func: (test: any) => test,
                };

                const diff = jsonDiff(source, target);
                expect(diff).toMatchSnapshot();
            });

            it('should correctly diff with negative values', () => {
                const source = { a: [5], b: true };
                const target = { a: [0], b: false };

                const diff = jsonDiff(source, target);
                expect(diff).toMatchSnapshot();
            });
        });

        describe('for non-trivial cases', () => {
            it('should correctly diff complex object structures', () => {
                const source: any = {
                    foo: { bar1: 1 },
                    hello1: { nested: { nestedX2: { primitive: 'abc' } } },
                    unchanging: { readonly: 1 },
                    changing: 'abc',
                    removed: 123,
                    removed2: { nested: { nestedX2: { primitive: 'abc' } } },
                };
                const target: any = {
                    foo: { bar1: 2 },
                    hello1: {
                        nested: { nestedX2: { primitive: 'abc', added: 123 } },
                        nestedAdd: { primitive: 123 },
                    },
                    unchanging: { readonly: 1 },
                    changing: '123',
                };

                const diff = jsonDiff(source, target);
                expect(diff).toMatchSnapshot();
                expect(diff).toHaveProperty('foo.bar1', target.foo.bar1);
                expect(diff).toHaveProperty('hello1.nested.nestedX2.added', 123);
                expect(diff).toHaveProperty('changing', target.changing);
                expect(diff).toHaveProperty('removed', undefined);
                expect(diff).toHaveProperty('removed2', undefined);
                expect(diff).not.toHaveProperty('unchanging');
                expect(diff).not.toHaveProperty('hello1.nestedX2.primitive');
            });

            it('should correctly diff identical arrays', () => {
                const source = {
                    foo: [1, 2, 3, 4],
                };

                const diff = jsonDiff(source, source);
                expect(diff).toBeNull();
            });

            it('should correctly diff mismatching arrays', () => {
                const source = {
                    foo: [1, 2, 3, 4],
                };
                const target = {
                    foo: [9, 8, 7, 6],
                };

                const diff = jsonDiff(source, target);
                expect(diff).toEqual(target);
            });

            it('should correctly diff function changes in arrays', () => {
                const source = {
                    foo: [{ fn: () => 'hello-world!' }],
                };
                const target = {
                    foo: [{ fn: () => 'foo-bar!?!?!' }],
                };

                const diff = jsonDiff(source, target);
                expect(diff).toMatchSnapshot();
                expect(diff).toHaveProperty(['foo', '0', 'fn'], target.foo[0].fn);
            });

            it('should correctly diff dictionary of functions (added)', () => {
                const source = { listeners: {} };
                const target = { listeners: { seriesNodeClick: (t: unknown) => console.log(t) } };

                const diff = jsonDiff(source, target);
                expect(diff).toStrictEqual(target);
            });

            it('should correctly diff dictionary of functions (removed)', () => {
                const source = { listeners: { seriesNodeClick: (t: unknown) => console.log(t) } };
                const target = { listeners: { seriesNodeClick: undefined } };

                const diff = jsonDiff<typeof source | typeof target>(source, target);
                expect(diff).toStrictEqual(target);
            });

            it('should correctly diff dictionary of functions when no difference', () => {
                const seriesNodeClick = (t: unknown) => console.log(t);
                const source = { legend: { listeners: { seriesNodeClick } } };
                const target = { legend: { listeners: { seriesNodeClick } } };

                const diff = jsonDiff(source, target);
                expect(diff).toEqual(null);
            });
        });
    });

    describe('#mergeDefaults', () => {
        describe('for trivial cases', () => {
            it('should merge primitives correctly', () => {
                const fns = [() => 'call-me1', () => 'call-me2', () => 'call-me3'];
                const base = {
                    no: 1,
                    foo: 'bar',
                    fn: fns[0],
                    date: FIXED_DATE,
                };
                const mergee1 = {
                    no: 2,
                    foo2: 'bar2',
                    fn2: fns[1],
                    date2: FIXED_DATE,
                };
                const mergee2 = {
                    no2: 2,
                    foo3: 'bar2',
                    fn2: fns[2],
                    date3: FIXED_DATE,
                };

                const merge = mergeDefaults(mergee2, mergee1, base);
                expect(merge).toMatchSnapshot();
                expect(merge).toHaveProperty('no', mergee1.no);
                expect(merge).toHaveProperty('no2', mergee2.no2);
                expect(merge).toHaveProperty('foo', base.foo);
                expect(merge).toHaveProperty('foo2', mergee1.foo2);
                expect(merge).toHaveProperty('foo3', mergee2.foo3);
                expect(merge).toHaveProperty('fn', base.fn);
                expect(merge).toHaveProperty('fn2', mergee2.fn2);
                expect(merge).toHaveProperty('date', base.date);
                expect(merge).toHaveProperty('date2', mergee1.date2);
                expect(merge).toHaveProperty('date3', mergee2.date3);
            });

            it('should merge array properties correctly', () => {
                const base: any = {
                    a: [[{ x: 1 }, { y: 1 }], [{ m: 2, n: 2 }]],
                    b: [1, 2, 3, 4, 5, 6],
                };
                const mergee1: any = { a: [], b: [] };
                const mergee2: any = {
                    a: [[{ x2: 1 }, { y2: 1 }], [{ m2: 2, n2: 2 }]],
                    c: [10, 9, 8, 7, 6],
                };

                const merge = mergeDefaults(mergee2, mergee1, base);
                expect(merge).toMatchSnapshot();
                expect(merge).toHaveProperty('a', mergee2.a);
                expect(merge).toHaveProperty('b', mergee1.b);
                expect(merge).toHaveProperty('c', mergee2.c);
            });

            it('should merge arrays correctly', () => {
                const base: any = { a: [[{ x: 1 }, { y: 1 }], [{ m: 2, n: 2 }]] };
                const mergee1: any = { a: [] };
                const mergee2: any = { a: [[{ x2: 1 }, { y2: 1 }], [{ m2: 2, n2: 2 }]] };

                const merge = mergeDefaults(mergee2, mergee1, base);
                expect(merge).toMatchSnapshot();
                expect(merge).toEqual(mergee2);
            });

            it('should take highest precedent value when types conflict', () => {
                const base = { a: [[{ x: 1 }, { y: 1 }], [{ m: 2, n: 2 }]], b: [1, 2, 3, 4, 5, 6] };
                const mergee1 = { a: {}, b: {} };
                const mergee2 = { a: 'a' };

                const merge = mergeDefaults(mergee2, mergee1, base);
                expect(merge).toMatchSnapshot();
                expect(merge).toHaveProperty('a', mergee2.a);
                expect(merge).toHaveProperty('b', mergee1.b);
            });
        });

        describe('for objects and arrays', () => {
            it('should create deep clones for objects', () => {
                const base = { a: { x: 1 } };
                const mergee1 = { a: { y: 2 } };
                const mergee2 = { a: { z: 3 } };

                const merge = mergeDefaults(mergee2, mergee1, base);
                expect(merge).toMatchSnapshot();
                expect(merge).not.toBe(base);
                expect(merge).not.toBe(mergee1);
                expect(merge).not.toBe(mergee2);
                expect(merge.a).not.toBe(base.a);
                expect(merge.a).not.toBe(mergee1.a);
                expect(merge.a).not.toBe(mergee2.a);
                expect(merge.a).toHaveProperty('x', 1);
                expect(merge.a).toHaveProperty('y', 2);
                expect(merge.a).toHaveProperty('z', 3);
            });

            it('should create deep clones for arrays', () => {
                const base = { a: [{ x: 1 }, { x: 2 }] };
                const mergee = { a: [{ y: 1 }] };

                const merge = deepClone(mergeDefaults(mergee, base));
                expect(merge).toMatchSnapshot();
                expect(merge).not.toBe(base);
                expect(merge).not.toBe(mergee);
                expect(merge.a).toBeInstanceOf(Array);
                expect(merge.a).not.toBe(base.a);
                expect(merge.a).not.toBe(mergee.a);
                expect(merge.a.length).toEqual(mergee.a.length);
                expect(merge.a[0]).not.toBe(mergee.a[0]);
                expect(merge.a[0]).toHaveProperty('y', 1);
                expect(merge.a[0]).not.toHaveProperty('x');
            });

            it('should honour `avoidDeepClone', () => {
                const base: any = {};
                const mergee = { a: [{ x: 1 }], b: [{ y: 2 }] };

                const merge = deepClone(mergeDefaults(mergee, base), { shallow: new Set(['b']) });
                expect(merge).toMatchSnapshot();
                expect(merge).not.toBe(base);
                expect(merge).not.toBe(mergee);
                expect(merge.a).toBeInstanceOf(Array);
                expect(merge.b).toBeInstanceOf(Array);
                expect(merge.a).not.toBe(mergee.a);
                expect(merge.b).not.toBe(mergee.b);
                expect(merge.b).toStrictEqual(mergee.b);
                expect(merge.a.length).toEqual(mergee.a.length);
                expect(merge.b.length).toEqual(mergee.b.length);
                expect(merge.a[0]).not.toBe(mergee.a[0]);
                expect(merge.a[0]).toHaveProperty('x', 1);
                expect(merge.b[0]).toBe(mergee.b[0]);
                expect(merge.b[0]).toHaveProperty('y', 2);
            });

            it('should correctly merge dictionary of functions', () => {
                const source = {};
                const target = { seriesNodeClick: (t: unknown) => console.log(t) };

                const merge = mergeDefaults(target, source);
                expect(merge).toHaveProperty('seriesNodeClick');
                expect(merge.seriesNodeClick).toBeInstanceOf(Function);
            });

            it('should correctly merge dictionary of functions when no difference', () => {
                const seriesNodeClick = (t: unknown) => console.log(t);
                const source = { legend: { listeners: { seriesNodeClick } } };
                const target = { listeners: { seriesNodeClick } };

                const merge = mergeDefaults(target, source);
                expect(merge).toHaveProperty('legend.listeners.seriesNodeClick');
                expect(merge).toHaveProperty('listeners.seriesNodeClick');
                expect(merge.legend?.listeners?.seriesNodeClick).toBeInstanceOf(Function);
                expect(merge.listeners?.seriesNodeClick).toBeInstanceOf(Function);
            });
        });
    });

    describe('#jsonWalk', () => {
        it('should visit no nodes for no object', () => {
            for (const test of [undefined, null, 'a', 1, FIXED_DATE]) {
                const cb = jest.fn();
                jsonWalk(test, cb, undefined, test);
                expect(cb).toHaveBeenCalledTimes(0);
            }
        });

        it('should not visit property nodes for no object', () => {
            for (const test of [undefined, null, 'a', 1, FIXED_DATE]) {
                const wrappedTest = { test };

                const cb = jest.fn();
                jsonWalk(wrappedTest, cb, undefined, wrappedTest);
                expect(cb).toHaveBeenCalledWith(wrappedTest, wrappedTest, undefined, undefined);
                expect(cb).toHaveBeenCalledTimes(1);
            }
        });

        it('should only visit one node for a trivial object', () => {
            const walked1 = { a: 1, b: 2, c: 'c', d: FIXED_DATE };
            const walked2 = { a: 2, b: 3, c: 'd', d: FIXED_DATE };

            const cb = jest.fn();
            jsonWalk(walked1, cb, undefined, walked2);
            expect(cb).toHaveBeenCalledTimes(1);
            expect(cb).toHaveBeenCalledWith(walked1, walked2, undefined, undefined);
        });

        it('should visit every node for a non-trivial object', () => {
            const walked1 = {
                a: 1,
                b: 2,
                c: 'c',
                d: FIXED_DATE,
                child1: { foo: 'bar' },
                child2: { hello: 'world', child3: { x: 'x' } },
            };
            const walked2 = { a: 2, b: 3, c: 'd', d: FIXED_DATE, child1: { foo: 'bar' } };

            const cb = jest.fn();
            jsonWalk(walked1, cb, undefined, walked2);
            expect(cb).toHaveBeenCalledWith(walked1, walked2, undefined, undefined);
            expect(cb).toHaveBeenCalledWith(walked1.child1, walked2.child1, undefined, undefined);
            expect(cb).toHaveBeenCalledWith(walked1.child2, undefined, undefined, undefined);
            expect(cb).toHaveBeenCalledWith(walked1.child2.child3, undefined, undefined, undefined);
            expect(cb).toHaveBeenCalledTimes(4);
        });

        it('should pass accumulator value appropriately', () => {
            const walked1 = {
                a: 1,
                b: 2,
                c: 'c',
                d: FIXED_DATE,
                child1: { foo: 'bar' },
                child2: { hello: 'world', child3: { x: 'x' } },
            };
            const walked2 = { a: 2, b: 3, c: 'd', d: FIXED_DATE, child1: { foo: 'bar' } };

            const ctx = {};
            const cb = jest.fn((_a, _b, _c, acc: number = -1) => acc + 1);
            const result = jsonWalk(walked1, cb, undefined, walked2, ctx, 0);
            expect(cb).toHaveBeenCalledWith(walked1, walked2, ctx, 0);
            expect(cb).toHaveBeenCalledWith(walked1.child1, walked2.child1, ctx, 1);
            expect(cb).toHaveBeenCalledWith(walked1.child2, undefined, ctx, 2);
            expect(cb).toHaveBeenCalledWith(walked1.child2.child3, undefined, ctx, 3);
            expect(cb).toHaveBeenCalledTimes(4);
            expect(result).toEqual(4);
        });

        it('should visit every node of an array', () => {
            const walked1 = [{ a: 1 }, { b: 2 }, { c: 3 }, { d: 4 }];
            const walked2 = [{ x: 1 }, { y: 2 }, { z: 3 }];

            const cb = jest.fn();
            jsonWalk(walked1, cb, undefined, walked2);
            expect(cb).toHaveBeenCalledWith(walked1, walked2, undefined, undefined);
            expect(cb).toHaveBeenCalledWith(walked1[0], walked2[0], undefined, undefined);
            expect(cb).toHaveBeenCalledWith(walked1[1], walked2[1], undefined, undefined);
            expect(cb).toHaveBeenCalledWith(walked1[2], walked2[2], undefined, undefined);
            expect(cb).toHaveBeenCalledWith(walked1[3], undefined, undefined, undefined);
            expect(cb).toHaveBeenCalledTimes(5);
        });

        it('should visit every node of an array property', () => {
            const walked1 = { prop1: [{ a: 1 }, { b: 2 }, { c: 3 }, { d: 4 }] };
            const walked2 = { prop1: [{ x: 1 }, { y: 2 }, { z: 3 }] };

            const cb = jest.fn();
            jsonWalk(walked1, cb, undefined, walked2);
            expect(cb).toHaveBeenCalledWith(walked1, walked2, undefined, undefined);
            expect(cb).toHaveBeenCalledWith(walked1.prop1, walked2.prop1, undefined, undefined);
            expect(cb).toHaveBeenCalledWith(walked1.prop1[0], walked2.prop1[0], undefined, undefined);
            expect(cb).toHaveBeenCalledWith(walked1.prop1[1], walked2.prop1[1], undefined, undefined);
            expect(cb).toHaveBeenCalledWith(walked1.prop1[2], walked2.prop1[2], undefined, undefined);
            expect(cb).toHaveBeenCalledWith(walked1.prop1[3], undefined, undefined, undefined);
            expect(cb).toHaveBeenCalledTimes(6);
        });

        it('should skip specified properties', () => {
            const walked1 = {
                a: 1,
                b: 2,
                c: 'c',
                d: FIXED_DATE,
                child1: { foo: 'bar' },
                child2: { hello: 'world', child3: { x: 'x' } },
            };
            const walked2 = { a: 2, b: 3, c: 'd', d: FIXED_DATE, child1: { foo: 'bar' } };

            const cb = jest.fn();
            jsonWalk(walked1, cb, new Set(['child1', 'child3']), walked2);
            expect(cb).toHaveBeenCalledWith(walked1, walked2, undefined, undefined);
            expect(cb).toHaveBeenCalledWith(walked1.child2, undefined, undefined, undefined);
            expect(cb).toHaveBeenCalledTimes(2);
        });
    });

    describe('#jsonApply', () => {
        beforeEach(() => {
            console.warn = jest.fn();
        });

        const json: any = {
            str: 'test-string',
            num: 123,
            date: FIXED_DATE,
            array: [1, 2, 3, 4],
            recurse: { str: 'test-string2', num: 789, date: FIXED_DATE, array: [1, 2, 3, 4] },
        };

        it('should be able to populate an existing object graph', () => {
            const target = new TestApply({ recurse: new TestApply() });
            jsonApply(target, json);
            expect(target.str).toEqual(json.str);
            expect(target.num).toEqual(json.num);
            expect(target.date).toEqual(json.date);
            expect(target.array).toEqual(json.array);
            expect(target.recurse).toBeInstanceOf(TestApply);
            expect(target.recurse?.str).toEqual(json.recurse.str);
            expect(target.recurse?.num).toEqual(json.recurse.num);
            expect(target.recurse?.date).toEqual(json.recurse.date);
            expect(target.recurse?.array).toEqual(json.recurse.array);
        });

        it('should skip specified properties', () => {
            const target = new TestApply();
            jsonApply(target, json, { skip: ['recurse.str', 'str'] });
            expect(target.str).toEqual(undefined);
            expect(target.recurse?.str).toEqual(undefined);
        });

        it('should error on unrecognised properties', () => {
            const badJson = { foo: 'bar' };
            const target = new TestApply();

            jsonApply(target, badJson as any);
            expect(console.warn).toBeCalledWith('AG Charts - unable to set [foo] in TestApply - property is unknown');
        });

        it('should error on undefined objects', () => {
            const target = new TestApply();

            jsonApply(target, json);
            expect(console.warn).toBeCalledWith(
                'AG Charts - unable to set [recurse] in TestApply - property is unknown'
            );
        });

        it('should error on incompatible properties', () => {
            const badJson = { recurse: 'foo' };
            const target = new TestApply({ recurse: new TestApply() });

            jsonApply(target, badJson as any);
            expect(console.warn).toBeCalledWith(
                "AG Charts - unable to set [recurse] in TestApply - can't apply type of [primitive], allowed types are: [class-instance]"
            );
        });
    });

    describe('#jsonPropertyCompare', () => {
        it('should return true with matching property values', () => {
            const source = { a: 1, b: true, c: 'three' };
            const target = { a: 1, b: true, c: 'three', d: 4 };

            expect(jsonPropertyCompare(source, target)).toEqual(true);
        });

        it('should return false with mismatching property values', () => {
            const source = { a: 1, b: true, c: 'three' };

            for (const key of Object.keys(source) as (keyof typeof source)[]) {
                const target = { ...source, [key]: (source[key] as any) + 1 };
                expect(jsonPropertyCompare(source, target)).toEqual(false);
            }
        });

        it('should return false with missing properties', () => {
            const source = { a: 1, b: true, c: 'three' };

            for (const key of Object.keys(source) as (keyof typeof source)[]) {
                const target = { ...source };
                delete target[key];
                expect(jsonPropertyCompare(source, target)).toEqual(false);
            }
        });

        it('should return false for undefined target', () => {
            const source = { a: 1, b: true, c: 'three' };

            expect(jsonPropertyCompare(source, undefined as any)).toEqual(false);
        });
    });

    describe('#jsonResolveOperations', () => {
        setupMockConsole();

        it('should resolve nested operations', () => {
            const source = { a: { b: { $ref: 'key' } }, c: [{ $ref: 'key' }, 'other', { $ref: 'key' }] };
            const params = { key: 'ref', second: 'ref' };
            const resolved = jsonResolveOperations([source], params);
            expect(resolved).toEqual({ a: { b: 'ref' }, c: ['ref', 'other', 'ref'] });
        });

        it('should resolve operations within operations', () => {
            const source = {
                a: { $path: [{ $path: '/b' }, 'default'] },
                b: { $path: '/c' },
                c: '/d',
                d: 'd-value',
            };
            const resolved = jsonResolveOperations([source]);
            expect(resolved).toEqual({ a: 'd-value', b: '/d', c: '/d', d: 'd-value' });
        });

        it('should merge sources', () => {
            const options = { a: 'options-a' };
            const defaults = { a: 'defaults-a', b: 'defaults-b' };
            const resolved = jsonResolveOperations([options, defaults]);
            expect(resolved).toEqual({ a: 'options-a', b: 'defaults-b' });
        });

        it('should merge sources with operations', () => {
            const options = { a: 'options-a', c: { $ref: 'key' } };
            const defaults = { a: { $ref: 'key' }, b: { $ref: 'key' }, d: 'defaults-d' };
            const params = { key: 'ref' };
            const resolved = jsonResolveOperations([options, defaults], params);
            expect(resolved).toEqual({ a: 'options-a', b: 'ref', c: 'ref', d: 'defaults-d' });
        });

        it('should merge deeply nested sources with operations', () => {
            const options = { a: { b: { c: { $ref: 'optionsRef' } }, e: { $ref: 'optionsRef' }, f: 'options-f' } };
            const defaults = { a: { b: { c: { $ref: 'defaultsRef' }, d: { $ref: 'defaultsRef' } }, g: 'defaults-g' } };
            const params = { optionsRef: 'options-ref', defaultsRef: 'defaults-ref' };
            const resolved = jsonResolveOperations([options, defaults], params);
            expect(resolved).toEqual({
                a: {
                    b: {
                        c: 'options-ref',
                        d: 'defaults-ref',
                    },
                    e: 'options-ref',
                    f: 'options-f',
                    g: 'defaults-g',
                },
            });
        });

        describe('location', () => {
            it('should resolve `$ref` operation with params', () => {
                const source = { a: { $ref: 'key' } };
                const params = { key: 'hello' };
                const resolved = jsonResolveOperations([source], params);
                expect(resolved).toEqual({ a: 'hello' });
            });

            it('should warn on invalid `$ref` operation', () => {
                const source = { a: { $ref: 'missing' } };
                const params = { key: 'hello', other: 'world' };
                const resolved = jsonResolveOperations([source], params);
                expect(resolved).toEqual({ a: undefined });
                expectWarningMessages([
                    'AG Charts - `$ref` json operation failed on [missing] at [a], expecting one of [key, other].',
                ]);
            });

            it('should resolve `$ref` operation on second `$ref` operation', () => {
                const source = { a: { $ref: 'first' } };
                const params = { first: { $ref: 'second' }, second: 'hello' };
                const resolved = jsonResolveOperations([source], params);
                expect(resolved).toEqual({ a: 'hello' });
            });

            it('should catch circular `$ref` operations', () => {
                const source = { a: { $ref: 'first' }, b: { $ref: 'fourth' } };
                const params = {
                    first: { $ref: 'second' },
                    second: { $ref: 'third' },
                    third: { $ref: 'first' },
                    fourth: 'fourth',
                };
                const resolved = jsonResolveOperations([source], params);
                expect(resolved).toEqual({ a: undefined, b: 'fourth' });
                expectWarningMessages([
                    'AG Charts - `$ref` json operation failed on [first] at [a], circular reference detected with [second, third, first].',
                ]);
            });

            it('should resolve `$path` operations', () => {
                const source = {
                    key: 'key-value',
                    parent: { child: 'child-value' },
                };
                const paths = {
                    cousin: { $path: '/key' },
                    secondCousin: { $path: '/parent/child' },
                    olderSibling: { $path: '/sibling' },
                    sibling: 'sibling-value',
                    youngerSibling: { $path: '/sibling' },
                    relative: {
                        relativeChild: { $path: '../parent/child' },
                    },
                };
                const resolved = jsonResolveOperations([source, paths]);
                expect(resolved).toEqual({
                    key: 'key-value',
                    parent: { child: 'child-value' },
                    cousin: 'key-value',
                    secondCousin: 'child-value',
                    olderSibling: 'sibling-value',
                    sibling: 'sibling-value',
                    youngerSibling: 'sibling-value',
                    relative: {
                        relativeChild: 'child-value',
                    },
                });
            });

            it("should resolve `$value: '$path'` operations", () => {
                const source = {
                    parent1: { child: { $value: '$path' } },
                    parent2: { child: [{ $value: '$path' }, { $value: '$path' }] },
                    parent3: [{ child: { $value: '$path' } }, { child: { $value: '$path' } }],
                    parent4: [
                        { child: [{ $value: '$path' }, { $value: '$path' }] },
                        { child: [{ $value: '$path' }, { $value: '$path' }] },
                    ],
                    parent5: {
                        child: { $path: ['.', undefined, { $value: '$path' }] },
                    },
                    parent6: {
                        child: [
                            { $path: ['.', undefined, { $value: '$path' }] },
                            { $path: ['.', undefined, { $value: '$path' }] },
                        ],
                    },
                    parent7: {
                        child: { $find: [true, { $path: '../parent6/child' }] },
                    },
                    // parent8: {
                    //     child: [{ $path: '../../parent8/child' }],
                    // },
                };
                const resolved = jsonResolveOperations([source]);
                expect(resolved).toEqual({
                    parent1: { child: 'parent1.child' },
                    parent2: { child: ['parent2.child.0', 'parent2.child.1'] },
                    parent3: [{ child: 'parent3.0.child' }, { child: 'parent3.1.child' }],
                    parent4: [
                        { child: ['parent4.0.child.0', 'parent4.0.child.1'] },
                        { child: ['parent4.1.child.0', 'parent4.1.child.1'] },
                    ],
                    parent5: { child: 'parent5.child' },
                    parent6: { child: ['parent6.child.0', 'parent6.child.1'] },
                    parent7: { child: 'parent6.child.0' },
                    // parent8: { child: [undefined] },
                });
                // expectWarningMessages([
                //     'AG Charts - `$path` json operation failed on [../../parent8/child] at [parent8.child.0] resolved to [parent8.child], path is circular.',
                // ]);
            });

            it('should resolve `$path` operations within `$path` operations', () => {
                const source = {
                    parent: {
                        a: { greeting: 'hello' },
                        b: { $path: ['/greeting', undefined, { $path: './a' }] },
                    },
                };
                const resolved = jsonResolveOperations([source]);
                expect(resolved).toEqual({
                    parent: {
                        a: { greeting: 'hello' },
                        b: 'hello',
                    },
                });
            });

            it('should warn on invalid `$path` operations', () => {
                const first = {
                    parent: {
                        olderSibling: { $path: './sibling' }, // can not immediately resolve, but is a valid path
                        sibling: 'sibling',
                        youngerSibling: { $path: '../sibling' }, // will never resolve as is an invalid path
                        youngestSibling: { $path: './missing' }, // will never resolve as is an invalid path
                        cousinSibling: { $path: './cousin' },
                        withDefault: { $path: ['../sibling', 'default-value'] }, // will never resolve but will use default value
                    },
                };
                const second = {
                    parent: {
                        cousin: 'cousin',
                        invalidCousin: { $path: '../sibling' },
                    },
                };
                const resolved = jsonResolveOperations([first, second]);
                expect(resolved).toEqual({
                    parent: {
                        olderSibling: 'sibling',
                        sibling: 'sibling',
                        youngerSibling: undefined,
                        youngestSibling: undefined,
                        withDefault: 'default-value',
                        cousinSibling: 'cousin',
                        cousin: 'cousin',
                        invalidCousin: undefined,
                    },
                });
                expectWarningMessages([
                    'AG Charts - `$path` json operation failed on [../sibling] at [parent.youngerSibling] resolved to [sibling], could not find path in object.',
                    'AG Charts - `$path` json operation failed on [./missing] at [parent.youngestSibling] resolved to [parent.missing], could not find path in object.',
                    'AG Charts - `$path` json operation failed on [../sibling] at [parent.invalidCousin] resolved to [sibling], could not find path in object.',
                ]);
            });

            it('should resolve `$path` operations with `$index`', () => {
                const source = {
                    a: [{ greeting: 'hello' }, { greeting: 'bonjour' }],
                    b: ['other', { $path: '/a/$index/greeting' }],
                };
                const resolved = jsonResolveOperations([source]);
                expect(resolved).toEqual({
                    a: [{ greeting: 'hello' }, { greeting: 'bonjour' }],
                    b: ['other', 'bonjour'],
                });
            });

            it('should resolve `$path` operations with `$prevIndex`', () => {
                const source = {
                    a: [{ greeting: 'hello' }, { greeting: 'bonjour' }],
                    b: [{ $path: ['/a/$prevIndex/greeting', undefined] }, { $path: '/a/$prevIndex/greeting' }],
                };
                const resolved = jsonResolveOperations([source]);

                // Requires a default fallback value since `$prevIndex` does not handle circular indices
                expect(resolved).toEqual({
                    a: [{ greeting: 'hello' }, { greeting: 'bonjour' }],
                    b: [undefined, 'hello'],
                });
            });

            it('should resolve `$path` operations with variables', () => {
                const source = {
                    a: {
                        $path: [
                            '/$lang/greeting',
                            {},
                            { en: { greeting: 'hello' }, fr: { greeting: 'bonjour' } },
                            { lang: 'fr' },
                        ],
                    },
                };
                const resolved = jsonResolveOperations([source]);
                expect(resolved).toEqual({ a: 'bonjour' });
            });

            it("should resolve `$value: '$1'` operations", () => {
                const source = {
                    a: ['other', { $value: '$1' }],
                };
                const resolved = jsonResolveOperations([source]);

                // Since this is outside a transform operation, `$value: '$1'` points to itself and so correctly resolves to `undefined`
                expect(resolved).toEqual({
                    a: ['other', undefined],
                });
            });

            it("should resolve `$value: '$index'` operations", () => {
                const source = {
                    a: [{ $value: '$index' }, 'other', { $value: '$index' }],
                };
                const resolved = jsonResolveOperations([source]);
                expect(resolved).toEqual({ a: [0, 'other', 2] });
            });
        });

        describe('logical', () => {
            it('should resolve `$eq` operation with strict equality', () => {
                const source = { a: { $eq: [1, 1] }, b: { $eq: [1, '1'] }, c: { $eq: ['hello', 'hello'] } };
                const resolved = jsonResolveOperations([source]);
                expect(resolved).toEqual({ a: true, b: false, c: true });
            });

            it('should resolve `$not` operation', () => {
                const source = { a: { $not: [true] }, b: { $not: [false] }, c: { $not: ['hello'] } };
                const resolved = jsonResolveOperations([source]);
                expect(resolved).toEqual({ a: false, b: true, c: false });
            });

            it('should resolve `$or` operation', () => {
                const source = { a: { $or: [true, true] }, b: { $or: [true, false] }, c: { $or: [false, false] } };
                const resolved = jsonResolveOperations([source]);
                expect(resolved).toEqual({ a: true, b: true, c: false });
            });

            it('should resolve `$and` operation', () => {
                const source = { a: { $and: [true, true] }, b: { $and: [true, false] }, c: { $and: [false, false] } };
                const resolved = jsonResolveOperations([source]);
                expect(resolved).toEqual({ a: true, b: false, c: false });
            });

            it('should resolve `$if` operation', () => {
                const source = { a: { $if: [true, 'yes', 'no'] }, b: { $if: [false, 'yes', 'no'] } };
                const resolved = jsonResolveOperations([source]);
                expect(resolved).toEqual({ a: 'yes', b: 'no' });
            });
        });

        describe('numeric', () => {
            it('should resolve `$isEven` operation', () => {
                const source = { a: { $isEven: [0] }, b: { $isEven: [1] }, c: { $isEven: [2] } };
                const resolved = jsonResolveOperations([source]);
                expect(resolved).toEqual({ a: true, b: false, c: true });
            });

            it('should resolve `$mul` operation', () => {
                const source = { a: { $mul: [2, 4] } };
                const resolved = jsonResolveOperations([source]);
                expect(resolved).toEqual({ a: 8 });
            });

            it('should warn on invalid `$mul` operation', () => {
                const source = { a: { $mul: [2, 'hello'] } };
                const resolved = jsonResolveOperations([source]);
                expect(resolved).toEqual({ a: undefined });
                expectWarningMessages([
                    'AG Charts - `$mul` json operation failed on [2] and [hello] at [a], expecting two numbers.',
                ]);
            });

            it('should resolve `$round` operation', () => {
                const source = { a: { $round: [1.234] }, b: { $round: [1.987] } };
                const resolved = jsonResolveOperations([source]);
                expect(resolved).toEqual({ a: 1, b: 2 });
            });
        });

        describe('transform', () => {
            it('should resolve `$map` operations', () => {
                const source = { a: { $map: ['ciao', ['hello', 'bonjour']] } };
                const resolved = jsonResolveOperations([source]);
                expect(resolved).toEqual({ a: ['ciao', 'ciao'] });
            });

            it('should resolve `$map` and `$path` operations', () => {
                const source = { a: ['hello', 'bonjour'], b: { $map: ['ciao', { $path: '/a' }] } };
                const resolved = jsonResolveOperations([source]);
                expect(resolved).toEqual({ a: ['hello', 'bonjour'], b: ['ciao', 'ciao'] });
            });

            it('should resolve `$map` and `$value` operations', () => {
                const source = { a: ['hello', 'bonjour'], b: { $map: [{ $value: '$1' }, { $path: '/a' }] } };
                const resolved = jsonResolveOperations([source]);
                expect(resolved).toEqual({ a: ['hello', 'bonjour'], b: ['hello', 'bonjour'] });
            });

            it('should resolve `$map` and `$merge` operations', () => {
                const source = {
                    a: ['hello', 'bonjour'],
                    b: { $map: [{ $merge: [{ greeting: { $value: '$1' } }] }, { $path: '/a' }] },
                };
                const resolved = jsonResolveOperations([source]);
                expect(resolved).toEqual({
                    a: ['hello', 'bonjour'],
                    b: [{ greeting: 'hello' }, { greeting: 'bonjour' }],
                });
            });

            it('should resolve `$map` and `$path` operations with `$index`', () => {
                const source = {
                    a: [{ greeting: 'hello' }, { greeting: 'bonjour' }],
                    b: { $map: [{ $path: '/a/$index/greeting' }, { $path: '/a' }] },
                };
                const resolved = jsonResolveOperations([source]);
                expect(resolved).toEqual({
                    a: [{ greeting: 'hello' }, { greeting: 'bonjour' }],
                    b: ['hello', 'bonjour'],
                });
            });

            it('should resolve `$map` and `$path` operations with `$prevIndex`', () => {
                const source = {
                    a: [{ greeting: 'hello' }, { greeting: 'bonjour' }],
                    b: { $map: [{ $path: ['/a/$prevIndex/greeting', undefined] }, { $path: '/a' }] },
                };
                const resolved = jsonResolveOperations([source]);
                expect(resolved).toEqual({
                    a: [{ greeting: 'hello' }, { greeting: 'bonjour' }],
                    b: [undefined, 'hello'],
                });
            });

            it('should resolve `$find` operations', () => {
                const source = {
                    a: {
                        $find: [
                            { $eq: [{ $path: ['./greeting', undefined, { $value: '$1' }] }, 'bonjour'] },
                            [{ greeting: 'hello' }, { greeting: 'bonjour' }, { greeting: 'howdy' }],
                        ],
                    },
                };
                const resolved = jsonResolveOperations([source]);
                expect(resolved).toEqual({ a: { greeting: 'bonjour' } });
            });

            it('should resolve `$find` operations wrapped in `$path`', () => {
                const source = {
                    a: {
                        $path: [
                            './greeting',
                            undefined,
                            {
                                $find: [
                                    { $eq: [{ $path: ['./greeting', undefined, { $value: '$1' }] }, 'bonjour'] },
                                    { $path: './b' },
                                ],
                            },
                        ],
                    },
                    b: [{ greeting: 'hello' }, { greeting: 'bonjour' }, { greeting: 'howdy' }],
                };
                const resolved = jsonResolveOperations([source]);
                expect(resolved).toEqual({
                    a: 'bonjour',
                    b: [{ greeting: 'hello' }, { greeting: 'bonjour' }, { greeting: 'howdy' }],
                });
            });

            it('should resolve `$findFirstResolvedSibling` operation', () => {
                const source = {
                    a: [
                        { $findFirstResolvedSibling: ['.', 'default value'] },
                        { greeting: 'bonjour', lang: 'fr' },
                        { greeting: 'howdy', lang: 'en-US' },
                    ],
                };
                const resolved = jsonResolveOperations([source]);
                expect(resolved).toEqual({
                    a: [
                        { greeting: 'bonjour', lang: 'fr' },
                        { greeting: 'bonjour', lang: 'fr' },
                        { greeting: 'howdy', lang: 'en-US' },
                    ],
                });
            });

            it('should resolve `$findFirstResolvedSibling` operation on child', () => {
                const source = {
                    a: [
                        {
                            greeting: { $findFirstResolvedSibling: ['./greeting', 'default value'] },
                            lang: 'en',
                        },
                        { greeting: 'bonjour', lang: 'fr' },
                        { greeting: 'howdy', lang: 'en-US' },
                    ],
                };
                const resolved = jsonResolveOperations([source]);
                expect(resolved).toEqual({
                    a: [
                        { greeting: 'bonjour', lang: 'en' },
                        { greeting: 'bonjour', lang: 'fr' },
                        { greeting: 'howdy', lang: 'en-US' },
                    ],
                });
            });

            it('should resolve `$apply` operation with arrays', () => {
                const options = { items: [{ type: 'one' }, { type: 'two' }, { type: 'two', color: 'red' }] };
                const defaults = {
                    items: {
                        $apply: [
                            {
                                one: { color: 'white' },
                                two: {
                                    other: { $path: './color' },
                                    color: 'black',
                                },
                            },
                            '/$type',
                            { type: { $path: ['./type', 'one', { $value: '$1' }] } },
                        ],
                    },
                };
                const resolved = jsonResolveOperations([options, defaults]);
                expect(resolved).toEqual({
                    items: [
                        { type: 'one', color: 'white' },
                        { type: 'two', color: 'black', other: 'black' },
                        { type: 'two', color: 'red', other: 'red' },
                    ],
                });
            });

            describe('should resolve `$apply` operations with objects', () => {
                const config = {
                    item: {
                        child: {
                            position: 'bottom',
                            orientation: {
                                $if: [
                                    {
                                        $or: [
                                            { $eq: [{ $path: './position' }, 'left'] },
                                            { $eq: [{ $path: './position' }, 'right'] },
                                        ],
                                    },
                                    'vertical',
                                    'horizontal',
                                ],
                            },
                        },
                    },
                };
                const defaults = {
                    $apply: [config, '/item', {}],
                };

                it('with missing object', () => {
                    const options = {};
                    const resolved = jsonResolveOperations([options, defaults]);
                    expect(resolved).toEqual({
                        child: { position: 'bottom', orientation: 'horizontal' },
                    });
                });

                it('with empty object', () => {
                    const options = { child: {} };
                    const resolved = jsonResolveOperations([options, defaults]);
                    expect(resolved).toEqual({
                        child: { position: 'bottom', orientation: 'horizontal' },
                    });
                });

                it('with expected object', () => {
                    const options = {
                        child: { position: 'left' },
                    };
                    const resolved = jsonResolveOperations([options, defaults]);
                    expect(resolved).toEqual({
                        child: { position: 'left', orientation: 'vertical' },
                    });
                });

                it('with partial object', () => {
                    const options = {
                        child: { other: 'value' },
                    };
                    const resolved = jsonResolveOperations([options, defaults]);
                    expect(resolved).toEqual({
                        child: { position: 'bottom', orientation: 'horizontal', other: 'value' },
                    });
                });
            });

            it('should resolve nested `$apply` operations', () => {
                const options = {
                    items: [
                        { type: 'one', children: [{ color: 'red' }, { color: 'green' }] },
                        { type: 'two', children: [{ width: 4 }] },
                        { type: 'two' }, // no children
                    ],
                };
                const defaults = {
                    items: {
                        $apply: [
                            {
                                one: {
                                    color: 'white',
                                    children: { $apply: [{ color: 'black', width: 2 }] },
                                },
                                two: {
                                    color: 'black',
                                    children: { $apply: [{ color: 'black', width: 2 }] },
                                },
                            },
                            '/$type',
                            { type: { $path: ['./type', 'one', { $value: '$1' }] } },
                        ],
                    },
                };
                const resolved = jsonResolveOperations([options, defaults]);
                expect(resolved).toEqual({
                    items: [
                        {
                            type: 'one',
                            color: 'white',
                            children: [
                                { color: 'red', width: 2 },
                                { color: 'green', width: 2 },
                            ],
                        },
                        { type: 'two', color: 'black', children: [{ color: 'black', width: 4 }] },
                        { type: 'two', color: 'black' },
                    ],
                });
            });

            it('should resolve `$merge` operation', () => {
                const source = {
                    a: { hello: 'world', bonjour: 'monde', people: [{ name: 'alice' }] },
                    b: {
                        $merge: [{ hello: 'test', goodbye: 'test', people: [{ age: 36 }] }, { $path: '/a' }],
                    },
                };
                const resolved = jsonResolveOperations([source]);
                expect(resolved).toEqual({
                    a: { hello: 'world', bonjour: 'monde', people: [{ name: 'alice' }] },
                    b: { hello: 'test', goodbye: 'test', bonjour: 'monde', people: [{ name: 'alice', age: 36 }] },
                });
            });

            it('should resolve `$omit` operations', () => {
                const source = { a: { $omit: [['b'], { b: 'hello', c: 'world' }] } };
                const resolved = jsonResolveOperations([source]);
                expect(resolved).toEqual({ a: { c: 'world' } });
            });

            it('should resolve `$clone` operations', () => {
                const source = { a: { greeting: 'hello' }, b: { $clone: [{ $path: './a' }] } };
                const resolved = jsonResolveOperations<PlainObject>([source]);
                expect(resolved.b).toEqual({ greeting: 'hello' });
                resolved.a.greeting = 'bonjour';
                expect(resolved.b).toEqual({ greeting: 'hello' });
            });
        });

        describe('font', () => {
            it('should resolve `$rem` operation', () => {
                const source = { a: { $rem: [1.5] } };
                const params = { fontSize: 12 };
                const resolved = jsonResolveOperations([source], params);
                expect(resolved).toEqual({ a: 18 });
            });
        });

        describe('color', () => {
            it('should resolve `$mix` operation', () => {
                const source = { a: { $mix: ['#ffffff', '#000000', 0.5] } };
                const resolved = jsonResolveOperations([source]);
                expect(resolved).toEqual({ a: '#808080' });
            });

            it('should resolve `$mix` operation with gradients', () => {
                const source = {
                    a: {
                        $mix: [
                            {
                                type: 'gradient',
                                colorStops: [
                                    { color: '#ffffff' },
                                    { color: '#ffff00', stop: 0.3 },
                                    { color: '#ff0000' },
                                ],
                            },
                            '#000000',
                            0.5,
                        ],
                    },
                };
                const resolved = jsonResolveOperations([source]);
                expect(resolved).toEqual({
                    a: {
                        type: 'gradient',
                        colorStops: [{ color: '#808080' }, { color: '#808000', stop: 0.3 }, { color: '#800000' }],
                    },
                });
            });
        });

        describe('combinations', () => {
            it('should resolve nested operations with chained $refs', () => {
                const source = {
                    b: {
                        c: 'cousin',
                    },
                    d: {
                        e: 'sibling',
                    },
                };
                const logic = {
                    a: { $ref: 'indirectRelative' },
                    d: {
                        f: {
                            $if: [
                                {
                                    $or: [
                                        { $eq: [{ $path: '../a' }, 'cousin'] },
                                        { $eq: [{ $path: '../a' }, 'parent'] },
                                    ],
                                },
                                { $ref: 'key' },
                                'no',
                            ],
                        },
                    },
                };
                const params = { key: 'hello', indirectRelative: { $ref: 'relative' }, relative: 'parent' };
                const resolved = jsonResolveOperations([source, logic], params);
                expect(resolved).toEqual({
                    a: 'parent',
                    b: { c: 'cousin' },
                    d: { e: 'sibling', f: 'hello' },
                });
            });

            it('should resolve nested operations with logical operations', () => {
                const source = { a: { b: 'yes' } };
                const logic = {
                    a: {
                        b: 'no',
                        c: {
                            $if: [
                                {
                                    $or: [{ $eq: [{ $path: './b' }, 'yes'] }, { $eq: [{ $path: './b' }, 'maybe'] }],
                                },
                                { $ref: 'one' },
                                { $ref: 'two' },
                            ],
                        },
                    },
                };
                const params = { one: 'ref-one', two: 'ref-two' };
                const resolved = jsonResolveOperations([source, logic], params);
                expect(resolved).toEqual({ a: { b: 'yes', c: 'ref-one' } });
            });

            it('should resolve options with defaults by type', () => {
                const params = {
                    __palette: {
                        fills: ['red', 'green', 'blue'],
                    },
                };
                const userOptions = {
                    title: 'User Options',
                    background: 'grey',
                    legend: { position: 'left' },
                    series: [
                        { type: 'line', stroke: 'purple' },
                        { type: 'bar', label: { placement: 'outside-start' } },
                        { type: 'bar' },
                    ],
                };
                const themeConfig = {
                    bar: {
                        background: 'white',
                        foreground: 'black',
                        series: {
                            fill: { $palette: 'fill' },
                            label: {
                                color: {
                                    $if: [
                                        {
                                            $or: [
                                                { $eq: [{ $path: './placement' }, 'outside-start'] },
                                                { $eq: [{ $path: './placement' }, 'outside-end'] },
                                            ],
                                        },
                                        'black',
                                        'white',
                                    ],
                                },
                                placement: 'inside-center',
                            },
                        },
                    },
                    line: {
                        background: 'black',
                        foreground: 'white',
                        legend: {
                            position: 'bottom',
                            orientation: {
                                $if: [
                                    {
                                        $or: [
                                            { $eq: [{ $path: './position' }, 'left'] },
                                            { $eq: [{ $path: './position' }, 'right'] },
                                        ],
                                    },
                                    'vertical',
                                    'horizontal',
                                ],
                            },
                            spacing: 30,
                        },
                        series: { stroke: { $palette: 'fill' } },
                    },
                };
                const chartDefaults = {
                    $apply: [themeConfig, '/$seriesType', { seriesType: { $path: '/series/0/type' } }, ['series']],
                };
                const seriesDefaults = {
                    series: {
                        $apply: [
                            themeConfig,
                            '/$seriesType/series',
                            { seriesType: { $path: ['/type', 'line', { $value: '$1' }] } },
                        ],
                    },
                };

                const resolved = jsonResolveOperations([userOptions, chartDefaults, seriesDefaults], params);
                expect(resolved).toEqual({
                    title: 'User Options', // from user options
                    background: 'grey', // from user options
                    foreground: 'white', // from first series' chart defaults
                    legend: {
                        position: 'left',
                        orientation: 'vertical',
                        spacing: 30,
                    },
                    series: [
                        {
                            type: 'line',
                            stroke: 'purple', // from user options
                        },
                        {
                            type: 'bar',
                            fill: 'green', // from series defaults by type
                            label: {
                                color: 'black', // from series defaults by type logic with user options `placement`
                                placement: 'outside-start', // from user options
                            },
                        },
                        {
                            type: 'bar',
                            fill: 'blue', // from series defaults by type
                            label: {
                                color: 'white', // from series defaults by type with default options `placement`
                                placement: 'inside-center', // from series defaults by type
                            },
                        },
                    ],
                });
            });
        });
    });
});

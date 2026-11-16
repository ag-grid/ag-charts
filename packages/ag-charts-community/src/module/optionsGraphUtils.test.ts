import { afterEach, describe, expect, it } from 'vitest';

import {
    getPathLastIndex,
    getPathLastIndexIndex,
    getPathSafe,
    hasTemplatePathSafe,
    isColorOptionKey,
    isColorOptionPath,
    resolvePath,
    setPathSafe,
} from './optionsGraphUtils';

describe('OptionsGraph Utils', () => {
    afterEach(() => {
        delete (Object.prototype as any).testMarker;
    });

    it('getPathSafe', () => {
        const object = { one: { two: { three: 'value' } } };
        expect(getPathSafe(object, ['one', 'two', 'three'])).toEqual('value');
        expect(getPathSafe(object, ['one', 'two'])).toEqual({ three: 'value' });
        expect(getPathSafe(object, ['one', 'two', 'four'])).toEqual(undefined);
    });

    it('hasTemplatePathSafe', () => {
        const object = { items: { label: { text: 'value' } }, list: [{ text: 'value' }] };
        expect(hasTemplatePathSafe(object, ['items', '2', 'label', 'text'])).toBe(true);
        expect(hasTemplatePathSafe(object, ['items', '2', 'label', 'other'])).toBe(false);
        expect(hasTemplatePathSafe(object, ['items', 'key', 'label'])).toBe(false);
        expect(hasTemplatePathSafe(object, ['list', '0', 'text'])).toBe(true);
        expect(hasTemplatePathSafe(object, ['list', '1', 'text'])).toBe(false);
    });

    it('setPathSafe', () => {
        const object = {};
        setPathSafe(object, ['one', 'two', 'three'], 'value');
        expect(object).toEqual({ one: { two: { three: 'value' } } });

        setPathSafe(object, ['one', 'two', 'three'], 'other');
        expect(object).toEqual({ one: { two: { three: 'other' } } });

        setPathSafe(object, ['one', 'two', 'three', 'four'], 'value');
        expect(object).toEqual({ one: { two: { three: { four: 'value' } } } });
    });

    it('resolvePath', () => {
        expect(resolvePath([], '/one')).toEqual(['one']);
        expect(resolvePath([], './one')).toEqual(['one']);
        expect(resolvePath([], 'one')).toEqual(['one']);
        expect(resolvePath([], '/one/two/three')).toEqual(['one', 'two', 'three']);

        expect(resolvePath(['one'], '/two/three')).toEqual(['two', 'three']);
        expect(resolvePath(['one'], './two/three')).toEqual(['two', 'three']);
        expect(resolvePath(['one'], 'two/three')).toEqual(['one', 'two', 'three']);

        expect(resolvePath(['one', 'two'], '/three')).toEqual(['three']);
        expect(resolvePath(['one', 'two'], './three')).toEqual(['one', 'three']);
        expect(resolvePath(['one', 'two'], 'three')).toEqual(['one', 'two', 'three']);
        expect(resolvePath(['one', 'two'], '../three')).toEqual(['three']);
    });

    it('setPathSafe ignores prototype keys', () => {
        const object = {};
        setPathSafe(object, ['__proto__', 'testMarker'], 1);
        expect(({} as any).testMarker).toBeUndefined();
        expect(Object.prototype).not.toHaveProperty('testMarker');
        expect(Object.keys(object)).toEqual([]);
    });

    it.each([
        ['constructor', ['constructor', 'prototype', 'testMarker']],
        ['prototype', ['prototype', 'testMarker']],
        ['trailing __proto__', ['one', '__proto__']],
    ])('setPathSafe leaves Object.prototype untouched for %s paths', (_name, path) => {
        setPathSafe({}, path, 1);
        expect(({} as any).testMarker).toBeUndefined();
        expect(Object.prototype).not.toHaveProperty('testMarker');
    });

    it('getPathLastIndex', () => {
        expect(getPathLastIndex(['one', '2', 'three', '4'])).toEqual(4);
        expect(getPathLastIndex(['one', '2', 'three'])).toEqual(2);
    });

    it('getPathLastIndexIndex', () => {
        expect(getPathLastIndexIndex(['one', '2', 'three', '4'])).toEqual(3);
        expect(getPathLastIndexIndex(['one', '2', 'three'])).toEqual(1);
    });

    it.each([
        'fill',
        'color',
        'fills',
        'backgroundFill',
        'rangeStroke',
        'ontoColor',
        'foregroundColor',
        'sequentialColors',
        'defaultColorRange',
        'undocumentedGroupStrokes',
    ])('isColorOptionKey(%s) is true', (key) => {
        expect(isColorOptionKey(key)).toBe(true);
    });

    it.each(['text', 'yName', 'legendItemName', 'fontFamily', 'id', 'fillOpacity'])(
        'isColorOptionKey(%s) is false',
        (key) => {
            expect(isColorOptionKey(key)).toBe(false);
        }
    );

    it('isColorOptionPath', () => {
        expect(isColorOptionPath(['series', '0', 'fills', '1'])).toBe(true);
        expect(isColorOptionPath(['series', '0', 'yName'])).toBe(false);
        expect(isColorOptionPath(['title', 'text'])).toBe(false);
        expect(isColorOptionPath([])).toBe(true);
    });
});

import { describe, expect, it } from '@jest/globals';

import { getPathLastIndex, getPathLastIndexIndex, getPathSafe, resolvePath, setPathSafe } from './optionsGraphUtils';

describe('OptionsGraph Utils', () => {
    it('getPathSafe', () => {
        const object = { one: { two: { three: 'value' } } };
        expect(getPathSafe(object, ['one', 'two', 'three'])).toEqual('value');
        expect(getPathSafe(object, ['one', 'two'])).toEqual({ three: 'value' });
        expect(getPathSafe(object, ['one', 'two', 'four'])).toEqual(undefined);
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

    it('getPathLastIndex', () => {
        expect(getPathLastIndex(['one', '2', 'three', '4'])).toEqual(4);
        expect(getPathLastIndex(['one', '2', 'three'])).toEqual(2);
    });

    it('getPathLastIndexIndex', () => {
        expect(getPathLastIndexIndex(['one', '2', 'three', '4'])).toEqual(3);
        expect(getPathLastIndexIndex(['one', '2', 'three'])).toEqual(1);
    });
});

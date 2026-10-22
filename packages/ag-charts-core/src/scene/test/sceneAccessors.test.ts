import { describe, expect, it } from 'vitest';

import { fake, setAgChartsDebug } from './sceneAccessors';

describe('sceneAccessors', () => {
    describe('fake', () => {
        it('returns the members it was given, typed as the target', () => {
            const element = fake<HTMLElement>({ clientWidth: 12 });

            expect(element.clientWidth).toBe(12);
        });
    });

    describe('setAgChartsDebug', () => {
        it('sets the flag and removes it again when there was none', () => {
            expect(Reflect.has(globalThis, 'agChartsDebug')).toBe(false);

            const restore = setAgChartsDebug(['scene']);
            expect(Reflect.get(globalThis, 'agChartsDebug')).toEqual(['scene']);

            restore();
            expect(Reflect.has(globalThis, 'agChartsDebug')).toBe(false);
        });

        it('puts a previous value back', () => {
            const restoreOuter = setAgChartsDebug('outer');
            const restoreInner = setAgChartsDebug(true);
            expect(Reflect.get(globalThis, 'agChartsDebug')).toBe(true);

            restoreInner();
            expect(Reflect.get(globalThis, 'agChartsDebug')).toBe('outer');

            restoreOuter();
            expect(Reflect.has(globalThis, 'agChartsDebug')).toBe(false);
        });
    });
});

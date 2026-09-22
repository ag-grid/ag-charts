import { afterEach, describe, expect, it } from 'vitest';

import { applyAnnotationOptions, resetAnnotationDatum, serialiseAnnotation } from './datum';

describe('annotation datum utils', () => {
    const create = () => ({
        id: 'a',
        type: 'line',
        strokeWidth: 2,
        text: { label: 'default', position: 'top' },
        handle: { fill: '#fff' },
    });

    it('merges nested options without discarding unspecified nested keys', () => {
        const datum = applyAnnotationOptions(create(), { strokeWidth: 4, text: { label: 'set' } });

        expect(datum).toEqual({ ...create(), strokeWidth: 4, text: { label: 'set', position: 'top' } });
    });

    it('keeps the current nested options when a nested option is null or undefined', () => {
        const datum = applyAnnotationOptions(create(), { text: null, handle: undefined });

        expect(datum.text).toEqual({ label: 'default', position: 'top' });
        expect(datum.handle).toEqual({ fill: '#fff' });
    });

    it('clears primitive options set to undefined', () => {
        const datum = applyAnnotationOptions(create(), { strokeWidth: undefined });

        expect(datum.strokeWidth).toBeUndefined();
    });

    it('copies nested option objects rather than aliasing them', () => {
        const text = { label: 'shared' };
        const datum: { id: string; type: string; text?: object } = { id: 'a', type: 'line' };
        applyAnnotationOptions(datum, { text });

        expect(datum.text).toEqual(text);
        expect(datum.text).not.toBe(text);
    });

    describe('with a `__proto__` key', () => {
        afterEach(() => {
            delete (Object.prototype as Record<string, unknown>).polluted;
        });

        it('does not write through it onto Object.prototype', () => {
            const datum = { start: { x: 1, y: 2 } };

            applyAnnotationOptions(datum, JSON.parse('{"start":{"__proto__":{"polluted":"yes"},"x":3}}'));

            expect(({} as Record<string, unknown>).polluted).toBeUndefined();
            expect(datum.start).toEqual({ x: 3, y: 2 });
        });
    });

    it('resets a datum to its defaults in place before applying restored options', () => {
        const datum: ReturnType<typeof create> & { locked?: boolean } = { ...create(), locked: true, strokeWidth: 9 };
        const result = resetAnnotationDatum(datum, { ...create(), id: 'other' }, { strokeWidth: 4 });

        expect(result).toBe(datum);
        expect(datum).toEqual({ ...create(), strokeWidth: 4 });
    });

    it('serialises a deep copy without the id', () => {
        const datum = create();
        const serialised = serialiseAnnotation(datum);

        expect(serialised).toEqual({ type: 'line', strokeWidth: 2, text: datum.text, handle: datum.handle });
        expect(serialised.text).not.toBe(datum.text);
    });
});

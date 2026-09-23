import { afterEach, describe, expect, it } from 'vitest';

import { applyAnnotationOptions } from './datum';

describe('applyAnnotationOptions', () => {
    afterEach(() => {
        delete (Object.prototype as Record<string, unknown>).polluted;
    });

    it('does not write through a `__proto__` key onto Object.prototype', () => {
        const datum = { start: { x: 1, y: 2 } };

        applyAnnotationOptions(datum, JSON.parse('{"start":{"__proto__":{"polluted":"yes"},"x":3}}'));

        expect(({} as Record<string, unknown>).polluted).toBeUndefined();
        expect(datum.start).toEqual({ x: 3, y: 2 });
    });
});

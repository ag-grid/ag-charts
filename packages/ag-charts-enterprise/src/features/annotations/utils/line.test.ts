import { describe, expect, it } from 'vitest';

import { getLineCap, getLineDash, getLineStyle, resolveLineDash } from './line';

describe('annotation line dash', () => {
    describe('getLineStyle', () => {
        it.each([
            [undefined, 'solid'],
            ['solid', 'solid'],
            [[], 'solid'],
            [[0], 'solid'],
            [[0, 0], 'solid'],
            [[6, 0], 'solid'],
            [[6, 0, 6, 0], 'solid'],
            [[6], 'dash'],
            [[6, 6], 'dash'],
            [[6, 0, 6], 'dash'],
            ['dot', 'dot'],
            ['dash', 'dash'],
            ['long-dash', 'dash'],
            ['dash-dot', 'dash'],
            [[6, 4], 'dash'],
            [[0, 5], 'dash'],
        ] as const)('shows %j as %s', (lineDash, expected) => {
            expect(getLineStyle(lineDash as any)).toBe(expected);
        });
    });

    describe('resolveLineDash', () => {
        it('scales a stock name by the stroke width and leaves an array in pixels', () => {
            expect(resolveLineDash('dash', 3)).toEqual([9, 6]);
            expect(resolveLineDash([8, 3], 3)).toEqual([8, 3]);
            expect(resolveLineDash(undefined, 3)).toEqual([]);
        });

        it('draws a dot as a zero-length dash over the stock dot period', () => {
            expect(resolveLineDash('dot', 2)).toEqual([0, 5]);
        });

        it('treats a missing stroke width as 1', () => {
            expect(getLineDash({ lineDash: 'dash' })).toEqual([3, 2]);
        });
    });

    describe('getLineCap', () => {
        it('rounds the caps of a dot only', () => {
            expect(getLineCap({ lineDash: 'dot' })).toBe('round');
            expect(getLineCap({ lineDash: 'dash' })).toBeUndefined();
            expect(getLineCap({ lineDash: [0, 5] })).toBeUndefined();
        });
    });
});

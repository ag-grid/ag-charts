import { describe, expect, it } from 'vitest';

import type { AgLineDashName } from 'ag-charts-types';

import { LINE_DASH_PATTERNS } from './lineDash';
import { setSvgLineDashAttributes } from './svgUtil';

const NAMES = Object.keys(LINE_DASH_PATTERNS) as AgLineDashName[];

function svgAttributes(lineDash: number[]) {
    const attributes: Record<string, string> = {};
    const element = { setAttribute: (name: string, value: string) => (attributes[name] = value) } as SVGElement;
    setSvgLineDashAttributes(element, { lineDash, lineDashOffset: 1 });
    return attributes;
}

describe('stock line dash patterns', () => {
    it('defines each stock pattern as documented, in multiples of the stroke width', () => {
        expect(LINE_DASH_PATTERNS).toEqual({
            solid: [0],
            dot: [1, 1.5],
            dash: [3, 2],
            'dash-dot': [3, 1.5, 1, 1.5],
            'long-dash': [7, 2],
            'long-dash-dot': [7, 1.5, 1, 1.5],
            'long-dash-dot-dot': [7, 2, 1, 2, 1, 2],
            'dash-dot-dot': [3, 1.5, 1, 1.5, 1, 1.5],
            'dash-long-dash': [3, 2, 7, 2],
            'long-dash-dash-dash': [7, 1.5, 3, 1.5, 3, 1.5],
        });
    });

    it.each(NAMES)('gives %s a non-empty pattern of non-negative lengths', (name) => {
        const pattern = LINE_DASH_PATTERNS[name];
        expect(pattern.length).toBeGreaterThan(0);
        expect(pattern.every((length) => length >= 0)).toBe(true);
    });

    it('writes no SVG dash for the solid pattern', () => {
        expect(svgAttributes([...LINE_DASH_PATTERNS.solid])).toEqual({});
    });

    it('writes the SVG dash array for a pattern with an odd number of lengths repeated', () => {
        expect(svgAttributes([5, 2, 1])).toEqual({ 'stroke-dasharray': '5 2 1 5 2 1', 'stroke-dashoffset': '1' });
    });
});

import { describe, expect, it } from 'vitest';

import type { AgLineDashName } from 'ag-charts-types';

import { LINE_DASH_PATTERNS, resolveLineDash } from './lineDash';
import { setSvgLineDashAttributes } from './svgUtil';

const NAMES = Object.keys(LINE_DASH_PATTERNS) as AgLineDashName[];

function svgAttributes(lineDash: Parameters<typeof setSvgLineDashAttributes>[1]['lineDash']) {
    const attributes: Record<string, string> = {};
    const element = { setAttribute: (name: string, value: string) => (attributes[name] = value) } as SVGElement;
    setSvgLineDashAttributes(element, { lineDash, lineDashOffset: 1 });
    return attributes;
}

describe('stock line dash patterns', () => {
    it('defines each stock pattern as documented', () => {
        expect(LINE_DASH_PATTERNS).toEqual({
            solid: [0],
            dot: [2, 3],
            dash: [6, 4],
            'dash-dot': [6, 3, 2, 3],
            'long-dash': [14, 4],
            'long-dash-dot': [14, 3, 2, 3],
            'long-dash-dot-dot': [14, 4, 2, 4, 2, 4],
            'dash-dot-dot': [6, 3, 2, 3, 2, 3],
            'dash-long-dash': [6, 4, 14, 4],
            'long-dash-dash-dash': [14, 3, 6, 3, 6, 3],
        });
    });

    it.each(NAMES)('resolves %s to its array, always the same instance', (name) => {
        expect(resolveLineDash(name)).toEqual(LINE_DASH_PATTERNS[name]);
        expect(resolveLineDash(name)).toBe(resolveLineDash(name));
    });

    it('passes an array through by reference and leaves undefined alone', () => {
        const lineDash = [5, 2];
        expect(resolveLineDash(lineDash)).toBe(lineDash);
        expect(resolveLineDash(undefined)).toBeUndefined();
    });

    it.each(NAMES)('writes the same SVG attributes for %s as for its array', (name) => {
        expect(svgAttributes(name)).toEqual(svgAttributes([...LINE_DASH_PATTERNS[name]]));
    });

    it('writes no SVG dash for solid', () => {
        expect(svgAttributes('solid')).toEqual({});
    });
});

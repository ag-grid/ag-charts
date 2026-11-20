import { describe, expect, it } from 'vitest';

import type { NormalisedSeriesTooltipOptions } from 'ag-charts-core';

import { formatSeriesTooltip } from './seriesTooltip';

const content = { heading: 'h', title: 'base', data: [{ label: 'l', value: 'v' }] };

function format(renderer: (params: object) => unknown, base: object = content) {
    const tooltip = { enabled: true, renderer } as unknown as NormalisedSeriesTooltipOptions<object>;
    return formatSeriesTooltip(tooltip, [], base, {}) as Record<string, unknown>;
}

describe('formatSeriesTooltip', () => {
    describe('stock dash names in a renderer symbol', () => {
        type Dashes = { marker?: number[]; line?: number[] };

        // A name scales by the width of its symbol, a line that inherits the marker's by its own; an array is in pixels.
        it.each<[label: string, symbol: object, expected: Dashes, base?: object]>([
            ['a marker at its own width', { marker: { lineDash: 'dash', strokeWidth: 3 } }, { marker: [9, 6] }],
            ['a marker with no width', { marker: { lineDash: 'dash' } }, { marker: [3, 2] }],
            ['a marker set to solid', { marker: { lineDash: 'solid', strokeWidth: 3 } }, { marker: [0] }],
            ['a line at its own width', { line: { lineDash: 'dot', strokeWidth: 2 } }, { line: [2, 3] }],
            ['a line with no width', { line: { lineDash: 'dash' } }, { line: [3, 2] }],
            [
                'a line at the width of its marker',
                { marker: { strokeWidth: 4 }, line: { lineDash: 'dash' } },
                { line: [12, 8] },
            ],
            [
                'a marker name that the line inherits, at the width of the line',
                { marker: { lineDash: 'dash', strokeWidth: 4 }, line: { strokeWidth: 2 } },
                { marker: [12, 8], line: [6, 4] },
            ],
            [
                'arrays, which stay in pixels',
                { marker: { lineDash: [5, 5], strokeWidth: 4 }, line: { lineDash: [1, 2] } },
                { marker: [5, 5], line: [1, 2] },
            ],
            [
                'a marker array that the line inherits, which stays in pixels',
                { marker: { lineDash: [5, 5], strokeWidth: 4 }, line: { strokeWidth: 2 } },
                { marker: [5, 5], line: [5, 5] },
            ],
            [
                'a marker name over the dash that the series built',
                { marker: { lineDash: 'dash' } },
                { marker: [6, 4] },
                { ...content, symbol: { marker: { lineDash: [1, 1], strokeWidth: 2 } } },
            ],
        ])('resolves %s', (_, symbol, expected, base = content) => {
            const result = format(() => ({ symbol }), base).symbol as { marker: object; line?: object };

            expect(result.marker).toMatchObject(expected.marker == null ? {} : { lineDash: expected.marker });
            expect(result.line ?? {}).toMatchObject(expected.line == null ? {} : { lineDash: expected.line });
        });
    });

    it('keeps raw HTML for string renderer results', () => {
        expect(format(() => '<b>x</b>')).toEqual({ type: 'raw', rawHtmlString: '<b>x</b>' });
    });

    it('keeps object renderer results structured', () => {
        const result = format(() => ({ type: 'raw', rawHtmlString: '<b>x</b>', title: 't' }));

        expect(result.type).toBe('structured');
        expect(result).not.toHaveProperty('rawHtmlString');
        expect(result.title).toBe('t');
    });

    it('applies heading, title and data overrides', () => {
        const data = [{ label: 'a', value: 'b' }];
        const result = format(() => ({ heading: 'H', title: 'T', data }));

        expect(result).toMatchObject({ type: 'structured', heading: 'H', title: 'T', data });
    });

    it('clears content when an override is explicitly undefined', () => {
        const result = format(() => ({ title: undefined }));

        expect(result.title).toBeUndefined();
        expect(result.heading).toBe('h');
    });
});

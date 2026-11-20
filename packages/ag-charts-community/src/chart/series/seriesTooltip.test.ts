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
        const symbolOf = (symbol: object, base: object = content) =>
            format(() => ({ symbol }), base).symbol as {
                marker: { lineDash?: unknown };
                line?: { lineDash?: unknown };
            };

        it.each([
            ['a marker at its own width', { marker: { lineDash: 'dash', strokeWidth: 3 } }, 'marker', [9, 6]],
            ['a marker with no width', { marker: { lineDash: 'dash' } }, 'marker', [3, 2]],
            ['a marker set to solid', { marker: { lineDash: 'solid', strokeWidth: 3 } }, 'marker', [0]],
            ['a line at its own width', { line: { lineDash: 'dot', strokeWidth: 2 } }, 'line', [2, 3]],
            [
                'a line at the width of its marker',
                { marker: { strokeWidth: 4 }, line: { lineDash: 'dash' } },
                'line',
                [12, 8],
            ],
            ['a line with no width', { line: { lineDash: 'dash' } }, 'line', [3, 2]],
        ] as const)('resolves a name on %s to its array', (_, symbol, location, expected) => {
            expect(symbolOf(symbol)[location]?.lineDash).toEqual(expected);
        });

        it('resolves a marker name that the line inherits at the width of the line', () => {
            const symbol = symbolOf({ marker: { lineDash: 'dash', strokeWidth: 4 }, line: { strokeWidth: 2 } });

            expect(symbol.marker.lineDash).toEqual([12, 8]);
            expect(symbol.line?.lineDash).toEqual([6, 4]);
        });

        it('leaves a marker array that the line inherits in pixels', () => {
            const symbol = symbolOf({ marker: { lineDash: [5, 5], strokeWidth: 4 }, line: { strokeWidth: 2 } });

            expect(symbol.line?.lineDash).toEqual([5, 5]);
        });

        it('leaves an array in pixels', () => {
            const symbol = symbolOf({ marker: { lineDash: [5, 5], strokeWidth: 4 }, line: { lineDash: [1, 2] } });

            expect(symbol.marker.lineDash).toEqual([5, 5]);
            expect(symbol.line?.lineDash).toEqual([1, 2]);
        });

        it('resolves a name over the dash that the series built', () => {
            const base = { ...content, symbol: { marker: { lineDash: [1, 1], strokeWidth: 2 } } };

            expect(symbolOf({ marker: { lineDash: 'dash' } }, base).marker.lineDash).toEqual([6, 4]);
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

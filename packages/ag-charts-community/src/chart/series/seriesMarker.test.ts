import { describe, expect, it } from 'vitest';

import type { NormalisedDropShadowOptions } from 'ag-charts-core';

import { mergeMarkerStyles, mergeMarkerStylesPair } from './seriesMarker';

const shadow = (overrides: Partial<NormalisedDropShadowOptions> = {}): NormalisedDropShadowOptions => ({
    enabled: true,
    color: '#000000',
    xOffset: 3,
    yOffset: 3,
    blur: 5,
    ...overrides,
});

const BASE_MARKER = {
    shape: 'circle',
    size: 7,
    fill: 'red',
    fillOpacity: 1,
    stroke: 'blue',
    strokeWidth: 1,
    strokeOpacity: 1,
    lineDash: [0],
    lineDashOffset: 0,
} as const;

describe('seriesMarker', () => {
    describe('mergeMarkerStyles', () => {
        it('carries the marker shadow through when no other source sets one', () => {
            const markerShadow = shadow();

            const result = mergeMarkerStyles(
                undefined,
                undefined,
                { size: 7 },
                { ...BASE_MARKER, shadow: markerShadow },
                undefined
            );

            expect(result.shadow).toBe(markerShadow);
        });

        it('leaves shadow undefined when no source sets one', () => {
            const result = mergeMarkerStyles(undefined, undefined, { size: 7 }, BASE_MARKER, undefined);

            expect(result.shadow).toBeUndefined();
        });

        it('resolves shadow left-most first: selection, highlight, default override, marker, inherited', () => {
            const sources = {
                selection: shadow({ blur: 1 }),
                highlight: shadow({ blur: 2 }),
                override: shadow({ blur: 3 }),
                marker: shadow({ blur: 4 }),
                inherited: shadow({ blur: 5 }),
            };

            const merge = (keep: ReadonlyArray<keyof typeof sources>) =>
                mergeMarkerStyles(
                    keep.includes('selection') ? { shadow: sources.selection } : undefined,
                    keep.includes('highlight') ? { shadow: sources.highlight } : undefined,
                    { size: 7, shadow: keep.includes('override') ? sources.override : undefined },
                    { ...BASE_MARKER, shadow: keep.includes('marker') ? sources.marker : undefined },
                    keep.includes('inherited') ? { shadow: sources.inherited } : undefined
                ).shadow;

            expect(merge(['selection', 'highlight', 'override', 'marker', 'inherited'])).toBe(sources.selection);
            expect(merge(['highlight', 'override', 'marker', 'inherited'])).toBe(sources.highlight);
            expect(merge(['override', 'marker', 'inherited'])).toBe(sources.override);
            expect(merge(['marker', 'inherited'])).toBe(sources.marker);
            expect(merge(['inherited'])).toBe(sources.inherited);
        });
    });

    describe('mergeMarkerStylesPair', () => {
        const base = { ...BASE_MARKER, size: 7, shadow: shadow({ blur: 9 }) };

        it('keeps the base shadow when the itemStyler result sets none', () => {
            const result = mergeMarkerStylesPair({ fill: 'green' }, base);

            expect(result.fill).toBe('green');
            expect(result.shadow).toBe(base.shadow);
        });

        it('returns the base untouched, shadow included, when there is no itemStyler result', () => {
            const result = mergeMarkerStylesPair(undefined, base);

            expect(result).toBe(base);
            expect(result.shadow).toBe(base.shadow);
        });

        it('lets a resolved style override the base shadow', () => {
            const override = shadow({ blur: 20, color: '#ff0000' });

            const result = mergeMarkerStylesPair({ shadow: override }, base);

            expect(result.shadow).toBe(override);
        });

        it('leaves shadow undefined when neither side has one', () => {
            const result = mergeMarkerStylesPair({ fill: 'green' }, { ...BASE_MARKER, size: 7 });

            expect(result.shadow).toBeUndefined();
        });
    });
});

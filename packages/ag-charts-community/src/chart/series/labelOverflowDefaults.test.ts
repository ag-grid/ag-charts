import { describe, expect, it } from 'vitest';

import type { AgBarSeriesOptions, AgCartesianChartOptions, AgLineSeriesOptions } from 'ag-charts-types';

import { ChartOptions } from '../../module/optionsModule';

// These assertions read resolved options rather than pixels, pinning the theme-template precedence itself.
describe('label overflow defaults', () => {
    type SeriesLabel = { wrapping?: unknown; truncate?: unknown; collision?: { alwaysShow?: unknown } };

    const resolveLabel = (label: object, type: 'bar' | 'line' = 'bar'): SeriesLabel => {
        // The label is built from probe keys, some of them undocumented, so it cannot satisfy the series label type.
        const series = { type, xKey: 'x', yKey: 'y', label } as unknown as AgBarSeriesOptions | AgLineSeriesOptions;
        const options = { series: [series] } as AgCartesianChartOptions;
        const { processedOptions } = new ChartOptions(options, {} as AgCartesianChartOptions, {}, {}, {});
        return (processedOptions.series![0] as { label: SeriesLabel }).label;
    };

    it.each(['bar', 'line'] as const)('wraps on space, hides overflow and hides collisions on %s', (type) => {
        expect(resolveLabel({ enabled: true }, type)).toMatchObject({
            wrapping: 'on-space',
            truncate: false,
            collision: { alwaysShow: false },
        });
    });

    it('keeps the defaults when a fit option is set', () => {
        expect(resolveLabel({ maxWidth: 80, minimumFontSize: 8 })).toMatchObject({
            wrapping: 'on-space',
            truncate: false,
            collision: { alwaysShow: false },
        });
    });

    it('keeps explicit user values', () => {
        expect(resolveLabel({ wrapping: 'never', truncate: true, collision: { alwaysShow: true } })).toMatchObject({
            wrapping: 'never',
            truncate: true,
            collision: { alwaysShow: true },
        });
    });
});

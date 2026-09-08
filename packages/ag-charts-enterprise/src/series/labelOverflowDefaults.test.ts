import { describe, expect, it } from 'vitest';

import type { AgChartOptions } from 'ag-charts-community';
import { _ModuleSupport } from 'ag-charts-community';

import { setupEnterpriseModules } from '../setup';

setupEnterpriseModules();

// Enterprise counterpart to the community `labelOverflowDefaults` suite: proves the overflow-control
// coupling reaches the enterprise series templates.
describe('label overflow defaults (enterprise)', () => {
    type SeriesLabel = { wrapping?: unknown; truncate?: unknown; collision?: { alwaysShow?: unknown } };

    const resolveSeries = (series: object): Record<string, any> => {
        const options = { series: [series] } as unknown as AgChartOptions;
        const { processedOptions } = new _ModuleSupport.ChartOptions(
            options,
            {} as AgChartOptions,
            {},
            {},
            {}
        ) as unknown as { processedOptions: { series: Record<string, any>[] } };
        return processedOptions.series[0];
    };

    const seriesCases: [string, (label: object) => SeriesLabel, string[]][] = [
        [
            'range-bar',
            (label) => resolveSeries({ type: 'range-bar', xKey: 'x', yLowKey: 'lo', yHighKey: 'hi', label }).label,
            ['inside', 'outside'],
        ],
        [
            'range-area',
            (label) => resolveSeries({ type: 'range-area', xKey: 'x', yLowKey: 'lo', yHighKey: 'hi', label }).label,
            ['inside', 'outside'],
        ],
        [
            'waterfall',
            (label) =>
                resolveSeries({ type: 'waterfall', xKey: 'x', yKey: 'y', item: { positive: { label } } }).item.positive
                    .label,
            ['inside-center', 'outside-end'],
        ],
        [
            'map-marker',
            (label) => resolveSeries({ type: 'map-marker', latitudeKey: 'lat', longitudeKey: 'lon', label }).label,
            ['top', 'bottom'],
        ],
    ];

    describe.each(seriesCases)('%s', (_seriesType, resolveLabel, placementCandidates) => {
        it('forces the overflow set when `maxWidth` is set', () => {
            const label = resolveLabel({ maxWidth: 80 });

            expect(label.wrapping).toBe('on-space');
            expect(label.truncate).toBe(true);
            expect(label.collision?.alwaysShow).toBe(false);
        });

        it('forces the overflow set when `placement` lists more than one candidate', () => {
            const label = resolveLabel({ placement: placementCandidates });

            expect(label.wrapping).toBe('on-space');
            expect(label.truncate).toBe(true);
            expect(label.collision?.alwaysShow).toBe(false);
        });

        it('keeps an explicit `truncate: false` alongside a trigger', () => {
            const label = resolveLabel({ maxWidth: 80, truncate: false });

            expect(label.truncate).toBe(false);
            expect(label.collision?.alwaysShow).toBe(false);
        });

        it('leaves the overflow properties untouched when no trigger is set', () => {
            const label = resolveLabel({ enabled: true });

            expect(label).not.toHaveProperty('wrapping');
            expect(label).not.toHaveProperty('truncate');
        });
    });

    // Map shape labels are always bounded by their shape, so wrapping is on by default and only `truncate`
    // follows the shared trigger set; there is no collision object to couple to.
    describe('map-shape', () => {
        const resolveLabel = (label: object) =>
            resolveSeries({ type: 'map-shape', idKey: 'id', labelKey: 'label', label }).label as SeriesLabel;

        it('wraps on space and hides overflow whatever fit options are set', () => {
            expect(resolveLabel({ enabled: true })).toMatchObject({ wrapping: 'on-space' });
            expect(resolveLabel({ enabled: true })).not.toHaveProperty('truncate');
            expect(resolveLabel({ maxWidth: 80, minimumFontSize: 8 })).toMatchObject({ wrapping: 'on-space' });
            expect(resolveLabel({ maxWidth: 80, minimumFontSize: 8 })).not.toHaveProperty('truncate');
        });

        it('keeps an explicit `wrapping` and `truncate`', () => {
            expect(resolveLabel({ wrapping: 'never', truncate: false, maxWidth: 80 })).toMatchObject({
                wrapping: 'never',
                truncate: false,
            });
        });
    });
});

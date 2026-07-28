import { describe, expect, it } from 'vitest';

import type { AgBarSeriesOptions, AgCartesianChartOptions, AgLineSeriesOptions } from 'ag-charts-types';

import { ChartOptions } from '../../module/optionsModule';

// Setting any one overflow-control label property (`maxWidth`, `maxHeight`, `wrapping`, `truncate`, or an
// array-valued `placement`/`orientation`) resolves the unset ones to a coherent set; every trigger reads by
// presence, not by value. These assertions read resolved options rather than pixels, so they pin the
// theme-template precedence itself rather than a rendering.
describe('label overflow defaults', () => {
    type SeriesLabel = { wrapping?: unknown; truncate?: unknown; collision?: { alwaysShow?: unknown } };

    const resolveLabel = (label: object, type: 'bar' | 'line' = 'bar'): SeriesLabel => {
        const series = { type, xKey: 'x', yKey: 'y', label } as unknown as AgBarSeriesOptions | AgLineSeriesOptions;
        const options = { series: [series] } as AgCartesianChartOptions;
        const { processedOptions } = new ChartOptions(options, {} as AgCartesianChartOptions, {}, {}, {});
        return (processedOptions.series![0] as { label: SeriesLabel }).label;
    };

    const expectOverflowManaged = (label: SeriesLabel) => {
        expect(label.wrapping).toBe('on-space');
        expect(label.truncate).toBe(true);
        expect(label.collision?.alwaysShow).toBe(false);
    };

    it('leaves the overflow properties untouched when no trigger is set', () => {
        const label = resolveLabel({ enabled: true });

        expect(label).not.toHaveProperty('wrapping');
        expect(label).not.toHaveProperty('truncate');
        expect(label.collision?.alwaysShow).toBe(true);
    });

    it('forces the overflow set when `maxHeight` is set', () => {
        expectOverflowManaged(resolveLabel({ maxHeight: 40 }));
    });

    it('forces the overflow set when `maxWidth` is set', () => {
        expectOverflowManaged(resolveLabel({ maxWidth: 80 }));
    });

    it('forces the overflow set when `wrapping` is set', () => {
        const label = resolveLabel({ wrapping: 'always' });

        expect(label.wrapping).toBe('always');
        expect(label.truncate).toBe(true);
        expect(label.collision?.alwaysShow).toBe(false);
    });

    it('forces the overflow set when `truncate` is set', () => {
        const label = resolveLabel({ truncate: true });

        expect(label.wrapping).toBe('on-space');
        expect(label.truncate).toBe(true);
        expect(label.collision?.alwaysShow).toBe(false);
    });

    it('forces the overflow set when `placement` lists more than one candidate', () => {
        expectOverflowManaged(resolveLabel({ placement: ['inside-center', 'outside-end'] }));
    });

    it('forces the overflow set when `orientation` lists more than one candidate', () => {
        expectOverflowManaged(resolveLabel({ orientation: ['horizontal', 'vertical'] }));
    });

    it.each([
        ['placement', 'inside-center'],
        ['orientation', 'horizontal'],
    ])('does not trigger on a single %s value', (key, value) => {
        const label = resolveLabel({ [key]: value });

        expect(label).not.toHaveProperty('wrapping');
        expect(label).not.toHaveProperty('truncate');
        expect(label.collision?.alwaysShow).toBe(true);
    });

    it.each([
        ['placement', ['inside-center']],
        ['orientation', ['horizontal']],
    ])('forces the overflow set on a single-candidate %s list', (key, value) => {
        expectOverflowManaged(resolveLabel({ [key]: value }));
    });

    it('keeps an explicit `alwaysShow: true` alongside a trigger', () => {
        const label = resolveLabel({ maxWidth: 80, collision: { alwaysShow: true } });

        expect(label.wrapping).toBe('on-space');
        expect(label.truncate).toBe(true);
        expect(label.collision?.alwaysShow).toBe(true);
    });

    it('keeps an explicit `wrapping` alongside a trigger', () => {
        const label = resolveLabel({ maxWidth: 80, wrapping: 'hyphenate' });

        expect(label.wrapping).toBe('hyphenate');
        expect(label.truncate).toBe(true);
        expect(label.collision?.alwaysShow).toBe(false);
    });

    it('keeps an explicit `truncate: false` alongside a trigger', () => {
        const label = resolveLabel({ maxWidth: 80, truncate: false });

        expect(label.wrapping).toBe('on-space');
        expect(label.truncate).toBe(false);
        expect(label.collision?.alwaysShow).toBe(false);
    });

    it('treats `wrapping: never` as a trigger', () => {
        const label = resolveLabel({ wrapping: 'never' });

        expect(label.wrapping).toBe('never');
        expect(label.truncate).toBe(true);
        expect(label.collision?.alwaysShow).toBe(false);
    });

    it('treats `truncate: false` as a trigger', () => {
        const label = resolveLabel({ truncate: false });

        expect(label.wrapping).toBe('on-space');
        expect(label.truncate).toBe(false);
        expect(label.collision?.alwaysShow).toBe(false);
    });

    it('applies to line series, which have no collision block of their own', () => {
        expectOverflowManaged(resolveLabel({ maxWidth: 80 }, 'line'));
    });

    it('resolves without recursing when a trigger reaches across the wrapping/truncate pair', () => {
        expect(() => resolveLabel({ truncate: true })).not.toThrow();
        expect(() => resolveLabel({ wrapping: 'on-space' })).not.toThrow();
    });
});

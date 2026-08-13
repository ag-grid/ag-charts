import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { AgCharts } from 'ag-charts-community';
import {
    createSceneGeometrySampler,
    deproxy,
    setupMockCanvas,
    setupMockConsole,
    waitForChartStability,
} from 'ag-charts-community-test';
import type { AgChartInstance, AgLinearGaugeOptions, AgRadialGaugeOptions } from 'ag-charts-types';

import { prepareEnterpriseTestOptions } from '../../test/utils';

const RADIAL_OPTIONS: AgRadialGaugeOptions = {
    type: 'radial-gauge',
    value: 50,
    scale: { min: 0, max: 100 },
    targets: [{ value: 70 }, { value: 90 }],
    // The needle is the node that carries `value` in the scene, so a value update visibly moves it.
    needle: { enabled: true },
};

const LINEAR_OPTIONS: AgLinearGaugeOptions = {
    type: 'linear-gauge',
    value: 50,
    scale: { min: 0, max: 100 },
    targets: [{ value: 70 }, { value: 90 }],
};

// Fields that legitimately differ between two independently-created charts (identity/volatile),
// and so are excluded when asserting processed-options equivalence between fast and cold paths.
const VOLATILE_KEYS = new Set(['container', 'context']);

function stripVolatile(value: unknown): unknown {
    if (Array.isArray(value)) return value.map(stripVolatile);
    if (value != null && typeof value === 'object') {
        const result: Record<string, unknown> = {};
        for (const [key, v] of Object.entries(value)) {
            if (VOLATILE_KEYS.has(key)) continue;
            result[key] = stripVolatile(v);
        }
        return result;
    }
    return value;
}

function seriesProcessedOptions(instance: AgChartInstance) {
    return stripVolatile((deproxy(instance) as any).chartOptions.processedOptions.series[0]);
}

describe('gauge preset fast path', () => {
    setupMockConsole({ includeAllLevels: true });
    setupMockCanvas();

    let chart: AgChartInstance;

    beforeEach(() => {
        (globalThis as any).agChartsDebug = ['perf'];
    });

    afterEach(() => {
        if (chart) {
            chart.destroy();
            (chart as unknown) = undefined;
        }
        delete (globalThis as any).agChartsDebug;
    });

    for (const [name, baseOptions] of [
        ['radial-gauge', RADIAL_OPTIONS],
        ['linear-gauge', LINEAR_OPTIONS],
    ] as const) {
        describe(name, () => {
            it('takes the fast path for a value-only update', async () => {
                const options = prepareEnterpriseTestOptions({ ...baseOptions });
                chart = AgCharts.createGauge(options);
                await chart.waitForUpdate();

                (console.log as any).mockClear();
                await chart.update(prepareEnterpriseTestOptions({ ...baseOptions, value: 42 }));

                expect(console.log).toHaveBeenCalledWith('ChartOptions.isFastPathDelta() - fast path possible.');
                expect(console.log).not.toHaveBeenCalledWith('ChartOptions.slowSetup()');
            });

            it('takes the fast path for a value+targets update', async () => {
                const options = prepareEnterpriseTestOptions({ ...baseOptions });
                chart = AgCharts.createGauge(options);
                await chart.waitForUpdate();

                (console.log as any).mockClear();
                await chart.update(
                    prepareEnterpriseTestOptions({ ...baseOptions, value: 42, targets: [{ value: 60 }, { value: 80 }] })
                );

                expect(console.log).toHaveBeenCalledWith('ChartOptions.isFastPathDelta() - fast path possible.');
                expect(console.log).not.toHaveBeenCalledWith('ChartOptions.slowSetup()');
            });

            it('falls back to the slow path when a non-fast gauge option changes', async () => {
                const options = prepareEnterpriseTestOptions({ ...baseOptions });
                chart = AgCharts.createGauge(options);
                await chart.waitForUpdate();

                (console.log as any).mockClear();
                await chart.update(
                    prepareEnterpriseTestOptions({ ...baseOptions, value: 42, scale: { min: 0, max: 200 } })
                );

                expect(console.log).toHaveBeenCalledWith('ChartOptions.slowSetup()');
            });

            it('produces processed options identical to a cold build (value-only)', async () => {
                await expectFastMatchesCold({ value: 42 });
            });

            it('produces processed options identical to a cold build (value+targets)', async () => {
                await expectFastMatchesCold({ value: 42, targets: [{ value: 60 }, { value: 80 }] });
            });

            it('produces processed options identical to a cold build (targets count change)', async () => {
                await expectFastMatchesCold({ value: 42, targets: [{ value: 30 }, { value: 55 }, { value: 85 }] });
            });

            it('renders the scene identically to a cold build after a fast value update', async () => {
                // Animation disabled so both charts settle at their final geometry deterministically
                // (no animation mocks are installed here to drive tweens to completion).
                const staticBase = { ...baseOptions, animation: { enabled: false } };

                chart = AgCharts.createGauge(prepareEnterpriseTestOptions({ ...staticBase }));
                const fastSampler = createSceneGeometrySampler(chart);
                await waitForChartStability(chart);
                const before = fastSampler();

                await chart.update(prepareEnterpriseTestOptions({ ...staticBase, value: 12 }));
                await waitForChartStability(chart);
                const fast = fastSampler();
                chart.destroy();

                // The value update must actually move the scene, so the equality below cannot pass flat.
                expect(fast).not.toEqual(before);

                chart = AgCharts.createGauge(prepareEnterpriseTestOptions({ ...staticBase, value: 12 }));
                const coldSampler = createSceneGeometrySampler(chart);
                await waitForChartStability(chart);
                const cold = coldSampler();

                expect(fast).toEqual(cold);
            });

            async function expectFastMatchesCold(update: Partial<typeof baseOptions>) {
                const options = prepareEnterpriseTestOptions({ ...baseOptions });
                chart = AgCharts.createGauge(options);
                await chart.waitForUpdate();
                await chart.update(prepareEnterpriseTestOptions({ ...baseOptions, ...update }));
                const fast = seriesProcessedOptions(chart);
                chart.destroy();

                // TS widens a spread of a union to a union of merged shapes; overriding a gauge's
                // options with a Partial of the same type cannot change its variant, so assert it back.
                const coldOptions = { ...baseOptions, ...update } as typeof baseOptions;
                chart = AgCharts.createGauge(prepareEnterpriseTestOptions(coldOptions));
                await chart.waitForUpdate();
                const cold = seriesProcessedOptions(chart);

                expect(fast).toEqual(cold);
            }
        });
    }
});

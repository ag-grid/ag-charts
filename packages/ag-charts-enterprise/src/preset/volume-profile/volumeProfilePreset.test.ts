import { afterEach, describe, expect, it, vi } from 'vitest';

import { AgCharts } from 'ag-charts-community';
import {
    IMAGE_SNAPSHOT_DEFAULTS,
    compareImageSnapshot,
    delay,
    deproxy,
    expectWarningsCalls,
    prepareFinancialTestOptions,
    setupMockCanvas,
    setupMockConsole,
    waitForChartStability,
} from 'ag-charts-community-test';
import type { AgChartInstance, AgChartTheme, AgVolumeProfileChartOptions } from 'ag-charts-types';

import { setupEnterpriseModules } from '../../setup';
import { getIrregularVolumeProfile, getRegularVolumeProfile } from '../test/volumeProfileData';

setupEnterpriseModules();

describe('volumeProfilePreset', () => {
    setupMockConsole();

    let chart: AgChartInstance<AgVolumeProfileChartOptions>;

    afterEach(() => {
        if (chart != null) {
            chart.destroy();
            (chart as unknown) = undefined;
        }
        vi.restoreAllMocks();
    });

    const ctx = setupMockCanvas();

    const volumeProfile: AgVolumeProfileChartOptions = {
        data: getRegularVolumeProfile(),
        upKey: 'upVolume',
        downKey: 'downVolume',
        title: { text: 'Volume Profile' },
    };

    const EXAMPLES: Record<string, AgVolumeProfileChartOptions> = {
        default: volumeProfile,
        'smaller tick size': { ...volumeProfile, tickSize: 1 },
        'matching tick size': { ...volumeProfile, tickSize: 2.5 },
        'larger tick size': { ...volumeProfile, tickSize: 5 },
        'irregular data': { ...volumeProfile, data: getIrregularVolumeProfile() },
    };

    it.each(Object.entries(EXAMPLES))(
        'for %s it should render to canvas as expected',
        async (_exampleName, example) => {
            chart = AgCharts.createVolumeProfileChart(prepareFinancialTestOptions({ ...example }));
            await compareImageSnapshot(chart, ctx, IMAGE_SNAPSHOT_DEFAULTS);
        }
    );

    it('should update the profile on an add transaction', async () => {
        chart = AgCharts.createVolumeProfileChart(prepareFinancialTestOptions({ ...volumeProfile }));
        await waitForChartStability(chart);
        await chart.applyTransaction({ add: [{ price: 210, upVolume: 50e6, downVolume: 40e6 }] });
        await compareImageSnapshot(chart, ctx, IMAGE_SNAPSHOT_DEFAULTS);
    });

    it('should update the profile on an update transaction', async () => {
        // Own rows, as the update mutates one in place.
        chart = AgCharts.createVolumeProfileChart(
            prepareFinancialTestOptions({ ...volumeProfile, data: getRegularVolumeProfile() })
        );
        await waitForChartStability(chart);
        const datum = chart.getOptions().data!.at(-1)!;
        datum.upVolume = 150e6;
        await chart.applyTransaction({ update: [datum] });
        await compareImageSnapshot(chart, ctx, IMAGE_SNAPSHOT_DEFAULTS);
    });

    const levels = () => deproxy(chart).series[0].data?.data ?? [];

    it('should regroup the profile when the tick size changes', async () => {
        chart = AgCharts.createVolumeProfileChart(prepareFinancialTestOptions({ ...volumeProfile }));
        await waitForChartStability(chart);
        await chart.updateDelta({ tickSize: 5 });
        await waitForChartStability(chart);
        // From 135 to 205 in steps of 5.
        expect(levels()).toHaveLength(15);
    });

    it('should regroup the profile when the price key changes', async () => {
        const data = getRegularVolumeProfile().map((datum) => ({ ...datum, level: datum.price + 100 }));
        chart = AgCharts.createVolumeProfileChart(prepareFinancialTestOptions({ ...volumeProfile, data }));
        await waitForChartStability(chart);
        await chart.updateDelta({ priceKey: 'level' });
        await waitForChartStability(chart);
        expect(levels()[0]).toMatchObject({ price: 305 });
    });

    it('should regroup the profile on a same-length data update', async () => {
        chart = AgCharts.createVolumeProfileChart(prepareFinancialTestOptions({ ...volumeProfile }));
        await waitForChartStability(chart);
        const data = getRegularVolumeProfile().map((datum) => ({ ...datum, upVolume: datum.upVolume * 2 }));
        await chart.updateDelta({ data });
        await waitForChartStability(chart);
        expect(levels()[0]).toMatchObject({ price: 205, upVolume: 6052217 * 2 });
    });

    describe('with a data source', () => {
        const createWithDataSource = (getData: () => unknown[], options: Partial<AgVolumeProfileChartOptions> = {}) => {
            const dataSource: AgVolumeProfileChartOptions['dataSource'] = {
                // @ts-expect-error Set undocumented options to instantly resolve for tests
                requestThrottle: 0,
                updateThrottle: 0,
                getData: () => Promise.resolve(getData()),
            };
            chart = AgCharts.createVolumeProfileChart(
                prepareFinancialTestOptions({ ...volumeProfile, data: [], ...options, dataSource })
            );
        };

        const loadedRows = () => deproxy(chart).data.data.length;

        const settleUntil = async (predicate: () => boolean, description: string) => {
            for (let attempt = 0; attempt < 200; attempt++) {
                await waitForChartStability(chart);
                if (predicate()) return;
                await delay(5);
            }
            throw new Error(`Timed out waiting for ${description}`);
        };

        it('should show the loaded profile', async () => {
            const getData = vi.fn(getRegularVolumeProfile);
            createWithDataSource(getData);
            await settleUntil(() => loadedRows() === 27, 'the load');
            await compareImageSnapshot(chart, ctx, IMAGE_SNAPSHOT_DEFAULTS);
        });

        it('should replace the profile on a later load', async () => {
            const getData = vi.fn(getRegularVolumeProfile);
            createWithDataSource(getData);
            await settleUntil(() => loadedRows() === 27, 'the first load');

            getData.mockImplementation(() => getRegularVolumeProfile().filter(({ price }) => price >= 170));
            await chart.updateDelta({});
            await settleUntil(() => loadedRows() === 15, 'the second load');
            await compareImageSnapshot(chart, ctx, IMAGE_SNAPSHOT_DEFAULTS);
        });

        it('should infer the tick size from the loaded data', async () => {
            const getData = vi.fn(() =>
                Array.from({ length: 11 }, (_, i) => ({
                    price: 150 + i,
                    upVolume: (i + 1) * 10e6,
                    downVolume: (11 - i) * 10e6,
                }))
            );
            createWithDataSource(getData, { data: getRegularVolumeProfile() });
            await settleUntil(() => loadedRows() === 11, 'the load');
            await compareImageSnapshot(chart, ctx, IMAGE_SNAPSHOT_DEFAULTS);
        });

        it('should group the loaded data by the validated options', async () => {
            // @ts-expect-error invalid `priceKey`
            createWithDataSource(getRegularVolumeProfile, { priceKey: null, tickSize: 0 });
            await settleUntil(() => loadedRows() === 27, 'the load');
            // The levels of the default `priceKey` at the inferred 2.5 tick size, from 135 to 205.
            expect(deproxy(chart).series[0].data?.data).toHaveLength(29);
            expectWarningsCalls().toEqual([
                ['AG Charts - Option `priceKey` cannot be set to `null`; expecting a string, ignoring.'],
                ['AG Charts - Option `tickSize` cannot be set to `0`; expecting a number greater than 0, ignoring.'],
            ]);
        });
    });

    it('should read the price, up and down values from the given keys', async () => {
        const data = getRegularVolumeProfile().map(({ price, upVolume, downVolume }) => ({
            level: price,
            buys: upVolume,
            sells: downVolume,
        }));
        chart = AgCharts.createVolumeProfileChart(
            prepareFinancialTestOptions({ data, priceKey: 'level', upKey: 'buys', downKey: 'sells' })
        );
        await compareImageSnapshot(chart, ctx, IMAGE_SNAPSHOT_DEFAULTS);
    });

    it('should colour the bars from the theme palette', async () => {
        chart = AgCharts.createVolumeProfileChart(
            prepareFinancialTestOptions({
                ...volumeProfile,
                theme: { params: {}, palette: { up: { fill: '#1565c0' }, down: { fill: '#ef6c00' } } },
            })
        );
        await compareImageSnapshot(chart, ctx, IMAGE_SNAPSHOT_DEFAULTS);
    });

    it('should apply the theme overrides', async () => {
        chart = AgCharts.createVolumeProfileChart(
            prepareFinancialTestOptions({
                ...volumeProfile,
                theme: {
                    params: {},
                    overrides: {
                        common: {
                            title: { color: '#1565c0', fontSize: 24 },
                            axes: {
                                category: { label: { color: '#ef6c00' } },
                                number: { label: { color: '#2e7d32' } },
                            },
                        },
                    },
                },
            })
        );
        await compareImageSnapshot(chart, ctx, IMAGE_SNAPSHOT_DEFAULTS);
    });

    it('keeps the preset base theme under a user theme naming no base of its own', async () => {
        const options = prepareFinancialTestOptions({ ...volumeProfile });
        const theme = options.theme as AgChartTheme;
        expect(theme.baseTheme).toBeUndefined();

        chart = AgCharts.createVolumeProfileChart(options);
        await waitForChartStability(chart);

        // `ag-financial`'s up colour; the default theme would resolve a green of its own.
        const { activeTheme } = deproxy(chart).chartOptions as { activeTheme: { palette: AgChartTheme['palette'] } };
        expect(activeTheme.palette?.up?.fill).toBe('#089981');
    });
});

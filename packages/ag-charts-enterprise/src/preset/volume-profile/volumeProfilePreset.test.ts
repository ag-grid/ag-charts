import { afterEach, describe, expect, it, vi } from 'vitest';

import { AgCharts } from 'ag-charts-community';
import {
    IMAGE_SNAPSHOT_DEFAULTS,
    compareImageSnapshot,
    deproxy,
    expectWarningsCalls,
    prepareFinancialTestOptions,
    setupMockCanvas,
    setupMockConsole,
    waitForChartStability,
    waitForChartStabilityUntil,
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

    // A test whose chart should end up looking like one of these compares against the same baseline, so every
    // route to that chart is held to the same image. Regenerating one regenerates it for all of them.
    const DEFAULT_SNAPSHOT = 'volume-profile-preset-default';
    const LARGER_TICK_SIZE_SNAPSHOT = 'volume-profile-preset-larger-tick-size';
    const SHARED_SNAPSHOTS: Record<string, string> = {
        default: DEFAULT_SNAPSHOT,
        'larger tick size': LARGER_TICK_SIZE_SNAPSHOT,
    };

    const compareToSnapshot = (customSnapshotIdentifier?: string) =>
        compareImageSnapshot(chart, ctx, { ...IMAGE_SNAPSHOT_DEFAULTS, customSnapshotIdentifier });

    const EXAMPLES: Record<string, AgVolumeProfileChartOptions> = {
        default: volumeProfile,
        'smaller tick size': { ...volumeProfile, tickSize: 1 },
        'matching tick size': { ...volumeProfile, tickSize: 2.5 },
        'larger tick size': { ...volumeProfile, tickSize: 5 },
        'irregular data': { ...volumeProfile, data: getIrregularVolumeProfile() },
        'a single level with the total segment': {
            ...volumeProfile,
            data: [{ price: 100, upVolume: 60e6, downVolume: 40e6 }],
            totalSegment: { enabled: true },
        },
        // The defaults: a block per level but none for levels without volume, fitted to the widest label, a 2px
        // gap before the bars, and labels to one decimal place, right-aligned against the bars.
        'the default total segment': { ...volumeProfile, totalSegment: { enabled: true } },
        // `width` wins over `minWidth`.
        'a customised total segment': {
            ...volumeProfile,
            totalSegment: {
                enabled: true,
                width: 80,
                minWidth: 150,
                gap: 12,
                fill: '#123456',
                label: { color: '#fedcba', formatter: ({ value }) => `${Math.round(value / 1e6)}M` },
            },
        },
        'a total segment without labels': {
            ...volumeProfile,
            totalSegment: { enabled: true, label: { enabled: false } },
        },
        'a total segment wider than its labels, with no gap': {
            ...volumeProfile,
            totalSegment: { enabled: true, minWidth: 150, gap: 0 },
        },
        'a total segment widened by long labels': {
            ...volumeProfile,
            totalSegment: {
                enabled: true,
                minWidth: 10,
                label: { formatter: ({ value }) => `${value} shares traded` },
            },
        },
    };

    it.each(Object.entries(EXAMPLES))('for %s it should render to canvas as expected', async (exampleName, example) => {
        chart = AgCharts.createVolumeProfileChart(prepareFinancialTestOptions({ ...example }));
        await compareToSnapshot(SHARED_SNAPSHOTS[exampleName]);
    });

    it('should update the profile on an add transaction', async () => {
        chart = AgCharts.createVolumeProfileChart(prepareFinancialTestOptions({ ...volumeProfile }));
        await waitForChartStability(chart);
        await chart.applyTransaction({ add: [{ price: 210, upVolume: 50e6, downVolume: 40e6 }] });
        await compareToSnapshot();
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
        await compareToSnapshot();
    });

    it('should regroup the profile when the tick size changes', async () => {
        chart = AgCharts.createVolumeProfileChart(prepareFinancialTestOptions({ ...volumeProfile }));
        await waitForChartStability(chart);
        await chart.updateDelta({ tickSize: 5 });
        await compareToSnapshot(LARGER_TICK_SIZE_SNAPSHOT);
    });

    it('should regroup the profile when the price, up and down keys change', async () => {
        // The default keys read decoys, with prices shifted and the volumes swapped; the keys switched to hold the
        // levels of the default profile.
        const data = getRegularVolumeProfile().map(({ price, upVolume, downVolume }) => ({
            price: price + 100,
            upVolume: downVolume,
            downVolume: upVolume,
            level: price,
            buys: upVolume,
            sells: downVolume,
        }));
        chart = AgCharts.createVolumeProfileChart(prepareFinancialTestOptions({ ...volumeProfile, data }));
        await waitForChartStability(chart);
        const decoys = ctx.snapshot();

        await chart.updateDelta({ priceKey: 'level', upKey: 'buys', downKey: 'sells' });
        await compareToSnapshot(DEFAULT_SNAPSHOT);
        expect(ctx.snapshot()).not.toMatchImage(decoys, { writeDiff: false });
    });

    it('should regroup the profile on a same-length data update', async () => {
        const data = getRegularVolumeProfile().map((datum) => ({ ...datum, upVolume: datum.upVolume * 2 }));
        chart = AgCharts.createVolumeProfileChart(prepareFinancialTestOptions({ ...volumeProfile, data }));
        await waitForChartStability(chart);
        const doubled = ctx.snapshot();

        await chart.updateDelta({ data: getRegularVolumeProfile() });
        await compareToSnapshot(DEFAULT_SNAPSHOT);
        expect(ctx.snapshot()).not.toMatchImage(doubled, { writeDiff: false });
    });

    describe('with the total segment', () => {
        const enabled: AgVolumeProfileChartOptions = { ...volumeProfile, totalSegment: { enabled: true } };

        it('should add and remove the segment, and its room, as the option changes', async () => {
            chart = AgCharts.createVolumeProfileChart(prepareFinancialTestOptions({ ...volumeProfile }));
            await waitForChartStability(chart);
            const without = ctx.snapshot();

            await chart.updateDelta({ totalSegment: { enabled: true } });
            await waitForChartStability(chart);
            expect(ctx.snapshot()).not.toMatchImage(without, { writeDiff: false });

            await chart.updateDelta({ totalSegment: { enabled: false } });
            await waitForChartStability(chart);
            expect(ctx.snapshot()).toMatchImage(without);
        });

        it('should resize the segment when its width and gap change', async () => {
            chart = AgCharts.createVolumeProfileChart(prepareFinancialTestOptions({ ...enabled }));
            await waitForChartStability(chart);
            await chart.updateDelta({ totalSegment: { width: 120, gap: 16 } });
            await compareToSnapshot();
        });

        it('should keep the blocks aligned with the bars when the profile is regrouped', async () => {
            chart = AgCharts.createVolumeProfileChart(prepareFinancialTestOptions({ ...enabled }));
            await waitForChartStability(chart);
            await chart.updateDelta({ tickSize: 5 });
            await compareToSnapshot();
        });
    });

    describe('with a data source', () => {
        const instantDataSource = (getData: () => unknown[]): AgVolumeProfileChartOptions['dataSource'] => ({
            // @ts-expect-error Set undocumented options to instantly resolve for tests
            requestThrottle: 0,
            updateThrottle: 0,
            getData: () => Promise.resolve(getData()),
        });

        const createWithDataSource = (getData: () => unknown[], options: Partial<AgVolumeProfileChartOptions> = {}) => {
            chart = AgCharts.createVolumeProfileChart(
                prepareFinancialTestOptions({
                    ...volumeProfile,
                    data: [],
                    ...options,
                    dataSource: instantDataSource(getData),
                })
            );
        };

        const loadedRows = () => deproxy(chart).data.data.length;
        const regularRows = getRegularVolumeProfile().length;

        it('should show the loaded profile', async () => {
            createWithDataSource(getRegularVolumeProfile);
            await waitForChartStabilityUntil(chart, () => loadedRows() === regularRows, 'the load');
            await compareToSnapshot(DEFAULT_SNAPSHOT);
        });

        it('should load without `data`', async () => {
            const { data: _data, ...options } = volumeProfile;
            chart = AgCharts.createVolumeProfileChart(
                prepareFinancialTestOptions({ ...options, dataSource: instantDataSource(getRegularVolumeProfile) })
            );
            await waitForChartStabilityUntil(chart, () => loadedRows() === regularRows, 'the load');
            await compareToSnapshot(DEFAULT_SNAPSHOT);
            expectWarningsCalls().toEqual([]);
        });

        it('should replace the profile on a later load', async () => {
            const getData = vi.fn(getRegularVolumeProfile);
            createWithDataSource(getData);
            await waitForChartStabilityUntil(chart, () => loadedRows() === regularRows, 'the first load');

            getData.mockImplementation(() => getRegularVolumeProfile().filter(({ price }) => price >= 170));
            await chart.updateDelta({});
            await waitForChartStabilityUntil(chart, () => loadedRows() === 15, 'the second load');
            await compareToSnapshot();
        });

        it('should keep the profile when a load groups to no levels', async () => {
            createWithDataSource(() => [{ upVolume: 10e6, downVolume: 10e6 }], { data: getRegularVolumeProfile() });
            let rendered: boolean | undefined;
            deproxy(chart).ctx.eventsHub.on('data:render-verdict', (event) => (rendered = event.rendered));
            await waitForChartStabilityUntil(chart, () => rendered === false, 'the load');
            await waitForChartStability(chart);
            // A load that renders nothing is dropped, and the chart's previous data restored.
            await compareToSnapshot(DEFAULT_SNAPSHOT);
        });

        it('should infer the tick size from the loaded data', async () => {
            const getData = () =>
                Array.from({ length: 11 }, (_, i) => ({
                    price: 150 + i,
                    upVolume: (i + 1) * 10e6,
                    downVolume: (11 - i) * 10e6,
                }));
            createWithDataSource(getData, { data: getRegularVolumeProfile() });
            await waitForChartStabilityUntil(chart, () => loadedRows() === 11, 'the load');
            await compareToSnapshot();
        });

        it('should group the loaded data by the validated options', async () => {
            // @ts-expect-error invalid `priceKey`
            createWithDataSource(getRegularVolumeProfile, { priceKey: null, tickSize: 0 });
            await waitForChartStabilityUntil(chart, () => loadedRows() === regularRows, 'the load');
            // The default `priceKey` at the inferred tick size.
            await compareToSnapshot(DEFAULT_SNAPSHOT);
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
        await compareToSnapshot();
    });

    describe('with keys the data lacks', () => {
        it('should warn for each key found in no data element', async () => {
            chart = AgCharts.createVolumeProfileChart(
                prepareFinancialTestOptions({
                    ...volumeProfile,
                    priceKey: 'noPrice',
                    upKey: 'nope',
                    downKey: 'alsoNope',
                })
            );
            await waitForChartStability(chart);

            expectWarningsCalls().toEqual([
                ["AG Charts - the key 'noPrice' was not found in any data element."],
                ["AG Charts - the key 'nope' was not found in any data element."],
                ["AG Charts - the key 'alsoNope' was not found in any data element."],
            ]);
        });

        it('should warn for the key alone when the others match', async () => {
            chart = AgCharts.createVolumeProfileChart(
                prepareFinancialTestOptions({ ...volumeProfile, downKey: 'nope' })
            );
            await waitForChartStability(chart);

            expectWarningsCalls().toEqual([["AG Charts - the key 'nope' was not found in any data element."]]);
        });

        it('should not warn when there is no data to hold the keys', async () => {
            chart = AgCharts.createVolumeProfileChart(prepareFinancialTestOptions({ ...volumeProfile, data: [] }));
            await waitForChartStability(chart);

            expectWarningsCalls().toEqual([]);
        });
    });

    it('should colour the bars from the theme palette', async () => {
        chart = AgCharts.createVolumeProfileChart(
            prepareFinancialTestOptions({
                ...volumeProfile,
                theme: { params: {}, palette: { up: { fill: '#1565c0' }, down: { fill: '#ef6c00' } } },
            })
        );
        await compareToSnapshot();
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
        await compareToSnapshot();
    });

    it('keeps the preset base theme under a user theme naming no base of its own', async () => {
        const options = prepareFinancialTestOptions({ ...volumeProfile });
        const theme = options.theme as AgChartTheme;
        expect(theme.baseTheme).toBeUndefined();

        chart = AgCharts.createVolumeProfileChart(options);
        // `ag-financial`'s colours; the default theme would resolve a green of its own.
        await compareToSnapshot(DEFAULT_SNAPSHOT);
    });
});

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
import { totalSegmentBlocks, totalSegmentLabels } from '../test/totalSegment';
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
    const levelsWithVolume = () => levels().filter((level: { total: number }) => level.total !== 0);

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
        expect(levels()[0]).toMatchObject({ price: 205, upVolume: data.find(({ price }) => price === 205)?.upVolume });
    });

    it('should regroup the profile when the up key changes', async () => {
        chart = AgCharts.createVolumeProfileChart(prepareFinancialTestOptions({ ...volumeProfile }));
        await waitForChartStability(chart);
        await chart.updateDelta({ upKey: 'downVolume' });
        await waitForChartStability(chart);
        const { downVolume } = getRegularVolumeProfile().find(({ price }) => price === 205) ?? {};
        expect(levels()[0]).toMatchObject({ price: 205, upVolume: downVolume, downVolume });
    });

    describe('with the total segment', () => {
        const seriesRectWidth = () => deproxy(chart).seriesRect!.width;
        const enabled: AgVolumeProfileChartOptions = { ...volumeProfile, totalSegment: { enabled: true } };

        it('should render a fixed-width column of totals beside the price axis', async () => {
            chart = AgCharts.createVolumeProfileChart(prepareFinancialTestOptions({ ...enabled }));
            await compareImageSnapshot(chart, ctx, IMAGE_SNAPSHOT_DEFAULTS);
        });

        it('should not draw the segment by default', async () => {
            chart = AgCharts.createVolumeProfileChart(prepareFinancialTestOptions({ ...volumeProfile }));
            await waitForChartStability(chart);
            expect(totalSegmentBlocks(chart)).toHaveLength(0);
        });

        it('should draw a blue block per level, as wide as the widest label needs', async () => {
            chart = AgCharts.createVolumeProfileChart(prepareFinancialTestOptions({ ...volumeProfile }));
            await waitForChartStability(chart);
            const widthWithout = seriesRectWidth();

            await chart.updateDelta({ totalSegment: { enabled: true } });
            await waitForChartStability(chart);

            const blocks = totalSegmentBlocks(chart);
            expect(blocks).toHaveLength(levelsWithVolume().length);
            expect(new Set(blocks.map((block) => block.fill))).toEqual(new Set(['#5090dc']));
            const widths = new Set(blocks.map((block) => block.width));
            expect(widths.size).toBe(1);
            const [width] = widths;
            expect(width).toBeGreaterThan(0);
            // The series area gives up the segment's width, as it does for an axis.
            expect(widthWithout - seriesRectWidth()).toBe(width);
        });

        it('should leave room either side of the widest label', async () => {
            chart = AgCharts.createVolumeProfileChart(prepareFinancialTestOptions({ ...enabled }));
            await waitForChartStability(chart);

            const [block] = totalSegmentBlocks(chart);
            const widest = Math.max(...totalSegmentLabels(chart).map((label) => label.getBBox().width));
            // The default padding, 8px each side, is wide enough for the text not to be cut short.
            expect(block.width).toBeGreaterThanOrEqual(widest + 16);
        });

        it('should show neither a block nor a label for a level without volume', async () => {
            chart = AgCharts.createVolumeProfileChart(prepareFinancialTestOptions({ ...enabled }));
            await waitForChartStability(chart);

            const empty = levels().filter((level: { total: number }) => level.total === 0);
            expect(empty.length).toBeGreaterThan(0);
            expect(totalSegmentBlocks(chart)).toHaveLength(levels().length - empty.length);
            expect(totalSegmentLabels(chart).every((label) => label.text !== '0')).toBe(true);
        });

        it('should widen the segment to fit longer labels', async () => {
            const widthFor = async (suffix: string) => {
                chart = AgCharts.createVolumeProfileChart(
                    prepareFinancialTestOptions({
                        ...volumeProfile,
                        totalSegment: { enabled: true, label: { formatter: ({ value }) => `${value}${suffix}` } },
                    })
                );
                await waitForChartStability(chart);
                const width = totalSegmentBlocks(chart)[0].width;
                chart.destroy();
                return width;
            };

            const short = await widthFor('');
            const long = await widthFor(' shares traded');
            expect(long).toBeGreaterThan(short);
        });

        it("should show each level's total in its label", async () => {
            chart = AgCharts.createVolumeProfileChart(prepareFinancialTestOptions({ ...enabled }));
            await waitForChartStability(chart);

            const labels = totalSegmentLabels(chart);
            expect(labels.length).toBeGreaterThan(0);
            // Without a formatter the value is abbreviated with a suffix.
            const compact = new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 });
            const totals = new Set(levels().map((level: { total: number }) => compact.format(level.total)));
            for (const label of labels) {
                expect(totals.has(String(label.text))).toBe(true);
            }
            expect(labels.some((label) => /[KMB]$/.test(String(label.text)))).toBe(true);
        });

        describe('minimum width', () => {
            const blockWidth = async (totalSegment: AgVolumeProfileChartOptions['totalSegment']) => {
                chart = AgCharts.createVolumeProfileChart(
                    prepareFinancialTestOptions({ ...volumeProfile, totalSegment })
                );
                await waitForChartStability(chart);
                const width = totalSegmentBlocks(chart)[0].width;
                chart.destroy();
                return width;
            };

            it('should keep the segment at least 60px wide by default', async () => {
                expect(await blockWidth({ enabled: true })).toBeGreaterThanOrEqual(60);
            });

            it('should honour a larger minWidth than the labels need', async () => {
                expect(await blockWidth({ enabled: true, minWidth: 150 })).toBe(150);
            });

            it('should let the labels set the width above the minimum', async () => {
                const wide = await blockWidth({
                    enabled: true,
                    minWidth: 10,
                    label: { formatter: ({ value }) => `${value} shares traded` },
                });
                expect(wide).toBeGreaterThan(60);
            });

            it('should fix the width when width is given, whatever the minWidth', async () => {
                expect(await blockWidth({ enabled: true, width: 40, minWidth: 150 })).toBe(40);
            });
        });

        it('should apply the width, fill and label options', async () => {
            chart = AgCharts.createVolumeProfileChart(
                prepareFinancialTestOptions({
                    ...volumeProfile,
                    totalSegment: {
                        enabled: true,
                        width: 80,
                        fill: '#123456',
                        label: { formatter: ({ value }) => `${Math.round(value / 1e6)}M`, color: '#fedcba' },
                    },
                })
            );
            await waitForChartStability(chart);

            const blocks = totalSegmentBlocks(chart);
            expect(new Set(blocks.map((block) => block.fill))).toEqual(new Set(['#123456']));
            expect(new Set(blocks.map((block) => block.width))).toEqual(new Set([80]));
            for (const label of totalSegmentLabels(chart)) {
                expect(label.text).toMatch(/^\d+M$/);
                expect(label.fill).toBe('#fedcba');
            }
        });

        it('should hide the labels when they are disabled', async () => {
            chart = AgCharts.createVolumeProfileChart(
                prepareFinancialTestOptions({
                    ...volumeProfile,
                    totalSegment: { enabled: true, label: { enabled: false } },
                })
            );
            await waitForChartStability(chart);
            expect(totalSegmentBlocks(chart).length).toBeGreaterThan(0);
            expect(totalSegmentLabels(chart)).toHaveLength(0);
        });

        it('should toggle the segment when the option changes', async () => {
            chart = AgCharts.createVolumeProfileChart(prepareFinancialTestOptions({ ...volumeProfile }));
            await waitForChartStability(chart);
            const widthWithout = seriesRectWidth();

            await chart.updateDelta({ totalSegment: { enabled: true } });
            await waitForChartStability(chart);
            const blocks = totalSegmentBlocks(chart);
            expect(blocks.length).toBeGreaterThan(0);
            expect(seriesRectWidth()).toBe(widthWithout - blocks[0].width);

            await chart.updateDelta({ totalSegment: { enabled: false } });
            await waitForChartStability(chart);
            expect(totalSegmentBlocks(chart)).toHaveLength(0);
            expect(seriesRectWidth()).toBe(widthWithout);
        });

        it('should keep the blocks aligned with the bars when the profile is regrouped', async () => {
            chart = AgCharts.createVolumeProfileChart(prepareFinancialTestOptions({ ...enabled }));
            await waitForChartStability(chart);
            await chart.updateDelta({ tickSize: 5 });
            await waitForChartStability(chart);
            expect(totalSegmentBlocks(chart)).toHaveLength(levelsWithVolume().length);
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
            // From 135 to 205 in steps of 2.5.
            expect(levels()).toHaveLength(29);
            await compareImageSnapshot(chart, ctx, IMAGE_SNAPSHOT_DEFAULTS);
        });

        it('should load without `data`', async () => {
            const { data: _data, ...options } = volumeProfile;
            chart = AgCharts.createVolumeProfileChart(
                prepareFinancialTestOptions({ ...options, dataSource: instantDataSource(getRegularVolumeProfile) })
            );
            await waitForChartStabilityUntil(chart, () => loadedRows() === regularRows, 'the load');
            expect(levels()).toHaveLength(29);
            expectWarningsCalls().toEqual([]);
        });

        it('should replace the profile on a later load', async () => {
            const getData = vi.fn(getRegularVolumeProfile);
            createWithDataSource(getData);
            await waitForChartStabilityUntil(chart, () => loadedRows() === regularRows, 'the first load');

            getData.mockImplementation(() => getRegularVolumeProfile().filter(({ price }) => price >= 170));
            await chart.updateDelta({});
            await waitForChartStabilityUntil(chart, () => loadedRows() === 15, 'the second load');
            // From 170 to 205 in steps of 2.5.
            expect(levels()).toHaveLength(15);
            await compareImageSnapshot(chart, ctx, IMAGE_SNAPSHOT_DEFAULTS);
        });

        it('should keep the profile when a load groups to no levels', async () => {
            createWithDataSource(() => [{ upVolume: 10e6, downVolume: 10e6 }], { data: getRegularVolumeProfile() });
            let rendered: boolean | undefined;
            deproxy(chart).ctx.eventsHub.on('data:render-verdict', (event) => (rendered = event.rendered));
            await waitForChartStabilityUntil(chart, () => rendered === false, 'the load');
            await waitForChartStability(chart);
            // A load that renders nothing is dropped, and the chart's previous data restored.
            expect(loadedRows()).toBe(regularRows);
            expect(levels()).toHaveLength(29);
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
            // From 150 to 160 in steps of 1.
            expect(levels()).toHaveLength(11);
            await compareImageSnapshot(chart, ctx, IMAGE_SNAPSHOT_DEFAULTS);
        });

        it('should group the loaded data by the validated options', async () => {
            // @ts-expect-error invalid `priceKey`
            createWithDataSource(getRegularVolumeProfile, { priceKey: null, tickSize: 0 });
            await waitForChartStabilityUntil(chart, () => loadedRows() === regularRows, 'the load');
            // The levels of the default `priceKey` at the inferred 2.5 tick size, from 135 to 205.
            expect(levels()).toHaveLength(29);
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

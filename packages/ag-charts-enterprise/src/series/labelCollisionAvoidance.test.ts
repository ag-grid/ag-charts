import { afterEach, describe, expect, it } from 'vitest';

import type { AgChartOptions } from 'ag-charts-community';
import { AgCharts } from 'ag-charts-community';
import {
    type PlacedLabelGeometry,
    compareImageSnapshot,
    deproxy,
    expectPixelIdenticalAcrossUpdate,
    expectWarningsCalls,
    setupMockCanvas,
    setupMockConsole,
    topLabelAnchorGap,
    waitForChartStability,
} from 'ag-charts-community-test';

import { createEnterpriseChart, prepareEnterpriseTestOptions } from '../test/utils';
import { ukRoadData } from './map-test/ukRoadData';
import ukRoadTopology from './map-test/ukRoadTopology.json';
import ukTopology from './map-test/ukTopology.json';

// `collideWith` within `label.collision` is undocumented, so option objects using it are built
// untyped and cast at the AgCharts.create boundary.
describe('label collision avoidance', () => {
    setupMockConsole();

    let chart: any;

    afterEach(() => {
        if (chart) {
            chart.destroy();
            (chart as unknown) = undefined;
        }
    });

    const ctx = setupMockCanvas();

    type Box = { x: number; y: number; width: number; height: number };
    const overlaps = (a: Box, b: Box) =>
        a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;

    const renderAndSnapshot = async (options: object) => {
        prepareEnterpriseTestOptions(options as AgChartOptions);
        chart = deproxy(AgCharts.create(options as AgChartOptions));
        await compareImageSnapshot(chart, ctx);
    };

    const visibleLabelCount = () => {
        const series = chart.series[0] as unknown as { labelSelection: { nodes(): { visible: boolean }[] } };
        return series.labelSelection.nodes().filter((node) => node.visible).length;
    };

    const renderPlacementCount = async (
        makeOptions: (collision: object, placement?: string | string[]) => object,
        collision: object,
        placement?: string | string[]
    ) => {
        const opts = makeOptions(collision, placement);
        prepareEnterpriseTestOptions(opts as AgChartOptions);
        chart = deproxy(AgCharts.create(opts as AgChartOptions));
        await waitForChartStability(chart);
        return visibleLabelCount();
    };

    // A tight cluster of markers forces overlapping labels, so placement candidates always resolve
    // real collisions.
    describe('map-marker', () => {
        // A ~1° box lands in a small pixel region at the UK-wide projection, so labels overlap heavily.
        const collisionData = Array.from({ length: 16 }, (_, i) => ({
            name: `Site ${i + 1}`,
            lat: 51.5 + (i % 4) * 0.3,
            lon: -1.5 + Math.floor(i / 4) * 0.3,
        }));
        const markerOptions = (config: object) => ({
            topology: ukTopology,
            series: [
                { type: 'map-shape-background' },
                {
                    type: 'map-marker',
                    data: collisionData,
                    latitudeKey: 'lat',
                    longitudeKey: 'lon',
                    labelKey: 'name',
                    label: { enabled: true, placement: ['top', 'right', 'left', 'bottom'], ...config },
                },
            ],
        });

        it('reposition overlapping labels around the candidate list (alwaysShow: false)', async () => {
            await renderAndSnapshot(markerOptions({ collision: { alwaysShow: false } }));
        });

        it('keeps a label that fails every candidate visible when alwaysShow is true', async () => {
            await renderAndSnapshot(markerOptions({ collision: { alwaysShow: true } }));
        });

        // The theme default is `collision.alwaysShow: false`, so an unset option must match it.
        it('hides overlapping labels by default, matching the explicit alwaysShow: false count', async () => {
            const render = async (config: object) => {
                chart?.destroy();
                const opts = markerOptions(config);
                prepareEnterpriseTestOptions(opts as AgChartOptions);
                chart = deproxy(AgCharts.create(opts as AgChartOptions));
                await waitForChartStability(chart);
                const series = chart.series.find((s: any) => s.type === 'map-marker') as unknown as {
                    labelSelection: { nodes(): { visible: boolean }[] };
                };
                return series.labelSelection.nodes().filter((node) => node.visible).length;
            };

            const defaultVisible = await render({});
            expect(defaultVisible).toBeLessThan(collisionData.length);

            const explicitVisible = await render({ collision: { alwaysShow: false } });
            expect(defaultVisible).toBe(explicitVisible);
        });

        // A single isolated marker, so its 'top' label never collides and only spacing varies.
        const singleMarker = (spacing: number) =>
            ({
                topology: ukTopology,
                series: [
                    { type: 'map-shape-background' },
                    {
                        type: 'map-marker',
                        data: [{ name: 'Site', lat: 52, lon: -1.5 }],
                        latitudeKey: 'lat',
                        longitudeKey: 'lon',
                        labelKey: 'name',
                        label: { enabled: true, placement: 'top', spacing },
                    },
                ],
            }) as AgChartOptions;

        const anchorGap = async (spacing: number) => {
            chart?.destroy();
            chart = await createEnterpriseChart(singleMarker(spacing));
            const series = chart.series.find((s: any) => s.type === 'map-marker') as unknown as PlacedLabelGeometry;
            return topLabelAnchorGap(series);
        };

        it('a larger label.spacing widens the gap between a map-marker label and its anchor', async () => {
            const near = await anchorGap(5);
            const far = await anchorGap(40);
            expect(far).toBeGreaterThan(near);
            expect(far - near).toBeCloseTo(35, 0);
        });
    });

    // Map-line labels centre on the line, so collision only decides hidden vs kept.
    describe('map-line', () => {
        const lineOptions = (config: object) => ({
            topology: ukRoadTopology,
            data: ukRoadData,
            series: [
                {
                    type: 'map-line',
                    idKey: 'name',
                    labelKey: 'name',
                    // Large bold labels so neighbouring route names genuinely overlap.
                    label: { enabled: true, fontSize: 24, fontWeight: 'bold', ...config },
                },
            ],
        });

        it('drops overlapping route labels (alwaysShow: false)', async () => {
            await renderAndSnapshot(lineOptions({ collision: { alwaysShow: false } }));
        });

        it('keeps every overlapping route label when alwaysShow is true', async () => {
            await renderAndSnapshot(lineOptions({ collision: { alwaysShow: true } }));
        });

        // The theme default is `collision.alwaysShow: false`, so an unset option must match it.
        it('drops overlapping route labels by default, matching the explicit alwaysShow: false count', async () => {
            const render = async (config: object) => {
                chart?.destroy();
                const opts = lineOptions(config);
                prepareEnterpriseTestOptions(opts as AgChartOptions);
                chart = deproxy(AgCharts.create(opts as AgChartOptions));
                await waitForChartStability(chart);
                return visibleLabelCount();
            };

            const defaultVisible = await render({});
            expect(defaultVisible).toBeLessThan(ukRoadData.length);

            const explicitVisible = await render({ collision: { alwaysShow: false } });
            expect(defaultVisible).toBe(explicitVisible);
        });
    });

    // A `placement` array is an ordered fallback list: the first candidate that clears its obstacles wins.
    describe('bar-family placement cascade (first fitting candidate wins)', () => {
        it('waterfall renders an array placement identically to its first candidate', async () => {
            const options = (placement: string | string[]): AgChartOptions => ({
                data: [
                    { year: '2020', spending: 10 },
                    { year: '2021', spending: -20 },
                    { year: '2022', spending: 30 },
                ],
                series: [
                    {
                        type: 'waterfall',
                        xKey: 'year',
                        yKey: 'spending',
                        item: {
                            positive: { label: { enabled: true, placement } },
                            negative: { label: { enabled: true, placement } },
                            total: { label: { enabled: true, placement } },
                        },
                    } as never,
                ],
            });
            await expectPixelIdenticalAcrossUpdate(
                ctx,
                createEnterpriseChart,
                options('inside-end'),
                options(['inside-end', 'outside-end'])
            );
        });

        const rangeData = [
            { x: 'A', low: 2, high: 8 },
            { x: 'B', low: 3, high: 9 },
            { x: 'C', low: 1, high: 7 },
        ];
        const rangeAxes = {
            x: { type: 'category', position: 'bottom' },
            y: { type: 'number', position: 'left' },
        };

        it('range-bar renders an array placement identically to its first candidate', async () => {
            const options = (placement: string | string[]): AgChartOptions => ({
                data: rangeData,
                axes: rangeAxes as never,
                series: [
                    {
                        type: 'range-bar',
                        xKey: 'x',
                        yLowKey: 'low',
                        yHighKey: 'high',
                        label: { enabled: true, placement },
                    } as never,
                ],
            });
            await expectPixelIdenticalAcrossUpdate(
                ctx,
                createEnterpriseChart,
                options('outside'),
                options(['outside', 'inside'])
            );
        });

        it('range-area renders an array placement identically to its first candidate', async () => {
            const options = (placement: string | string[]): AgChartOptions => ({
                data: rangeData,
                axes: rangeAxes as never,
                series: [
                    {
                        type: 'range-area',
                        xKey: 'x',
                        yLowKey: 'low',
                        yHighKey: 'high',
                        label: { enabled: true, placement },
                    } as never,
                ],
            });
            await expectPixelIdenticalAcrossUpdate(
                ctx,
                createEnterpriseChart,
                options('outside'),
                options(['outside', 'inside'])
            );
        });
    });

    describe('bar-family label orientation', () => {
        const orientations = ['horizontal', 'vertical', 'vertical-reversed'];
        const rangeData = [
            { x: 'A', low: 2, high: 8 },
            { x: 'B', low: 3, high: 9 },
            { x: 'C', low: 1, high: 7 },
        ];
        const rangeAxes = {
            x: { type: 'category', position: 'bottom' },
            y: { type: 'number', position: 'left' },
        };

        for (const orientation of orientations) {
            it(`waterfall renders labels with orientation '${orientation}'`, async () => {
                await renderAndSnapshot({
                    data: [
                        { year: '2020', spending: 10 },
                        { year: '2021', spending: -20 },
                        { year: '2022', spending: 30 },
                    ],
                    series: [
                        {
                            type: 'waterfall',
                            xKey: 'year',
                            yKey: 'spending',
                            item: {
                                positive: { label: { enabled: true, orientation } },
                                negative: { label: { enabled: true, orientation } },
                                total: { label: { enabled: true, orientation } },
                            },
                        },
                    ],
                });
            });

            it(`range-bar renders labels with orientation '${orientation}'`, async () => {
                await renderAndSnapshot({
                    data: rangeData,
                    axes: rangeAxes,
                    series: [
                        {
                            type: 'range-bar',
                            xKey: 'x',
                            yLowKey: 'low',
                            yHighKey: 'high',
                            label: { enabled: true, orientation },
                        },
                    ],
                });
            });
        }

        // Tall, thin bars whose horizontal label overflows the bar width must fall through to the
        // vertical candidate; alternating deltas keep the bars tall enough for it to fit.
        it('waterfall falls through to vertical when the horizontal label overflows a thin bar', async () => {
            const thinWaterfall = (orientation: string | string[]) => {
                const label = { enabled: true, placement: 'inside-center', orientation, formatter: () => 'WWWWWWWWWW' };
                return {
                    data: Array.from({ length: 12 }, (_, i) => ({ year: `Y${i}`, spending: i % 2 === 0 ? 100 : -100 })),
                    series: [
                        {
                            type: 'waterfall',
                            xKey: 'year',
                            yKey: 'spending',
                            item: { positive: { label }, negative: { label }, total: { label } },
                        },
                    ],
                };
            };
            await expectPixelIdenticalAcrossUpdate(
                ctx,
                createEnterpriseChart,
                thinWaterfall(['horizontal', 'vertical']) as any,
                thinWaterfall('vertical') as any
            );
        });

        // Range-bar carries two labels per node, and an inside orientation array must slide each
        // flush inside the bar rect rather than straddling it.
        it('range-bar resolves an inside-placement orientation array against the bar rect', async () => {
            await renderAndSnapshot({
                data: Array.from({ length: 10 }, (_, i) => ({ x: `C${i}`, low: 0, high: 100 })),
                axes: rangeAxes,
                series: [
                    {
                        type: 'range-bar',
                        xKey: 'x',
                        yLowKey: 'low',
                        yHighKey: 'high',
                        label: {
                            enabled: true,
                            placement: 'inside',
                            orientation: ['horizontal', 'vertical'],
                            formatter: () => 'WWWWWWWWWW',
                        },
                    },
                ],
            });
        });
    });

    describe('cross-series obstacles (baked range-bar labels vs scatter label)', () => {
        // The HIT scatter point sits just below range-bar A's low label so its `top` candidate
        // collides; the rest are clear.
        const rangeData = [
            { x: 'A', low: 2, high: 8 },
            { x: 'B', low: 3, high: 7 },
            { x: 'C', low: 1, high: 9 },
        ];
        const scatterData = [
            { x: 'A', y: 1.9, name: 'HIT' },
            { x: 'B', y: 5, name: 'S1' },
        ];

        const visibleLabelBoxes = (series: {
            labelSelection: { nodes(): { visible: boolean; computeBBox(): Box | undefined }[] };
        }) =>
            series.labelSelection
                .nodes()
                .filter((node) => node.visible)
                .map((node) => node.computeBBox())
                .filter((box): box is Box => box != null);

        const options = (): any => ({
            legend: { enabled: false },
            axes: { x: { type: 'category' }, y: { type: 'number' } },
            series: [
                {
                    type: 'range-bar',
                    xKey: 'x',
                    yLowKey: 'low',
                    yHighKey: 'high',
                    data: rangeData,
                    label: { enabled: true, collision: { alwaysShow: true } },
                },
                {
                    type: 'scatter',
                    xKey: 'x',
                    yKey: 'y',
                    labelKey: 'name',
                    data: scatterData,
                    label: {
                        enabled: true,
                        placement: ['top', 'bottom'],
                        collision: { alwaysShow: false },
                    },
                },
            ],
        });

        it('renders with the scatter label cleared off the range-bar labels', async () => {
            await renderAndSnapshot(options());
        });

        it('drops a hideable scatter label overlapping a range-bar baked label', async () => {
            const opts = options();
            prepareEnterpriseTestOptions(opts);
            chart = deproxy(AgCharts.create(opts));
            await waitForChartStability(chart);
            const [rangeBar, scatter] = chart.series as unknown as Parameters<typeof visibleLabelBoxes>[0][];
            const rangeBarBoxes = visibleLabelBoxes(rangeBar);
            const scatterBoxes = visibleLabelBoxes(scatter);
            expect(rangeBarBoxes.length).toBeGreaterThan(0);
            expect(scatterBoxes.length).toBeGreaterThan(0);
            // A hideable scatter label must never remain visible on top of a range-bar's baked label.
            for (const rangeBarBox of rangeBarBoxes) {
                for (const scatterBox of scatterBoxes) {
                    expect(overlaps(rangeBarBox, scatterBox)).toBe(false);
                }
            }
        });
    });

    describe('waterfall placement cascade and own-label hiding', () => {
        // The bar's `outside-end` label overflows the series area, so series-area avoidance must
        // drop a single-placement label and cascade a placement array to an inside candidate.
        const options = (collision: object, placement: string | string[] = 'outside-end'): any => ({
            data: [{ x: 'A', y: 10 }],
            legend: { enabled: false },
            padding: { top: 100, right: 10, bottom: 10, left: 10 },
            axes: { x: { type: 'category' }, y: { type: 'number', min: 0, max: 10 } },
            series: [
                {
                    type: 'waterfall',
                    xKey: 'x',
                    yKey: 'y',
                    item: { positive: { label: { enabled: true, placement, collision } } },
                },
            ],
        });

        it('drops a hideable outside label overflowing the series area', async () => {
            expect(await renderPlacementCount(options, { alwaysShow: false, collideWith: { seriesArea: true } })).toBe(
                0
            );
        });

        it('keeps the same label when it is not hideable (alwaysShow: true)', async () => {
            expect(await renderPlacementCount(options, { alwaysShow: true, collideWith: { seriesArea: true } })).toBe(
                1
            );
        });

        it('cascades a hideable outside label to an inside placement that fits', async () => {
            // The single `outside-end` label above hides (0); the array falls through to `inside-center`,
            // which fits inside the tall bar, so the label is kept even though `alwaysShow` is false.
            expect(
                await renderPlacementCount(options, { alwaysShow: false, collideWith: { seriesArea: true } }, [
                    'outside-end',
                    'inside-center',
                ])
            ).toBe(1);
        });

        // Only an inside-only placement binds label text to the bar rect; a cascade with a fallback must not.
        it('keeps full text and cascades an oversized inside-first label to the outside fallback', async () => {
            // A very short bar whose long label cannot fit inside.
            const opts: any = {
                data: [{ x: 'A', y: 1 }],
                legend: { enabled: false },
                padding: { top: 100, right: 100, bottom: 10, left: 100 },
                axes: { x: { type: 'category' }, y: { type: 'number', min: 0, max: 100 } },
                series: [
                    {
                        type: 'waterfall',
                        xKey: 'x',
                        yKey: 'y',
                        item: {
                            positive: {
                                label: {
                                    enabled: true,
                                    formatter: () => 'WWWWWWWWWWWWWWWWWWWW',
                                    placement: ['inside-center', 'outside-end'],
                                    collision: { alwaysShow: false },
                                },
                            },
                        },
                    },
                ],
            };
            prepareEnterpriseTestOptions(opts);
            chart = deproxy(AgCharts.create(opts));
            await waitForChartStability(chart);
            const series = chart.series[0] as unknown as {
                labelSelection: { nodes(): { visible: boolean; datum: { label?: { placement?: string } } }[] };
            };
            const labels = series.labelSelection.nodes().filter((node) => node.visible);
            expect(labels).toHaveLength(1);
            expect(labels[0].datum.label?.placement).toBe('outside-end');
        });

        // Bars sized to cover each outcome: outside-end fits, overflows and cascades inside, or is too wide inside.
        const multiBarCascade = (label: object) => {
            const barLabel = {
                enabled: true,
                placement: ['outside-end', 'inside-center'],
                collision: { alwaysShow: false, collideWith: { seriesArea: true } },
                ...label,
            };
            return {
                data: [
                    { year: 'Y0', spending: 3 },
                    { year: 'Y1', spending: 3 },
                    { year: 'Y2', spending: 4 },
                ],
                legend: { enabled: false },
                padding: { top: 60, right: 10, bottom: 10, left: 10 },
                axes: { x: { type: 'category' }, y: { type: 'number', min: 0, max: 10 } },
                series: [
                    {
                        type: 'waterfall',
                        xKey: 'year',
                        yKey: 'spending',
                        totals: [{ totalType: 'total', index: 2, axisLabel: 'Total' }],
                        item: {
                            positive: { label: barLabel },
                            negative: { label: barLabel },
                            total: { label: { ...barLabel, formatter: () => 'WWWWWWWWWWWWWWWWWWWW' } },
                        },
                    },
                ],
            };
        };

        // A placement array turns truncation on, so the total's oversized label is ellipsised into the
        // candidate that keeps the most of it rather than dropped.
        it('renders outside, cascaded-inside and dropped labels across a multi-bar chart', async () => {
            await renderAndSnapshot(multiBarCascade({}));
        });

        // Opting out of truncation leaves nothing to fall back on: every candidate for the oversized
        // label overflows at full text, so it is dropped instead.
        it('drops rather than truncates the oversized label when truncate is off', async () => {
            await renderAndSnapshot(multiBarCascade({ truncate: false }));
        });
    });

    // A range bar carries an independent label at each value end (low, high). With a placement array each
    // end cascades on its own, so only the end whose candidates all collide is hidden or repositioned.
    describe('range-bar per-label placement cascade and hiding', () => {
        // The bar's high end sits at the axis max, so its `outside` label overflows the top series-area
        // padding band; the low end sits mid-plot with room, so its `outside` label clears it.
        const options = (collision: object, placement: string | string[] = 'outside'): any => ({
            data: [{ x: 'A', low: 2, high: 10 }],
            legend: { enabled: false },
            padding: { top: 100, right: 10, bottom: 10, left: 10 },
            axes: { x: { type: 'category' }, y: { type: 'number', min: 0, max: 10 } },
            series: [
                {
                    type: 'range-bar',
                    xKey: 'x',
                    yLowKey: 'low',
                    yHighKey: 'high',
                    label: { enabled: true, placement, collision },
                },
            ],
        });

        it('drops only the colliding high-end label, keeping the low-end label', async () => {
            expect(await renderPlacementCount(options, { alwaysShow: false, collideWith: { seriesArea: true } })).toBe(
                1
            );
        });

        it('keeps both labels when not hideable (alwaysShow: true)', async () => {
            expect(await renderPlacementCount(options, { alwaysShow: true, collideWith: { seriesArea: true } })).toBe(
                2
            );
        });

        it('cascades the colliding high-end label to an inside placement, keeping both', async () => {
            // Only the high end overflows: it falls through to `inside`, while the low end stays outside.
            expect(
                await renderPlacementCount(options, { alwaysShow: false, collideWith: { seriesArea: true } }, [
                    'outside',
                    'inside',
                ])
            ).toBe(2);
        });

        // One render, every outcome: A keeps both outside, B's high end cascades inside, C's high label is dropped.
        const multiBarCascade = (label: object) => ({
            data: [
                { x: 'A', low: 2, high: 6 },
                { x: 'B', low: 1, high: 10 },
                { x: 'C', low: 1, high: 10 },
            ],
            legend: { enabled: false },
            padding: { top: 60, right: 10, bottom: 10, left: 10 },
            axes: { x: { type: 'category' }, y: { type: 'number', min: 0, max: 10 } },
            series: [
                {
                    type: 'range-bar',
                    xKey: 'x',
                    yLowKey: 'low',
                    yHighKey: 'high',
                    label: {
                        enabled: true,
                        // Range-bar labels default to white (usually drawn inside the bar); force a dark
                        // colour so the outside labels are legible against the plot background too.
                        color: 'black',
                        formatter: ({ datum }: any) => (datum.x === 'C' ? 'WWWWWWWWWWWWWWWWWWWW' : undefined),
                        placement: ['outside', 'inside'],
                        collision: { alwaysShow: false, collideWith: { seriesArea: true } },
                        ...label,
                    },
                },
            ],
        });

        // A placement array turns truncation on, so bar C's oversized high label is ellipsised into the
        // candidate that keeps the most of it rather than dropped.
        it('renders outside, cascaded-inside and dropped labels across a multi-bar chart', async () => {
            await renderAndSnapshot(multiBarCascade({}));
        });

        // Opting out of truncation leaves nothing to fall back on: every candidate for that label
        // overflows at full text, so it is dropped instead.
        it('drops rather than truncates the oversized label when truncate is off', async () => {
            await renderAndSnapshot(multiBarCascade({ truncate: false }));
        });
    });

    describe('range-bar sibling-label collision (shared bar rect)', () => {
        const visibleLabels = (series: {
            labelSelection: {
                nodes(): { visible: boolean; datum: { placement?: string }; computeBBox(): Box | undefined }[];
            };
        }) =>
            series.labelSelection
                .nodes()
                .filter((node) => node.visible)
                .map((node) => ({ placement: node.datum.placement, box: node.computeBBox() }))
                .filter((label): label is { placement: string | undefined; box: Box } => label.box != null);

        // The bar is tall enough to hold one end label, so the sibling obstacle — not fit alone — drives the cascade.
        it('cascades one sibling label outside instead of dropping or overlapping it inside', async () => {
            const opts: any = {
                data: [{ x: 'A', low: 47, high: 53 }],
                legend: { enabled: false },
                axes: { x: { type: 'category' }, y: { type: 'number', min: 0, max: 100 } },
                series: [
                    {
                        type: 'range-bar',
                        xKey: 'x',
                        yLowKey: 'low',
                        yHighKey: 'high',
                        label: { enabled: true, placement: ['inside', 'outside'], collision: { alwaysShow: false } },
                    },
                ],
            };
            prepareEnterpriseTestOptions(opts);
            chart = deproxy(AgCharts.create(opts));
            await waitForChartStability(chart);
            const series = chart.series[0] as unknown as Parameters<typeof visibleLabels>[0];
            const labels = visibleLabels(series);
            // Anti-vacuous guard: both end labels must stay visible (neither hidden for failing inside).
            expect(labels.length).toBe(2);
            expect(overlaps(labels[0].box, labels[1].box)).toBe(false);
            // Exactly one end cascades outside; the other stays inside.
            expect(labels.filter((l) => l.placement?.startsWith('outside'))).toHaveLength(1);
        });

        // Default styling, so the snapshot also pins `outsideStyle` being applied to the escaped label.
        it('renders one label per short bar outside to avoid the inside collision', async () => {
            await renderAndSnapshot({
                data: [
                    { x: 'A', low: 44, high: 50 },
                    { x: 'B', low: 47, high: 53 },
                    { x: 'C', low: 50, high: 56 },
                ],
                legend: { enabled: false },
                padding: { top: 40, right: 40, bottom: 20, left: 40 },
                axes: { x: { type: 'category' }, y: { type: 'number', min: 0, max: 100 } },
                series: [
                    {
                        type: 'range-bar',
                        xKey: 'x',
                        yLowKey: 'low',
                        yHighKey: 'high',
                        label: { enabled: true, placement: ['inside', 'outside'] },
                    },
                ],
            });
        });
    });

    describe('range-bar reversed value axis', () => {
        // A reversed value axis puts low at the top of the bar, so the low label must render above the high label.
        const reversedLabelEnds = async (label: object) => {
            const opts: any = {
                data: [{ x: 'A', low: 2, high: 8 }],
                legend: { enabled: false },
                padding: { top: 60, right: 40, bottom: 60, left: 40 },
                axes: { x: { type: 'category' }, y: { type: 'number', min: 0, max: 10, reverse: true } },
                series: [{ type: 'range-bar', xKey: 'x', yLowKey: 'low', yHighKey: 'high', label }],
            };
            prepareEnterpriseTestOptions(opts);
            chart = deproxy(AgCharts.create(opts));
            await waitForChartStability(chart);
            const series = chart.series[0] as unknown as {
                labelSelection: {
                    nodes(): { visible: boolean; datum: { itemType: string }; computeBBox(): Box | undefined }[];
                };
            };
            const nodes = series.labelSelection.nodes().filter((node) => node.visible);
            const low = nodes.find((node) => node.datum.itemType === 'low')?.computeBBox();
            const high = nodes.find((node) => node.datum.itemType === 'high')?.computeBBox();
            return { low, high };
        };

        it('places the low label above the high label (baked inside placement)', async () => {
            const { low, high } = await reversedLabelEnds({ enabled: true, placement: 'inside' });
            expect(low).toBeDefined();
            expect(high).toBeDefined();
            expect(low!.y).toBeLessThan(high!.y);
        });

        it('places the low label above the high label (placement cascade)', async () => {
            const { low, high } = await reversedLabelEnds({
                enabled: true,
                placement: ['outside', 'inside'],
                collision: { alwaysShow: false },
            });
            expect(low).toBeDefined();
            expect(high).toBeDefined();
            expect(low!.y).toBeLessThan(high!.y);
        });
    });

    // Range-area labels are point-anchored, so `outside`/`inside` map per datum onto compass directions.
    describe('range-area label placement', () => {
        type LabelNode = {
            visible: boolean;
            datum: { itemType: string; placement?: string; valueSide: string };
            computeBBox(): Box | undefined;
        };
        /** A visible label node's resolved placement, band side, and rendered box. */
        type PlacedLabelInfo = { placement?: string; side: string; box: Box };
        /** Range-area's engine output, in the plot-local coordinates its anchor points also use. */
        type RangeAreaPlacedLabel = {
            y: number;
            height: number;
            placement?: string;
            datum: { itemType: string; point: { y: number } };
        };
        const placedLabelData = (): RangeAreaPlacedLabel[] => chart.series[0].placedLabelData;

        const placedLabels = async (options: object): Promise<PlacedLabelInfo[]> => {
            chart?.destroy();
            const opts = options as AgChartOptions;
            prepareEnterpriseTestOptions(opts);
            chart = deproxy(AgCharts.create(opts));
            await waitForChartStability(chart);
            const series = chart.series[0] as unknown as { labelSelection: { nodes(): LabelNode[] } };
            const labels: PlacedLabelInfo[] = [];
            for (const node of series.labelSelection.nodes()) {
                const box = node.visible ? node.computeBBox() : undefined;
                if (box != null) {
                    labels.push({ placement: node.datum.placement, side: node.datum.valueSide, box });
                }
            }
            return labels;
        };

        const narrowBand = (label: object) => ({
            data: [{ x: 'A', low: 46, high: 54 }],
            legend: { enabled: false },
            padding: { top: 40, right: 40, bottom: 20, left: 40 },
            axes: { x: { type: 'category' }, y: { type: 'number', min: 0, max: 100 } },
            series: [{ type: 'range-area', xKey: 'x', yLowKey: 'low', yHighKey: 'high', label }],
        });

        // A band too narrow for both end labels, so the second must treat its sibling as an obstacle.
        it('cascades one sibling label outside instead of dropping or overlapping it inside', async () => {
            const labels = await placedLabels(
                narrowBand({ enabled: true, placement: ['inside', 'outside'], collision: { alwaysShow: false } })
            );
            // Anti-vacuous guard: both end labels stay visible (neither hidden for failing inside).
            expect(labels).toHaveLength(2);
            expect(overlaps(labels[0].box, labels[1].box)).toBe(false);
            // Both resolved a vertical placement, and exactly one of them cascaded outside.
            expect(labels.filter((l) => l.placement === 'bottom' || l.placement === 'top')).toHaveLength(2);
            const outside = labels.filter((l) => (l.placement === 'top') === (l.side === 'high'));
            expect(outside).toHaveLength(1);
        });

        // A dense band of long labels: every candidate collides, so `alwaysShow` decides the outcome.
        const crowded = (collision: object) => ({
            data: Array.from({ length: 12 }, (_, i) => ({ x: `Category ${i}`, low: 40 + i, high: 44 + i })),
            legend: { enabled: false },
            axes: { x: { type: 'category' }, y: { type: 'number', min: 0, max: 100 } },
            series: [
                {
                    type: 'range-area',
                    xKey: 'x',
                    yLowKey: 'low',
                    yHighKey: 'high',
                    label: {
                        enabled: true,
                        formatter: () => 'A very long range-area label',
                        placement: ['outside', 'inside'],
                        collision,
                    },
                },
            ],
        });

        it('drops labels that fit nowhere when alwaysShow is false, keeps them when true', async () => {
            const hidden = await placedLabels(crowded({ alwaysShow: false }));
            const kept = await placedLabels(crowded({ alwaysShow: true }));
            expect(hidden.length).toBeLessThan(kept.length);
            expect(kept).toHaveLength(24);
        });

        // `low > high` draws the low value above the high value, so each label's facing side flips: the
        // `high` label of an inverted datum must render below its own stroke, not above it.
        it('places every outside label clear of the band, including on an inverted datum', async () => {
            await placedLabels({
                data: [
                    { x: 'A', low: 20, high: 80 },
                    { x: 'B', low: 80, high: 20 },
                ],
                legend: { enabled: false },
                padding: { top: 40, right: 40, bottom: 20, left: 40 },
                axes: { x: { type: 'category' }, y: { type: 'number', min: 0, max: 100 } },
                series: [
                    {
                        type: 'range-area',
                        xKey: 'x',
                        yLowKey: 'low',
                        yHighKey: 'high',
                        invertedStyle: { enabled: true },
                        label: { enabled: true, placement: 'outside' },
                    },
                ],
            });
            const placed = placedLabelData();
            expect(placed).toHaveLength(4);
            const anchorYs = placed.map((label) => label.datum.point.y);
            const bandMidY = (Math.min(...anchorYs) + Math.max(...anchorYs)) / 2;
            for (const label of placed) {
                const anchorY = label.datum.point.y;
                if (anchorY < bandMidY) {
                    // Upper stroke: the label sits entirely above its anchor.
                    expect(label.placement).toBe('top');
                    expect(label.y + label.height).toBeLessThanOrEqual(anchorY);
                } else {
                    expect(label.placement).toBe('bottom');
                    expect(label.y).toBeGreaterThanOrEqual(anchorY);
                }
            }
            // Anti-vacuous guard: the inverted datum's `high` label is the one on the lower stroke.
            const invertedHigh = placed.filter(
                (label) => label.datum.itemType === 'high' && label.placement === 'bottom'
            );
            expect(invertedHigh).toHaveLength(1);
        });

        // A label sits `gap + spacing` from its anchor, `gap` being the marker radius, so it never
        // lands on its own marker.
        it('offsets an outside label from its marker by the marker radius plus label.spacing', async () => {
            const markerSize = 20;
            const spacing = 12;
            await placedLabels({
                data: [{ x: 'A', low: 20, high: 80 }],
                legend: { enabled: false },
                padding: { top: 60, right: 40, bottom: 20, left: 40 },
                axes: { x: { type: 'category' }, y: { type: 'number', min: 0, max: 100 } },
                series: [
                    {
                        type: 'range-area',
                        xKey: 'x',
                        yLowKey: 'low',
                        yHighKey: 'high',
                        marker: { enabled: true, size: markerSize },
                        label: { enabled: true, placement: 'outside', spacing },
                    },
                ],
            });
            expect(topLabelAnchorGap(chart.series[0] as PlacedLabelGeometry)).toBeCloseTo(markerSize / 2 + spacing, 5);
        });

        it('reports the resolved coarse placement to the label itemStyler', async () => {
            const captured: (string | undefined)[] = [];
            const itemStyler = (params: { placement?: string }) => {
                captured.push(params.placement);
                return {};
            };
            await placedLabels(
                narrowBand({
                    enabled: true,
                    placement: ['inside', 'outside'],
                    collision: { alwaysShow: false },
                    itemStyler,
                })
            );
            expect(new Set(captured)).toEqual(new Set(['inside', 'outside']));
        });

        // These pin what renders, not just the resolved placement, so a label drawn in the wrong spot still fails.
        describe('rendered placement fallback', () => {
            // Bands narrow enough that the two end labels cannot both sit inside at the theme's spacing.
            const cascadeBands = (placement: string | string[]) => ({
                data: [
                    { x: 'A', low: 46, high: 54 },
                    { x: 'B', low: 44, high: 56 },
                    { x: 'C', low: 47, high: 53 },
                ],
                legend: { enabled: false },
                padding: { top: 40, right: 40, bottom: 40, left: 40 },
                axes: { x: { type: 'category' }, y: { type: 'number', min: 0, max: 100 } },
                series: [
                    {
                        type: 'range-area',
                        xKey: 'x',
                        yLowKey: 'low',
                        yHighKey: 'high',
                        label: { enabled: true, placement, collision: { alwaysShow: false } },
                    },
                ],
            });
            const isOutside = (l: { placement?: string; side: string }) =>
                (l.placement === 'top') === (l.side === 'high');

            it('drops the colliding sibling label when inside is the only placement', async () => {
                const labels = await placedLabels(cascadeBands('inside'));
                // Two of the six end labels have nowhere to go once their sibling claims the inside slot.
                expect(labels).toHaveLength(4);
                expect(labels.filter(isOutside)).toHaveLength(0);
                await compareImageSnapshot(chart, ctx);
            });

            it('keeps both sibling labels by cascading one outside when a fallback is offered', async () => {
                const labels = await placedLabels(cascadeBands(['inside', 'outside']));
                // Same data as above: the two labels dropped there are recovered outside their bands.
                expect(labels).toHaveLength(6);
                expect(labels.filter(isOutside)).toHaveLength(2);
                await compareImageSnapshot(chart, ctx);
            });

            // Labels too long for either candidate are dropped rather than overlapped, leaving visible gaps.
            it('drops labels whose every placement candidate collides', async () => {
                const labels = await placedLabels({
                    data: Array.from({ length: 8 }, (_, i) => ({ x: `Category ${i}`, low: 42 + i, high: 50 + i })),
                    legend: { enabled: false },
                    padding: { top: 40, right: 40, bottom: 40, left: 40 },
                    axes: { x: { type: 'category' }, y: { type: 'number', min: 0, max: 100 } },
                    series: [
                        {
                            type: 'range-area',
                            xKey: 'x',
                            yLowKey: 'low',
                            yHighKey: 'high',
                            label: {
                                enabled: true,
                                placement: ['outside', 'inside'],
                                formatter: () => 'A very long range-area label',
                                collision: { alwaysShow: false },
                            },
                        },
                    ],
                });
                // All three cascade outcomes must be present, so the render shows each of them: some
                // labels keep `outside`, some fall back to `inside`, and the rest are dropped.
                expect(labels.filter(isOutside).length).toBeGreaterThan(0);
                expect(labels.filter((l) => !isOutside(l)).length).toBeGreaterThan(0);
                expect(labels.length).toBeLessThan(16);
                await compareImageSnapshot(chart, ctx);
            });
        });
    });
    // Funnel, cone funnel and pyramid value labels all cascade through the bar candidate list. Funnel and
    // pyramid place along the stage axis (`before`/`after`); cone funnel places across its divider
    // (`before`/`middle`/`after`) and along it (`start`/`center`/`end`).
    describe('funnel family', () => {
        const stageData = [
            { stage: 'Qualify', value: 7910 },
            { stage: 'Develop', value: 8170 },
            { stage: 'Propose', value: 7260 },
            { stage: 'Close', value: 4460 },
        ];

        type LabelDatum = { x: number; y: number; placement?: string; hidden?: boolean; text: unknown };

        const labelDatums = (): LabelDatum[] => chart.series[0].contextNodeData.labelData;

        const labelNodes = (): { visible: boolean; fill: string; text: unknown }[] =>
            chart.series[0].labelSelection.nodes();

        const render = async (options: object) => {
            chart?.destroy();
            chart = await createEnterpriseChart(options as AgChartOptions);
        };

        /** Every stage's label anchor and resolved placement, in stage order. */
        const anchors = async (options: object) => {
            await render(options);
            return labelDatums().map(({ x, y, placement, hidden }) => ({ x, y, placement, hidden }));
        };

        const visibleCount = async (options: object) => {
            await render(options);
            return labelNodes().filter((node) => node.visible).length;
        };

        describe('funnel', () => {
            const options = (label: object = {}, series: object = {}, chartOptions: object = {}): any => ({
                data: stageData,
                legend: { enabled: false },
                padding: { top: 40, right: 80, bottom: 40, left: 80 },
                series: [
                    {
                        type: 'funnel',
                        stageKey: 'stage',
                        valueKey: 'value',
                        label: { enabled: true, ...label },
                        ...series,
                    },
                ],
                ...chartOptions,
            });

            it('renders the theme default exactly as an explicit inside-center placement', async () => {
                await expectPixelIdenticalAcrossUpdate(
                    ctx,
                    createEnterpriseChart,
                    options(),
                    options({ placement: 'inside-center' })
                );
            });

            it('places inside-before and inside-after at opposite ends of the stage axis', async () => {
                const centre = await anchors(options());
                const before = await anchors(options({ placement: 'inside-before' }));
                const after = await anchors(options({ placement: 'inside-after' }));

                expect(before.map((label) => label.placement)).toEqual(stageData.map(() => 'inside-before'));
                for (const [index, label] of before.entries()) {
                    expect(label.y).toBeLessThan(centre[index].y);
                    expect(after[index].y).toBeGreaterThan(centre[index].y);
                    expect(label.x).toBeCloseTo(centre[index].x, 5);
                }
            });

            it('reports only funnel placements to the label itemStyler', async () => {
                const captured: (string | undefined)[] = [];
                const itemStyler = (params: { placement?: string }) => {
                    captured.push(params.placement);
                    return {};
                };
                await render(
                    options({
                        placement: ['outside-before', 'inside-center'],
                        collision: { alwaysShow: false },
                        itemStyler,
                    })
                );
                expect(captured.length).toBeGreaterThan(0);
                for (const placement of captured) {
                    expect(['outside-before', 'inside-center']).toContain(placement);
                }
            });

            it('swaps the two sides when the category axis is reversed', async () => {
                const axes = (reverse: boolean) => ({
                    x: { type: 'number' },
                    y: { type: 'category', reverse },
                });
                const centre = await anchors(options({}, {}, { axes: axes(false) }));
                const before = await anchors(options({ placement: 'inside-before' }, {}, { axes: axes(false) }));
                const reversedCentre = await anchors(options({}, {}, { axes: axes(true) }));
                const reversedBefore = await anchors(options({ placement: 'inside-before' }, {}, { axes: axes(true) }));

                for (const [index, label] of before.entries()) {
                    expect(label.y).toBeLessThan(centre[index].y);
                    expect(reversedBefore[index].y).toBeGreaterThan(reversedCentre[index].y);
                }
            });

            it('places along the horizontal axis for a horizontal funnel', async () => {
                const centre = await anchors(options({}, { direction: 'horizontal' }));
                const before = await anchors(options({ placement: 'inside-before' }, { direction: 'horizontal' }));

                for (const [index, label] of before.entries()) {
                    expect(label.x).toBeLessThan(centre[index].x);
                    expect(label.y).toBeCloseTo(centre[index].y, 5);
                }
            });

            it('styles an inside placement differently from an outside one', async () => {
                await render(options({ placement: 'inside-center' }));
                const inside = labelNodes().map((node) => node.fill);
                await render(options({ placement: 'outside-before' }));
                const outside = labelNodes().map((node) => node.fill);

                expect(new Set(inside).size).toBe(1);
                expect(new Set(outside).size).toBe(1);
                expect(inside[0]).not.toBe(outside[0]);
            });

            it('drops a hideable outside label overflowing the series area and keeps it when opted out', async () => {
                const overflowing = (seriesArea: boolean) =>
                    options({
                        placement: 'outside-before',
                        collision: { alwaysShow: false, collideWith: { seriesArea } },
                    });

                expect(await visibleCount(overflowing(true))).toBeLessThan(stageData.length);
                expect(await visibleCount(overflowing(false))).toBe(stageData.length);
            });

            it('hides colliding labels only while they are hideable', async () => {
                const crowded = (alwaysShow: boolean) =>
                    options({
                        placement: 'outside-after',
                        formatter: () => 'A very long funnel stage label',
                        collision: { alwaysShow },
                    });

                expect(await visibleCount(crowded(false))).toBeLessThan(stageData.length);
                expect(await visibleCount(crowded(true))).toBe(stageData.length);
            });

            it('hides more labels as the collision threshold grows', async () => {
                const spaced = (threshold: number) =>
                    options({
                        placement: 'inside-center',
                        formatter: () => 'Stage',
                        collision: { alwaysShow: false, threshold },
                    });

                expect(await visibleCount(spaced(0))).toBeGreaterThan(await visibleCount(spaced(200)));
            });

            it('drops a hideable outside label overlapping the neighbouring stage', async () => {
                // Taller than the gap between stages, with seriesArea off: only the stage above is left.
                const overlapping = (seriesItems?: boolean) =>
                    options({
                        placement: 'outside-before',
                        formatter: () => 'A',
                        fontSize: 30,
                        collision: { alwaysShow: false, collideWith: { seriesArea: false, seriesItems } },
                    });

                expect(await visibleCount(overlapping())).toBe(0);
                expect(await visibleCount(overlapping(false))).toBeGreaterThan(0);
            });

            it('cascades to the first placement that fits', async () => {
                // `outside-before` on every stage collides with the neighbouring stage's bar, so the
                // cascade falls through to the inside candidate rather than dropping the label.
                const cascaded = await anchors(
                    options({
                        placement: ['outside-before', 'inside-center'],
                        formatter: () => 'A very long funnel stage label',
                        collision: { alwaysShow: false },
                    })
                );
                expect(cascaded.some((label) => label.placement === 'inside-center')).toBe(true);
                expect(cascaded.every((label) => label.hidden !== true)).toBe(true);
            });
        });

        describe('cone funnel', () => {
            const CONE_PLACEMENTS = [
                'before-start',
                'before-center',
                'before-end',
                'middle-start',
                'middle-center',
                'middle-end',
                'after-start',
                'after-center',
                'after-end',
            ];

            const options = (label: object = {}, series: object = {}, chartOptions: object = {}): any => ({
                data: stageData,
                legend: { enabled: false },
                padding: { top: 40, right: 80, bottom: 40, left: 80 },
                series: [
                    {
                        type: 'cone-funnel',
                        stageKey: 'stage',
                        valueKey: 'value',
                        label: { enabled: true, ...label },
                        ...series,
                    },
                ],
                ...chartOptions,
            });

            it('renders the theme default exactly as an explicit before-center placement', async () => {
                await expectPixelIdenticalAcrossUpdate(
                    ctx,
                    createEnterpriseChart,
                    options(),
                    options({ placement: 'before-center' })
                );
            });

            it('renders all nine placements at distinct anchors', async () => {
                const seen = new Set<string>();
                for (const placement of CONE_PLACEMENTS) {
                    const [first] = await anchors(options({ placement }));
                    seen.add(`${first.x.toFixed(2)},${first.y.toFixed(2)}`);
                }
                expect(seen.size).toBe(CONE_PLACEMENTS.length);
            });

            it('keeps a middle placement visible with alwaysShow off', async () => {
                const middle = await anchors(options({ placement: 'middle-center', collision: { alwaysShow: false } }));
                expect(middle.every((label) => label.hidden !== true)).toBe(true);
            });

            it('swaps start and end under RTL when the dividers span the horizontal axis', async () => {
                const ltr = await anchors(options({ placement: 'before-start' }));
                const rtl = await anchors(options({ placement: 'before-start' }, {}, { enableRtl: true }));

                expect(ltr.map((label) => label.placement)).toEqual(stageData.map(() => 'before-start'));
                expect(rtl.map((label) => label.placement)).toEqual(stageData.map(() => 'before-end'));
            });

            it('leaves start and end alone under RTL when the dividers span the vertical axis', async () => {
                const rtl = await anchors(
                    options({ placement: 'before-start' }, { direction: 'horizontal' }, { enableRtl: true })
                );
                expect(rtl.map((label) => label.placement)).toEqual(stageData.map(() => 'before-start'));
            });

            it.each([
                ['before', 'before-center'],
                ['middle', 'middle-center'],
                ['after', 'after-center'],
            ])('renders the deprecated %s alias exactly as %s', async (alias, canonical) => {
                const aliased = await anchors(options({ placement: alias }));
                expectWarningsCalls().toEqual([[expect.stringContaining('deprecated')]]);
                const expanded = await anchors(options({ placement: canonical }));
                expect(aliased).toEqual(expanded);
            });

            it('resolves a fallback list mixing canonical placements with a deprecated alias', async () => {
                const mixed = await anchors(options({ placement: ['before-center', 'after'] }));
                expectWarningsCalls().toEqual([[expect.stringContaining('deprecated')]]);
                const canonical = await anchors(options({ placement: ['before-center', 'after-center'] }));
                expect(mixed).toEqual(canonical);
            });

            it('warns once for a deprecated alias and not at all for the default', async () => {
                await render(options({ placement: 'before' }));
                expectWarningsCalls().toEqual([[expect.stringContaining('deprecated')]]);
            });

            it('does not warn for the theme default placement', async () => {
                await render(options());
                expectWarningsCalls().toEqual([]);
            });
        });

        describe('pyramid', () => {
            const options = (label: object = {}, series: object = {}): any => ({
                data: stageData,
                legend: { enabled: false },
                padding: { top: 40, right: 80, bottom: 40, left: 80 },
                series: [
                    {
                        type: 'pyramid',
                        stageKey: 'stage',
                        valueKey: 'value',
                        label: { enabled: true, ...label },
                        ...series,
                    },
                ],
            });

            const stageLabels = (): { x: number; y: number; text: unknown }[] =>
                chart.series[0].stageLabelSelection.nodes();

            it('renders the theme default exactly as an explicit inside-center placement', async () => {
                await expectPixelIdenticalAcrossUpdate(
                    ctx,
                    createEnterpriseChart,
                    options(),
                    options({ placement: 'inside-center' })
                );
            });

            it('places inside-before and inside-after at opposite ends of the stage axis', async () => {
                const centre = await anchors(options());
                const before = await anchors(options({ placement: 'inside-before' }));
                const after = await anchors(options({ placement: 'inside-after' }));

                for (const [index, label] of before.entries()) {
                    expect(label.y).toBeLessThan(centre[index].y);
                    expect(after[index].y).toBeGreaterThan(centre[index].y);
                }
            });

            it('reports only pyramid placements to the label itemStyler', async () => {
                const captured: (string | undefined)[] = [];
                const itemStyler = (params: { placement?: string }) => {
                    captured.push(params.placement);
                    return {};
                };
                await render(
                    options({
                        placement: ['outside-before', 'inside-center'],
                        collision: { alwaysShow: false },
                        itemStyler,
                    })
                );
                expect(captured.length).toBeGreaterThan(0);
                for (const placement of captured) {
                    expect(['outside-before', 'inside-center']).toContain(placement);
                }
            });

            it('places along the horizontal axis for a horizontal pyramid', async () => {
                const centre = await anchors(options({}, { direction: 'horizontal' }));
                const before = await anchors(options({ placement: 'inside-before' }, { direction: 'horizontal' }));

                for (const [index, label] of before.entries()) {
                    expect(label.x).toBeLessThan(centre[index].x);
                }
            });

            it('styles an inside placement differently from an outside one', async () => {
                await render(options({ placement: 'inside-center' }));
                const inside = labelNodes().map((node) => node.fill);
                await render(options({ placement: 'outside-after' }));
                const outside = labelNodes().map((node) => node.fill);

                expect(inside[0]).not.toBe(outside[0]);
            });

            it('anchors a centred value label on the centre of its stage', async () => {
                const labels = await anchors(options({ placement: 'inside-center' }));
                const stages = chart.series[0].contextNodeData.nodeData;

                for (const [index, label] of labels.entries()) {
                    expect(label.x).toBeCloseTo(stages[index].x);
                    expect(label.y).toBeCloseTo(stages[index].y);
                }
            });

            it('bounds the fitted text of a tapering stage to the width where the text sits', async () => {
                const text = 'A very long pyramid stage label';
                await render(options({ placement: 'inside-center', formatter: () => text, truncate: true }));
                const lineCounts = labelNodes().map((node) => String(node.text).split('\n').length);

                // The apex stage is the narrowest across its label's own band, so its label wraps the
                // hardest, while the base stage is wide enough to keep the text on one line.
                expect(lineCounts[0]).toBeGreaterThan(lineCounts.at(-1)!);
                expect(String(labelNodes().at(-1)!.text)).toBe(text);
            });

            it('keeps the stage labels identical across value label placements', async () => {
                await render(options({ placement: 'inside-center' }));
                const centred = stageLabels().map(({ x, y, text }) => ({ x, y, text: String(text) }));
                await render(options({ placement: 'outside-after', spacing: 40 }));
                const outside = stageLabels().map(({ x, y, text }) => ({ x, y, text: String(text) }));

                expect(outside).toEqual(centred);
            });
        });
    });
});
